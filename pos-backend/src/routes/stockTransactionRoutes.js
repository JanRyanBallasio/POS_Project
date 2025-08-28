const express = require('express')
const router = express.Router()
const controller = require('../controllers/stockTransactionController')

router.post('/', controller.createStockTransaction)      // POST /api/stock-transactions
router.get('/', controller.listStockTransactions)        // GET /api/stock-transactions
router.get('/:id', controller.getStockTransaction)       // GET /api/stock-transactions/:id

module.exports = router