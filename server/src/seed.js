import bcrypt from 'bcryptjs';
import { db, initDb } from './db.js';

export function cleanDatabase() {
  console.log('🧹 Clearing all existing Brightloop database records...');
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM payments;
    DELETE FROM invoice_lines;
    DELETE FROM invoices;
    DELETE FROM subscription_lines;
    DELETE FROM subscriptions;
    DELETE FROM quotation_template_lines;
    DELETE FROM quotation_templates;
    DELETE FROM product_variants;
    DELETE FROM products;
    DELETE FROM quotation_template_lines;
    DELETE FROM quotation_templates;
    DELETE FROM plans;
    DELETE FROM taxes;
    DELETE FROM discounts;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
    PRAGMA foreign_keys = ON;
  `);
  console.log('✨ All tables cleared and sequences reset.');
}

export async function seedDatabase(forceClean = true) {
  initDb();

  if (forceClean) {
    cleanDatabase();
  } else {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count > 0) {
      console.log('Database already contains records. Skipping seed.');
      return;
    }
  }

  console.log('🌱 Seeding rich benchmark dataset for Brightloop...');

  // Standard compliant passwords (>8 chars, uppercase, lowercase, digit, special char)
  const adminPass = await bcrypt.hash('BrightAdmin2026!', 10);
  const staffPass = await bcrypt.hash('BrightStaff2026!', 10);
  const custPass = await bcrypt.hash('CustomerPass2026!', 10);

  // -------------------------------------------------------------------------
  // 1. Seed Users (Admins, Staff, and Diverse Customers)
  // -------------------------------------------------------------------------
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, company_name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Admins
  const admin1Id = insertUser.run(
    'Elena Vance (COO & Admin)',
    'admin@brightloop.io',
    adminPass,
    'admin',
    'Brightloop Software Inc.',
    '+1 (555) 019-2831'
  ).lastInsertRowid;

  const admin2Id = insertUser.run(
    'David Chen (VP Finance)',
    'david.chen@brightloop.io',
    adminPass,
    'admin',
    'Brightloop Software Inc.',
    '+1 (555) 019-2839'
  ).lastInsertRowid;

  // Staff (Sales & Operations)
  const staff1Id = insertUser.run(
    'Marcus Reed (Billing Ops)',
    'staff@brightloop.io',
    staffPass,
    'staff',
    'Brightloop Software Inc.',
    '+1 (555) 019-2832'
  ).lastInsertRowid;

  const staff2Id = insertUser.run(
    'Chloe Adams (Enterprise AE)',
    'chloe.adams@brightloop.io',
    staffPass,
    'staff',
    'Brightloop Software Inc.',
    '+1 (555) 019-2833'
  ).lastInsertRowid;

  const staff3Id = insertUser.run(
    'Liam Patel (Customer Success)',
    'liam.patel@brightloop.io',
    staffPass,
    'staff',
    'Brightloop Software Inc.',
    '+1 (555) 019-2834'
  ).lastInsertRowid;

  // Customers (Various Industries & Geographies)
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

  const cust4Id = insertUser.run(
    'Emily Watson',
    'emily.watson@apexlogistics.com',
    custPass,
    'customer',
    'Apex Freight & Logistics',
    '+1 (555) 328-9901'
  ).lastInsertRowid;

  const cust5Id = insertUser.run(
    'Robert Kim',
    'robert.kim@fintechpulse.io',
    custPass,
    'customer',
    'FinTech Pulse Technologies',
    '+1 (555) 674-1288'
  ).lastInsertRowid;

  const cust6Id = insertUser.run(
    'Clara Moreau',
    'clara.moreau@lyonconsulting.eu',
    custPass,
    'customer',
    'Lyon Advisory Group',
    '+33 1 42 68 55 00'
  ).lastInsertRowid;

  const cust7Id = insertUser.run(
    'Samuel Okonkwo',
    'sam.okonkwo@saharaenergy.org',
    custPass,
    'customer',
    'Sahara Clean Power',
    '+234 1 890 2341'
  ).lastInsertRowid;

  const cust8Id = insertUser.run(
    'Dr. Priya Nair',
    'priya.nair@vertexhealth.com',
    custPass,
    'customer',
    'Vertex Health Analytics',
    '+1 (555) 912-7800'
  ).lastInsertRowid;

  const cust9Id = insertUser.run(
    'Hannah Schmidt',
    'hannah.schmidt@nordiccloud.de',
    custPass,
    'customer',
    'Nordic Cloud Systems GmbH',
    '+49 30 901820'
  ).lastInsertRowid;

  const cust10Id = insertUser.run(
    'Carlos Mendoza',
    'carlos.mendoza@latamgrowth.com',
    custPass,
    'customer',
    'LatAm Commerce Hub',
    '+52 55 5345 2000'
  ).lastInsertRowid;

  console.log('✅ Seeded 15 Users (2 Admins, 3 Staff, 10 Customers)');

  // -------------------------------------------------------------------------
  // 2. Seed Products & Variants
  // -------------------------------------------------------------------------
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

  const prod4Id = insertProd.run(
    'Advanced Analytics & AI Forecasting',
    'software',
    450.00,
    120.00,
    'Real-time MRR churn forecasting and predictive cohort analytics'
  ).lastInsertRowid;

  const prod5Id = insertProd.run(
    'Dedicated High-Throughput API Gateway',
    'service',
    800.00,
    220.00,
    'Uncapped rate limits, 99.99% uptime guarantee with global CDN'
  ).lastInsertRowid;

  const prod6Id = insertProd.run(
    'White-Glove Architecture Onboarding',
    'service',
    2500.00,
    800.00,
    'Single payment migration and custom ERP integration'
  ).lastInsertRowid;

  // Variants for Product 1 (including mandatory Odoo brand +560 requirement)
  const insertVariant = db.prepare(`
    INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_extra, sku)
    VALUES (?, ?, ?, ?, ?)
  `);

  const varStandardId = insertVariant.run(prod1Id, 'Brand', 'Standard', 0.00, 'BLP-STD-01').lastInsertRowid;
  const varOdooId = insertVariant.run(prod1Id, 'Brand', 'Odoo', 560.00, 'BLP-ODOO-02').lastInsertRowid;
  const varEntId = insertVariant.run(prod1Id, 'Brand', 'Enterprise Custom', 980.00, 'BLP-ENT-03').lastInsertRowid;

  // Variants for Product 4 (Analytics Tier)
  const varStorageStdId = insertVariant.run(prod4Id, 'Storage Tier', 'Standard 500GB', 0.00, 'ANA-500G').lastInsertRowid;
  const varStorageProId = insertVariant.run(prod4Id, 'Storage Tier', 'Pro 2TB', 150.00, 'ANA-2TB').lastInsertRowid;
  const varStorageEntId = insertVariant.run(prod4Id, 'Storage Tier', 'Enterprise 10TB', 500.00, 'ANA-10TB').lastInsertRowid;

  console.log('✅ Seeded 6 Products and 6 Variants (including Odoo Brand +$560.00)');

  // -------------------------------------------------------------------------
  // 3. Seed Plans (Various Billing Intervals & Policies)
  // -------------------------------------------------------------------------
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

  console.log('✅ Seeded 4 Recurring Plans (Monthly, Yearly, Weekly, Daily)');

  // -------------------------------------------------------------------------
  // 4. Seed Taxes
  // -------------------------------------------------------------------------
  const insertTax = db.prepare(`
    INSERT INTO taxes (name, rate, tax_type, is_active)
    VALUES (?, ?, ?, 1)
  `);

  const taxVatId = insertTax.run('Standard VAT (15%)', 15.00, 'exclusive').lastInsertRowid;
  const taxStateId = insertTax.run('State Sales Tax (8%)', 8.00, 'exclusive').lastInsertRowid;
  const taxEuId = insertTax.run('EU Digital Tax (10%)', 10.00, 'exclusive').lastInsertRowid;
  const taxZeroId = insertTax.run('Tax Exempt (0%)', 0.00, 'exclusive').lastInsertRowid;

  console.log('✅ Seeded 4 Tax Rules');

  // -------------------------------------------------------------------------
  // 5. Seed Discounts
  // -------------------------------------------------------------------------
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

  const discVolumeId = insertDiscount.run(
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

  const discEntId = insertDiscount.run(
    'Enterprise Partnership 15%',
    'ENTERPRISE15',
    'percent',
    15.00,
    1500.00,
    1,
    '2026-01-01',
    '2027-12-31',
    200,
    26,
    'order'
  ).lastInsertRowid;

  const discStartupId = insertDiscount.run(
    'Y-Combinator Accelerator Credit',
    'STARTUP50',
    'percent',
    50.00,
    200.00,
    1,
    '2026-01-01',
    '2026-12-31',
    30,
    12,
    'order'
  ).lastInsertRowid;

  console.log('✅ Seeded 4 Conditional Discount Rules');

  // -------------------------------------------------------------------------
  // 6. Seed Quotation Templates
  // -------------------------------------------------------------------------
  const tmpl1Id = db.prepare(`
    INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
    VALUES ('Standard Enterprise Odoo Bundle', ?, 30, 'Pre-configured quotation for enterprise clients requesting Odoo edition')
  `).run(planYearlyId).lastInsertRowid;

  db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
    VALUES (?, ?, ?, 5, 1760.00, 10.0)
  `).run(tmpl1Id, prod1Id, varOdooId);

  db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
    VALUES (?, ?, NULL, 1, 350.00, 0.0)
  `).run(tmpl1Id, prod2Id);

  const tmpl2Id = db.prepare(`
    INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
    VALUES ('Growth Stage SaaS Starter Pack', ?, 15, 'Tailored package for fast-growing companies')
  `).run(planMonthlyId).lastInsertRowid;

  db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
    VALUES (?, ?, ?, 1, 1200.00, 0.0)
  `).run(tmpl2Id, prod1Id, varStandardId);

  db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
    VALUES (?, ?, ?, 1, 450.00, 5.0)
  `).run(tmpl2Id, prod4Id, varStorageStdId);

  console.log('✅ Seeded 2 Quotation Templates with Line Items');

  // -------------------------------------------------------------------------
  // 7. Seed Subscriptions Across Diverse Customers
  // -------------------------------------------------------------------------
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, status,
      start_date, expiry_date, next_billing_date, payment_terms,
      subtotal, tax_total, discount_total, grand_total, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSubLine = db.prepare(`
    INSERT INTO subscription_lines (
      subscription_id, product_id, variant_id, description, quantity, unit_price, tax_id, line_subtotal, line_tax, line_total
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Sub 1: TechCorp (Active Monthly)
  const sub1Id = insertSub.run(
    'SUB-2026-0001', cust1Id, planMonthlyId, 'active',
    '2026-02-01', '2027-02-01', '2026-03-01', 'Net 15',
    1550.00, 232.50, 0.00, 1782.50, 'TechCorp primary cluster'
  ).lastInsertRowid;
  insertSubLine.run(sub1Id, prod1Id, varStandardId, 'Brightloop Cloud Platform (Standard)', 1, 1200.00, taxVatId, 1200.00, 180.00, 1380.00);
  insertSubLine.run(sub1Id, prod2Id, null, '24/7 Dedicated Support Add-on', 1, 350.00, taxVatId, 350.00, 52.50, 402.50);

  // Sub 2: Urban Retailers (Active Yearly with Odoo Variant +$560)
  const sub2Id = insertSub.run(
    'SUB-2026-0002', cust2Id, planYearlyId, 'active',
    '2026-01-15', '2027-01-15', '2026-11-01', 'Immediate',
    1760.00, 264.00, 0.00, 2024.00, 'Urban Retailers Odoo-integrated subscription'
  ).lastInsertRowid;
  insertSubLine.run(sub2Id, prod1Id, varOdooId, 'Brightloop Cloud Platform (Odoo Brand +560)', 1, 1760.00, taxVatId, 1760.00, 264.00, 2024.00);

  // Sub 3: QuickStart Studio (Pending Quotation)
  const sub3Id = insertSub.run(
    'SUB-2026-0003', cust3Id, planDailyId, 'quotation',
    '2026-03-01', '2026-03-10', '2026-03-01', 'Net 30',
    250.00, 20.00, 0.00, 270.00, 'Sandbox quotation awaiting customer approval'
  ).lastInsertRowid;
  insertSubLine.run(sub3Id, prod1Id, varStandardId, 'Brightloop Cloud Platform (Sandbox)', 1, 250.00, taxStateId, 250.00, 20.00, 270.00);

  // Sub 4: Apex Logistics (Active Monthly Enterprise)
  const sub4Id = insertSub.run(
    'SUB-2026-0004', cust4Id, planMonthlyId, 'active',
    '2026-01-01', '2027-01-01', '2026-04-01', 'Net 30',
    3430.00, 514.50, 0.00, 3944.50, 'Apex fleet multi-region tracking cluster'
  ).lastInsertRowid;
  insertSubLine.run(sub4Id, prod1Id, varEntId, 'Brightloop Cloud Platform (Enterprise Custom)', 1, 2180.00, taxVatId, 2180.00, 327.00, 2507.00);
  insertSubLine.run(sub4Id, prod5Id, null, 'Dedicated High-Throughput API Gateway', 1, 800.00, taxVatId, 800.00, 120.00, 920.00);
  insertSubLine.run(sub4Id, prod4Id, varStorageProId, 'Advanced Analytics & AI Forecasting (Pro 2TB)', 1, 450.00, taxVatId, 450.00, 67.50, 517.50);

  // Sub 5: FinTech Pulse (Active Monthly with 2FA Tokens)
  const sub5Id = insertSub.run(
    'SUB-2026-0005', cust5Id, planMonthlyId, 'active',
    '2026-02-15', '2027-02-15', '2026-03-15', 'Net 15',
    2100.00, 168.00, 0.00, 2268.00, 'FinTech Pulse regulatory production environment'
  ).lastInsertRowid;
  insertSubLine.run(sub5Id, prod1Id, varStandardId, 'Brightloop Cloud Platform', 1, 1200.00, taxStateId, 1200.00, 96.00, 1296.00);
  insertSubLine.run(sub5Id, prod3Id, null, 'Hardware 2FA Security Token (10 Units)', 10, 65.00, taxStateId, 650.00, 52.00, 702.00);
  insertSubLine.run(sub5Id, prod2Id, null, '24/7 Dedicated Support Add-on', 1, 250.00, taxStateId, 250.00, 20.00, 270.00);

  // Sub 6: Lyon Advisory Group (Paused Monthly)
  const sub6Id = insertSub.run(
    'SUB-2026-0006', cust6Id, planMonthlyId, 'paused',
    '2026-01-10', '2027-01-10', '2026-04-10', 'Net 30',
    1650.00, 165.00, 0.00, 1815.00, 'Temporarily paused for internal reorganization'
  ).lastInsertRowid;
  insertSubLine.run(sub6Id, prod1Id, varStandardId, 'Brightloop Cloud Platform', 1, 1200.00, taxEuId, 1200.00, 120.00, 1320.00);
  insertSubLine.run(sub6Id, prod4Id, varStorageStdId, 'Advanced Analytics Engine', 1, 450.00, taxEuId, 450.00, 45.00, 495.00);

  // Sub 7: Sahara Clean Power (Active Yearly)
  const sub7Id = insertSub.run(
    'SUB-2026-0007', cust7Id, planYearlyId, 'active',
    '2026-01-01', '2027-01-01', '2027-01-01', 'Immediate',
    2180.00, 0.00, 0.00, 2180.00, 'Sahara renewable grid monitoring telemetry'
  ).lastInsertRowid;
  insertSubLine.run(sub7Id, prod1Id, varEntId, 'Brightloop Cloud Platform (Enterprise)', 1, 2180.00, taxZeroId, 2180.00, 0.00, 2180.00);

  // Sub 8: Vertex Health Analytics (Draft Stage)
  const sub8Id = insertSub.run(
    'SUB-2026-0008', cust8Id, planMonthlyId, 'draft',
    '2026-04-01', '2027-04-01', '2026-04-01', 'Net 30',
    2950.00, 236.00, 0.00, 3186.00, 'HIPAA compliant deployment draft'
  ).lastInsertRowid;
  insertSubLine.run(sub8Id, prod1Id, varOdooId, 'Brightloop Cloud Platform (Odoo Edition)', 1, 1760.00, taxStateId, 1760.00, 140.80, 1900.80);
  insertSubLine.run(sub8Id, prod4Id, varStorageEntId, 'Advanced Analytics (10TB Storage)', 1, 950.00, taxStateId, 950.00, 76.00, 1026.00);
  insertSubLine.run(sub8Id, prod3Id, null, 'Hardware 2FA Security Token (4 Units)', 4, 60.00, taxStateId, 240.00, 19.20, 259.20);

  // Sub 9: Nordic Cloud Systems (Active Weekly)
  const sub9Id = insertSub.run(
    'SUB-2026-0009', cust9Id, planWeeklyId, 'active',
    '2026-02-01', '2026-06-01', '2026-03-08', 'Immediate',
    415.00, 41.50, 0.00, 456.50, 'Nordic fast-iteration dev sprint'
  ).lastInsertRowid;
  insertSubLine.run(sub9Id, prod2Id, null, '24/7 Dedicated Support Add-on', 1, 350.00, taxEuId, 350.00, 35.00, 385.00);
  insertSubLine.run(sub9Id, prod3Id, null, 'Hardware 2FA Security Token', 1, 65.00, taxEuId, 65.00, 6.50, 71.50);

  // Sub 10: LatAm Commerce (Closed)
  const sub10Id = insertSub.run(
    'SUB-2026-0010', cust10Id, planMonthlyId, 'closed',
    '2025-06-01', '2026-01-01', '2026-01-01', 'Net 15',
    1550.00, 124.00, 0.00, 1674.00, 'Term completed and auto-closed by policy'
  ).lastInsertRowid;
  insertSubLine.run(sub10Id, prod1Id, varStandardId, 'Brightloop Cloud Platform', 1, 1200.00, taxStateId, 1200.00, 96.00, 1296.00);
  insertSubLine.run(sub10Id, prod2Id, null, '24/7 Dedicated Support', 1, 350.00, taxStateId, 350.00, 28.00, 378.00);

  console.log('✅ Seeded 10 Subscriptions across customers with diverse lifecycles');

  // -------------------------------------------------------------------------
  // 8. Seed Invoices & Payments (Paid, Confirmed, Overdue, Partial)
  // -------------------------------------------------------------------------
  const insertInv = db.prepare(`
    INSERT INTO invoices (
      invoice_number, subscription_id, customer_id, status,
      invoice_date, due_date, billing_period_start, billing_period_end,
      subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInvLine = db.prepare(`
    INSERT INTO invoice_lines (invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPay = db.prepare(`
    INSERT INTO payments (payment_number, invoice_id, customer_id, method, amount, payment_date, reference_note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'completed')
  `);

  // Invoice 1: TechCorp (Paid in Full)
  const inv1Id = insertInv.run(
    'INV-2026-0001', sub1Id, cust1Id, 'paid',
    '2026-02-01', '2026-02-16', '2026-02-01', '2026-02-28',
    1550.00, 232.50, 0.00, 1782.50, 1782.50, 0.00,
    'February billing cycle - settled in full'
  ).lastInsertRowid;
  insertInvLine.run(inv1Id, prod1Id, varStandardId, 'Brightloop Cloud Platform (Standard)', 1, 1200.00, 15.00, 1380.00);
  insertInvLine.run(inv1Id, prod2Id, null, '24/7 Dedicated Support Add-on', 1, 350.00, 15.00, 402.50);
  insertPay.run('PAY-2026-0001', inv1Id, cust1Id, 'bank_transfer', 1782.50, '2026-02-05', 'ACH Wire Ref #9928174');

  // Invoice 2: Urban Retailers (Overdue Confirmed Invoice with Odoo Brand)
  const inv2Id = insertInv.run(
    'INV-2026-0002', sub2Id, cust2Id, 'confirmed',
    '2026-01-15', '2026-01-30', '2026-01-15', '2026-02-15',
    1760.00, 264.00, 0.00, 2024.00, 0.00, 2024.00,
    'January contract invoice - payment overdue'
  ).lastInsertRowid;
  insertInvLine.run(inv2Id, prod1Id, varOdooId, 'Brightloop Cloud Platform (Odoo Brand +560)', 1, 1760.00, 15.00, 2024.00);

  // Invoice 3: Apex Logistics (Partially Paid Confirmed Invoice)
  const inv3Id = insertInv.run(
    'INV-2026-0003', sub4Id, cust4Id, 'confirmed',
    '2026-02-01', '2026-03-03', '2026-02-01', '2026-02-28',
    3430.00, 514.50, 200.00, 3744.50, 2000.00, 1744.50,
    'High-volume freight tier with promo credit applied'
  ).lastInsertRowid;
  insertInvLine.run(inv3Id, prod1Id, varEntId, 'Brightloop Cloud Platform (Enterprise Custom)', 1, 2180.00, 15.00, 2507.00);
  insertInvLine.run(inv3Id, prod5Id, null, 'Dedicated High-Throughput API Gateway', 1, 800.00, 15.00, 920.00);
  insertPay.run('PAY-2026-0002', inv3Id, cust4Id, 'bank_transfer', 2000.00, '2026-02-10', 'Partial ACH Advance Wire #44892');

  // Invoice 4: FinTech Pulse (Paid via Stripe/Credit Card)
  const inv4Id = insertInv.run(
    'INV-2026-0004', sub5Id, cust5Id, 'paid',
    '2026-02-15', '2026-03-02', '2026-02-15', '2026-03-15',
    2100.00, 168.00, 0.00, 2268.00, 2268.00, 0.00,
    'Settled via corporate Stripe corporate credit card'
  ).lastInsertRowid;
  insertInvLine.run(inv4Id, prod1Id, varStandardId, 'Brightloop Cloud Platform', 1, 1200.00, 8.00, 1296.00);
  insertInvLine.run(inv4Id, prod3Id, null, 'Hardware 2FA Security Token (10 Units)', 10, 65.00, 8.00, 702.00);
  insertInvLine.run(inv4Id, prod2Id, null, '24/7 Dedicated Support Add-on', 1, 250.00, 8.00, 270.00);
  insertPay.run('PAY-2026-0003', inv4Id, cust5Id, 'credit_card', 2268.00, '2026-02-15', 'Stripe Charge ch_3P7mK29184xL');

  // Invoice 5: Sahara Clean Power (Paid Annual Contract)
  const inv5Id = insertInv.run(
    'INV-2026-0005', sub7Id, cust7Id, 'paid',
    '2026-01-01', '2026-01-15', '2026-01-01', '2027-01-01',
    2180.00, 0.00, 0.00, 2180.00, 2180.00, 0.00,
    'Annual solar grid monitoring telemetry contract'
  ).lastInsertRowid;
  insertInvLine.run(inv5Id, prod1Id, varEntId, 'Brightloop Cloud Platform (Enterprise)', 1, 2180.00, 0.00, 2180.00);
  insertPay.run('PAY-2026-0004', inv5Id, cust7Id, 'bank_transfer', 2180.00, '2026-01-03', 'Central Bank SWIFT Wire #NG-90182');

  // Invoice 6: Nordic Cloud Systems (Active Confirmed Invoice, Due Soon)
  const inv6Id = insertInv.run(
    'INV-2026-0006', sub9Id, cust9Id, 'confirmed',
    '2026-02-20', '2026-03-10', '2026-02-20', '2026-02-27',
    415.00, 41.50, 0.00, 456.50, 0.00, 456.50,
    'Sprint sprint tooling cycle'
  ).lastInsertRowid;
  insertInvLine.run(inv6Id, prod2Id, null, '24/7 Dedicated Support Add-on', 1, 350.00, 10.00, 385.00);
  insertInvLine.run(inv6Id, prod3Id, null, 'Hardware 2FA Security Token', 1, 65.00, 10.00, 71.50);

  // Invoice 7: Lyon Advisory Group (Overdue Unpaid Invoice)
  const inv7Id = insertInv.run(
    'INV-2026-0007', sub6Id, cust6Id, 'confirmed',
    '2026-01-10', '2026-02-10', '2026-01-10', '2026-02-10',
    1650.00, 165.00, 100.00, 1715.00, 0.00, 1715.00,
    'Overdue consulting cluster statement - follow up initiated'
  ).lastInsertRowid;
  insertInvLine.run(inv7Id, prod1Id, varStandardId, 'Brightloop Cloud Platform', 1, 1200.00, 10.00, 1320.00);
  insertInvLine.run(inv7Id, prod4Id, varStorageStdId, 'Advanced Analytics Engine', 1, 450.00, 10.00, 495.00);

  console.log('✅ Seeded 7 Invoices (3 Paid, 2 Overdue, 2 Confirmed) and 4 Payments');
  console.log('🎉 Brightloop benchmark dataset seeding completed successfully!');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase(true).catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
