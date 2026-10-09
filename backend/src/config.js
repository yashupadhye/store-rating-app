import dotenv from 'dotenv';

dotenv.config();

const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not configured.`);
  }
}

export const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'store_rating_db'
  },
  jwtSecret: process.env.JWT_SECRET || 'development_secret_change_me',
  port: Number(process.env.PORT || 5000),
  // comma separated list, e.g. http://localhost:5173. Empty means allow any origin (dev only).
  corsOrigins: (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean)
};
