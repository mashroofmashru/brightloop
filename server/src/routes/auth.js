import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../db.js';
import { validatePassword, authenticateToken, JWT_SECRET } from '../middleware/auth.js';

const router = express.Router();

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register (Customer self-signup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company_name, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check unique email
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({
        field: 'email',
        error: 'An account with this email already exists'
      });
    }

    // Strict password policy check
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
      INSERT INTO users (name, email, password_hash, role, company_name, phone)
      VALUES (?, ?, ?, 'customer', ?, ?)
    `);
    const result = insert.run(name.trim(), cleanEmail, password_hash, company_name || null, phone || null);

    const newUser = db.prepare('SELECT id, name, email, role, company_name, phone, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      company_name: user.company_name,
      phone: user.phone,
      created_at: user.created_at
    };

    const token = generateToken(safeUser);

    res.json({
      message: 'Logged in successfully',
      user: safeUser,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      // Don't reveal account existence for security, but return friendly message
      return res.json({
        message: 'If an account exists with this email, a reset link has been dispatched.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.prepare('UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?')
      .run(resetToken, expiresAt, user.id);

    // In local development/demo, we return the resetToken so the user can easily test the reset flow!
    res.json({
      message: 'If an account exists with this email, a reset link has been dispatched.',
      debugToken: resetToken,
      resetUrl: `/reset-password?token=${resetToken}`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    const user = db.prepare(`
      SELECT id, email FROM users
      WHERE reset_token = ? AND datetime(reset_token_expires_at) > datetime('now')
    `).get(token);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset link' });
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

    db.prepare(`
      UPDATE users
      SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL
      WHERE id = ?
    `).run(password_hash, user.id);

    res.json({ message: 'Password has been successfully updated. You may now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
