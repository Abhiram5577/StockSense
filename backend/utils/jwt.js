import jwt from 'jsonwebtoken';

const DEFAULT_JWT_SECRET = 'stocksense_jwt_fallback_secret_key_2026';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('[Security Warning] JWT_SECRET is not defined in .env. Using fallback secret for development.');
    return DEFAULT_JWT_SECRET;
  }
  return secret;
}

/**
 * Generates standard authentication JWT token
 * @param {{ userId: number, role: string }} payload
 * @returns {string}
 */
export function generateToken(payload) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Generates a short-lived token specifically for password reset authorization
 * @param {{ userId: number, email: string }} payload
 * @returns {string}
 */
export function generateResetToken(payload) {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_RESET_EXPIRES_IN || '15m';
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      purpose: 'password_reset',
    },
    secret,
    { expiresIn }
  );
}

/**
 * Verifies and decodes a JWT token
 * @param {string} token
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}
