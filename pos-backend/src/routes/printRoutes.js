// pos-backend/src/routes/printRoutes.js
const express = require('express');
const router = express.Router();
const { printReceipt } = require('../lib/printReceipt');
const { spawn } = require('child_process');

// List installed printers (Windows)
router.get('/printers', async (req, res) => {
  try {
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
    if (out.code !== 0) {
      return res.status(500).json({ success: false, error: out.stderr || 'Failed to list printers' });
    }
    const printers = String(out.stdout).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    res.json({ success: true, printers });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

// Print receipt via RAW spooler (default printer if printerName not provided)
router.post('/receipt', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[PRINT] request received:', {
      items: Array.isArray(payload.items) ? payload.items.length : 0,
      printerName: payload.printerName || '(default)',
      customer: payload.customer?.name || 'N/A',
      total: payload.cartTotal || 0
    });

    // ✅ Validate required data
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No items to print' 
      });
    }

    // ✅ Ensure all items have required fields
    const processedItems = payload.items.map(item => ({
      desc: String(item.desc || ''),
      qty: Number(item.qty || 0),
      price: Number(item.price || 0),
      amount: Number(item.amount || 0)
    }));

    const result = await printReceipt(
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

    console.log('[PRINT] success');
    res.json({ 
      success: true, 
      message: 'Printed successfully',
      itemCount: processedItems.length,
      total: payload.cartTotal
    });
  } catch (e) {
    console.error('[PRINT] error:', e);
    res.status(500).json({ 
      success: false, 
      error: String(e),
      message: 'Print failed. Please check printer connection and try again.'
    });
  }
});

// Test endpoint to verify connection
router.get('/test', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Print service is working',
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ success: false, error: String(e) });
  }
});

module.exports = router;