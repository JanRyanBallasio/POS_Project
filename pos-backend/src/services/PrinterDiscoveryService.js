// pos-backend/src/services/PrinterDiscoveryService.js
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class PrinterDiscoveryService {
  static async getAvailablePrinters() {
    try {
      console.log('[PRINTER DISCOVERY] Scanning for available printers...');
      
      if (process.platform === 'win32') {
        // Windows printer discovery
        const { stdout } = await execAsync('wmic printer get name,status /format:csv');
        const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Node') && !line.includes('Name'));
        
        const printers = lines.map(line => {
          const parts = line.split(',').map(part => part.trim());
          return {
            name: parts[1] || 'Unknown',
            status: parts[2] || 'Unknown',
            isDefault: false
          };
        }).filter(printer => printer.name && printer.name !== 'Unknown');

        console.log(`[PRINTER DISCOVERY] Found ${printers.length} Windows printers`);
        return printers;
        
      } else if (process.platform === 'darwin') {
        // macOS printer discovery
        const { stdout } = await execAsync('lpstat -p');
        const printers = stdout.split('\n')
          .filter(line => line.startsWith('printer'))
          .map(line => {
            const parts = line.split(' ');
            return {
              name: parts[1],
              status: line.includes('disabled') ? 'Disabled' : 'Available',
              isDefault: false
            };
          });

        console.log(`[PRINTER DISCOVERY] Found ${printers.length} macOS printers`);
        return printers;
        
      } else {
        // Linux printer discovery
        const { stdout } = await execAsync('lpstat -p');
        const printers = stdout.split('\n')
          .filter(line => line.startsWith('printer'))
          .map(line => {
            const parts = line.split(' ');
            return {
              name: parts[1],
              status: line.includes('disabled') ? 'Disabled' : 'Available',
              isDefault: false
            };
          });

        console.log(`[PRINTER DISCOVERY] Found ${printers.length} Linux printers`);
        return printers;
      }
    } catch (error) {
      console.error('[PRINTER DISCOVERY] Error discovering printers:', error.message);
      return [{ 
        name: 'Default Printer', 
        status: 'Available',
        isDefault: true 
      }];
    }
  }

  static async getDefaultPrinter() {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync('wmic printer where default=true get name /format:csv');
        const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Node') && !line.includes('Name'));
        const defaultName = lines[0]?.split(',')[1]?.trim();
        return defaultName || 'Default';
      } else {
        const { stdout } = await execAsync('lpstat -d');
        const match = stdout.match(/system default destination: (.+)/);
        return match ? match[1].trim() : 'Default';
      }
    } catch (error) {
      console.error('[PRINTER DISCOVERY] Error getting default printer:', error.message);
      return 'Default';
    }
  }

  static async testPrinterConnection(printerName) {
    try {
      if (process.platform === 'win32') {
        const { stdout } = await execAsync(`wmic printer where name="${printerName}" get status /format:csv`);
        return stdout.includes('OK') || stdout.includes('Idle');
      } else {
        const { stdout } = await execAsync(`lpstat -p "${printerName}"`);
        return !stdout.includes('disabled');
      }
    } catch (error) {
      console.error(`[PRINTER DISCOVERY] Error testing printer ${printerName}:`, error.message);
      return false;
    }
  }
}

module.exports = PrinterDiscoveryService;