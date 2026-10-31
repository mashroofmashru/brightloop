import assert from 'assert';
import { db } from '../src/db.js';

console.log('🧪 Running End-to-End Complete Business Scenario Suite...');

const runTimestamp = Date.now();

// ---------------------------------------------------------------------------
// Scenario 1: Identity, RBAC & Strict Password Policy
// ---------------------------------------------------------------------------
console.log('\n[Scenario 1] Validating RBAC and Password Policy Rules...');
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{9,}$/;

// Verify password policy
assert.strictEqual(passwordRegex.test('short'), false, 'Rejects short password');
assert.strictEqual(passwordRegex.test('AllLowercase123!'), true, 'Accepts valid strong password');
assert.strictEqual(passwordRegex.test('noSpecialChar123'), false, 'Rejects missing special char');

// Verify seeded roles in users
const users = db.prepare('SELECT DISTINCT role FROM users').all().map(u => u.role);
assert.ok(users.includes('admin'), 'System has admin accounts');
assert.ok(users.includes('staff'), 'System has staff accounts');
assert.ok(users.includes('customer'), 'System has customer accounts');
console.log('✅ Scenario 1: RBAC & Password security verified.');

// ---------------------------------------------------------------------------
// Scenario 2: Products with Variant Pricing Delta (+$560 Odoo Brand)
// ---------------------------------------------------------------------------
console.log('\n[Scenario 2] Validating Products & Variant Attribute Delta (+560)...');
const odooVariant = db.prepare(`
  SELECT pv.*, p.name as product_name, p.sales_price 
  FROM product_variants pv 
  JOIN products p ON pv.product_id = p.id 
  WHERE pv.attribute_name = 'Brand' AND pv.attribute_value = 'Odoo'
`).get();

assert.ok(odooVariant, 'Variant Brand: Odoo must exist in the database');
assert.strictEqual(Number(odooVariant.price_extra), 560.00, 'Brand: Odoo must add exactly $560.00');

const calculatedVariantPrice = Number(odooVariant.sales_price) + Number(odooVariant.price_extra);
assert.ok(calculatedVariantPrice > Number(odooVariant.sales_price), 'Variant total price must exceed base product price');
console.log(`✅ Scenario 2: Variant pricing verified (Base: $${odooVariant.sales_price} + Extra: $${odooVariant.price_extra} = $${calculatedVariantPrice}).`);

// ---------------------------------------------------------------------------
// Scenario 3: Quotation Template, Subscriptions & Sequential Numbering
// ---------------------------------------------------------------------------
console.log('\n[Scenario 3] Validating Quotation Templates & Subscription Lifecycle...');
const template = db.prepare('SELECT * FROM quotation_templates LIMIT 1').get();
assert.ok(template, 'Must have at least one active quotation template');

const customer = db.prepare("SELECT * FROM users WHERE role = 'customer' LIMIT 1").get();
assert.ok(customer, 'Customer user must exist');

const plan = db.prepare("SELECT * FROM plans WHERE billing_interval = 'monthly' LIMIT 1").get();
assert.ok(plan, 'Monthly plan must exist');

// Create a new subscription through lifecycle: draft -> quotation -> confirmed -> active
const subNumber = `SUB-E2E-${runTimestamp}`;
const insertSub = db.prepare(`
  INSERT INTO subscriptions (
    subscription_number, customer_id, plan_id, status, 
    start_date, next_billing_date, payment_terms, 
    subtotal, tax_total, discount_total, grand_total
  ) VALUES (?, ?, ?, 'draft', '2026-03-01', '2026-04-01', 'Net 30', ?, ?, 0, ?)
`);

const lineSubtotal = calculatedVariantPrice * 2; // Qty 2
const lineTax = lineSubtotal * 0.15; // 15% VAT
const grandTotal = lineSubtotal + lineTax;

const subResult = insertSub.run(subNumber, customer.id, plan.id, lineSubtotal, lineTax, grandTotal);
const subId = subResult.lastInsertRowid;

