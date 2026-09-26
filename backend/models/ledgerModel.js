import pool from '../config/db.js';

export const LedgerModel = {
  // Get all ledger entries with details
  async getLedger() {
    const query = `
      SELECT l.id, l.movement_type, l.quantity, l.reference, l.created_at,
             p.name as product_name, p.sku,
             sw.name as source_warehouse, sl.name as source_location,
             dw.name as dest_warehouse, dl.name as dest_location,
             u.name as user_name
      FROM stock_ledger l
      JOIN products p ON l.product_id = p.id
      LEFT JOIN warehouses sw ON l.source_warehouse_id = sw.id
      LEFT JOIN locations sl ON l.source_location_id = sl.id
      LEFT JOIN warehouses dw ON l.destination_warehouse_id = dw.id
      LEFT JOIN locations dl ON l.destination_location_id = dl.id
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
    `;
    const [rows] = await pool.execute(query);
    return rows;
  },

  // Insert a ledger entry with a transaction connection
  async insertLedgerWithConnection(connection, {
    productId, movementType, quantity, sourceWarehouseId = null, sourceLocationId = null,
    destWarehouseId = null, destLocationId = null, reference = null, userId = null
  }) {
    const query = `
      INSERT INTO stock_ledger (
        product_id, movement_type, quantity, 
        source_warehouse_id, source_location_id, 
        destination_warehouse_id, destination_location_id, 
        reference, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      productId, movementType, quantity,
      sourceWarehouseId, sourceLocationId,
      destWarehouseId, destLocationId,
      reference, userId
    ];
    
    const [result] = await connection.execute(query, params);
    return result.insertId;
  }
};

export default LedgerModel;
