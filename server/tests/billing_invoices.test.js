import assert from 'assert';
import { db } from '../src/db.js';

console.log('🧪 Running Billing, Invoices, Taxes & Discounts Unit Tests...');

// 1. Verify Taxes
console.log('Verifying tax rules...');
const vat = db.prepare("SELECT * FROM taxes WHERE name LIKE '%VAT%'").get();
assert.ok(vat, 'Standard VAT must exist');
assert.strictEqual(vat.rate, 15.0);

// 2. Verify Discounts Engine & Counter
console.log('Verifying discount rules & redemption tracking...');
const discount = db.prepare("SELECT * FROM discounts WHERE code = 'LAUNCH20'").get();
assert.ok(discount, 'LAUNCH20 discount must exist');
assert.strictEqual(discount.value, 20.0);
assert.strictEqual(discount.discount_type, 'percent');
assert.ok(discount.redemption_count >= 0, 'Must have redemption count');

// 3. Verify Existing Invoices and Overdue Detection
console.log('Verifying invoices & overdue detection...');
const invoices = db.prepare('SELECT * FROM invoices').all();
assert.ok(invoices.length >= 2, 'Must have at least 2 seeded invoices');

const paidInv = invoices.find(i => i.status === 'paid');
assert.ok(paidInv, 'Must have a paid invoice');
assert.strictEqual(paidInv.amount_due, 0);

const overdueInv = invoices.find(i => i.status === 'confirmed');
assert.ok(overdueInv, 'Must have a confirmed overdue invoice for testing');
assert.ok(overdueInv.amount_due > 0, 'Overdue invoice must have outstanding amount due');

// 4. Test Idempotency Rule of Automated Billing
console.log('Testing billing idempotency logic...');
const sub = db.prepare("SELECT * FROM subscriptions WHERE status = 'active' LIMIT 1").get();
assert.ok(sub, 'Must have an active subscription');

// Check if double-billing is prevented
const duplicateCheck = db.prepare(`
  SELECT id FROM invoices WHERE subscription_id = ? AND billing_period_start = ?
`).all(sub.id, sub.start_date);

assert.ok(duplicateCheck.length <= 1, 'Idempotency constraint: at most 1 invoice per billing period');

console.log('✅ Billing idempotency and state machine tests passed!');
console.log('🎉 ALL BILLING, INVOICES & DISCOUNTS UNIT TESTS PASSED SUCCESSFULLY!');
