const express = require("express");
const router = express.Router();
const receiptCtrl = require("../controllers/receiptPdfController");

router.post("/receipt", receiptCtrl.generate);

module.exports = router;