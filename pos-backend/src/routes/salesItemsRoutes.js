const express = require('express');
const router = express.Router();
const salesItemsController = require('../controllers/salesItemsController');

router.get('/', salesItemsController.getSalesItems);
router.get('/products-by-category', salesItemsController.getProductsByCategory);
router.get('/products', salesItemsController.getProductSales);
router.get('/product-details', salesItemsController.getProductDetails); // ← Add this line

module.exports = router;