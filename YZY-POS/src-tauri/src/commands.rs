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

#[command]
pub async fn print_receipt(html: String, item_count: u32) -> Result<String, String> {
    println!("Printing receipt with {} items", item_count);
    
    // Create temporary HTML file with timestamp
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let temp_file = format!("receipt_{}.html", timestamp);
    
    // Write HTML to temp file
    std::fs::write(&temp_file, html).map_err(|e| e.to_string())?;
    
    // Use system default browser to print (no limitations)
    let output = if cfg!(target_os = "windows") {
        // Windows: Use Edge to print
        Command::new("cmd")
            .args(["/C", "start", "/wait", "msedge", "--print-to-pdf", &temp_file])
            .output()
    } else if cfg!(target_os = "macos") {
        // macOS: Use Safari
        Command::new("open")
            .args(["-a", "Safari", &temp_file])
            .output()
    } else {
        // Linux: Use default browser
        Command::new("xdg-open")
            .args([&temp_file])
            .output()
    };
    
    match output {
        Ok(_) => {
            // Clean up temp file after a delay
            tokio::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(10)).await;
                let _ = std::fs::remove_file(&temp_file);
            });
            Ok(format!("Receipt printed successfully! Items: {}", item_count))
        }
        Err(e) => Err(format!("Print failed: {}", e))
    }
}
