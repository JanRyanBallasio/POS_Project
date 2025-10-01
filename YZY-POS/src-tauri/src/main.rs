// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::thread;
use std::time::Duration;

mod commands;

fn main() {
    // Start backend server in background
    thread::spawn(|| {
        let backend_path = std::env::current_dir()
            .unwrap()
            .parent()
            .unwrap()
            .join("pos-backend");
        
        if backend_path.exists() {
            let _ = Command::new("node")
                .arg("server.js")
                .current_dir(&backend_path)
                .spawn();
        }
    });
    
    // Give backend time to start
    thread::sleep(Duration::from_secs(2));

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_sales_data,
            commands::get_sale_items,
            commands::print_receipt_direct
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}