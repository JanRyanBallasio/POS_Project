// pos-backend/src/routes/professionalPrintRoutes.js
const express = require('express');
const router = express.Router();
const professionalPrintController = require('../controllers/professionalPrintController');
const PrinterDiscoveryService = require('../services/PrinterDiscoveryService');

// Enhanced printing endpoints
router.post('/enhanced', professionalPrintController.printReceiptEnhanced);
router.get('/enhanced/test', professionalPrintController.testEnhanced);

// Printer discovery endpoints
router.get('/enhanced/printers', async (req, res) => {
  try {
    console.log('[PRINT ROUTES] Printer discovery requested');
    
    const [printers, defaultPrinter] = await Promise.all([
      PrinterDiscoveryService.getAvailablePrinters(),
      PrinterDiscoveryService.getDefaultPrinter()
    ]);

    // Mark the default printer
    const printersWithDefault = printers.map(printer => ({
      ...printer,
      isDefault: printer.name === defaultPrinter
    }));

    res.json({
      success: true,
      printers: printersWithDefault,
      defaultPrinter,
      count: printers.length,
      timestamp: new Date().toISOString(),
      platform: process.platform
    });
  } catch (error) {
    console.error('[PRINT ROUTES] Printer discovery error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      printers: [{ 
        name: 'Default Printer', 
        status: 'Available',
        isDefault: true 
      }],
      defaultPrinter: 'Default Printer'
    });
  }
});

// Test specific printer connection
router.get('/enhanced/printers/:name/test', async (req, res) => {
  try {
    const printerName = decodeURIComponent(req.params.name);
    const isConnected = await PrinterDiscoveryService.testPrinterConnection(printerName);
    
    res.json({
      success: true,
      printerName,
      isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      printerName: req.params.name,
      isConnected: false
    });
  }
});

module.exports = router;