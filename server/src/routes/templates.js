import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/templates (List quotation templates)
router.get('/', authenticateToken, (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT t.*, p.name as plan_name, p.price as plan_price, p.billing_interval
      FROM quotation_templates t
      LEFT JOIN plans p ON t.plan_id = p.id
      ORDER BY t.id DESC
    `).all();

    const getLines = db.prepare(`
      SELECT l.*, prod.name as product_name, prod.type as product_type,
             pv.attribute_name, pv.attribute_value, pv.price_extra
      FROM quotation_template_lines l
      JOIN products prod ON l.product_id = prod.id
      LEFT JOIN product_variants pv ON l.variant_id = pv.id
      WHERE l.template_id = ?
    `);

    const result = templates.map(t => ({
      ...t,
      lines: getLines.all(t.id)
    }));

    res.json({ templates: result });
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ error: 'Failed to retrieve quotation templates' });
  }
});

// GET /api/templates/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const template = db.prepare(`
      SELECT t.*, p.name as plan_name, p.price as plan_price, p.billing_interval
      FROM quotation_templates t
      LEFT JOIN plans p ON t.plan_id = p.id
      WHERE t.id = ?
    `).get(req.params.id);

    if (!template) {
      return res.status(404).json({ error: 'Quotation template not found' });
    }

    const lines = db.prepare(`
      SELECT l.*, prod.name as product_name, prod.type as product_type,
             pv.attribute_name, pv.attribute_value, pv.price_extra
      FROM quotation_template_lines l
      JOIN products prod ON l.product_id = prod.id
      LEFT JOIN product_variants pv ON l.variant_id = pv.id
      WHERE l.template_id = ?
    `).all(template.id);

    res.json({ template: { ...template, lines } });
  } catch (error) {
    console.error('Fetch template error:', error);
    res.status(500).json({ error: 'Failed to retrieve quotation template' });
  }
});

// POST /api/templates (Internal Staff & Admin can create templates)
router.post('/', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const { name, plan_id, validity_days, notes, lines } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required' });
    }

    const createTransaction = db.transaction(() => {
      const insertTmpl = db.prepare(`
        INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
        VALUES (?, ?, ?, ?)
      `);
      const tmplRes = insertTmpl.run(
        name.trim(),
        plan_id || null,
        parseInt(validity_days, 10) || 30,
        notes || null
      );
      const templateId = tmplRes.lastInsertRowid;

      if (Array.isArray(lines) && lines.length > 0) {
        const insertLine = db.prepare(`
          INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, discount_percent)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const line of lines) {
          if (line.product_id) {
            insertLine.run(
              templateId,
              line.product_id,
              line.variant_id || null,
              parseInt(line.quantity, 10) || 1,
              parseFloat(line.unit_price) || 0,
              parseFloat(line.discount_percent) || 0
            );
          }
        }
      }

      return templateId;
    });

    const newTemplateId = createTransaction();
    const created = db.prepare('SELECT * FROM quotation_templates WHERE id = ?').get(newTemplateId);

    res.status(201).json({
      message: 'Quotation template created successfully',
      template: created
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create quotation template' });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const templateId = req.params.id;
    const existing = db.prepare('SELECT id FROM quotation_templates WHERE id = ?').get(templateId);
    if (!existing) {
      return res.status(404).json({ error: 'Quotation template not found' });
    }

    db.prepare('DELETE FROM quotation_templates WHERE id = ?').run(templateId);
    res.json({ message: 'Quotation template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete quotation template' });
  }
});

export default router;
