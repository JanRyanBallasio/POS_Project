const express = require('express');
const router = express.Router();
const { printReceipt } = require('../lib/printReceipt');
const { spawn } = require('child_process');

// List installed printers (cross-platform)
router.get('/printers', async (req, res) => {
  try {
    let printers = [];
    
    if (process.platform === 'win32') {
      const out = await new Promise((resolve) => {
        const ps = spawn('powershell', [
          '-NoProfile',
          '-Command',
          'Get-CimInstance Win32_Printer | Select-Object -ExpandProperty Name'
        ]);
        let stdout = '', stderr = '';
        ps.stdout.on('data', b => stdout += b.toString());
        ps.stderr.on('data', b => stderr += b.toString());
        ps.on('close', code => resolve({ code, stdout, stderr }));
      });
      
      if (out.code === 0) {
        printers = String(out.stdout).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      }
    }
    
    res.json({ success: true, printers });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

// Print receipt
router.post('/receipt', async (req, res) => {
  try {
    const payload = req.body || {};

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No items to print' 
      });
    }

    const processedItems = payload.items.map(item => ({
      desc: String(item.desc || ''),
      qty: Number(item.qty || 0),
      price: Number(item.price || 0),
      amount: Number(item.amount || 0)
    }));

    await printReceipt(
      {
        store: payload.store || { name: 'YZY STORE', address1: 'Eastern Slide, Tuding' },
        customer: payload.customer || { name: 'N/A' },
        cartTotal: Number(payload.cartTotal || 0),
        amount: Number(payload.amount || 0),
        change: Number(payload.change || 0),
        points: Number(payload.points || 0),
        items: processedItems,
      },
      { printerName: payload.printerName || null }
    );

    res.json({ 
      success: true, 
      message: 'Printed successfully',
      itemCount: processedItems.length,
      total: payload.cartTotal
    });
  } catch (e) {
    res.status(500).json({ 
      success: false, 
      error: String(e),
      message: 'Print failed. Please check printer connection and try again.'
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Print service is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;