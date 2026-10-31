import assert from 'assert';
import { db } from '../src/db.js';

console.log('🧪 Running Products, Variants & Plans Unit Tests...');

// 1. Verify Product Variants
console.log('Verifying product variants in database...');
const product = db.prepare("SELECT * FROM products WHERE name LIKE '%Cloud Platform%'").get();
assert.ok(product, 'Cloud Platform product must exist');

const variants = db.prepare('SELECT * FROM product_variants WHERE product_id = ?').all(product.id);
assert.ok(variants.length >= 2, 'Must have at least 2 variants');

const odooVariant = variants.find(v => v.attribute_value === 'Odoo');
assert.ok(odooVariant, 'Odoo variant must exist');
assert.strictEqual(odooVariant.attribute_name, 'Brand');
assert.strictEqual(odooVariant.price_extra, 560.00, 'Odoo variant must add 560.00 to price');

console.log('✅ Product & variant tests passed!');

// 2. Verify Plans and Recurrence Intervals
console.log('Verifying recurring plans and lifecycle policies...');
const plans = db.prepare('SELECT * FROM plans').all();
assert.ok(plans.length >= 4, 'Must have monthly, yearly, daily, weekly plans');

const dailyPlan = plans.find(p => p.billing_interval === 'daily');
assert.ok(dailyPlan, 'Daily plan must exist');
assert.strictEqual(dailyPlan.auto_close_on_end, 1, 'Daily sandbox should auto-close on end');

const monthlyPlan = plans.find(p => p.billing_interval === 'monthly');
assert.ok(monthlyPlan, 'Monthly plan must exist');
assert.strictEqual(monthlyPlan.allow_pause, 1, 'Monthly plan should allow pause');
assert.strictEqual(monthlyPlan.allow_renewal, 1, 'Monthly plan should allow renewal');

const yearlyPlan = plans.find(p => p.billing_interval === 'yearly');
assert.ok(yearlyPlan, 'Yearly plan must exist');
assert.strictEqual(yearlyPlan.min_quantity, 5, 'Yearly plan minimum quantity should be 5');

console.log('✅ Recurring plans and lifecycle policies tests passed!');
console.log('🎉 ALL PRODUCTS & PLANS UNIT TESTS PASSED SUCCESSFULLY!');
