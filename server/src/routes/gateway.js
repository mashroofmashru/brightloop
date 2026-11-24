import express from 'express';
import Stripe from 'stripe';
import { db } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { generatePaymentNumber } from './payments.js';

// Online card payments through Stripe Checkout (hosted payment page).
//
// Flow:
//   1. Customer clicks Pay  -> POST /api/gateway/checkout  -> returns Stripe Checkout URL
//   2. Customer pays on Stripe, is redirected to /payment-return?session_id=...
//   3. Return page calls POST /api/gateway/confirm, and Stripe also calls the webhook.
//      Both paths go through recordGatewayPayment(), which records each session exactly once.
//
// Environment:
//   STRIPE_SECRET_KEY      sk_test_... (required for payments)
//   STRIPE_WEBHOOK_SECRET  whsec_...   (required for the webhook)
//   STRIPE_CURRENCY        default usd
//   APP_URL                where the browser returns to, default http://localhost:3000

const router = express.Router();

const CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
const appUrl = () => (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');

let stripeClient = null;

// Tests inject a fake client here so no network calls are made.
export function setStripeClientForTests(fake) {
  stripeClient = fake;
}

function getStripe() {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

/**
 * Record a paid Stripe Checkout session against its invoice, exactly once.
 * Returns { status: 'recorded' | 'already_recorded' | 'unknown_session', payment_id }.
 */
export function recordGatewayPayment(session) {
  return db.transaction(() => {
    const ps = db.prepare('SELECT * FROM payment_sessions WHERE session_id = ?').get(session.id);
    if (!ps) {
      return { status: 'unknown_session', payment_id: null };
    }
    if (ps.status === 'completed') {
      return { status: 'already_recorded', payment_id: ps.payment_id };
    }

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(ps.invoice_id);
    const paid = session.amount_total / 100;
    const paymentDate = new Date().toISOString().split('T')[0];

    const payInfo = db.prepare(`
      INSERT INTO payments (payment_number, invoice_id, customer_id, method, amount,
                            payment_date, reference_note, status)
      VALUES (?, ?, ?, 'credit_card', ?, ?, ?, 'completed')
    `).run(
      generatePaymentNumber(),
      invoice.id,
      ps.customer_id,
      paid,
      paymentDate,
      `Stripe checkout ${session.id}`
    );

    const newPaid = invoice.amount_paid + paid;
    const newDue = Math.max(0, invoice.amount_due - paid);
    const newStatus = newDue <= 0.001 ? 'paid' : invoice.status;
    db.prepare('UPDATE invoices SET amount_paid = ?, amount_due = ?, status = ? WHERE id = ?')
      .run(newPaid, newDue, newStatus, invoice.id);

    db.prepare("UPDATE payment_sessions SET status = 'completed', payment_id = ? WHERE session_id = ?")
      .run(payInfo.lastInsertRowid, session.id);

    return { status: 'recorded', payment_id: payInfo.lastInsertRowid };
  })();
}

// POST /api/gateway/checkout  { invoice_id }  (customers pay their own open invoices)
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers pay invoices online.' });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Online payments are not configured on the server.' });
    }

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.body.invoice_id);
    if (!invoice || invoice.customer_id !== req.user.id) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    if (invoice.status !== 'confirmed' || invoice.amount_due <= 0) {
      return res.status(400).json({ error: 'This invoice is not open for payment.' });
    }

    const amount = Math.round(invoice.amount_due * 100) / 100;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: CURRENCY,
          unit_amount: Math.round(amount * 100),
          product_data: { name: `Invoice ${invoice.invoice_number}` }
        }
      }],
      metadata: { invoice_id: String(invoice.id), customer_id: String(req.user.id) },
      success_url: `${appUrl()}/payment-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/payment-return?cancelled=1`
    });

    db.prepare(`
      INSERT INTO payment_sessions (session_id, invoice_id, customer_id, amount, currency)
      VALUES (?, ?, ?, ?, ?)
    `).run(session.id, invoice.id, req.user.id, amount, CURRENCY);

    res.json({ url: session.url, session_id: session.id });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Could not start the online payment. Please try again.' });
  }
});

// POST /api/gateway/confirm  { session_id }  (called by the return page)
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { session_id } = req.body;
    const ps = db.prepare('SELECT * FROM payment_sessions WHERE session_id = ?').get(session_id);
    if (!ps || (req.user.role === 'customer' && ps.customer_id !== req.user.id)) {
      return res.status(404).json({ error: 'Payment session not found' });
    }
    if (ps.status === 'completed') {
      return res.json({ status: 'completed', payment_id: ps.payment_id });
    }

    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({ error: 'Online payments are not configured on the server.' });
    }

    // Ask Stripe directly; never trust the browser's claim that a payment succeeded.
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.json({ status: 'pending' });
    }

    const result = recordGatewayPayment(session);
    res.json({ status: 'completed', payment_id: result.payment_id });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Could not confirm the payment. If you were charged, it will still be recorded shortly.' });
  }
});

// Mounted before express.json() in index.js because Stripe signatures need the raw body.
export async function gatewayWebhook(req, res) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return res.status(503).end();
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], secret);
  } catch {
    return res.status(400).send('Invalid signature');
  }

  try {
    if (event.type === 'checkout.session.completed' && event.data.object.payment_status === 'paid') {
      const result = recordGatewayPayment(event.data.object);
      if (result.status === 'unknown_session') {
        console.warn(`Webhook for unknown checkout session ${event.data.object.id}`);
      }
    }
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).end(); // Stripe retries on 5xx
  }
}

export default router;
