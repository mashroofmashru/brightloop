import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: Generate next subscription number (SUB-YYYY-XXXX)
function generateSubscriptionNumber() {
  const year = new Date().getFullYear();
  const lastSub = db.prepare(`
    SELECT subscription_number FROM subscriptions
    WHERE subscription_number LIKE ?
    ORDER BY id DESC LIMIT 1
  `).get(`SUB-${year}-%`);

  let nextSeq = 1;
  if (lastSub) {
    const parts = lastSub.subscription_number.split('-');
    if (parts.length === 3) {
      nextSeq = parseInt(parts[2], 10) + 1;
    }
  }

  return `SUB-${year}-${String(nextSeq).padStart(4, '0')}`;
}

// GET /api/subscriptions (Filtered by role)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { status, customer_id, plan_id, search } = req.query;

    let query = `
      SELECT s.*, u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
             p.name as plan_name, p.billing_interval, p.price as plan_price,
             p.allow_pause, p.allow_early_close, p.allow_renewal, p.auto_close_on_end
      FROM subscriptions s
      JOIN users u ON s.customer_id = u.id
      JOIN plans p ON s.plan_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // STRICT CUSTOMER ISOLATION: Customers only ever see their own subscriptions
    if (req.user.role === 'customer') {
      query += ' AND s.customer_id = ?';
      params.push(req.user.id);
    } else if (customer_id) {
      query += ' AND s.customer_id = ?';
      params.push(customer_id);
    }

    if (status) {
      query += ' AND s.status = ?';
      params.push(status);
    }

    if (plan_id) {
      query += ' AND s.plan_id = ?';
      params.push(plan_id);
    }

    if (search) {
      query += ' AND (s.subscription_number LIKE ? OR u.name LIKE ? OR u.company_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY s.id DESC';

    const subscriptions = db.prepare(query).all(...params);

    // Fetch lines for each subscription
    const getLines = db.prepare(`
      SELECT sl.*, prod.name as product_name, prod.type as product_type,
             pv.attribute_name, pv.attribute_value, pv.price_extra,
             tx.name as tax_name, tx.rate as tax_rate
      FROM subscription_lines sl
      JOIN products prod ON sl.product_id = prod.id
      LEFT JOIN product_variants pv ON sl.variant_id = pv.id
      LEFT JOIN taxes tx ON sl.tax_id = tx.id
      WHERE sl.subscription_id = ?
    `);

    const result = subscriptions.map(sub => ({
      ...sub,
      lines: getLines.all(sub.id)
    }));

    res.json({ subscriptions: result });
  } catch (error) {
    console.error('Fetch subscriptions error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscriptions' });
  }
});

// GET /api/subscriptions/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const sub = db.prepare(`
      SELECT s.*, u.name as customer_name, u.email as customer_email, u.company_name as customer_company,
             u.phone as customer_phone,
             p.name as plan_name, p.billing_interval, p.price as plan_price,
             p.allow_pause, p.allow_early_close, p.allow_renewal, p.auto_close_on_end
      FROM subscriptions s
      JOIN users u ON s.customer_id = u.id
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ?
    `).get(req.params.id);

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Role check: customer can only view own subscription
    if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const lines = db.prepare(`
      SELECT sl.*, prod.name as product_name, prod.type as product_type,
             pv.attribute_name, pv.attribute_value, pv.price_extra,
             tx.name as tax_name, tx.rate as tax_rate
      FROM subscription_lines sl
      JOIN products prod ON sl.product_id = prod.id
      LEFT JOIN product_variants pv ON sl.variant_id = pv.id
      LEFT JOIN taxes tx ON sl.tax_id = tx.id
      WHERE sl.subscription_id = ?
    `).all(sub.id);

    res.json({ subscription: { ...sub, lines } });
  } catch (error) {
    console.error('Fetch subscription detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve subscription' });
  }
});

// POST /api/subscriptions (Create Quote or Subscription)
router.post('/', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const {
      customer_id,
      plan_id,
      status = 'draft',
      start_date,
      expiry_date,
      payment_terms = 'Immediate',
      notes,
      lines = []
    } = req.body;

    if (!customer_id || !plan_id || !start_date) {
      return res.status(400).json({ error: 'Customer, plan, and start date are required' });
    }

    const customer = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'customer'").get(customer_id);
    if (!customer) {
      return res.status(404).json({ error: 'Selected customer not found' });
    }

    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(plan_id);
    if (!plan) {
      return res.status(404).json({ error: 'Selected recurring plan not found' });
    }

    const subscription_number = generateSubscriptionNumber();

    const createTransaction = db.transaction(() => {
      let subtotal = 0;
      let tax_total = 0;
      const computedLines = [];

      for (const line of lines) {
        const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(line.product_id);
        if (!prod) continue;

        let unitPrice = parseFloat(line.unit_price) || prod.sales_price;
        if (line.variant_id) {
          const variant = db.prepare('SELECT price_extra FROM product_variants WHERE id = ?').get(line.variant_id);
          if (variant && !line.unit_price) {
            unitPrice += variant.price_extra;
          }
        }

        const qty = parseInt(line.quantity, 10) || 1;
        const lineSubtotal = qty * unitPrice;

        let lineTax = 0;
        if (line.tax_id) {
          const tax = db.prepare('SELECT rate FROM taxes WHERE id = ?').get(line.tax_id);
          if (tax) {
            lineTax = lineSubtotal * (tax.rate / 100);
          }
        }

        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        tax_total += lineTax;

        computedLines.push({
          product_id: prod.id,
          variant_id: line.variant_id || null,
          description: line.description || prod.name,
          quantity: qty,
          unit_price: unitPrice,
          tax_id: line.tax_id || null,
          line_subtotal: lineSubtotal,
          line_tax: lineTax,
          line_total: lineTotal
        });
      }

      const grand_total = subtotal + tax_total;

      const insertSub = db.prepare(`
        INSERT INTO subscriptions (
          subscription_number, customer_id, plan_id, status,
          start_date, expiry_date, next_billing_date, payment_terms,
          subtotal, tax_total, discount_total, grand_total, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0.0, ?, ?)
      `);

      const nextBilling = start_date; // first billing on start date
      const subResult = insertSub.run(
        subscription_number,
        customer_id,
        plan_id,
        status,
        start_date,
        expiry_date || null,
        nextBilling,
        payment_terms,
        subtotal,
        tax_total,
        grand_total,
        notes || null
      );

      const subscriptionId = subResult.lastInsertRowid;

      const insertLine = db.prepare(`
        INSERT INTO subscription_lines (
          subscription_id, product_id, variant_id, description, quantity,
          unit_price, tax_id, line_subtotal, line_tax, line_total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const line of computedLines) {
        insertLine.run(
          subscriptionId,
          line.product_id,
          line.variant_id,
          line.description,
          line.quantity,
          line.unit_price,
          line.tax_id,
          line.line_subtotal,
          line.line_tax,
          line.line_total
        );
      }

      return subscriptionId;
    });

    const newSubId = createTransaction();
    const createdSub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(newSubId);

    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: createdSub
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// PATCH /api/subscriptions/:id/status (Transition State Machine)
// Draft -> Quotation -> Confirmed -> Active -> Paused -> Closed
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const subId = req.params.id;
    const { status: targetStatus, close_reason } = req.body;

    const sub = db.prepare(`
      SELECT s.*, p.allow_pause, p.allow_early_close, p.allow_renewal
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.id = ?
    `).get(subId);

    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Customer can only view or request pause/cancellation if authorized
    if (req.user.role === 'customer') {
      if (sub.customer_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Customer can pause (if allowed) or request cancel
      if (targetStatus === 'paused' && !sub.allow_pause) {
        return res.status(400).json({ error: 'This plan does not permit pausing.' });
      }
      if (targetStatus === 'closed' && !sub.allow_early_close) {
        return res.status(400).json({ error: 'This plan requires contract duration to complete.' });
      }
    }

    const validTransitions = {
      draft: ['quotation', 'confirmed', 'closed'],
      quotation: ['confirmed', 'closed', 'draft'],
      confirmed: ['active', 'closed'],
      active: ['paused', 'closed', 'active'],
      paused: ['active', 'closed'],
      closed: ['draft'] // Allow re-opening quote
    };

    const allowed = validTransitions[sub.status] || [];
    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({
        error: `Invalid transition from "${sub.status}" to "${targetStatus}".`
      });
    }

    const updates = ['status = ?'];
    const params = [targetStatus];

    if (targetStatus === 'closed') {
      updates.push("closed_at = datetime('now')");
      updates.push('close_reason = ?');
      params.push(close_reason || 'Closed upon request');
    }

    params.push(subId);

    db.prepare(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(subId);

    res.json({
      message: `Subscription moved to ${targetStatus}`,
      subscription: updated
    });
  } catch (error) {
    console.error('Update subscription status error:', error);
    res.status(500).json({ error: 'Failed to update subscription status' });
  }
});

export default router;
