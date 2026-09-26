import WarehouseModel from '../models/warehouseModel.js';

export const getWarehouses = async (req, res) => {
  try {
    const warehouses = await WarehouseModel.findAll();
    res.status(200).json({ success: true, warehouses });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ success: false, message: 'Server error fetching warehouses' });
  }
};

export const getWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await WarehouseModel.findById(id);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    res.status(200).json({ success: true, warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ success: false, message: 'Server error fetching warehouse' });
  }
};

export const createWarehouse = async (req, res) => {
  try {
    const { name, location_address } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Warehouse name is required' });
    }

    const newId = await WarehouseModel.create({ name: name.trim(), location_address });
    const warehouse = await WarehouseModel.findById(newId);
    
    res.status(201).json({ success: true, message: 'Warehouse created', warehouse });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ success: false, message: 'Server error creating warehouse' });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location_address } = req.body;

    const existing = await WarehouseModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Warehouse name cannot be empty' });
    }

    const updated = await WarehouseModel.update(id, { 
      name: name ? name.trim() : undefined, 
      location_address 
    });

    if (updated) {
      const warehouse = await WarehouseModel.findById(id);
      res.status(200).json({ success: true, message: 'Warehouse updated', warehouse });
    } else {
      res.status(400).json({ success: false, message: 'Could not update warehouse' });
    }
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ success: false, message: 'Server error updating warehouse' });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await WarehouseModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const deleted = await WarehouseModel.deactivate(id);
    if (deleted) {
      res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Could not delete warehouse' });
    }
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ success: false, message: 'Server error deleting warehouse' });
  }
};
