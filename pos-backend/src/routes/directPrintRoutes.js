const express = require("express");
const router = express.Router();
const directPrintCtrl = require("../controllers/directPrintController");

router.get("/test", directPrintCtrl.testConnection);
router.get("/test-zy609", directPrintCtrl.testZY609);
router.get("/list-printers", directPrintCtrl.listPrinters);
router.post("/direct-print", directPrintCtrl.printReceipt);

module.exports = router;
