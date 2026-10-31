import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

export async function seedDatabase() {
  initDb();

  console.log('🌱 Seeding Brightloop database...');

  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  // Passwords adhering to rule: >8 chars, uppercase, lowercase, special character
  const adminPass = await bcrypt.hash('BrightAdmin2026!', 10);
  const staffPass = await bcrypt.hash('BrightStaff2026!', 10);
  const custPass = await bcrypt.hash('CustomerPass2026!', 10);

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, company_name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const adminId = insertUser.run(
    'Elena Vance (Admin)',
    'admin@brightloop.io',
    adminPass,
    'admin',
    'Brightloop Software Inc.',
    '+1 (555) 019-2831'
  ).lastInsertRowid;

  const staffId = insertUser.run(
    'Marcus Reed (Operations)',
    'staff@brightloop.io',
    staffPass,
    'staff',
    'Brightloop Software Inc.',
    '+1 (555) 019-2832'
  ).lastInsertRowid;

  const cust1Id = insertUser.run(
    'Sarah Jenkins',
    'sarah@techcorp.com',
    custPass,
    'customer',
    'TechCorp Global Solutions',
    '+1 (555) 432-8710'
  ).lastInsertRowid;

  const cust2Id = insertUser.run(
    'John Davis',
    'john@urbanretail.com',
    custPass,
    'customer',
    'Urban Retailers Ltd',
    '+1 (555) 891-2309'
  ).lastInsertRowid;

  const cust3Id = insertUser.run(
    'Alex Rivera',
    'alex@quickstart.co',
    custPass,
    'customer',
    'QuickStart Studio',
    '+1 (555) 761-4411'
  ).lastInsertRowid;

  console.log('✅ Users seeded (Admin, Staff, 3 Customers)');

  // 2. Seed Products & Variants
  const insertProd = db.prepare(`
    INSERT INTO products (name, type, sales_price, cost_price, notes, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const prod1Id = insertProd.run(
    'Brightloop Cloud Platform',
    'software',
    1200.00,
    350.00,
    'Core multi-tenant subscription software engine'
  ).lastInsertRowid;

  const prod2Id = insertProd.run(
    '24/7 Dedicated Support Add-on',
    'service',
    350.00,
    100.00,
    'Priority phone and SLA resolution within 1 hour'
  ).lastInsertRowid;

  const prod3Id = insertProd.run(
    'Hardware 2FA Security Token',
    'physical',
    65.00,
    25.00,
    'FIDO2 WebAuthn cryptographic physical key'
  ).lastInsertRowid;

  // Variants for Product 1 (including Odoo brand +560 requirement)
  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
    VALUES (?, ?, ?, ?, ?)
  `);

  const varStandardId = insertVariant.run(prod1Id, 'Brand', 'Standard', 0.00, 'BLP-STD-01').lastInsertRowid;
  const varOdooId = insertVariant.run(prod1Id, 'Brand', 'Odoo', 560.00, 'BLP-ODOO-02').lastInsertRowid;
  const varEntId = insertVariant.run(prod1Id, 'Brand', 'Enterprise Custom', 980.00, 'BLP-ENT-03').lastInsertRowid;

  console.log('✅ Products & Variants seeded (including Odoo Brand +560.00)');

  // 3. Seed Plans
  const insertPlan = db.prepare(`
    INSERT INTO plans (name, code, price, billing_interval, min_quantity, available_from, available_until, auto_close_on_end, allow_early_close, allow_pause, allow_renewal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const planMonthlyId = insertPlan.run(
    'Monthly Pro Business',
    'PLAN-MTH-PRO',
    199.00,
    'monthly',
    1,
    '2026-01-01',
    '2028-12-31',
    0, 1, 1, 1
  ).lastInsertRowid;

  const planYearlyId = insertPlan.run(
    'Yearly Enterprise Contract',
    'PLAN-YR-ENT',
    1990.00,
    'yearly',
    5,
    '2026-01-01',
    '2029-12-31',
    0, 1, 1, 1
  ).lastInsertRowid;

  const planDailyId = insertPlan.run(
    'Daily Sandbox Test Cluster',
    'PLAN-DAY-SBOX',
    25.00,
    'daily',
    1,
    '2026-01-01',
    '2026-12-31',
    1, 1, 0, 0
  ).lastInsertRowid;

  const planWeeklyId = insertPlan.run(
    'Weekly Growth Accelerator',
    'PLAN-WK-GROWTH',
    65.00,
    'weekly',
    1,
    '2026-01-01',
    '2027-12-31',
    0, 1, 1, 1
  ).lastInsertRowid;

  console.log('✅ Plans seeded (Monthly, Yearly, Daily, Weekly)');

  // 4. Seed Taxes
  const insertTax = db.prepare(`
    INSERT INTO taxes (name, rate, tax_type, is_active)
    VALUES (?, ?, ?, 1)
  `);

  const taxVatId = insertTax.run('Standard VAT (15%)', 15.00, 'exclusive').lastInsertRowid;
  const taxStateId = insertTax.run('State Sales Tax (8%)', 8.00, 'exclusive').lastInsertRowid;
  const taxZeroId = insertTax.run('Tax Exempt (0%)', 0.00, 'exclusive').lastInsertRowid;

  console.log('✅ Taxes seeded');

  // 5. Seed Discounts
  const insertDiscount = db.prepare(`
    INSERT INTO discounts (name, code, discount_type, value, min_order_amount, min_quantity, start_date, end_date, usage_limit, redemption_count, scope, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const discLaunchId = insertDiscount.run(
    'Q1 Early Bird Promo',
    'LAUNCH20',
    'percent',
    20.00,
    500.00,
    1,
    '2026-01-01',
    '2026-12-31',
    100,
    14,
    'order'
  ).lastInsertRowid;

  const discSeatsId = insertDiscount.run(
    'High Volume Seat Credit',
    'VOLUME100',
    'fixed',
    100.00,
    0.00,
    5,
    '2026-01-01',
    '2026-12-31',
    50,
    8,
    'order'
  ).lastInsertRowid;

  console.log('✅ Discounts seeded');

  // 6. Seed Quotation Templates
  const tmplId = db.prepare(`
    INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
    VALUES ('Standard Enterprise Odoo Bundle', ?, 30, 'Pre-configured quotation for enterprise clients requesting Odoo edition')
  `).run(planYearlyId).lastInsertRowid;

  db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
    VALUES (?, ?, ?, 5, 1760.00, 10.0)
  `).run(tmplId, prod1Id, varOdooId);

  db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
    VALUES (?, ?, NULL, 1, 350.00, 0.0)
  `).run(tmplId, prod2Id);

  console.log('✅ Quotation templates seeded');

  // 7. Seed Sample Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, status,
      start_date, expiry_date, next_billing_date, payment_terms,
      subtotal, tax_total, discount_total, grand_total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sub1Id = insertSub.run(
    'SUB-2026-0001',
    cust1Id,
    planMonthlyId,
    'active',
    '2026-02-01',
    '2027-02-01',
    '2026-03-01',
    'Net 15',
    1550.00,
    232.50,
    0.00,
    1782.50,
    'TechCorp primary production cluster'
  ).lastInsertRowid;

  db.prepare(`
    INSERT INTO subscription_lines (
      subscription_id, product_id, variant_id, description, quantity, unit_price, tax_id, line_subtotal, line_tax, line_total
    ) VALUES (?, ?, ?, 'Brightloop Cloud Platform (Standard)', 1, 1200.00, ?, 1200.00, 180.00, 1380.00)
  `).run(sub1Id, prod1Id, varStandardId, taxVatId);

  db.prepare(`
    INSERT INTO subscription_lines (
      subscription_id, product_id, variant_id, description, quantity, unit_price, tax_id, line_subtotal, line_tax, line_total
    ) VALUES (?, ?, NULL, '24/7 Dedicated Support Add-on', 1, 350.00, ?, 350.00, 52.50, 402.50)
  `).run(sub1Id, prod2Id, taxVatId);

  const sub2Id = insertSub.run(
    'SUB-2026-0002',
    cust2Id,
    planYearlyId,
    'active',
    '2026-01-15',
    '2027-01-15',
    '2026-11-01',
    'Immediate',
    1760.00,
    264.00,
    0.00,
    2024.00,
    'Urban Retailers Odoo-integrated subscription'
  ).lastInsertRowid;

  db.prepare(`
    INSERT INTO subscription_lines (
      subscription_id, product_id, variant_id, description, quantity, unit_price, tax_id, line_subtotal, line_tax, line_total
    ) VALUES (?, ?, ?, 'Brightloop Cloud Platform (Odoo Brand +560)', 1, 1760.00, ?, 1760.00, 264.00, 2024.00)
  `).run(sub2Id, prod1Id, varOdooId, taxVatId);

  const sub3Id = insertSub.run(
    'SUB-2026-0003',
    cust3Id,
    planDailyId,
    'quotation',
    '2026-03-01',
    '2026-03-10',
    '2026-03-01',
    'Net 30',
    250.00,
    20.00,
    0.00,
    270.00,
    'Sandbox quotation awaiting customer approval'
  ).lastInsertRowid;

  console.log('✅ Subscriptions seeded');

  // 8. Seed Invoices & Payments
  const insertInv = db.prepare(`
    INSERT INTO invoices (
      invoice_number, subscription_id, customer_id, status,
      invoice_date, due_date, billing_period_start, billing_period_end,
      subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inv1Id = insertInv.run(
    'INV-2026-0001',
    sub1Id,
    cust1Id,
    'paid',
    '2026-02-01',
    '2026-02-16',
    '2026-02-01',
    '2026-02-28',
    1550.00,
    232.50,
    0.00,
    1782.50,
    1782.50,
    0.00,
    'February billing cycle - settled in full'
  ).lastInsertRowid;

  db.prepare(`
    INSERT INTO invoice_lines (invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, total)
    VALUES (?, ?, ?, 'Brightloop Cloud Platform (Standard)', 1, 1200.00, 15.00, 1380.00)
  `).run(inv1Id, prod1Id, varStandardId);

  db.prepare(`
    INSERT INTO invoice_lines (invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, total)
    VALUES (?, ?, NULL, '24/7 Dedicated Support Add-on', 1, 350.00, 15.00, 402.50)
  `).run(inv1Id, prod2Id);

  db.prepare(`
    INSERT INTO payments (payment_number, invoice_id, customer_id, method, amount, payment_date, reference_note, status)
    VALUES ('PAY-2026-0001', ?, ?, 'bank_transfer', 1782.50, '2026-02-05', 'ACH Wire Ref #9928174', 'completed')
  `).run(inv1Id, cust1Id);

  // Overdue invoice for dashboard testing
  const inv2Id = insertInv.run(
    'INV-2026-0002',
    sub2Id,
    cust2Id,
    'confirmed',
    '2026-01-15',
    '2026-01-30',
    '2026-01-15',
    '2026-02-15',
    1760.00,
    264.00,
    0.00,
    2024.00,
    0.00,
    2024.00,
    'January contract invoice - payment overdue'
  ).lastInsertRowid;

  console.log('✅ Invoices & Payments seeded (including 1 paid, 1 overdue)');
  console.log('✨ Brightloop database seeding complete!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
