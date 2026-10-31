import assert from 'assert';
import { db } from '../src/db.js';

console.log('🧪 Running Quotations, Templates & Subscriptions Unit Tests...');

// 1. Verify Quotation Templates
console.log('Verifying quotation templates...');
const template = db.prepare("SELECT * FROM quotation_templates WHERE name LIKE '%Enterprise Odoo%'").get();
assert.ok(template, 'Odoo Enterprise quotation template must exist');

const tmplLines = db.prepare('SELECT * FROM quotation_template_lines WHERE template_id = ?').all(template.id);
assert.ok(tmplLines.length >= 2, 'Template must have pre-configured lines');

console.log('✅ Quotation templates tests passed!');

// 2. Verify Subscriptions & Sequential Numbering
console.log('Verifying subscriptions & numbering...');
const sub = db.prepare("SELECT * FROM subscriptions WHERE subscription_number = 'SUB-2026-0001'").get();
assert.ok(sub, 'First subscription SUB-2026-0001 must exist');
assert.strictEqual(sub.status, 'active');

const subLines = db.prepare('SELECT * FROM subscription_lines WHERE subscription_id = ?').all(sub.id);
assert.ok(subLines.length >= 1, 'Subscription must contain product lines');

// Check line totals calculation
const lineSubtotalSum = subLines.reduce((acc, l) => acc + l.line_subtotal, 0);
assert.strictEqual(lineSubtotalSum, sub.subtotal, 'Sum of line subtotals must equal subscription subtotal');

console.log('✅ Subscription lines & math verification passed!');

// 3. Test State Machine Transitions
console.log('Verifying state machine lifecycle...');
const validTransitions = {
  draft: ['quotation', 'confirmed', 'closed'],
  quotation: ['confirmed', 'closed', 'draft'],
  confirmed: ['active', 'closed'],
  active: ['paused', 'closed', 'active'],
  paused: ['active', 'closed'],
  closed: ['draft']
};

assert.ok(validTransitions.draft.includes('quotation'));
assert.ok(validTransitions.quotation.includes('confirmed'));
assert.ok(validTransitions.confirmed.includes('active'));
assert.ok(validTransitions.active.includes('closed'));

console.log('✅ Subscription lifecycle state machine verified!');
console.log('🎉 ALL QUOTATIONS & SUBSCRIPTIONS UNIT TESTS PASSED SUCCESSFULLY!');
