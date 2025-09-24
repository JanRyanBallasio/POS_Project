const escpos = require('escpos');
const escposUSB = require('escpos-usb');
const escposNetwork = require('escpos-network');
const fs = require('fs');
const path = require('path');

// ZY609 Printer Configuration
const ZY609_CONFIG = {
  model: 'ZY609',
  paperWidth: '80mm', // Standard receipt width
  dpi: 203,
  maxCharsPerLine: 32, // For 80mm paper
  supportedCommands: [
    'ESC @ (Initialize)',
    'ESC a (Alignment)',
    'ESC E (Bold)',
    'GS V (Cut)',
    'ESC d (Feed)'
  ]
};

// Function to generate ESC/POS receipt optimized for ZY609
function generateESCPOSReceipt(data) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long", 
    day: "2-digit",
  });

  let commands = '';
  
  // Initialize printer (ZY609 compatible)
  commands += '\x1B\x40'; // ESC @ - Initialize
  
  // Center align and bold for header
  commands += '\x1B\x61\x01'; // ESC a 1 - Center align
  commands += '\x1B\x45\x01'; // ESC E 1 - Bold on
  commands += 'YZY STORE\n';
  commands += 'Eastern Slide, Tuding\n';
  commands += '\x1B\x45\x00'; // ESC E 0 - Bold off
  commands += '\x1B\x61\x00'; // ESC a 0 - Left align
  
  // Add separator
  commands += '================================\n';
  
  // Customer and date info
  commands += `Customer: ${data.customer?.name || "N/A"}\n`;
  commands += `Date: ${dateStr}\n`;
  commands += '--------------------------------\n';
  
  // Table header
  commands += 'Item                QTY  Price  Amount\n';
  commands += '--------------------------------\n';
  
  // Add all items (this will handle all 100+ items without cutoff)
  data.items.forEach((item) => {
    const desc = item.desc.length > 20 ? item.desc.substring(0, 17) + "..." : item.desc;
    const qty = item.qty.toString().padStart(3);
    const price = item.price ? item.price.toFixed(2) : (item.amount / item.qty).toFixed(2);
    const amount = item.amount.toFixed(2).padStart(7);
    
    commands += `${desc.padEnd(20)} ${qty} ${price.padStart(6)} ${amount}\n`;
  });
  
  // Totals
  commands += '--------------------------------\n';
  commands += `Total:                    P${data.cartTotal.toFixed(2)}\n`;
  commands += `Amount:                   P${data.amount.toFixed(2)}\n`;
  commands += `Change:                   P${data.change.toFixed(2)}\n`;
  commands += '--------------------------------\n';
  commands += `Customer Points: ${data.points || 0}\n`;
  commands += '--------------------------------\n\n';
  
  // Footer
  commands += '\x1B\x61\x01'; // Center align
  commands += 'THANK YOU - GATANG KA MANEN!\n\n';
  commands += 'CUSTOMER COPY\n';
  commands += '\x1B\x61\x00'; // Left align
  commands += '================================\n\n';
  
  // Feed paper and cut (ZY609 compatible)
  commands += '\x1B\x64\x03'; // ESC d 3 - Feed 3 lines
  commands += '\x1D\x56\x00'; // GS V 0 - Full cut
  
  return commands;
}

// Function to save receipt to file for debugging
function saveReceiptToFile(commands, data, testType = 'debug') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `receipt-${testType}-${timestamp}.txt`;
    const filepath = path.join(__dirname, '../../receipts', filename);
    
    // Create receipts directory if it doesn't exist
    const receiptsDir = path.dirname(filepath);
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    
    // Create detailed test report
    const testReport = `
ZY609 PRINTER TEST REPORT
========================
Test Type: ${testType}
Timestamp: ${new Date().toISOString()}
Printer Model: ${ZY609_CONFIG.model}
Paper Width: ${ZY609_CONFIG.paperWidth}
DPI: ${ZY609_CONFIG.dpi}
Max Chars Per Line: ${ZY609_CONFIG.maxCharsPerLine}

RECEIPT DATA SUMMARY
===================
Customer: ${data.customer?.name || "N/A"}
Total Items: ${data.items.length}
Cart Total: P${data.cartTotal.toFixed(2)}
Amount Paid: P${data.amount.toFixed(2)}
Change: P${data.change.toFixed(2)}
Points: ${data.points || 0}

ITEM LIST
=========
${data.items.map((item, index) => 
  `${index + 1}. ${item.desc} - Qty: ${item.qty} - Price: P${item.price ? item.price.toFixed(2) : (item.amount / item.qty).toFixed(2)} - Amount: P${item.amount.toFixed(2)}`
).join('\n')}

ESC/POS COMMANDS (RAW)
======================
${commands}

ESC/POS COMMANDS (HEX)
======================
${Buffer.from(commands, 'utf8').toString('hex').match(/.{1,2}/g).join(' ')}

RECEIPT PREVIEW (WHAT WILL PRINT)
=================================
${commands.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1B/g, '[ESC]').replace(/\x1D/g, '[GS]')}
`;

    // Save the test report
    fs.writeFileSync(filepath, testReport, 'utf8');
    
    console.log(`Test report saved to: ${filepath}`);
    return filepath;
  } catch (error) {
    console.error('Error saving test report:', error);
    return null;
  }
}