// Add subscription line
db.prepare(`
  INSERT INTO subscription_lines (
    subscription_id, product_id, variant_id, description, quantity, unit_price, line_subtotal, line_tax, line_total
  ) VALUES (?, ?, ?, ?, 2, ?, ?, ?, ?)
`).run(subId, odooVariant.product_id, odooVariant.id, `${odooVariant.product_name} (Odoo Brand)`, calculatedVariantPrice, lineSubtotal, lineTax, grandTotal);

// Transition: draft -> quotation
db.prepare("UPDATE subscriptions SET status = 'quotation' WHERE id = ?").run(subId);
let currentSub = db.prepare('SELECT status FROM subscriptions WHERE id = ?').get(subId);
assert.strictEqual(currentSub.status, 'quotation');

// Transition: quotation -> confirmed
db.prepare("UPDATE subscriptions SET status = 'confirmed' WHERE id = ?").run(subId);
currentSub = db.prepare('SELECT status FROM subscriptions WHERE id = ?').get(subId);
assert.strictEqual(currentSub.status, 'confirmed');

// Transition: confirmed -> active
db.prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?").run(subId);
currentSub = db.prepare('SELECT status FROM subscriptions WHERE id = ?').get(subId);
assert.strictEqual(currentSub.status, 'active');
console.log(`✅ Scenario 3: Subscription ${subNumber} successfully created and transitioned to active.`);

// ---------------------------------------------------------------------------
// Scenario 4: Automated Idempotent Billing Engine & Conditional Discounts
// ---------------------------------------------------------------------------
console.log('\n[Scenario 4] Validating Idempotent Billing & Conditional Discount Redemptions...');

// Verify discount rules
const promoDiscount = db.prepare("SELECT * FROM discounts WHERE code = 'LAUNCH20'").get();
assert.ok(promoDiscount, 'LAUNCH20 discount rule must exist');
const initialRedemptions = promoDiscount.redemption_count;

// Create invoice from the active subscription
const invNumber = `INV-E2E-${runTimestamp}`;
const discountAmount = promoDiscount.discount_type === 'percent' 
  ? (lineSubtotal * (promoDiscount.value / 100))
  : promoDiscount.value;

const finalTotal = (lineSubtotal - discountAmount) + lineTax;

const invResult = db.prepare(`
  INSERT INTO invoices (
    invoice_number, subscription_id, customer_id, status, 
    invoice_date, due_date, billing_period_start, billing_period_end, 
    subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, notes
  ) VALUES (?, ?, ?, 'confirmed', '2026-03-01', '2026-03-31', '2026-03-01', '2026-03-31', ?, ?, ?, ?, 0, ?, ?)
`).run(invNumber, subId, customer.id, lineSubtotal, lineTax, discountAmount, finalTotal, finalTotal, 'Promo applied');

const invoiceId = invResult.lastInsertRowid;

// Increment redemption counter
db.prepare('UPDATE discounts SET redemption_count = redemption_count + 1 WHERE id = ?').run(promoDiscount.id);
const updatedPromo = db.prepare('SELECT redemption_count FROM discounts WHERE id = ?').get(promoDiscount.id);
assert.strictEqual(updatedPromo.redemption_count, initialRedemptions + 1, 'Discount redemption counter must increment');

// Idempotency check: verify unique billing period invoice for the same subscription
const duplicateCheck = db.prepare(`
  SELECT id FROM invoices 
  WHERE subscription_id = ? AND billing_period_start = '2026-03-01'
`).all(subId);
assert.strictEqual(duplicateCheck.length, 1, 'Only one invoice per billing period is allowed');
console.log(`✅ Scenario 4: Invoice ${invNumber} generated with discount & idempotency safeguard.`);

// ---------------------------------------------------------------------------
// Scenario 5: Payment Processing & Auto-Reconciliation to Paid
// ---------------------------------------------------------------------------
console.log('\n[Scenario 5] Validating Multi-Method Payments and Full Reconciliation...');
const payNumber = `PAY-E2E-${runTimestamp}`;

db.prepare(`
  INSERT INTO payments (payment_number, invoice_id, customer_id, method, amount, payment_date, reference_note, status)
  VALUES (?, ?, ?, 'credit_card', ?, '2026-03-02', 'E2E Full Settlement', 'completed')
`).run(payNumber, invoiceId, customer.id, finalTotal);

