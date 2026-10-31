import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: Generate next invoice number (INV-YYYY-XXXX)
function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const lastInv = db.prepare(`
    SELECT invoice_number FROM invoices
    WHERE invoice_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`INV-${year}-%`);

  let nextSeq = 1;
  if (lastInv) {
    const parts = lastInv.invoice_number.split('-');
    if (parts.length === 3) {
      nextSeq = parseInt(parts[2], 10) + 1;
    }
  }

  return `INV-${year}-${String(nextSeq).padStart(4, '0')}`;
}

// Helper: Advance next billing date by interval
function computeNextBillingDate(currentDateStr, interval) {
  const date = new Date(currentDateStr);
  switch (interval) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'monthly':
    default:
      date.setMonth(date.getMonth() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
}

// GET /api/invoices (Filtered by role: Customers see only own invoices)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, customer_id, overdueOnly, search } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT i.*, u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
             s.subscription_number, p.name as plan_name,
             CASE
               WHEN i.status = 'confirmed' AND i.due_date < ? AND i.amount_due > 0 THEN 1
               ELSE 0
             END as is_overdue
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE 1=1
    `;
    const params = [today];

    // Customer Isolation
    if (req.user.role === 'customer') {
      query += ' AND i.customer_id = ?';
      params.push(req.user.id);
    } else if (customer_id) {
      query += ' AND i.customer_id = ?';
      params.push(customer_id);
    }

    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }

    if (overdueOnly === 'true') {
      query += ' AND i.status = "confirmed" AND i.due_date < ? AND i.amount_due > 0';
      params.push(today);
    }

    if (search) {
      query += ' AND (i.invoice_number LIKE ? OR u.name LIKE ? OR u.company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY i.id DESC';

    const invoices = db.prepare(query).all(...params);

    res.json({ invoices });
  } catch (error) {
    console.error('Fetch invoices error:', error);
    res.status(500).json({ error: 'Failed to retrieve invoices' });
  }
});

// GET /api/invoices/:id (Full invoice printable detail with lines)
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const invoice = db.prepare(`
      SELECT i.*, u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
             u.phone as customer_phone,
             s.subscription_number, s.payment_terms,
             p.name as plan_name, p.billing_interval,
             CASE
               WHEN i.status = 'confirmed' AND i.due_date < ? AND i.amount_due > 0 THEN 1
               ELSE 0
             END as is_overdue
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      LEFT JOIN subscriptions s ON i.subscription_id = s.id
      LEFT JOIN plans p ON s.plan_id = p.id
      WHERE i.id = ?
    `).get(today, req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Role check: Customer can only view own invoice
    if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lines = db.prepare(`
      SELECT il.*, prod.name as product_name, pv.attribute_name, pv.attribute_value
      FROM invoice_lines il
      LEFT JOIN products prod ON il.product_id = prod.id
      LEFT JOIN product_variants pv ON il.variant_id = pv.id
      WHERE il.invoice_id = ?
    `).all(invoice.id);

    res.json({ invoice: { ...invoice, lines } });
  } catch (error) {
    console.error('Fetch invoice detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve invoice details' });
  }
});

