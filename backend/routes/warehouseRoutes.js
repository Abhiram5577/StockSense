import express from 'express';
import { 
  getWarehouses, 
  getWarehouse, 
  createWarehouse, 
  updateWarehouse, 
  deleteWarehouse 
} from '../controllers/warehouseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All warehouse routes require authentication
router.use(authenticateToken);

router.get('/', getWarehouses);
router.post('/', createWarehouse);
router.get('/:id', getWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);

export default router;
