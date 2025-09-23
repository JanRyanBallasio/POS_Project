const express = require("express");
const router = express.Router();
const receiptCtrl = require("../controllers/receiptPdfController");

router.post("/receipt", receiptCtrl.generate);
router.get("/test-bulk", receiptCtrl.testBulkReceipt); // NEW: Test endpoint

module.exports = router;