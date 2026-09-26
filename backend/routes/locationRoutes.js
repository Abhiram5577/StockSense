import express from 'express';
import { 
  getLocations, 
  createLocation, 
  updateLocation, 
  deleteLocation 
} from '../controllers/locationController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All location routes require authentication
router.use(authenticateToken);

// Locations are typically accessed within the context of a warehouse
router.get('/warehouse/:warehouseId', getLocations);
router.post('/warehouse/:warehouseId', createLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export default router;
