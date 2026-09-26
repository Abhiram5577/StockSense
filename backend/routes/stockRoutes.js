import express from 'express';
import { 
  getStockSummary, 
  getStockByProduct,
  getStockByWarehouse, 
  getLedger, 
  performOperation, 
  performAdjustment 
} from '../controllers/stockController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', getStockSummary);
router.get('/product/:productId', getStockByProduct);
router.get('/warehouse/:warehouseId', getStockByWarehouse);
router.get('/ledger', getLedger);

router.post('/operation', performOperation);
router.post('/adjustment', performAdjustment);

export default router;
