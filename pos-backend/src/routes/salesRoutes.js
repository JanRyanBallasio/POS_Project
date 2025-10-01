const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/', salesController.createSale);
router.get('/', salesController.getSales);

// Add public routes that don't require auth
router.get('/public/sales', (req, res) => {
  // Your sales logic here without auth
});

router.get('/public/sales-items', (req, res) => {
  // Your sales items logic here without auth
});

module.exports = router;