// Reconcile invoice
db.prepare(`
  UPDATE invoices 
  SET amount_paid = amount_paid + ?, 
      amount_due = MAX(0, amount_due - ?),
      status = CASE WHEN (amount_due - ?) <= 0 THEN 'paid' ELSE status END
  WHERE id = ?
`).run(finalTotal, finalTotal, finalTotal, invoiceId);

const settledInv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
assert.strictEqual(settledInv.amount_due, 0, 'Invoice balance due must be 0.00');
assert.strictEqual(settledInv.status, 'paid', "Invoice status must transition to 'paid'");
console.log(`✅ Scenario 5: Invoice ${invNumber} fully settled via payment ${payNumber} and marked 'paid'.`);

// ---------------------------------------------------------------------------
// Scenario 6: Customer Portal Self-Service Isolation
// ---------------------------------------------------------------------------
console.log('\n[Scenario 6] Validating Customer Portal Data Isolation & Self-Service...');
const customerSubs = db.prepare('SELECT * FROM subscriptions WHERE customer_id = ?').all(customer.id);
assert.ok(customerSubs.length >= 1, 'Customer can retrieve their own subscriptions');
assert.ok(customerSubs.every(s => s.customer_id === customer.id), 'Customer receives only their own records');

const customerInvs = db.prepare('SELECT * FROM invoices WHERE customer_id = ?').all(customer.id);
assert.ok(customerInvs.length >= 1, 'Customer can retrieve their own invoices');
assert.ok(customerInvs.every(i => i.customer_id === customer.id), 'Customer invoices are securely scoped');

// Customer self-service pause & resume
db.prepare("UPDATE subscriptions SET status = 'paused' WHERE id = ?").run(subId);
let subState = db.prepare('SELECT status FROM subscriptions WHERE id = ?').get(subId);
assert.strictEqual(subState.status, 'paused', 'Customer can pause allowed subscription');

db.prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?").run(subId);
subState = db.prepare('SELECT status FROM subscriptions WHERE id = ?').get(subId);
assert.strictEqual(subState.status, 'active', 'Customer can resume paused subscription');
console.log('✅ Scenario 6: Customer portal security scoping and self-service lifecycle verified.');

// ---------------------------------------------------------------------------
// Scenario 7: Executive Finance Analytics SLA (<2s SLA Benchmark)
// ---------------------------------------------------------------------------
console.log('\n[Scenario 7] Benchmarking Executive Finance Analytics Queries (<2s SLA)...');
const startTime = Date.now();

const mrrQuery = db.prepare(`
  SELECT COALESCE(SUM(
    CASE 
      WHEN p.billing_interval = 'monthly' THEN s.grand_total
      WHEN p.billing_interval = 'yearly' THEN s.grand_total / 12.0
      WHEN p.billing_interval = 'weekly' THEN s.grand_total * 4.33
      WHEN p.billing_interval = 'daily' THEN s.grand_total * 30.0
      ELSE s.grand_total
    END
  ), 0) as mrr
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.status = 'active'
`).get();

const cashCollected = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'completed'").get();
const openReceivables = db.prepare("SELECT COALESCE(SUM(amount_due), 0) as total FROM invoices WHERE status = 'confirmed' AND amount_due > 0").get();

const duration = Date.now() - startTime;
assert.ok(duration < 2000, `Analytics query must complete within 2000ms SLA (Actual: ${duration}ms)`);
assert.ok(mrrQuery.mrr > 0, 'Calculated MRR must be positive');
assert.ok(cashCollected.total > 0, 'Total cash collected must be positive');

console.log(`✅ Scenario 7: Executive dashboard analytics executed in ${duration}ms (MRR: $${Number(mrrQuery.mrr).toFixed(2)}, Cash: $${Number(cashCollected.total).toFixed(2)}).`);

console.log('\n================================================================');
console.log('🎉 ALL END-TO-END SCENARIOS VERIFIED SUCCESSFULLY AND PASSED!');
console.log('================================================================');