// POST /api/invoices/run-billing (IDEMPOTENT AUTOMATED BATCH BILLING ENGINE)
// "It is billing day, and hundreds of subscriptions are due at once.
//  Nothing should be billed twice or skipped."
router.post('/run-billing', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const billingDate = req.body.billing_date || new Date().toISOString().split('T')[0];

    // Find all ACTIVE subscriptions due for billing (next_billing_date <= billingDate)
    const dueSubscriptions = db.prepare(`
      SELECT s.*, p.billing_interval, p.auto_close_on_end, u.name as customer_name, u.company_name
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      JOIN users u ON s.customer_id = u.id
      WHERE s.status = 'active'
        AND (s.next_billing_date IS NULL OR s.next_billing_date <= ?)
      ORDER BY s.id ASC
    `).all(billingDate);

    const results = [];

    const runBillingTransaction = db.transaction(() => {
      for (const sub of dueSubscriptions) {
        const periodStart = sub.next_billing_date || billingDate;
        const periodEnd = computeNextBillingDate(periodStart, sub.billing_interval);

        // 1. IDEMPOTENCY CHECK: Ensure not billed twice for this period!
        const existingInvoice = db.prepare(`
          SELECT id, invoice_number FROM invoices
          WHERE subscription_id = ? AND billing_period_start = ?
        `).get(sub.id, periodStart);

        if (existingInvoice) {
          results.push({
            subscription_id: sub.id,
            subscription_number: sub.subscription_number,
            customer_name: sub.customer_name,
            result: 'skipped',
            reason: `Already billed under ${existingInvoice.invoice_number}`,
            invoice_number: existingInvoice.invoice_number,
            total_amount: 0
          });
          continue;
        }

        // 2. Load Subscription Lines & Product Details
        const subLines = db.prepare(`
          SELECT sl.*, p.name as product_name, t.rate as tax_rate
          FROM subscription_lines sl
          JOIN products p ON sl.product_id = p.id
          LEFT JOIN taxes t ON sl.tax_id = t.id
          WHERE sl.subscription_id = ?
        `).all(sub.id);

        let subtotal = 0;
        let taxAmount = 0;
        let totalQuantity = 0;

        for (const line of subLines) {
          const lineSub = line.quantity * line.unit_price;
          const lineTax = lineSub * ((line.tax_rate || 0) / 100);
          subtotal += lineSub;
          taxAmount += lineTax;
          totalQuantity += line.quantity;
        }

        // 3. CONDITIONAL DISCOUNT ENGINE EVALUATION
        // Find active eligible discounts for order or products
        const activeDiscounts = db.prepare(`
          SELECT * FROM discounts
          WHERE is_active = 1
            AND (start_date IS NULL OR start_date <= ?)
            AND (end_date IS NULL OR end_date >= ?)
            AND (usage_limit IS NULL OR redemption_count < usage_limit)
          ORDER BY value DESC
        `).all(billingDate, billingDate);

        let appliedDiscount = null;
        let discountAmount = 0;

        for (const disc of activeDiscounts) {
          // Check minimum spend and quantity thresholds
          if (subtotal >= (disc.min_order_amount || 0) && totalQuantity >= (disc.min_quantity || 0)) {
            if (disc.discount_type === 'percent') {
              discountAmount = subtotal * (disc.value / 100);
            } else {
              discountAmount = Math.min(disc.value, subtotal);
            }
            appliedDiscount = disc;
            break; // Apply best eligible discount
          }
        }

        // Increment redemption count if discount applied
        if (appliedDiscount) {
          db.prepare(`
            UPDATE discounts
            SET redemption_count = redemption_count + 1
            WHERE id = ?
          `).run(appliedDiscount.id);
        }

        const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
        const invoiceNumber = generateInvoiceNumber();

        // Calculate due date from payment terms
        const dueDateObj = new Date(periodStart);
        if (sub.payment_terms === 'Net 15') dueDateObj.setDate(dueDateObj.getDate() + 15);
        else if (sub.payment_terms === 'Net 30') dueDateObj.setDate(dueDateObj.getDate() + 30);
        else if (sub.payment_terms === 'Net 60') dueDateObj.setDate(dueDateObj.getDate() + 60);
        const dueDate = dueDateObj.toISOString().split('T')[0];

        // 4. Create Generated Invoice
        const insertInv = db.prepare(`
          INSERT INTO invoices (
            invoice_number, subscription_id, customer_id, status,
            invoice_date, due_date, billing_period_start, billing_period_end,
            subtotal, tax_amount, discount_amount, total_amount, amount_paid, amount_due, notes
          ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?)
        `);

        const invNotes = appliedDiscount
          ? `Auto-applied discount: ${appliedDiscount.name} (${appliedDiscount.code})`
          : null;

        const invRes = insertInv.run(
          invoiceNumber,
          sub.id,
          sub.customer_id,
          billingDate,
          dueDate,
          periodStart,
          periodEnd,
          subtotal,
          taxAmount,
          discountAmount,
          totalAmount,
          totalAmount,
          invNotes
        );

        const newInvoiceId = invRes.lastInsertRowid;

        // 5. Insert Invoice Lines
        const insertInvLine = db.prepare(`
          INSERT INTO invoice_lines (
            invoice_id, product_id, variant_id, description, quantity, unit_price, tax_rate, discount_amount, total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const line of subLines) {
          const lineSub = line.quantity * line.unit_price;
          const lineTax = lineSub * ((line.tax_rate || 0) / 100);
          const lineTotal = lineSub + lineTax;
          insertInvLine.run(
            newInvoiceId,
            line.product_id,
            line.variant_id,
            line.description,
            line.quantity,
            line.unit_price,
            line.tax_rate || 0,
            0,
            lineTotal
          );
        }

        // 6. Advance Subscription next_billing_date (Idempotency checkpoint)
        const nextPeriod = computeNextBillingDate(periodStart, sub.billing_interval);
        db.prepare('UPDATE subscriptions SET next_billing_date = ? WHERE id = ?').run(nextPeriod, sub.id);

        results.push({
          subscription_id: sub.id,
          subscription_number: sub.subscription_number,
          customer_name: sub.customer_name,
          result: 'created',
          reason: 'Invoice generated for billing period',
          invoice_number: invoiceNumber,
          total_amount: totalAmount,
          applied_discount: appliedDiscount ? appliedDiscount.code : null
        });
      }
    });

    runBillingTransaction();

    const createdCount = results.filter(r => r.result === 'created').length;
    const skippedCount = results.filter(r => r.result === 'skipped').length;

    res.json({
      message: `Billing run complete: ${createdCount} created, ${skippedCount} skipped.`,
      summary: {
        total_processed: dueSubscriptions.length,
        created: createdCount,
        skipped: skippedCount
      },
      results
    });
  } catch (error) {
    console.error('Run billing error:', error);
    res.status(500).json({ error: 'Failed to execute billing run' });
  }
});

// PATCH /api/invoices/:id/status (Invoice state machine: draft -> confirmed -> paid / cancelled)
router.patch('/:id/status', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { status: targetStatus } = req.body;

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const validTransitions = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['paid', 'cancelled'],
      paid: [],
      cancelled: ['draft']
    };

    const allowed = validTransitions[invoice.status] || [];
    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({
        error: `Cannot transition invoice from ${invoice.status} to ${targetStatus}`
      });
    }

    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(targetStatus, invoiceId);

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);
    res.json({ message: `Invoice moved to ${targetStatus}`, invoice: updated });
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
});

// POST /api/invoices/:id/send (Simulate sending invoice to client email)
router.post('/:id/send', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const invoiceId = req.params.id;
    db.prepare("UPDATE invoices SET sent_at = datetime('now') WHERE id = ?").run(invoiceId);
    res.json({ message: 'Invoice dispatched to customer registered email.' });
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

export default router;
