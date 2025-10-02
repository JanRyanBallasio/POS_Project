// pos-backend/src/controllers/professionalPrintController.js
const net = require('net');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SimplifiedPrintService {
  constructor() {
    this.defaultConfig = {
      timeout: 5000,
      paperWidth: 80,
      encoding: 'utf8'
    };
  }

  // Generate professional ESC/POS receipt
  generateESCPOSReceipt(data) {
    let commands = '';
    
    // Initialize printer
    commands += '\x1B\x40'; // ESC @
    
    // Set encoding
    commands += '\x1B\x74\x00'; // ESC t 0
    
    // Header - Center aligned
    commands += '\x1B\x61\x01'; // Center
    commands += '\x1B\x45\x01'; // Bold on
    commands += `${data.store?.name || 'YZY STORE'}\n`;
    commands += `${data.store?.address1 || 'Eastern Slide, Tuding'}\n`;
    commands += '\x1B\x45\x00'; // Bold off
    
    // Left align for content
    commands += '\x1B\x61\x00'; // Left
    commands += '--------------------------------\n';
    
    // Customer and date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    });
    commands += `Customer: ${data.customer?.name || 'N/A'}\n`;
    commands += `Date: ${date}\n`;
    commands += '--------------------------------\n';
    
    // Items header
    commands += '# Description        Qty Price Amount\n';
    commands += '--------------------------------\n';
    
    // Items
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach((item, index) => {
        const desc = String(item.desc || '').length > 15 
          ? String(item.desc).substring(0, 12) + '...' 
          : String(item.desc || '').padEnd(15);
        const qty = String(item.qty || 0).padStart(3);
        const price = `P${(item.price || 0).toFixed(2)}`.padStart(6);
        const amount = `P${(item.amount || 0).toFixed(2)}`.padStart(7);
        
        commands += `${String(index + 1).padStart(2)} ${desc} ${qty} ${price} ${amount}\n`;
      });
    }
    
    // Totals
    commands += '--------------------------------\n';
    commands += `Total:                    P${(data.cartTotal || 0).toFixed(2)}\n`;
    commands += `Amount:                   P${(data.amount || 0).toFixed(2)}\n`;
    commands += `Change:                   P${(data.change || 0).toFixed(2)}\n`;
    commands += '--------------------------------\n';
    commands += `Customer Points: ${data.points || 0}\n`;
    commands += '--------------------------------\n\n';
    
    // Footer - Center aligned
    commands += '\x1B\x61\x01'; // Center
    commands += 'CUSTOMER COPY - NOT AN OFFICIAL RECEIPT\n\n';
    commands += 'THANK YOU - GATANG KA MANEN!\n';
    commands += '\x1B\x61\x00'; // Left
    commands += '--------------------------------\n\n';
    
    // Feed and cut
    commands += '\x1B\x64\x03'; // Feed 3 lines
    commands += '\x1D\x56\x00'; // Full cut
    
    return commands;
  }

  // Network printing using built-in net module
  async printToNetworkPrinter(printerIP, port, receiptData) {
    return new Promise((resolve, reject) => {
      const client = new net.Socket();
      let connected = false;
      
      const cleanup = () => {
        if (connected) {
          client.destroy();
          connected = false;
        }
      };

      client.setTimeout(this.defaultConfig.timeout);
      
      client.connect(port || 9100, printerIP, () => {
        connected = true;
        console.log(`[NETWORK PRINT] Connected to ${printerIP}:${port}`);
        
        // Convert string to buffer and send
        const buffer = Buffer.from(receiptData, 'binary');
        client.write(buffer);
        
        // Give printer time to process
        setTimeout(() => {
          cleanup();
          resolve({ 
            success: true, 
            method: 'network',
            printer: `${printerIP}:${port}`,
            timestamp: new Date().toISOString()
          });
        }, 1000);
      });
      
      client.on('error', (err) => {
        cleanup();
        reject(new Error(`Network printer error: ${err.message}`));
      });
      
      client.on('timeout', () => {
        cleanup();
        reject(new Error('Network printer timeout'));
      });
    });
  }

  // Local printing using system commands
  async printToLocalPrinter(receiptData) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const tempFile = path.join(process.cwd(), `receipt_${timestamp}.txt`);
      
      try {
        // Write receipt data to temp file
        fs.writeFileSync(tempFile, receiptData, 'binary');
        
        const isWindows = process.platform === 'win32';
        const isLinux = process.platform === 'linux';
        
        if (isWindows) {
          // Windows: Use PowerShell to print to default printer
          const ps = spawn('powershell', [
            '-NoProfile',
            '-ExecutionPolicy', 'Bypass',
            '-Command',
            `
            $ErrorActionPreference = 'Stop'
            $path = '${tempFile.replace(/\\/g, '\\\\')}'
            $bytes = [System.IO.File]::ReadAllBytes($path)
            Add-Type -Language CSharp -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinterHelper {
  [StructLayout(LayoutKind.Sequential)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDatatype;
  }
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, DOCINFOA di);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, byte[] pBytes, int dwCount, out int dwWritten);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
}
public class RawPrint {
  public static void SendBytes(string printerName, byte[] bytes) {
    IntPtr h;
    if (!RawPrinterHelper.OpenPrinter(printerName, out h, IntPtr.Zero)) throw new Exception("OpenPrinter failed");
    var di = new RawPrinterHelper.DOCINFOA() { pDocName = "ESC/POS", pDatatype = "RAW" };
    if (!RawPrinterHelper.StartDocPrinter(h, 1, di)) throw new Exception("StartDocPrinter failed");
    if (!RawPrinterHelper.StartPagePrinter(h)) throw new Exception("StartPagePrinter failed");
    int written;
    if (!RawPrinterHelper.WritePrinter(h, bytes, bytes.Length, out written)) throw new Exception("WritePrinter failed");
    RawPrinterHelper.EndPagePrinter(h);
    RawPrinterHelper.EndDocPrinter(h);
    RawPrinterHelper.ClosePrinter(h);
  }
}
"@
            $target = (Get-CimInstance Win32_Printer | Where-Object {$_.Default -eq $true}).Name
            if (-not $target) { throw 'No default printer found' }
            [RawPrint]::SendBytes($target, $bytes)
            Write-Host "Printed to: $target"
            `
          ]);
          
          let output = '';
          let error = '';
          
          ps.stdout.on('data', (data) => output += data.toString());
          ps.stderr.on('data', (data) => error += data.toString());
          
          ps.on('close', (code) => {
            try { fs.unlinkSync(tempFile); } catch {}
            
            if (code === 0) {
              resolve({ 
                success: true, 
                method: 'local-windows',
                printer: 'default',
                timestamp: new Date().toISOString()
              });
            } else {
              reject(new Error(`Windows print failed: ${error || output}`));
            }
          });
          
        } else if (isLinux) {
          // Linux/Ubuntu: Use lp command
          const lp = spawn('lp', ['-o', 'raw', tempFile]);
          
          lp.on('close', (code) => {
            try { fs.unlinkSync(tempFile); } catch {}
            
            if (code === 0) {
              resolve({ 
                success: true, 
                method: 'local-linux',
                printer: 'default',
                timestamp: new Date().toISOString()
              });
            } else {
              reject(new Error('Linux print failed'));
            }
          });
          
          lp.on('error', (err) => {
            try { fs.unlinkSync(tempFile); } catch {}
            reject(new Error(`Linux print error: ${err.message}`));
          });
          
        } else {
          // macOS: Use lpr command
          const lpr = spawn('lpr', [tempFile]);
          
          lpr.on('close', (code) => {
            try { fs.unlinkSync(tempFile); } catch {}
            
            if (code === 0) {
              resolve({ 
                success: true, 
                method: 'local-macos',
                printer: 'default',
                timestamp: new Date().toISOString()
              });
            } else {
              reject(new Error('macOS print failed'));
            }
          });
        }
        
      } catch (error) {
        try { fs.unlinkSync(tempFile); } catch {}
        reject(error);
      }
    });
  }
}

