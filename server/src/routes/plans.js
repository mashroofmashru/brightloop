import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/plans (All authenticated users can browse plans)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { interval, activeOnly } = req.query;

    let query = 'SELECT * FROM plans WHERE 1=1';
    const params = [];

    if (interval) {
      query += ' AND billing_interval = ?';
      params.push(interval);
    }

    if (activeOnly === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query += ` AND (available_from IS NULL OR available_from <= ?)
                 AND (available_until IS NULL OR available_until >= ?)`;
      params.push(today, today);
    }

    query += ' ORDER BY price ASC';

    const plans = db.prepare(query).all(...params);
    res.json({ plans });
  } catch (error) {
    console.error('Fetch plans error:', error);
    res.status(500).json({ error: 'Failed to retrieve plans' });
  }
});

// GET /api/plans/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const plan = db.prepare('SELECT * FROM plans WHERE id = ?').get(req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ plan });
  } catch (error) {
    console.error('Fetch plan detail error:', error);
    res.status(500).json({ error: 'Failed to retrieve plan details' });
  }
});

// POST /api/plans (ADMIN ONLY: "The admin decides which, plan by plan")
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const {
      name,
      code,
      price,
      billing_interval,
      min_quantity,
      available_from,
      available_until,
      auto_close_on_end,
      allow_early_close,
      allow_pause,
      allow_renewal
    } = req.body;

    if (!name || !code || price === undefined || !billing_interval) {
      return res.status(400).json({ error: 'Name, code, price, and billing interval are required' });
    }

    const validIntervals = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validIntervals.includes(billing_interval)) {
      return res.status(400).json({
        error: `Invalid billing interval. Must be one of: [${validIntervals.join(', ')}]`
      });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check unique code
    const existing = db.prepare('SELECT id FROM plans WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(409).json({ field: 'code', error: 'A plan with this code already exists' });
    }

    const insert = db.prepare(`
      INSERT INTO plans (
        name, code, price, billing_interval, min_quantity,
        available_from, available_until,
        auto_close_on_end, allow_early_close, allow_pause, allow_renewal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      name.trim(),
      cleanCode,
      parseFloat(price) || 0,
      billing_interval,
      parseInt(min_quantity, 10) || 1,
      available_from || null,
      available_until || null,
      auto_close_on_end ? 1 : 0,
      allow_early_close !== false ? 1 : 0,
      allow_pause !== false ? 1 : 0,
      allow_renewal !== false ? 1 : 0
    );

    const createdPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Recurring plan created successfully',
      plan: createdPlan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create recurring plan' });
  }
});

// PUT /api/plans/:id (ADMIN ONLY)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const planId = req.params.id;
    const {
      name,
      code,
      price,
      billing_interval,
      min_quantity,
      available_from,
      available_until,
      auto_close_on_end,
      allow_early_close,
      allow_pause,
      allow_renewal
    } = req.body;

    const existing = db.prepare('SELECT id FROM plans WHERE id = ?').get(planId);
    if (!existing) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const update = db.prepare(`
      UPDATE plans
      SET name = ?, code = ?, price = ?, billing_interval = ?, min_quantity = ?,
          available_from = ?, available_until = ?,
          auto_close_on_end = ?, allow_early_close = ?, allow_pause = ?, allow_renewal = ?
      WHERE id = ?
    `);

    update.run(
      name.trim(),
      code.trim().toUpperCase(),
      parseFloat(price) || 0,
      billing_interval,
      parseInt(min_quantity, 10) || 1,
      available_from || null,
      available_until || null,
      auto_close_on_end ? 1 : 0,
      allow_early_close ? 1 : 0,
      allow_pause ? 1 : 0,
      allow_renewal ? 1 : 0,
      planId
    );

    const updatedPlan = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId);

    res.json({
      message: 'Plan updated successfully',
      plan: updatedPlan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

export default router;
