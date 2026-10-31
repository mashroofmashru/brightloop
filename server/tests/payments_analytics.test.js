import assert from 'assert';
import { db } from '../src/db.js';

console.log('🧪 Running Payments & Finance Analytics Unit Tests...');

// 1. Verify Seeded Payments
console.log('Verifying payments records...');
const payments = db.prepare('SELECT * FROM payments').all();
assert.ok(payments.length >= 1, 'Must have at least 1 recorded payment');

const firstPay = payments[0];
assert.ok(firstPay.payment_number.startsWith('PAY-'), 'Payment number must have PAY- prefix');
assert.ok(firstPay.amount > 0, 'Payment amount must be greater than 0');

// 2. Test Recording a New Payment against an Invoice
console.log('Testing payment reconciliation against invoice...');
const unpaidInv = db.prepare("SELECT * FROM invoices WHERE amount_due > 0 LIMIT 1").get();
assert.ok(unpaidInv, 'Must find an invoice with amount due');

const initialPaid = unpaidInv.amount_paid;
const initialDue = unpaidInv.amount_due;
const paymentAmt = 100.00;

const testPayNumber = 'PAY-TEST-' + Date.now();
const insertPay = db.prepare(`
  INSERT INTO payments (payment_number, invoice_id, customer_id, method, amount, payment_date, reference_note, status)
  VALUES (?, ?, ?, 'bank_transfer', ?, '2026-03-01', 'Test reconciliation wire', 'completed')
`);
insertPay.run(testPayNumber, unpaidInv.id, unpaidInv.customer_id, paymentAmt);

db.prepare(`
  UPDATE invoices
  SET amount_paid = amount_paid + ?, amount_due = MAX(0, amount_due - ?)
  WHERE id = ?
`).run(paymentAmt, paymentAmt, unpaidInv.id);

const reconciledInv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(unpaidInv.id);
assert.strictEqual(reconciledInv.amount_paid, initialPaid + paymentAmt);
assert.strictEqual(reconciledInv.amount_due, initialDue - paymentAmt);

console.log('✅ Payment recording and invoice reconciliation passed!');

// 3. Test Finance Executive Analytics SLA (<2s)
console.log('Testing executive analytics query performance & accuracy...');
const startTime = Date.now();

const today = new Date().toISOString().split('T')[0];
const activeSubs = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'").get();
const totalCollected = db.prepare("SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE status = 'completed'").get();
const overdueInvoices = db.prepare("SELECT COUNT(*) as count FROM invoices WHERE status = 'confirmed' AND due_date < ? AND amount_due > 0").get(today);

const durationMs = Date.now() - startTime;
assert.ok(durationMs < 2000, `Finance queries must complete under 2000ms SLA (Actual: ${durationMs}ms)`);
assert.ok(activeSubs.count >= 1, 'Active subscriptions count must be >= 1');
assert.ok(totalCollected.sum > 0, 'Total collected cash must be > 0');

console.log(`✅ Executive finance analytics verified in ${durationMs}ms (Sub-2s SLA met)!`);
console.log('🎉 ALL PAYMENTS & ANALYTICS TESTS PASSED SUCCESSFULLY!');
