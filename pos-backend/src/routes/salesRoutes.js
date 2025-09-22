const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.post('/', salesController.createSale);
router.get('/', salesController.getSales);
router.get('/totals', salesController.getSalesTotals);
router.get('/category-analytics', salesController.getCategoryAnalytics);

module.exports = router;