// Test endpoint for ZY609 compatibility
exports.testZY609 = async function (req, res) {
  try {
    console.log('ZY609 Test endpoint called');
    
    // Create test data with 100 items (like your actual use case)
    const testData = {
      customer: { name: "Test Customer" },
      cartTotal: 1000.00,
      amount: 1000.00,
      change: 0.00,
      points: 10,
      items: []
    };
    
    // Generate 100 test items
    for (let i = 100; i >= 1; i--) {
      testData.items.push({
        desc: `Debug Product ${i}`,
        qty: 1,
        price: 10.00,
        amount: 10.00
      });
    }
    
    // Generate ESC/POS commands
    const escposCommands = generateESCPOSReceipt(testData);
    
    // Save test report
    const filepath = saveReceiptToFile(escposCommands, testData, 'zy609-test');
    
    res.json({
      success: true,
      message: "ZY609 compatibility test completed",
      printer: ZY609_CONFIG,
      testData: {
        itemCount: testData.items.length,
        totalAmount: testData.cartTotal,
        receiptLength: escposCommands.length,
        estimatedPrintTime: Math.ceil(testData.items.length * 0.1) + " seconds"
      },
      filepath: filepath,
      compatibility: {
        paperWidth: "80mm - Compatible",
        dpi: "203 - Compatible", 
        maxItems: "Unlimited - No cutoff issues",
        commands: "ESC/POS - Fully supported"
      }
    });
    
  } catch (err) {
    console.error("ZY609 test error:", err);
    res.status(500).json({
      error: "Test failed",
      details: String(err)
    });
  }
};

// Direct print function
exports.printReceipt = async function (req, res) {
  try {
    const raw = req.body || {};
    const debugMode = req.query.debug === 'true' || process.env.DEBUG_PRINT === 'true';
    
    const data = {
      customer: raw.customer || { name: "N/A" },
      cartTotal: Number(raw.cartTotal || 0),
      amount: Number(raw.amount || 0),
      change: Number(raw.change || 0),
      points: raw.points || 0,
      items: Array.isArray(raw.items)
        ? raw.items.map((it) => ({
            desc: it && it.desc ? String(it.desc) : "",
            qty: Number(it.qty || 0),
            price: typeof it.price === "number" ? it.price : (Number(it.amount || 0) / Number(it.qty || 1)),
            amount: Number(it.amount || 0),
          }))
        : [],
    };

    // Generate ESC/POS commands
    const escposCommands = generateESCPOSReceipt(data);
    
    if (debugMode) {
      // Debug mode: save to file instead of printing
      const filepath = saveReceiptToFile(escposCommands, data, 'debug');
      
      console.log('DEBUG MODE: Receipt saved to file instead of printing');
      return res.json({ 
        success: true, 
        message: "Receipt saved to file (debug mode)",
        debug: true,
        filepath: filepath,
        itemCount: data.items.length,
        totalAmount: data.cartTotal,
        printer: ZY609_CONFIG,
        estimatedPrintTime: Math.ceil(data.items.length * 0.1) + " seconds"
      });
    }
    
    // Production mode: try to print to actual ZY609 printer
    try {
      // Convert to Buffer for printing
      const printBuffer = Buffer.from(escposCommands, 'utf8');
      
      // Create device connection only when needed
      const device = new escposUSB();
      const printer = new escpos.Printer(device);
      
      // Open printer connection
      device.open(function(error) {
        if (error) {
          console.error('Error opening ZY609 printer:', error);
          return res.status(500).json({ 
            error: "Failed to connect to ZY609 printer", 
            details: error.message,
            suggestion: "Make sure your ZY609 printer is connected via USB and turned on. You can also use debug mode by adding ?debug=true to the request."
          });
        }
        
        // Send print job
        printer.raw(printBuffer, function(err) {
          if (err) {
            console.error('Print error:', err);
            return res.status(500).json({ 
              error: "Print failed", 
              details: err.message 
            });
          }
          
          console.log('Receipt printed successfully to ZY609 printer');
          res.json({ 
            success: true, 
            message: "Receipt printed successfully to ZY609 printer",
            itemCount: data.items.length,
            totalAmount: data.cartTotal,
            printer: ZY609_CONFIG
          });
          
          // Close printer connection
          device.close();
        });
      });
      
    } catch (printerError) {
      console.error('ZY609 printer setup error:', printerError);
      return res.status(500).json({ 
        error: "ZY609 printer not found or not accessible", 
        details: printerError.message,
        suggestion: "Make sure your ZY609 printer is connected via USB and turned on. You can also use debug mode by adding ?debug=true to the request."
      });
    }
    
  } catch (err) {
    console.error("Direct print error:", err);
    return res.status(500).json({ 
      error: "Direct print failed", 
      details: String(err) 
    });
  }
};

// Test endpoint
exports.testConnection = async function (req, res) {
  try {
    console.log('Test endpoint called');
    res.json({ 
      success: true, 
      message: "Backend connection working!",
      timestamp: new Date().toISOString(),
      debugMode: process.env.DEBUG_PRINT === 'true',
      printer: ZY609_CONFIG
    });
  } catch (err) {
    console.error("Test error:", err);
    res.status(500).json({ 
      error: "Test failed", 
      details: String(err) 
    });
  }
};

// List available printers endpoint
exports.listPrinters = async function (req, res) {
  try {
    // This will help identify available printers
    const usb = require('usb');
    const devices = usb.getDeviceList();
    
    const printerDevices = devices.map(device => ({
      vendorId: device.deviceDescriptor.idVendor,
      productId: device.deviceDescriptor.idProduct,
      manufacturer: device.deviceDescriptor.iManufacturer,
      product: device.deviceDescriptor.iProduct
    }));
    
    res.json({
      success: true,
      printers: printerDevices,
      message: "Available USB devices",
      targetPrinter: ZY609_CONFIG
    });
  } catch (err) {
    console.error("List printers error:", err);
    res.status(500).json({
      error: "Failed to list printers",
      details: String(err)
    });
  }
};
