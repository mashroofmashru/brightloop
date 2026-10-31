import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/discounts (Authenticated users can view discounts)
router.get('/', authenticateToken, (req, res) => {
  try {
    const discounts = db.prepare(`
      SELECT d.*, p.name as target_product_name
      FROM discounts d
      LEFT JOIN products p ON d.target_product_id = p.id
      ORDER BY d.id DESC
    `).all();

    res.json({ discounts });
  } catch (error) {
    console.error('Fetch discounts error:', error);
    res.status(500).json({ error: 'Failed to retrieve discount rules' });
  }
});

// POST /api/discounts (ADMIN ONLY: "Only the admin can create discount rules")
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const {
      name,
      code,
      discount_type, // 'fixed' or 'percent'
      value,
      min_order_amount,
      min_quantity,
      start_date,
      end_date,
      usage_limit,
      scope = 'order', // 'order' or 'product'
      target_product_id
    } = req.body;

    if (!name || !code || !discount_type || value === undefined) {
      return res.status(400).json({ error: 'Name, code, type, and discount value are required' });
    }

    const cleanCode = code.trim().toUpperCase();

    // Check unique discount code
    const existing = db.prepare('SELECT id FROM discounts WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(409).json({ field: 'code', error: 'A discount with this code already exists' });
    }

    const insert = db.prepare(`
      INSERT INTO discounts (
        name, code, discount_type, value, min_order_amount, min_quantity,
        start_date, end_date, usage_limit, redemption_count, scope, target_product_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)
    `);

    const result = insert.run(
      name.trim(),
      cleanCode,
      discount_type,
      parseFloat(value) || 0,
      parseFloat(min_order_amount) || 0,
      parseInt(min_quantity, 10) || 0,
      start_date || null,
      end_date || null,
      usage_limit ? parseInt(usage_limit, 10) : null,
      scope,
      target_product_id || null
    );

    const created = db.prepare('SELECT * FROM discounts WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Discount rule created successfully',
      discount: created
    });
  } catch (error) {
    console.error('Create discount error:', error);
    res.status(500).json({ error: 'Failed to create discount rule' });
  }
});

// PUT /api/discounts/:id (ADMIN ONLY)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const discountId = req.params.id;
    const {
      name,
      code,
      discount_type,
      value,
      min_order_amount,
      min_quantity,
      start_date,
      end_date,
      usage_limit,
      scope,
      target_product_id,
      is_active
    } = req.body;

    db.prepare(`
      UPDATE discounts
      SET name = ?, code = ?, discount_type = ?, value = ?, min_order_amount = ?,
          min_quantity = ?, start_date = ?, end_date = ?, usage_limit = ?,
          scope = ?, target_product_id = ?, is_active = ?
      WHERE id = ?
    `).run(
      name.trim(),
      code.trim().toUpperCase(),
      discount_type,
      parseFloat(value) || 0,
      parseFloat(min_order_amount) || 0,
      parseInt(min_quantity, 10) || 0,
      start_date || null,
      end_date || null,
      usage_limit ? parseInt(usage_limit, 10) : null,
      scope || 'order',
      target_product_id || null,
      is_active !== false ? 1 : 0,
      discountId
    );

    const updated = db.prepare('SELECT * FROM discounts WHERE id = ?').get(discountId);
    res.json({ message: 'Discount rule updated successfully', discount: updated });
  } catch (error) {
    console.error('Update discount error:', error);
    res.status(500).json({ error: 'Failed to update discount rule' });
  }
});

// DELETE /api/discounts/:id (Toggle status)
router.delete('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const discountId = req.params.id;
    const disc = db.prepare('SELECT id, is_active FROM discounts WHERE id = ?').get(discountId);
    if (!disc) {
      return res.status(404).json({ error: 'Discount not found' });
    }

    const newStatus = disc.is_active === 1 ? 0 : 1;
    db.prepare('UPDATE discounts SET is_active = ? WHERE id = ?').run(newStatus, discountId);
    res.json({ message: newStatus === 0 ? 'Discount archived' : 'Discount activated', is_active: newStatus });
  } catch (error) {
    console.error('Delete discount error:', error);
    res.status(500).json({ error: 'Failed to toggle discount status' });
  }
});

export default router;