const printService = new SimplifiedPrintService();

// Enhanced print endpoint that works with your existing structure
exports.printReceiptEnhanced = async (req, res) => {
  try {
    console.log('[ENHANCED PRINT] ==========================================');
    console.log('[ENHANCED PRINT] New print request received');
    console.log('[ENHANCED PRINT] Request method:', req.method);
    console.log('[ENHANCED PRINT] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[ENHANCED PRINT] Request body keys:', Object.keys(req.body || {}));
    
    const data = req.body;
    
    // Enhanced validation
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
        timestamp: new Date().toISOString()
      });
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No items provided for printing',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('[ENHANCED PRINT] Validated request data:', {
      itemCount: data?.items?.length || 0,
      customer: data?.customer?.name || 'N/A',
      total: data?.cartTotal || 0,
      printer: data?.printerName || 'default'
    });

    // Generate ESC/POS commands using the simplified service
    const escposCommands = printService.generateESCPOSReceipt(data);
    console.log('[ENHANCED PRINT] Generated ESC/POS commands, length:', escposCommands.length);
    
    // Try network printer first (if configured), then fall back to local
    let result;
    
    // Check if network printer is configured in environment
    const networkPrinterIP = process.env.NETWORK_PRINTER_IP;
    const networkPrinterPort = process.env.NETWORK_PRINTER_PORT || 9100;
    
    if (networkPrinterIP) {
      try {
        console.log(`[ENHANCED PRINT] Attempting network print to ${networkPrinterIP}:${networkPrinterPort}`);
        result = await printService.printToNetworkPrinter(
          networkPrinterIP,
          parseInt(networkPrinterPort),
          escposCommands
        );
      } catch (networkError) {
        console.log(`[ENHANCED PRINT] Network print failed, falling back to local: ${networkError.message}`);
        result = await printService.printToLocalPrinter(escposCommands);
      }
    } else {
      // No network printer configured, use local
      console.log('[ENHANCED PRINT] Using local printer (no network printer configured)');
      result = await printService.printToLocalPrinter(escposCommands);
    }
    
    console.log('[ENHANCED PRINT] Print operation completed successfully:', result);
    
    res.json({
      success: true,
      message: 'Receipt printed successfully',
      method: result.method,
      printer: result.printer,
      itemCount: data?.items?.length || 0,
      timestamp: result.timestamp,
      enhanced: true,
      debug: {
        platform: process.platform,
        nodeEnv: process.env.NODE_ENV,
        hasNetworkPrinter: !!networkPrinterIP
      }
    });
    
  } catch (error) {
    console.error('[ENHANCED PRINT] Critical error:', error);
    console.error('[ENHANCED PRINT] Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        platform: process.platform,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
};

// Test connection
exports.testEnhanced = async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Enhanced print service is ready',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: process.platform,
      networkPrinter: process.env.NETWORK_PRINTER_IP ? {
        ip: process.env.NETWORK_PRINTER_IP,
        port: process.env.NETWORK_PRINTER_PORT || 9100
      } : null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};