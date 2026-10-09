export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export function validateName(name) {
  if (typeof name !== 'string') return 'Name is required.';
  const value = name.trim();
  if (value.length < 20 || value.length > 60) {
    return 'Name must be between 20 and 60 characters.';
  }
  return null;
}

export function validateAddress(address) {
  if (typeof address !== 'string' || !address.trim()) return 'Address is required.';
  if (address.trim().length > 400) return 'Address must not exceed 400 characters.';
  return null;
}

export function validateEmail(email) {
  if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return null;
}

export function validatePassword(password) {
  if (typeof password !== 'string' || !passwordRegex.test(password)) {
    return 'Password must be 8–16 characters and contain at least one uppercase letter and one special character.';
  }
  return null;
}

export function validateRating(rating) {
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return 'Rating must be an integer from 1 to 5.';
  return null;
}

export function validateUserInput(data) {
  return (
    validateName(data.name) ||
    validateEmail(data.email) ||
    validateAddress(data.address) ||
    validatePassword(data.password)
  );
}
