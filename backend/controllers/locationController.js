import LocationModel from '../models/locationModel.js';
import WarehouseModel from '../models/warehouseModel.js';

export const getLocations = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    
    // Validate warehouse exists
    const warehouse = await WarehouseModel.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const locations = await LocationModel.findByWarehouse(warehouseId);
    res.status(200).json({ success: true, locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, message: 'Server error fetching locations' });
  }
};

export const createLocation = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { name, type } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Location name is required' });
    }

    const warehouse = await WarehouseModel.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }

    const newId = await LocationModel.create({ 
      warehouse_id: warehouseId, 
      name: name.trim(), 
      type: type || 'Rack' 
    });
    
    const location = await LocationModel.findById(newId);
    res.status(201).json({ success: true, message: 'Location created', location });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ success: false, message: 'Server error creating location' });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const existing = await LocationModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    if (name !== undefined && name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Location name cannot be empty' });
    }

    const updated = await LocationModel.update(id, { 
      name: name ? name.trim() : undefined, 
      type 
    });

    if (updated) {
      const location = await LocationModel.findById(id);
      res.status(200).json({ success: true, message: 'Location updated', location });
    } else {
      res.status(400).json({ success: false, message: 'Could not update location' });
    }
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await LocationModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }

    const deleted = await LocationModel.deactivate(id);
    if (deleted) {
      res.status(200).json({ success: true, message: 'Location deleted successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Could not delete location' });
    }
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ success: false, message: 'Server error deleting location' });
  }
};
