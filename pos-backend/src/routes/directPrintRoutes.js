const express = require("express");
const router = express.Router();
const directPrintCtrl = require("../controllers/directPrintController");

router.get("/test", directPrintCtrl.testConnection);
router.get("/test-zy609", directPrintCtrl.testZY609);
router.get("/list-printers", directPrintCtrl.listPrinters);
router.post("/direct-print", directPrintCtrl.printReceipt);
router.post("/tauri-print", directPrintCtrl.printReceiptTauri);
router.post("/tauri-print-enhanced", directPrintCtrl.printReceiptEnhanced); // NEW
router.post("/generate-html", directPrintCtrl.generateHTMLReceipt);
router.post("/generate-pdf", directPrintCtrl.generatePDF);

module.exports = router;
