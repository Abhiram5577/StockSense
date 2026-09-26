import pool from '../config/db.js';

/**
 * User database operations with parameterized queries
 */
export const UserModel = {
  /**
   * Finds a user by email (includes password_hash for authentication)
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const query = `
      SELECT id, name, email, password_hash, role, created_at, updated_at
      FROM users
      WHERE email = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Finds a user by ID (excludes password_hash for safe profile inspection)
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const query = `
      SELECT id, name, email, role, created_at, updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new user record
   * @param {{ name: string, email: string, passwordHash: string, role?: string }} userData
   * @returns {Promise<number>} New user ID
   */
  async create({ name, email, passwordHash, role = 'staff' }) {
    const validRoles = ['admin', 'manager', 'staff'];
    const assignedRole = validRoles.includes(role) ? role : 'staff';

    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [name, email, passwordHash, assignedRole]);
    return result.insertId;
  },

  /**
   * Updates user's password hash and updated_at timestamp
   * @param {number} userId
   * @param {string} newPasswordHash
   * @returns {Promise<boolean>}
   */
  async updatePassword(userId, newPasswordHash) {
    const query = `
      UPDATE users
      SET password_hash = ?, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [newPasswordHash, userId]);
    return result.affectedRows > 0;
  },
};

export default UserModel;
