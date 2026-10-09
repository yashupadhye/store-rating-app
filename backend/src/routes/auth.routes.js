import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { config } from '../config.js';
import { asyncHandler } from '../utils/http.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import {
  validateAddress,
  validateEmail,
  validateName,
  validatePassword
} from '../utils/validation.js';

const router = express.Router();

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '8h' }
  );
}

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, address, password } = req.body;

  const validation =
    validateName(name) ||
    validateEmail(email) ||
    validateAddress(address) ||
    validatePassword(password);

  if (validation) return res.status(400).json({ message: validation });

  const existing = await query('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()]);
  if (existing.length) return res.status(409).json({ message: 'Email is already registered.' });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (name, email, password_hash, address, role)
     VALUES (?, ?, ?, ?, 'NORMAL_USER')`,
    [name.trim(), email.trim().toLowerCase(), passwordHash, address.trim()]
  );

  const user = {
    id: result.insertId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    address: address.trim(),
    role: 'NORMAL_USER'
  };

  res.status(201).json({ token: tokenFor(user), user });
}));

router.post('/login', loginLimiter(), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const rows = await query(
    'SELECT id, name, email, password_hash, address, role FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );
  if (!rows.length) return res.status(401).json({ message: 'Invalid email or password.' });

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

  delete user.password_hash;
  res.json({ token: tokenFor(user), user });
}));

export default router;
