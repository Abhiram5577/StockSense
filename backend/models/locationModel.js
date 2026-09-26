import pool from '../config/db.js';

export const LocationModel = {
  async findByWarehouse(warehouseId) {
    const query = `
      SELECT id, warehouse_id, name, type, is_active, created_at, updated_at
      FROM locations
      WHERE warehouse_id = ? AND is_active = TRUE
      ORDER BY name ASC
    `;
    const [rows] = await pool.execute(query, [warehouseId]);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT id, warehouse_id, name, type, is_active, created_at, updated_at
      FROM locations
      WHERE id = ? AND is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create({ warehouse_id, name, type = 'Rack' }) {
    const query = `
      INSERT INTO locations (warehouse_id, name, type)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(query, [warehouse_id, name, type]);
    return result.insertId;
  },

  async update(id, { name, type }) {
    const query = `
      UPDATE locations
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, type, id]);
    return result.affectedRows > 0;
  },

  async deactivate(id) {
    const query = `
      UPDATE locations
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
};

export default LocationModel;
