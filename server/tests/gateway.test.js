import './setup-test-db.js';
import assert from 'assert';
import { db } from '../src/db.js';
import { recordGatewayPayment, gatewayWebhook, setStripeClientForTests } from '../src/routes/gateway.js';

console.log('🧪 Running Online Gateway (Stripe) Tests...');

// Fake Stripe client: no network calls. The webhook "signature" is accepted only when it equals 'valid'.
const fakeStripe = {
  webhooks: {
    constructEvent(body, signature) {
      if (signature !== 'valid') throw new Error('bad signature');
      return JSON.parse(body.toString());
    }
  }
};
setStripeClientForTests(fakeStripe);
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

// Pick an open invoice and a customer that owns it.
const invoice = db.prepare("SELECT * FROM invoices WHERE status = 'confirmed' AND amount_due > 0 ORDER BY id LIMIT 1").get();
assert.ok(invoice, 'seed must contain an open invoice');
const dueBefore = invoice.amount_due;
const paidCents = Math.round(Math.min(dueBefore, 100) * 100);
const sessionId = 'cs_test_' + Date.now();

// Stand-in for what POST /api/gateway/checkout writes.
db.prepare(`
  INSERT INTO payment_sessions (session_id, invoice_id, customer_id, amount, currency)
  VALUES (?, ?, ?, ?, 'usd')
`).run(sessionId, invoice.id, invoice.customer_id, paidCents / 100);

const session = { id: sessionId, payment_status: 'paid', amount_total: paidCents };

// 1. First recording updates the invoice balance and creates one payment.
const first = recordGatewayPayment(session);
assert.strictEqual(first.status, 'recorded');
const after = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);
assert.ok(Math.abs(after.amount_due - (dueBefore - paidCents / 100)) < 0.001, 'amount_due must drop by the paid amount');
assert.ok(Math.abs(after.amount_paid - (invoice.amount_paid + paidCents / 100)) < 0.001, 'amount_paid must rise by the paid amount');
const payments = db.prepare('SELECT * FROM payments WHERE reference_note = ?').all(`Stripe checkout ${sessionId}`);
assert.strictEqual(payments.length, 1, 'exactly one payment row');
console.log('✅ Successful checkout records one payment and updates the invoice balance.');

// 2. Recording the same session again (webhook after return page, or retry) does nothing.
const second = recordGatewayPayment(session);
assert.strictEqual(second.status, 'already_recorded');
assert.strictEqual(db.prepare('SELECT COUNT(*) c FROM payments WHERE reference_note = ?').get(`Stripe checkout ${sessionId}`).c, 1);
const again = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice.id);
assert.strictEqual(again.amount_due, after.amount_due, 'balance must not change on a repeat');
console.log('✅ Repeat recording is idempotent (no double charge in the ledger).');

// 3. Unknown session is ignored, not recorded.
const unknown = recordGatewayPayment({ id: 'cs_unknown', payment_status: 'paid', amount_total: 100 });
assert.strictEqual(unknown.status, 'unknown_session');
console.log('✅ Unknown sessions are never recorded.');

// 4. Webhook: bad signature rejected, valid signature records the payment.
const webhookSessionId = 'cs_webhook_' + Date.now();
db.prepare(`
  INSERT INTO payment_sessions (session_id, invoice_id, customer_id, amount, currency)
  VALUES (?, ?, ?, ?, 'usd')
`).run(webhookSessionId, after.id, invoice.customer_id, 1);
const event = {
  type: 'checkout.session.completed',
  data: { object: { id: webhookSessionId, payment_status: 'paid', amount_total: 100 } }
};

const makeRes = () => {
  const r = { statusCode: 200, body: undefined };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
};

const badRes = makeRes();
await gatewayWebhook({ body: Buffer.from(JSON.stringify(event)), headers: { 'stripe-signature': 'forged' } }, badRes);
assert.strictEqual(badRes.statusCode, 400, 'forged webhook must be rejected');
assert.strictEqual(db.prepare("SELECT status FROM payment_sessions WHERE session_id = ?").get(webhookSessionId).status, 'pending');

const okRes = makeRes();
await gatewayWebhook({ body: Buffer.from(JSON.stringify(event)), headers: { 'stripe-signature': 'valid' } }, okRes);
assert.strictEqual(okRes.statusCode, 200);
assert.strictEqual(db.prepare("SELECT status FROM payment_sessions WHERE session_id = ?").get(webhookSessionId).status, 'completed');

// Replaying the same valid webhook must not record a second payment.
await gatewayWebhook({ body: Buffer.from(JSON.stringify(event)), headers: { 'stripe-signature': 'valid' } }, makeRes());
assert.strictEqual(db.prepare('SELECT COUNT(*) c FROM payments WHERE reference_note = ?').get(`Stripe checkout ${webhookSessionId}`).c, 1);
console.log('✅ Webhook rejects forged signatures and records valid events exactly once.');

// 5. Unpaid session (e.g. abandoned) is not recorded.
const unpaidId = 'cs_unpaid_' + Date.now();
db.prepare(`INSERT INTO payment_sessions (session_id, invoice_id, customer_id, amount, currency) VALUES (?, ?, ?, 1, 'usd')`)
  .run(unpaidId, after.id, invoice.customer_id);
const unpaidRes = makeRes();
await gatewayWebhook({
  body: Buffer.from(JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: unpaidId, payment_status: 'unpaid', amount_total: 100 } } })),
  headers: { 'stripe-signature': 'valid' }
}, unpaidRes);
assert.strictEqual(db.prepare("SELECT status FROM payment_sessions WHERE session_id = ?").get(unpaidId).status, 'pending');
console.log('✅ Unpaid sessions are ignored.');

setStripeClientForTests(null);
console.log('🎉 ALL ONLINE GATEWAY TESTS PASSED SUCCESSFULLY!');
