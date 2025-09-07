const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const productController = require('../controllers/productController');

router.use(auth);

// Order matters: specific routes before dynamic ones
router.get('/barcode/:barcode', productController.getProductByBarcode);
router.get('/:id', productController.getProductById);
router.get('/', productController.getAllProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;