import pool from '../config/db.js';

export const ProductModel = {
  async findAll() {
    const query = `
      SELECT p.id, p.name, p.sku, p.category_id, c.name as category_name, p.uom, p.reorder_level, p.is_active, p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = TRUE
      ORDER BY p.name ASC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT p.id, p.name, p.sku, p.category_id, c.name as category_name, p.uom, p.reorder_level, p.is_active, p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ? AND p.is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  },
  
  async findBySku(sku) {
    const query = `
      SELECT id, name, sku, category_id, uom, reorder_level, is_active
      FROM products
      WHERE sku = ? AND is_active = TRUE
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [sku]);
    return rows.length > 0 ? rows[0] : null;
  },

  async create({ name, sku, category_id = null, uom = 'Unit', reorder_level = 0 }) {
    const query = `
      INSERT INTO products (name, sku, category_id, uom, reorder_level)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [name, sku, category_id, uom, reorder_level]);
    return result.insertId;
  },

  async update(id, { name, sku, category_id, uom, reorder_level }) {
    const query = `
      UPDATE products
      SET name = COALESCE(?, name),
          sku = COALESCE(?, sku),
          category_id = COALESCE(?, category_id),
          uom = COALESCE(?, uom),
          reorder_level = COALESCE(?, reorder_level),
          updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [name, sku, category_id, uom, reorder_level, id]);
    return result.affectedRows > 0;
  },

  async deactivate(id) {
    const query = `
      UPDATE products
      SET is_active = FALSE, updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
};

export default ProductModel;
