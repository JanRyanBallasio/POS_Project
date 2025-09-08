const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.get('/', customerController.getAllCustomers);
router.post('/', customerController.createCustomer);
router.put('/:id/points', customerController.updateCustomerPoints);
router.post('/:id/add-points', customerController.addPointsToCustomer);

module.exports = router;