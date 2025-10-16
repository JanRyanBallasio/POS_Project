const express = require('express')
const router = express.Router()
const controller = require('../controllers/stockTransactionController')

router.post('/', controller.createStockTransaction)                                    // POST /api/stock-transactions
router.get('/suppliers/list', controller.getSuppliers)                                 // GET /api/stock-transactions/suppliers/list
router.get('/suppliers/:companyName/percent', controller.getSupplierPercent)           // GET /api/stock-transactions/suppliers/:companyName/percent
router.put('/suppliers/:companyName/percent', controller.updateSupplierPercent)        // PUT /api/stock-transactions/suppliers/:companyName/percent
router.get('/today/:companyName', controller.getTodayTransaction)                      // GET /api/stock-transactions/today/:companyName
router.post('/:transactionId/items', controller.addStockItems)                         // POST /api/stock-transactions/:transactionId/items
router.put('/items/:itemId', controller.updateStockItem)                               // PUT /api/stock-transactions/items/:itemId
router.delete('/items/:itemId', controller.deleteStockItem)                            // DELETE /api/stock-transactions/items/:itemId
router.get('/', controller.listStockTransactions)                                      // GET /api/stock-transactions
router.get('/:id', controller.getStockTransaction)                                     // GET /api/stock-transactions/:id

module.exports = router