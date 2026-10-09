import express from 'express';
import { query } from '../db.js';
import { asyncHandler, safeDirection, safeSort } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, authorize('STORE_OWNER'));

// maps the sort keys the client may send to real column names
const sortColumns = {
  name: 'u.name',
  email: 'u.email',
  address: 'u.address',
  rating: 'r.rating',
  updated_at: 'r.updated_at'
};

router.get('/dashboard', asyncHandler(async (req, res) => {
  const stores = await query(
    `SELECT s.id, s.name, s.email, s.address,
            COALESCE(ROUND(AVG(r.rating), 2), 0) AS average_rating,
            COUNT(r.id) AS rating_count
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE s.owner_id = ?
     GROUP BY s.id`,
    [req.user.id]
  );

  if (!stores.length) {
    return res.json({ store: null, ratings: [] });
  }

  const store = stores[0];
  const sortKey = safeSort(req.query.sortBy, Object.keys(sortColumns), 'updated_at');
  const direction = safeDirection(req.query.direction ?? 'DESC');

  const ratings = await query(
    `SELECT u.id AS user_id, u.name, u.email, u.address,
            r.rating, r.updated_at
     FROM ratings r
     INNER JOIN users u ON u.id = r.user_id
     WHERE r.store_id = ?
     ORDER BY ${sortColumns[sortKey]} ${direction}`,
    [store.id]
  );

  res.json({ store, ratings });
}));

export default router;
