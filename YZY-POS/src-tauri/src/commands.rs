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

/// Example: GET sales by date
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

    if let Some(f) = from {
        filters.push(format!("date=gte.{}", f));
    }
    if let Some(t) = to {
        filters.push(format!("date=lte.{}", t));
    }
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

// Single authoritative direct ESC/POS printing command (Windows/macOS/Linux)
#[command]
pub async fn print_receipt_direct(
    receipt_data: String,
    item_count: u32,
    printer_name: Option<String>,   // Windows only; ignored on macOS/Linux
) -> Result<String, String> {
    println!("Direct printing receipt with {} items", item_count);

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

    println!("Attempting to print file: {}", full_path_str);

    let result = if cfg!(target_os = "windows") {
        if let Some(name) = printer_name.clone() {
            let ps = format!(
              "Get-Content -Path '{}' -Encoding Byte -ReadCount 0 | Out-Printer -Name '{}'",
              full_path_str.replace('\'', "''"),
              name.replace('\'', "''")
            );
            Command::new("powershell")
                .args(["-NoProfile", "-Command", &ps])
                .output()
        } else {
            Command::new("cmd")
                .args(["/C", "copy", "/B", &full_path_str, "PRN"])
                .output()
        }
    } else if cfg!(target_os = "macos") {
        Command::new("lpr").arg(&full_path_str).output()
    } else {
        Command::new("lp").arg(&full_path_str).output()
    };

    match result {
        Ok(output) => {
            println!("Print command output: {:?}", output);
            if output.status.success() {
                cleanup_temp_file(&temp_file);
                Ok(format!(
                    "Receipt sent to printer successfully! Items: {}",
                    item_count
                ))
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                let stdout = String::from_utf8_lossy(&output.stdout);
                println!("Print command failed - stderr: {}, stdout: {}", stderr, stdout);
                Err(format!("Print command failed: {} (stdout: {})", stderr, stdout))
            }
        }
        Err(e) => {
            println!("Print command error: {}", e);
            Err(format!("Print command failed: {}", e))
        }
    }
}

fn cleanup_temp_file(temp_file: &str) {
    let file_path = temp_file.to_string();
    tokio::spawn(async move {
        tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
        let _ = std::fs::remove_file(&file_path);
    });
}