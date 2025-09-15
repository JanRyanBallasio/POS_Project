const express = require('express');
const router = express.Router();
const salesItemsController = require('../controllers/salesItemsController');

router.get('/', salesItemsController.getSalesItems);
router.get('/products-by-category', salesItemsController.getProductsByCategory);

module.exports = router;