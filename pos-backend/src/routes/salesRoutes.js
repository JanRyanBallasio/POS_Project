const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/', salesController.createSale);
router.get('/stats', salesController.getTodaysStats);
router.get('/validate-consistency', salesController.validateDailySalesConsistency);
router.get('/', salesController.getSales);

// List individual sales with joined customer name
router.get('/list', salesController.listSales);
router.get('/:id', salesController.getSaleDetails);

module.exports = router;