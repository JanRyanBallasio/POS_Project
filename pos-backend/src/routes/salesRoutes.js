const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/', salesController.createSale);
router.get('/stats', salesController.getTodaysStats);
router.get('/validate-consistency', salesController.validateDailySalesConsistency);
router.get('/', salesController.getSales);

module.exports = router;