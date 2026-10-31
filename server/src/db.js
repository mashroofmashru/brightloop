import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../brightloop.db');

export const db = new Database(dbPath);

// Enable foreign keys & WAL mode for high performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'staff', 'customer')),
      company_name TEXT,
      phone TEXT,
      reset_token TEXT,
      reset_token_expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'software' CHECK(type IN ('software', 'service', 'physical')),
      sales_price REAL NOT NULL DEFAULT 0.0,
      cost_price REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      attribute_name TEXT NOT NULL,
      attribute_value TEXT NOT NULL,
      price_extra REAL NOT NULL DEFAULT 0.0,
      sku TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      price REAL NOT NULL DEFAULT 0.0,
      billing_interval TEXT NOT NULL CHECK(billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')),
      min_quantity INTEGER NOT NULL DEFAULT 1,
      available_from TEXT,
      available_until TEXT,
      auto_close_on_end INTEGER NOT NULL DEFAULT 0,
      allow_early_close INTEGER NOT NULL DEFAULT 1,
      allow_pause INTEGER NOT NULL DEFAULT 1,
      allow_renewal INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotation_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL,
      validity_days INTEGER NOT NULL DEFAULT 30,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotation_template_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES quotation_templates(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      discount_percent REAL NOT NULL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL DEFAULT 0.0,
      tax_type TEXT NOT NULL DEFAULT 'exclusive' CHECK(tax_type IN ('exclusive', 'inclusive')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL CHECK(discount_type IN ('fixed', 'percent')),
      value REAL NOT NULL DEFAULT 0.0,
      min_order_amount REAL DEFAULT 0.0,
      min_quantity INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      usage_limit INTEGER DEFAULT NULL,
      redemption_count INTEGER NOT NULL DEFAULT 0,
      scope TEXT NOT NULL DEFAULT 'order' CHECK(scope IN ('order', 'product')),
      target_product_id INTEGER REFERENCES products(id),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      plan_id INTEGER NOT NULL REFERENCES plans(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed')),
      start_date TEXT NOT NULL,
      expiry_date TEXT,
      next_billing_date TEXT,
      payment_terms TEXT NOT NULL DEFAULT 'Immediate',
      subtotal REAL NOT NULL DEFAULT 0.0,
      tax_total REAL NOT NULL DEFAULT 0.0,
      discount_total REAL NOT NULL DEFAULT 0.0,
      grand_total REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      close_reason TEXT,
      closed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      tax_id INTEGER REFERENCES taxes(id),
      discount_id INTEGER REFERENCES discounts(id),
      line_subtotal REAL NOT NULL DEFAULT 0.0,
      line_tax REAL NOT NULL DEFAULT 0.0,
      line_total REAL NOT NULL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE SET NULL,
      customer_id INTEGER NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed', 'paid', 'cancelled')),
      invoice_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      billing_period_start TEXT,
      billing_period_end TEXT,
      subtotal REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      amount_paid REAL NOT NULL DEFAULT 0.0,
      amount_due REAL NOT NULL DEFAULT 0.0,
      notes TEXT,
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      variant_id INTEGER REFERENCES product_variants(id),
      description TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0.0,
      tax_rate REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      total REAL NOT NULL DEFAULT 0.0
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_number TEXT UNIQUE NOT NULL,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id),
      customer_id INTEGER NOT NULL REFERENCES users(id),
      method TEXT NOT NULL CHECK(method IN ('credit_card', 'bank_transfer', 'stripe', 'check', 'cash')),
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      reference_note TEXT,
      status TEXT NOT NULL DEFAULT 'completed' CHECK(status IN ('completed', 'refunded')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes for sub-2s query SLA
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_sub_status_billing ON subscriptions(status, next_billing_date);
    CREATE INDEX IF NOT EXISTS idx_sub_customer ON subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_inv_status_due ON invoices(status, due_date);
    CREATE INDEX IF NOT EXISTS idx_inv_customer ON invoices(customer_id);
    CREATE INDEX IF NOT EXISTS idx_inv_sub ON invoices(subscription_id);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
  `);
}
