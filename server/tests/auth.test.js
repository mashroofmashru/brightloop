import assert from 'assert';
import { validatePassword } from '../src/middleware/auth.js';

console.log('🧪 Running Phase 1 Foundation & Auth Unit Tests...');

// 1. Test Password Validation Rule Checklist
console.log('Testing password validation rules...');

// Too short (<= 8)
const shortCheck = validatePassword('Short1!');
assert.strictEqual(shortCheck.isValid, false, 'Should fail for <= 8 chars');
assert.ok(shortCheck.errors.some(e => e.includes('more than 8 characters')));

// No uppercase
const noUpperCheck = validatePassword('nouppercase123!');
assert.strictEqual(noUpperCheck.isValid, false, 'Should fail without uppercase');
assert.ok(noUpperCheck.errors.some(e => e.includes('uppercase')));

// No lowercase
const noLowerCheck = validatePassword('NOLOWERCASE123!');
assert.strictEqual(noLowerCheck.isValid, false, 'Should fail without lowercase');
assert.ok(noLowerCheck.errors.some(e => e.includes('lowercase')));

// No special character
const noSpecialCheck = validatePassword('NoSpecial1234');
assert.strictEqual(noSpecialCheck.isValid, false, 'Should fail without special char');
assert.ok(noSpecialCheck.errors.some(e => e.includes('special character')));

// Valid password (> 8, upper, lower, special)
const validCheck = validatePassword('Brightloop2026!');
assert.strictEqual(validCheck.isValid, true, 'Should pass all criteria');
assert.strictEqual(validCheck.errors.length, 0);

console.log('✅ Password validation unit tests passed!');

// 2. Test Database Integrity and Seeding
import { db } from '../src/db.js';

const admin = db.prepare("SELECT * FROM users WHERE email = 'admin@brightloop.io'").get();
assert.ok(admin, 'Admin user must exist');
assert.strictEqual(admin.role, 'admin');

const staff = db.prepare("SELECT * FROM users WHERE email = 'staff@brightloop.io'").get();
assert.ok(staff, 'Staff user must exist');
assert.strictEqual(staff.role, 'staff');

const customer = db.prepare("SELECT * FROM users WHERE email = 'sarah@techcorp.com'").get();
assert.ok(customer, 'Customer user must exist');
assert.strictEqual(customer.role, 'customer');

// Verify Odoo variant price extra 560
const odooVariant = db.prepare("SELECT * FROM product_variants WHERE attribute_value = 'Odoo'").get();
assert.ok(odooVariant, 'Odoo variant must exist');
assert.strictEqual(odooVariant.price_extra, 560.00, 'Odoo variant must add 560 to price');

console.log('✅ Database integrity unit tests passed!');
console.log('🎉 ALL PHASE 1 UNIT TESTS PASSED SUCCESSFULLY!');
