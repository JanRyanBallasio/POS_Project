const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);

// ADD THIS LINE:
router.put('/:id', productController.updateProduct);

router.post('/', productController.createProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;