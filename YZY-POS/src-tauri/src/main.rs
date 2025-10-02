// YZY-POS/src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::Command;
use std::thread;
use std::time::Duration;
use std::path::PathBuf;

mod commands;

fn start_backend_server() {
    thread::spawn(|| {
        println!("[TAURI] Starting backend server...");
        
        // Get the backend path relative to the Tauri app
        let current_dir = std::env::current_dir().unwrap();
        let backend_path: PathBuf;
        
        // Try different possible backend locations
        if current_dir.join("../pos-backend").exists() {
            backend_path = current_dir.join("../pos-backend");
        } else if current_dir.join("../../pos-backend").exists() {
            backend_path = current_dir.join("../../pos-backend");
        } else if current_dir.join("pos-backend").exists() {
            backend_path = current_dir.join("pos-backend");
        } else {
            eprintln!("[TAURI] Backend directory not found!");
            return;
        }
        
        println!("[TAURI] Backend path: {:?}", backend_path);
        
        if !backend_path.exists() {
            eprintln!("[TAURI] Backend path does not exist: {:?}", backend_path);
            return;
        }

        // Check if server.js exists
        let server_file = backend_path.join("server.js");
        if !server_file.exists() {
            eprintln!("[TAURI] server.js not found at: {:?}", server_file);
            return;
        }

        // Start the backend server
        match Command::new("node")
            .arg("server.js")
            .current_dir(&backend_path)
            .spawn() {
            Ok(mut child) => {
                println!("[TAURI] Backend server started successfully with PID: {}", 
                    child.id());
                
                // Keep the process running
                let _ = child.wait();
            },
            Err(e) => {
                eprintln!("[TAURI] Failed to start backend server: {}", e);
                eprintln!("[TAURI] Make sure Node.js is installed and in PATH");
            }
        }
    });
}

fn main() {
    // Load environment variables
    dotenvy::dotenv().ok();
    
    println!("[TAURI] YZY POS starting...");
    
    // Start backend server
    start_backend_server();
    
    // Give backend time to start
    println!("[TAURI] Waiting for backend to start...");
    thread::sleep(Duration::from_secs(3));
    
    // Test backend connection
    thread::spawn(|| {
        thread::sleep(Duration::from_secs(5));
        println!("[TAURI] Testing backend connection...");
        
        match std::process::Command::new("curl")
            .arg("-s")
            .arg("http://localhost:5000/api/print/enhanced/test")
            .output() {
            Ok(output) => {
                if output.status.success() {
                    println!("[TAURI] Backend connection test: SUCCESS");
                } else {
                    println!("[TAURI] Backend connection test: FAILED");
                }
            },
            Err(_) => {
                println!("[TAURI] Backend connection test: Could not run curl");
            }
        }
    });

    // Start Tauri application
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_sales_data,
            commands::get_sale_items,
            commands::print_receipt_direct
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}