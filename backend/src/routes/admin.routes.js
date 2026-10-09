import express from 'express';
import { query } from '../db.js';
import { asyncHandler } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, authorize('SYSTEM_ADMIN'));

router.get('/stats', asyncHandler(async (req, res) => {
  const [users] = await query(`SELECT COUNT(*) AS total FROM users`);
  const [stores] = await query(`SELECT COUNT(*) AS total FROM stores`);
  const [ratings] = await query(`SELECT COUNT(*) AS total FROM ratings`);

  res.json({
    users: Number(users.total),
    stores: Number(stores.total),
    ratings: Number(ratings.total)
  });
}));

export default router;
