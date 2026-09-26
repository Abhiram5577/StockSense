import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generates a cryptographically secure 6-digit numeric OTP
 * @returns {string} 6-digit string e.g. "482910"
 */
export function generateSixDigitOtp() {
  // randomInt range is [min, max), so 100000 to 1000000 produces 6 digits
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Hashes an OTP using bcrypt before database storage
 * Plaintext OTPs are NEVER saved to the database.
 * @param {string} otp
 * @returns {Promise<string>}
 */
export async function hashOtp(otp) {
  const saltRounds = 10;
  return await bcrypt.hash(otp.trim(), saltRounds);
}

/**
 * Compares a plain OTP with stored hash
 * @param {string} plainOtp
 * @param {string} hashedOtp
 * @returns {Promise<boolean>}
 */
export async function compareOtp(plainOtp, hashedOtp) {
  return await bcrypt.compare(plainOtp.trim(), hashedOtp);
}
