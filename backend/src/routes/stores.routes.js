import express from 'express';
import { query } from '../db.js';
import { asyncHandler, safeDirection, safeSort } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateAddress, validateEmail } from '../utils/validation.js';

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { name = '', email = '', address = '', sortBy = 'name', direction = 'ASC' } = req.query;
  const allowedSort = ['name', 'email', 'address', 'average_rating', 'rating_count'];
  const requested = safeSort(sortBy, allowedSort, 'name');
  const dir = safeDirection(direction);

  const where = [];
  const params = [];

  if (name) { where.push('s.name LIKE ?'); params.push(`%${name}%`); }
  if (email) { where.push('s.email LIKE ?'); params.push(`%${email}%`); }
  if (address) { where.push('s.address LIKE ?'); params.push(`%${address}%`); }

  const rows = await query(
    `SELECT s.id, s.name, s.email, s.address, s.owner_id,
            COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating,
            COUNT(r.id) AS rating_count,
            ur.rating AS user_rating
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     LEFT JOIN ratings ur ON ur.store_id = s.id AND ur.user_id = ?
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY s.id, ur.rating
     ORDER BY ${requested} ${dir}, s.id ASC`,
    [req.user.id, ...params]
  );

  res.json(rows);
}));

router.post('/', authorize('SYSTEM_ADMIN'), asyncHandler(async (req, res) => {
  const { name, email, address, ownerId = null } = req.body;
  if (!name || name.trim().length < 1 || name.trim().length > 255) {
    return res.status(400).json({ message: 'Store name is required and must be at most 255 characters.' });
  }

  const emailError = validateEmail(email);
  const addressError = validateAddress(address);
  if (emailError) return res.status(400).json({ message: emailError });
  if (addressError) return res.status(400).json({ message: addressError });

  if (ownerId) {
    const owner = await query('SELECT id, role FROM users WHERE id = ?', [ownerId]);
    if (!owner.length || owner[0].role !== 'STORE_OWNER') {
      return res.status(400).json({ message: 'ownerId must belong to a STORE_OWNER.' });
    }

    const existingStore = await query('SELECT id FROM stores WHERE owner_id = ?', [ownerId]);
    if (existingStore.length) {
      return res.status(409).json({ message: 'This store owner is already assigned to a store.' });
    }
  }

  const duplicate = await query('SELECT id FROM stores WHERE email = ?', [email.trim().toLowerCase()]);
  if (duplicate.length) return res.status(409).json({ message: 'Store email is already registered.' });

  const result = await query(
    `INSERT INTO stores (name, email, address, owner_id)
     VALUES (?, ?, ?, ?)`,
    [name.trim(), email.trim().toLowerCase(), address.trim(), ownerId || null]
  );

  res.status(201).json({
    id: result.insertId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    owner_id: ownerId || null
  });
}));

export default router;
