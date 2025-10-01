// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_sales_data,
            commands::get_sale_items,
            commands::print_receipt_direct
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}