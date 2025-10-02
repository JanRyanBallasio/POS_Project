// pos-backend/src/routes/printRoutes.js
const express = require('express');
const router = express.Router();
const { printReceipt } = require('../lib/printReceipt');
const { spawn } = require('child_process');
const os = require('os');

// List installed printers (Cross-platform)
router.get('/printers', async (req, res) => {
  try {
    const platform = os.platform();
    let out;

    if (platform === 'win32') {
      // Windows: Use PowerShell
      out = await new Promise((resolve) => {
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
    } else {
      // Linux/Unix: Use lpstat
      out = await new Promise((resolve) => {
        const ps = spawn('lpstat', ['-p']);
        let stdout = '', stderr = '';
        ps.stdout.on('data', b => stdout += b.toString());
        ps.stderr.on('data', b => stderr += b.toString());
        ps.on('close', code => resolve({ code, stdout, stderr }));
      });
    }

    if (out.code !== 0) {
      // Return empty array on error instead of crashing
      return res.json({ success: true, printers: [] });
    }

    let printers;
    if (platform === 'win32') {
      // Windows: Split by newlines
      printers = String(out.stdout).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    } else {
      // Linux: Parse lpstat output
      printers = String(out.stdout)
        .split(/\r?\n/)
        .map(line => {
          const match = line.match(/^printer\s+(\S+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
    }

    res.json({ success: true, printers });
  } catch (e) {
    // Return empty array on error instead of crashing
    res.json({ success: true, printers: [] });
  }
});

// Print receipt (Cross-platform)
router.post('/receipt', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[PRINT] request', {
      items: Array.isArray(payload.items) ? payload.items.length : 0,
      printerName: payload.printerName || '(default)'
    });

    await printReceipt(
      {
        store: payload.store || {},
        customer: payload.customer || { name: 'N/A' },
        cartTotal: Number(payload.cartTotal || 0),
        amount: Number(payload.amount || 0),
        change: Number(payload.change || 0),
        points: Number(payload.points || 0),
        items: Array.isArray(payload.items) ? payload.items : [],
      },
      { printerName: payload.printerName || null }
    );

    console.log('[PRINT] success');
    res.json({ success: true, message: 'Printed successfully' });
  } catch (e) {
    console.error('[PRINT] error', e);
    res.status(500).json({ success: false, error: String(e) });
  }
});

module.exports = router;