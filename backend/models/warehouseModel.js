import pool from '../config/db.js';

export const WarehouseModel = {
  async findAll() {
    const query = `
      SELECT id, name, location_address, is_active, created_at, updated_at
      FROM warehouses
      WHERE is_active = TRUE
      ORDER BY name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT id, name, location_address, is_active, created_at, updated_at
      FROM warehouses
      WHERE id = ? AND is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create({ name, location_address = null }) {
    const query = `
      INSERT INTO warehouses (name, location_address)
      VALUES (?, ?)
    `;
    const [result] = await pool.execute(query, [name, location_address]);
    return result.insertId;
  },

  async update(id, { name, location_address }) {
    const query = `
      UPDATE warehouses
      SET name = COALESCE(?, name),
          location_address = COALESCE(?, location_address),
          updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, location_address, id]);
    return result.affectedRows > 0;
  },

  async deactivate(id) {
    const query = `
      UPDATE warehouses
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
};

export default WarehouseModel;
