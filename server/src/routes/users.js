import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { authenticateToken, requireRole, validatePassword, getHashedAccountNumber } from '../middleware/auth.js';

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

// GET /api/users/profile (Any authenticated user can view their own profile)
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, company_name, phone, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.account_id = getHashedAccountNumber(user.id, user.email);
    res.json({ user });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile (Any authenticated user can update their personal/company info)
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { name, company_name, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    db.prepare(`
      UPDATE users
      SET name = ?, company_name = ?, phone = ?
      WHERE id = ?
    `).run(name.trim(), company_name ? company_name.trim() : null, phone ? phone.trim() : null, req.user.id);

    const updatedUser = db.prepare(`
      SELECT id, name, email, role, company_name, phone, created_at
      FROM users
      WHERE id = ?
    `).get(req.user.id);

    updatedUser.account_id = getHashedAccountNumber(updatedUser.id, updatedUser.email);
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/change-password (Authenticated user changes their password)
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = db.prepare('SELECT id, password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match' });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({
        field: 'newPassword',
        error: passwordCheck.errors.join('. '),
        details: passwordCheck.errors
      });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, req.user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
