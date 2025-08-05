const express = require('express');
const router = express.Router();
const salesItemsController = require('../controllers/salesItemsController');

router.get('/', salesItemsController.getSalesItems);

module.exports = router;