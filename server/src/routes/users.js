import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, requireRole, validatePassword } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/staff (Admin and Staff can view staff list)
router.get('/staff', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const staff = db.prepare(`
    SELECT id, name, email, role, phone, created_at
    FROM users
    WHERE role IN ('admin', 'staff')
    ORDER BY role ASC, name ASC
  `).all();
  res.json({ staff });
});

// POST /api/users/staff (ADMIN ONLY: "Only the admin can add a new member of staff")
router.post('/staff', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and temporary password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({
        field: 'email',
        error: 'A user account with this email already exists'
      });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        field: 'password',
        error: passwordCheck.errors.join('. '),
        details: passwordCheck.errors
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES (?, ?, ?, 'staff', ?)
    `);
    const result = insert.run(name.trim(), cleanEmail, password_hash, phone || null);

    const newStaff = db.prepare('SELECT id, name, email, role, phone, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Staff member added successfully',
      staff: newStaff
    });
  } catch (error) {
    console.error('Add staff error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/customers (Admin and Staff can view customer list)
router.get('/customers', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const customers = db.prepare(`
    SELECT id, name, email, role, company_name, phone, created_at
    FROM users
    WHERE role = 'customer'
    ORDER BY name ASC
  `).all();
  res.json({ customers });
});

export default router;
