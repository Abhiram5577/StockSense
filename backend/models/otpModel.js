import pool from '../config/db.js';

/**
 * Password reset OTP database operations with parameterized queries
 */
export const OtpModel = {
  /**
   * Invalidates any existing unused OTPs for a user
   * @param {number} userId
   * @returns {Promise<number>} Number of invalidated records
   */
  async invalidateUserOtps(userId) {
    const query = `
      UPDATE password_reset_otps
      SET used = TRUE
      WHERE user_id = ? AND used = FALSE
    `;
    const [result] = await pool.execute(query, [userId]);
    return result.affectedRows;
  },

  /**
   * Creates a new hashed OTP entry with expiration timestamp
   * @param {{ userId: number, otpHash: string, expiresAt: Date }} otpData
   * @returns {Promise<number>} New OTP record ID
   */
  async create({ userId, otpHash, expiresAt }) {
    const query = `
      INSERT INTO password_reset_otps (user_id, otp_hash, expires_at, attempts, used)
      VALUES (?, ?, ?, 0, FALSE)
    `;
    const [result] = await pool.execute(query, [userId, otpHash, expiresAt]);
    return result.insertId;
  },

  /**
   * Retrieves the latest active (unused) OTP for a user
   * @param {number} userId
   * @returns {Promise<object|null>}
   */
  async getLatestActiveOtp(userId) {
    const query = `
      SELECT id, user_id, otp_hash, expires_at, attempts, used, created_at
      FROM password_reset_otps
      WHERE user_id = ? AND used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Increments the failed attempts counter for an OTP
   * @param {number} otpId
   * @returns {Promise<boolean>}
   */
  async incrementAttempts(otpId) {
    const query = `
      UPDATE password_reset_otps
      SET attempts = attempts + 1
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [otpId]);
    return result.affectedRows > 0;
  },

  /**
   * Marks an OTP as used to prevent replay attacks
   * @param {number} otpId
   * @returns {Promise<boolean>}
   */
  async markAsUsed(otpId) {
    const query = `
      UPDATE password_reset_otps
      SET used = TRUE
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [otpId]);
    return result.affectedRows > 0;
  },
};

export default OtpModel;
