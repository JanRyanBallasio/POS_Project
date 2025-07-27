const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/',productController.getAllProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);

router.post('/', productController.createProduct);

module.exports = router;
