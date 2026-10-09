// Small in-memory limiter, enough to slow down password guessing on /login.
// For a multi-server deployment this should move to a shared store like Redis.
const attempts = new Map();

export function loginLimiter({ windowMs = 15 * 60 * 1000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || now > entry.resetAt) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
    }
    next();
  };
}

// clean out expired entries so the map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (now > entry.resetAt) attempts.delete(key);
  }
}, 10 * 60 * 1000).unref();
