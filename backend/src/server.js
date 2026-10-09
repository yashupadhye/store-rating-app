import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { pool } from './db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import storeRoutes from './routes/stores.routes.js';
import ratingRoutes from './routes/ratings.routes.js';
import adminRoutes from './routes/admin.routes.js';
import ownerRoutes from './routes/owner.routes.js';

const app = express();

app.use(cors({
  origin: config.corsOrigins.length ? config.corsOrigins : true,
  credentials: false
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);

async function ensureDefaultAdmin() {
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', ['admin@example.com']);
  if (!rows.length) {
    const hash = await bcrypt.hash('Admin@123', 10);
    await pool.execute(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES (?, ?, ?, ?, 'SYSTEM_ADMIN')`,
      ['System Administrator', 'admin@example.com', hash, 'Administration Office']
    );
    console.log('Default admin created: admin@example.com / Admin@123');
  }
}

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ message: 'A record with this unique value already exists.' });
  }

  res.status(500).json({ message: 'Internal server error.' });
});

ensureDefaultAdmin()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`Store Rating API running at http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Database startup failed:', error);
    process.exit(1);
  });
