export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function safeSort(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function safeDirection(value) {
  return String(value).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}
