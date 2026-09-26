import StockModel from '../models/stockModel.js';
import LedgerModel from '../models/ledgerModel.js';
import pool from '../config/db.js';

export const getStockSummary = async (req, res) => {
  try {
    const summary = await StockModel.getStockSummary();
    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error('Error fetching stock summary:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stock summary' });
  }
};

export const getStockByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const stock = await StockModel.getStockByProduct(productId);
    res.status(200).json({ success: true, stock });
  } catch (error) {
    console.error('Error fetching stock details:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stock details' });
  }
};

export const getStockByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const stock = await StockModel.getStockByWarehouse(warehouseId);
    res.status(200).json({ success: true, stock });
  } catch (error) {
    console.error('Error fetching warehouse stock:', error);
    res.status(500).json({ success: false, message: 'Server error fetching warehouse stock' });
  }
};

export const getLedger = async (req, res) => {
  try {
    const ledger = await LedgerModel.getLedger();
    res.status(200).json({ success: true, ledger });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ success: false, message: 'Server error fetching ledger' });
  }
};

// Generic operation endpoint for Receipts, Deliveries, Transfers, Adjustments
export const performOperation = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { 
      type, // 'Receipt', 'Delivery', 'Transfer', 'Adjustment'
      productId, quantity, 
      sourceWarehouseId, sourceLocationId, 
      destWarehouseId, destLocationId, 
      reference 
    } = req.body;
    const userId = req.user.userId;

    if (!type || !productId || !quantity || quantity <= 0) {
      throw new Error('Invalid operation parameters');
    }

    if (type === 'Receipt') {
      // Stock increases at destination
      if (!destWarehouseId) throw new Error('Destination warehouse required for Receipt');
      await StockModel.updateStockWithConnection(connection, {
        productId, warehouseId: destWarehouseId, locationId: destLocationId, quantityChange: quantity
      });
      await LedgerModel.insertLedgerWithConnection(connection, {
        productId, movementType: type, quantity,
        destWarehouseId, destLocationId, reference, userId
      });
    } 
    else if (type === 'Delivery') {
      // Stock decreases at source
      if (!sourceWarehouseId) throw new Error('Source warehouse required for Delivery');
      await StockModel.updateStockWithConnection(connection, {
        productId, warehouseId: sourceWarehouseId, locationId: sourceLocationId, quantityChange: -quantity
      });
      await LedgerModel.insertLedgerWithConnection(connection, {
        productId, movementType: type, quantity: -quantity,
        sourceWarehouseId, sourceLocationId, reference, userId
      });
    }
    else if (type === 'Transfer') {
      // Decrease source, increase destination
      if (!sourceWarehouseId || !destWarehouseId) throw new Error('Source and destination required for Transfer');
      await StockModel.updateStockWithConnection(connection, {
        productId, warehouseId: sourceWarehouseId, locationId: sourceLocationId, quantityChange: -quantity
      });
      await StockModel.updateStockWithConnection(connection, {
        productId, warehouseId: destWarehouseId, locationId: destLocationId, quantityChange: quantity
      });
      await LedgerModel.insertLedgerWithConnection(connection, {
        productId, movementType: type, quantity, // For transfer, we just log the positive amount being moved
        sourceWarehouseId, sourceLocationId, destWarehouseId, destLocationId, reference, userId
      });
    }
    else if (type === 'Adjustment') {
      // Can be positive or negative
      // But we receive the *difference* as quantity? Or wait, if quantity can be negative in req.body
      // Let's assume quantity here is the difference (can be negative)
      // Actually we checked quantity <= 0 above, so let's use a specific field for adjustment
      throw new Error('Please use the dedicated adjustment endpoint or allow negative quantities');
    }
    else {
      throw new Error('Unknown operation type');
    }

    await connection.commit();
    res.status(200).json({ success: true, message: `${type} operation successful` });
  } catch (error) {
    await connection.rollback();
    console.error('Operation failed:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

export const performAdjustment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { productId, warehouseId, locationId, difference, reference } = req.body;
    const userId = req.user.userId;

    if (!productId || !warehouseId || difference === undefined || difference === 0) {
      throw new Error('Invalid adjustment parameters');
    }

    await StockModel.updateStockWithConnection(connection, {
      productId, warehouseId, locationId, quantityChange: difference
    });
    
    await LedgerModel.insertLedgerWithConnection(connection, {
      productId, movementType: 'Adjustment', quantity: difference,
      sourceWarehouseId: warehouseId, sourceLocationId: locationId, reference, userId
    });

    await connection.commit();
    res.status(200).json({ success: true, message: 'Adjustment successful' });
  } catch (error) {
    await connection.rollback();
    console.error('Adjustment failed:', error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
