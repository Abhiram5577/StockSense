import pool from '../config/db.js';

export const StockModel = {
  // Get all stock grouped by product
  async getStockSummary() {
    const query = `
      SELECT p.id as product_id, p.name, p.sku, p.reorder_level, p.uom,
             SUM(s.quantity) as total_quantity
      FROM products p
      LEFT JOIN stock s ON p.id = s.product_id
      WHERE p.is_active = TRUE
      GROUP BY p.id
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  // Get stock details for a specific product
  async getStockByProduct(productId) {
    const query = `
      SELECT s.id, s.product_id, s.warehouse_id, w.name as warehouse_name, 
             s.location_id, l.name as location_name, s.quantity
      FROM stock s
      JOIN warehouses w ON s.warehouse_id = w.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.product_id = ? AND s.quantity > 0
    `;
    const [rows] = await pool.execute(query, [productId]);
    return rows;
  },

  // Get stock details for a specific warehouse
  async getStockByWarehouse(warehouseId) {
    const query = `
      SELECT s.id, s.product_id, p.name as product_name, p.sku,
             s.warehouse_id, s.location_id, l.name as location_name, s.quantity
      FROM stock s
      JOIN products p ON s.product_id = p.id
      LEFT JOIN locations l ON s.location_id = l.id
      WHERE s.warehouse_id = ? AND s.quantity > 0
    `;
    const [rows] = await pool.execute(query, [warehouseId]);
    return rows;
  },

  // Update stock with a transaction connection
  async updateStockWithConnection(connection, { productId, warehouseId, locationId, quantityChange }) {
    // Treat null location_id correctly in the unique constraint
    const locationQuery = locationId ? 'location_id = ?' : 'location_id IS NULL';
    const params = locationId ? [productId, warehouseId, locationId] : [productId, warehouseId];

    const checkQuery = `SELECT id, quantity FROM stock WHERE product_id = ? AND warehouse_id = ? AND ${locationQuery} LIMIT 1`;
    const [existing] = await connection.execute(checkQuery, params);

    if (existing.length > 0) {
      const newQuantity = existing[0].quantity + quantityChange;
      if (newQuantity < 0) {
        throw new Error('Insufficient stock for this operation');
      }
      
      const updateQuery = `UPDATE stock SET quantity = ?, updated_at = NOW() WHERE id = ?`;
      await connection.execute(updateQuery, [newQuantity, existing[0].id]);
      return newQuantity;
    } else {
      if (quantityChange < 0) {
        throw new Error('Insufficient stock for this operation');
      }
      
      const insertQuery = `
        INSERT INTO stock (product_id, warehouse_id, location_id, quantity)
        VALUES (?, ?, ?, ?)
      `;
      const insertParams = [productId, warehouseId, locationId || null, quantityChange];
      await connection.execute(insertQuery, insertParams);
      return quantityChange;
    }
  }
};

export default StockModel;
