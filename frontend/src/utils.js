export const PASSWORD_RULE =
  /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

export function validateForm({ name, email, address, password }) {
  if (name !== undefined && (name.trim().length < 20 || name.trim().length > 60)) {
    return 'Name must be between 20 and 60 characters.';
  }
  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Enter a valid email address.';
  }
  if (address !== undefined && (!address.trim() || address.trim().length > 400)) {
    return 'Address is required and must be at most 400 characters.';
  }
  if (password !== undefined && !PASSWORD_RULE.test(password)) {
    return 'Password must be 8–16 characters with at least one uppercase letter and one special character.';
  }
  return '';
}
export function errorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Something went wrong.';
}
