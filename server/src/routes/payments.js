import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: Generate next payment number (PAY-YYYY-XXXX)
function generatePaymentNumber() {
  const year = new Date().getFullYear();
  const lastPay = db.prepare(`
    SELECT payment_number FROM payments
    WHERE payment_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`PAY-${year}-%`);

  let nextSeq = 1;
  if (lastPay) {
    const parts = lastPay.payment_number.split('-');
    if (parts.length === 3) {
      nextSeq = parseInt(parts[2], 10) + 1;
    }
  }

  return `PAY-${year}-${String(nextSeq).padStart(4, '0')}`;
}

// GET /api/payments (Filtered by role)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { invoice_id, method, search } = req.query;

    let query = `
      SELECT p.*, i.invoice_number, i.total_amount as invoice_total, i.amount_due as invoice_due,
             u.name as customer_name, u.email as customer_email, u.company_name as customer_company
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      JOIN users u ON p.customer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Customer data isolation
    if (req.user.role === 'customer') {
      query += ' AND p.customer_id = ?';
      params.push(req.user.id);
    }

    if (invoice_id) {
      query += ' AND p.invoice_id = ?';
      params.push(invoice_id);
    }

    if (method) {
      query += ' AND p.method = ?';
      params.push(method);
    }

    if (search) {
      query += ' AND (p.payment_number LIKE ? OR i.invoice_number LIKE ? OR u.name LIKE ? OR u.company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.id DESC';

    const payments = db.prepare(query).all(...params);
    res.json({ payments });
  } catch (error) {
    console.error('Fetch payments error:', error);
    res.status(500).json({ error: 'Failed to retrieve payment records' });
  }
});

// POST /api/payments (Record a payment against an invoice)
// "Payments arrive by different methods and on different days.
//  Each one needs to be recorded with its method, amount, date and a note, against the right invoice."
router.post('/', authenticateToken, (req, res) => {
  try {
    const {
      invoice_id,
      method = 'bank_transfer',
      amount,
      payment_date = new Date().toISOString().split('T')[0],
      reference_note
    } = req.body;

    if (!invoice_id || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Invoice ID and a valid payment amount are required' });
    }

    const payAmount = parseFloat(amount);

    const invoice = db.prepare(`
      SELECT * FROM invoices WHERE id = ?
    `).get(invoice_id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Role verification: Customers can only pay their own invoice
    if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (invoice.status === 'paid' || invoice.amount_due <= 0) {
      return res.status(400).json({ error: 'This invoice is already settled in full.' });
    }

    const paymentNumber = generatePaymentNumber();

    const recordPaymentTransaction = db.transaction(() => {
      // 1. Insert payment record
      const insertPay = db.prepare(`
        INSERT INTO payments (
          payment_number, invoice_id, customer_id, method, amount,
          payment_date, reference_note, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
      `);

      const payRes = insertPay.run(
        paymentNumber,
        invoice.id,
        invoice.customer_id,
        method,
        payAmount,
        payment_date,
        reference_note || null
      );

      // 2. Update invoice amount_paid and amount_due
      const newPaid = invoice.amount_paid + payAmount;
      const newDue = Math.max(0, invoice.amount_due - payAmount);
      const newStatus = newDue <= 0.001 ? 'paid' : 'confirmed';

      db.prepare(`
        UPDATE invoices
        SET amount_paid = ?, amount_due = ?, status = ?
        WHERE id = ?
      `).run(newPaid, newDue, newStatus, invoice.id);

      return payRes.lastInsertRowid;
    });

    const newPaymentId = recordPaymentTransaction();

    const createdPayment = db.prepare(`
      SELECT p.*, i.invoice_number, i.status as invoice_status, i.amount_due as remaining_due
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE p.id = ?
    `).get(newPaymentId);

    res.status(201).json({
      message: `Payment of $${payAmount.toFixed(2)} recorded successfully.`,
      payment: createdPayment
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

export default router;
