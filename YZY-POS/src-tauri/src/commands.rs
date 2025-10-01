// YZY-POS/src-tauri/src/commands.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;
use reqwest::Client;
use std::env;
use tauri::command;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct Sale {
    pub id: i64,
    pub date: String,
    pub amount: f64,
    pub customer_id: Option<i64>,
    pub metadata: Option<Value>,
}

#[tauri::command]
pub async fn get_sales_data(date: String) -> Result<Vec<Sale>, String> {
    let supabase_url =
        env::var("SUPABASE_URL").map_err(|_| "Missing SUPABASE_URL".to_string())?;
    let supabase_key =
        env::var("SUPABASE_KEY").map_err(|_| "Missing SUPABASE_KEY".to_string())?;

    let client = Client::new();
    let url = format!(
        "{}/rest/v1/sales?select=*&date=eq.{}",
        supabase_url.trim_end_matches('/'),
        date
    );

    let resp = client
        .get(&url)
        .header("apikey", &supabase_key)
        .header("Authorization", format!("Bearer {}", supabase_key))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("Supabase error: {} - {}", status, text));
    }

    let rows = resp.json::<Vec<Sale>>().await.map_err(|e| e.to_string())?;
    Ok(rows)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AggregatedSaleItem {
    pub category: String,
    pub quantity: i64,
}

#[tauri::command]
pub async fn get_sale_items(from: Option<String>, to: Option<String>) -> Result<Vec<AggregatedSaleItem>, String> {
    let supabase_url = std::env::var("SUPABASE_URL").map_err(|_| "Missing SUPABASE_URL".to_string())?;
    let supabase_key = std::env::var("SUPABASE_KEY").map_err(|_| "Missing SUPABASE_KEY".to_string())?;
    let client = reqwest::Client::new();

    let mut url = format!("{}/rest/v1/sales_items?select=category,quantity", supabase_url.trim_end_matches('/'));
    let mut filters = vec![];
    if let Some(f) = from { filters.push(format!("date=gte.{}", f)); }
    if let Some(t) = to { filters.push(format!("date=lte.{}", t)); }
    if !filters.is_empty() {
        url.push('&');
        url.push_str(&filters.join("&"));
    }

    let resp = client
        .get(&url)
        .header("apikey", &supabase_key)
        .header("Authorization", format!("Bearer {}", supabase_key))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("Supabase error: {}", resp.status()));
    }

    let rows = resp.json::<Vec<AggregatedSaleItem>>().await.map_err(|e| e.to_string())?;
    Ok(rows)
}

// Kept for compatibility; frontend now posts to backend /print/receipt.
#[command]
pub async fn print_receipt_direct(
    receipt_data: String,
    item_count: u32,
    printer_name: Option<String>,
) -> Result<String, String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let temp_file = format!("receipt_{}.txt", timestamp);

    std::fs::write(&temp_file, receipt_data)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;
    let full_path = current_dir.join(&temp_file);
    let full_path_str = full_path.to_string_lossy().to_string();

    let result = if cfg!(target_os = "windows") {
        // Simplified PowerShell command - always use default printer
        let printer_expr = if let Some(name) = printer_name {
            format!("'{}'", name.replace('\'', "''"))
        } else {
            // Use default printer directly
            String::from("(Get-CimInstance Win32_Printer | Where-Object {$_.Default -eq $true}).Name")
        };

        let ps = format!(
            r#"$ErrorActionPreference = 'Stop'
$path = '{}'
$bytes = [System.IO.File]::ReadAllBytes($path)
Add-Type -Language CSharp -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class RawPrinterHelper {{
  [StructLayout(LayoutKind.Sequential)]
  public class DOCINFOA {{
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDatatype;
  }}
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
}}
public class RawPrint {{
  public static void SendBytes(string printerName, byte[] bytes) {{
    IntPtr h;
    if (!RawPrinterHelper.OpenPrinter(printerName, out h, IntPtr.Zero)) throw new Exception("OpenPrinter failed");
    var di = new RawPrinterHelper.DOCINFOA() {{ pDocName = "ESC/POS", pDatatype = "RAW" }};
    if (!RawPrinterHelper.StartDocPrinter(h, 1, di)) throw new Exception("StartDocPrinter failed");
    if (!RawPrinterHelper.StartPagePrinter(h)) throw new Exception("StartPagePrinter failed");
    int written;
    if (!RawPrinterHelper.WritePrinter(h, bytes, bytes.Length, out written)) throw new Exception("WritePrinter failed");
    RawPrinterHelper.EndPagePrinter(h);
    RawPrinterHelper.EndDocPrinter(h);
    RawPrinterHelper.ClosePrinter(h);
  }}
}}
"@
$target = {}
if (-not $target) {{ throw 'No target printer'; }}
[RawPrint]::SendBytes($target, $bytes)"#,
            full_path_str.replace('\'', "''"),
            printer_expr
        );

        Command::new("powershell")
            .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-Command", &ps])
            .output()
    } else if cfg!(target_os = "macos") {
        Command::new("lpr").arg(&full_path_str).output()
    } else {
        Command::new("lp").arg(&full_path_str).output()
    };

    match result {
        Ok(output) => {
            if output.status.success() {
                let _ = std::fs::remove_file(&temp_file);
                Ok(format!("Receipt sent to default printer. Items: {}", item_count))
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                let stdout = String::from_utf8_lossy(&output.stdout);
                Err(format!("Print failed: {} (stdout: {})", stderr, stdout))
            }
        }
        Err(e) => Err(format!("Print command failed: {}", e))
    }
}