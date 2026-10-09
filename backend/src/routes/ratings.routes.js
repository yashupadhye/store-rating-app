import express from 'express';
import { query } from '../db.js';
import { asyncHandler } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateRating } from '../utils/validation.js';

const router = express.Router();
router.use(authenticate, authorize('NORMAL_USER'));

router.post('/', asyncHandler(async (req, res) => {
  const { storeId, rating } = req.body;
  const error = validateRating(rating);
  if (error) return res.status(400).json({ message: error });

  const stores = await query('SELECT id FROM stores WHERE id = ?', [storeId]);
  if (!stores.length) return res.status(404).json({ message: 'Store not found.' });

  await query(
    `INSERT INTO ratings (user_id, store_id, rating)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), updated_at = CURRENT_TIMESTAMP`,
    [req.user.id, storeId, Number(rating)]
  );

  res.json({ message: 'Rating saved successfully.', rating: Number(rating) });
}));

export default router;
