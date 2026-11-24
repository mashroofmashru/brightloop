import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/taxes (Authenticated users can view tax rules)
router.get('/', authenticateToken, (req, res) => {
  try {
    const taxes = db.prepare('SELECT * FROM taxes ORDER BY id ASC').all();
    res.json({ taxes });
  } catch (error) {
    console.error('Fetch taxes error:', error);
    res.status(500).json({ error: 'Failed to retrieve tax rules' });
  }
});

// POST /api/taxes (ADMIN ONLY: "Only the admin can create tax rules")
router.post('/', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, rate, tax_type = 'exclusive' } = req.body;

    if (!name || rate === undefined) {
      return res.status(400).json({ error: 'Tax name and percentage rate are required' });
    }

    const insert = db.prepare(`
      INSERT INTO taxes (name, rate, tax_type, is_active)
      VALUES (?, ?, ?, 1)
    `);

    const result = insert.run(name.trim(), parseFloat(rate) || 0, tax_type);
    const created = db.prepare('SELECT * FROM taxes WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Tax rule created successfully',
      tax: created
    });
  } catch (error) {
    console.error('Create tax error:', error);
    res.status(500).json({ error: 'Failed to create tax rule' });
  }
});

// PUT /api/taxes/:id (ADMIN ONLY)
router.put('/:id', authenticateToken, requireRole('admin'), (req, res) => {
  try {
    const { name, rate, tax_type, is_active } = req.body;
    const taxId = req.params.id;

    const existing = db.prepare('SELECT * FROM taxes WHERE id = ?').get(taxId);
    if (!existing) {
      return res.status(404).json({ error: 'Tax rule not found' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Tax name is required' });
    }
    if (tax_type !== undefined && !['exclusive', 'inclusive'].includes(tax_type)) {
      return res.status(400).json({ error: 'Tax type must be exclusive or inclusive' });
    }

    db.prepare(`
      UPDATE taxes
      SET name = ?, rate = ?, tax_type = ?, is_active = ?
      WHERE id = ?
    `).run(
      name.trim(),
      parseFloat(rate) || 0,
      tax_type || 'exclusive',
      is_active === undefined ? existing.is_active : (is_active !== false ? 1 : 0), // edit form omits is_active
      taxId
    );

    const updated = db.prepare('SELECT * FROM taxes WHERE id = ?').get(taxId);
    res.json({ message: 'Tax rule updated successfully', tax: updated });
  } catch (error) {
    console.error('Update tax error:', error);
    res.status(500).json({ error: 'Failed to update tax rule' });
  }
});

export default router;
