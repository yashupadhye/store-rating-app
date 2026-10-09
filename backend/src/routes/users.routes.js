import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { asyncHandler, safeDirection, safeSort } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateAddress,
  validateEmail,
  validateName,
  validatePassword
} from '../utils/validation.js';

const router = express.Router();

router.use(authenticate);

router.put('/me/password', authorize('NORMAL_USER', 'STORE_OWNER', 'SYSTEM_ADMIN'), asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required.' });
  }

  const validation = validatePassword(newPassword);
  if (validation) return res.status(400).json({ message: validation });

  const rows = await query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!rows.length) return res.status(404).json({ message: 'User not found.' });

  const matches = await bcrypt.compare(currentPassword, rows[0].password_hash);
  if (!matches) return res.status(400).json({ message: 'Current password is incorrect.' });

  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ message: 'Password updated successfully.' });
}));

router.get('/', authorize('SYSTEM_ADMIN'), asyncHandler(async (req, res) => {
  const { name = '', email = '', address = '', role = '', sortBy = 'name', direction = 'ASC' } = req.query;
  const allowedSort = ['name', 'email', 'address', 'role', 'created_at'];
  const column = safeSort(sortBy, allowedSort, 'name');
  const dir = safeDirection(direction);

  const where = [];
  const params = [];

  if (name) { where.push('u.name LIKE ?'); params.push(`%${name}%`); }
  if (email) { where.push('u.email LIKE ?'); params.push(`%${email}%`); }
  if (address) { where.push('u.address LIKE ?'); params.push(`%${address}%`); }
  if (role) { where.push('u.role = ?'); params.push(role); }

  const sql = `
    SELECT u.id, u.name, u.email, u.address, u.role, u.created_at,
           s.name AS store_name,
           COALESCE(AVG(r.rating), 0) AS owner_rating
    FROM users u
    LEFT JOIN stores s ON s.owner_id = u.id
    LEFT JOIN ratings r ON r.store_id = s.id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    GROUP BY u.id, s.id
    ORDER BY ${column} ${dir}
  `;

  const rows = await query(sql, params);
  res.json(rows);
}));

router.get('/:id', authorize('SYSTEM_ADMIN'), asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT u.id, u.name, u.email, u.address, u.role,
            s.id AS store_id, s.name AS store_name,
            COALESCE(AVG(r.rating), 0) AS store_rating,
            COUNT(r.id) AS rating_count
     FROM users u
     LEFT JOIN stores s ON s.owner_id = u.id
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE u.id = ?
     GROUP BY u.id, s.id`,
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'User not found.' });
  res.json(rows[0]);
}));

router.post('/', authorize('SYSTEM_ADMIN'), asyncHandler(async (req, res) => {
  const { name, email, address, password, role } = req.body;
  const allowedRoles = ['SYSTEM_ADMIN', 'NORMAL_USER', 'STORE_OWNER'];

  if (!allowedRoles.includes(role)) return res.status(400).json({ message: 'Invalid role.' });

  const validation =
    validateName(name) ||
    validateEmail(email) ||
    validateAddress(address) ||
    validatePassword(password);

  if (validation) return res.status(400).json({ message: validation });

  const existing = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing.length) return res.status(409).json({ message: 'Email is already registered.' });

  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), email.trim().toLowerCase(), hash, address.trim(), role]
  );

  res.status(201).json({
    id: result.insertId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    role
  });
}));

export default router;
