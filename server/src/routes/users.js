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

// GET /api/users/customers (Admin and Staff can view customer list with aggregate subscription & billing metrics)
router.get('/customers', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const customers = db.prepare(`
      SELECT 
        u.id, u.name, u.email, u.role, u.company_name, u.phone, u.created_at,
        COUNT(DISTINCT s.id) AS total_subscriptions_count,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) AS active_subscriptions_count,
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END), 0) AS total_paid,
        COALESCE(SUM(CASE WHEN i.status IN ('confirmed', 'overdue') THEN i.total_amount ELSE 0 END), 0) AS outstanding_balance
      FROM users u
      LEFT JOIN subscriptions s ON s.customer_id = u.id
      LEFT JOIN invoices i ON i.customer_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      ORDER BY u.name ASC
    `).all();

    customers.forEach(c => {
      c.account_id = getHashedAccountNumber(c.id, c.email);
    });

    res.json({ customers });
  } catch (error) {
    console.error('Fetch customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/customers/:id (Admin and Staff can view full customer 360 history)
router.get('/customers/:id', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const customer = db.prepare(`
      SELECT id, name, email, role, company_name, phone, created_at
      FROM users
      WHERE id = ? AND role = 'customer'
    `).get(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customer.account_id = getHashedAccountNumber(customer.id, customer.email);

    const subscriptions = db.prepare(`
      SELECT s.*, p.name as plan_name, pr.name as product_name
      FROM subscriptions s
      LEFT JOIN plans p ON s.plan_id = p.id
      LEFT JOIN products pr ON p.product_id = pr.id
      WHERE s.customer_id = ?
      ORDER BY s.created_at DESC
    `).all(customer.id);

    const invoices = db.prepare(`
      SELECT id, invoice_number, status, total_amount, issue_date, due_date
      FROM invoices
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `).all(customer.id);

    res.json({ customer, subscriptions, invoices });
  } catch (error) {
    console.error('Fetch customer detail error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/customers (Admin and Staff can onboard a new customer)
router.post('/customers', authenticateToken, requireRole('admin', 'staff'), async (req, res) => {
  try {
    const { name, email, password, company_name, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'A customer account with this email already exists' });
    }

    const initialPassword = password && password.trim() ? password.trim() : 'Welcome@123';
    const passwordCheck = validatePassword(initialPassword);
    if (!passwordCheck.isValid) {
      return res.status(400).json({ error: passwordCheck.errors.join('. ') });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(initialPassword, salt);

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, company_name, phone)
      VALUES (?, ?, ?, 'customer', ?, ?)
    `);
    const result = insert.run(
      name.trim(),
      cleanEmail,
      password_hash,
      company_name && company_name.trim() ? company_name.trim() : null,
      phone && phone.trim() ? phone.trim() : null
    );

    const newCustomer = db.prepare(`
      SELECT id, name, email, role, company_name, phone, created_at
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);
    newCustomer.account_id = getHashedAccountNumber(newCustomer.id, newCustomer.email);
    newCustomer.total_subscriptions_count = 0;
    newCustomer.active_subscriptions_count = 0;
    newCustomer.total_paid = 0;
    newCustomer.outstanding_balance = 0;

    res.status(201).json({
      message: 'Customer created successfully',
      customer: newCustomer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/customers/:id (Admin and Staff can update customer details)
router.put('/customers/:id', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const { name, company_name, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE id = ? AND role = "customer"').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    db.prepare(`
      UPDATE users
      SET name = ?, company_name = ?, phone = ?
      WHERE id = ?
    `).run(
      name.trim(),
      company_name && company_name.trim() ? company_name.trim() : null,
      phone && phone.trim() ? phone.trim() : null,
      req.params.id
    );

    const updated = db.prepare(`
      SELECT id, name, email, role, company_name, phone, created_at
      FROM users WHERE id = ?
    `).get(req.params.id);
    updated.account_id = getHashedAccountNumber(updated.id, updated.email);

    res.json({ message: 'Customer updated successfully', customer: updated });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
