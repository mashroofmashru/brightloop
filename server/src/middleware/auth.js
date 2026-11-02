import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026';

/**
 * Validate password according to Brightloop security specification:
 * - Length > 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
export function validatePassword(password) {
  const errors = [];
  if (!password || password.length <= 8) {
    errors.push('Password must be more than 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Compute deterministic 8-digit hashed account number for a user
 */
export function getHashedAccountNumber(userId, email = '') {
  let hash = 2166136261;
  const str = `brightloop_account_${userId}_${email || ''}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const num = (Math.abs(hash) % 90000000) + 10000000;
  return `#${num}`;
}

/**
 * Middleware: Verify JWT and attach user
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    const user = db.prepare('SELECT id, name, email, role, company_name, phone, created_at FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.account_id = getHashedAccountNumber(user.id, user.email);
    req.user = user;
    next();
  });
}

/**
 * Middleware: Role-based access control
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`
      });
    }
    next();
  };
}
