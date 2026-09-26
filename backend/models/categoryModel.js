import pool from '../config/db.js';

export const CategoryModel = {
  async findAll() {
    const query = `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      WHERE is_active = TRUE
      ORDER BY name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM categories
      WHERE id = ? AND is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create({ name, description = null }) {
    const query = `
      INSERT INTO categories (name, description)
      VALUES (?, ?)
    `;
    const [result] = await pool.execute(query, [name, description]);
    return result.insertId;
  },

  async update(id, { name, description }) {
    const query = `
      UPDATE categories
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, description, id]);
    return result.affectedRows > 0;
  },

  async deactivate(id) {
    const query = `
      UPDATE categories
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
};

export default CategoryModel;
