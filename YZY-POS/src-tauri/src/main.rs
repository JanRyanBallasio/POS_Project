#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|_app| {
            // Load env
            let _ = dotenvy::dotenv();
            
            println!("SUPABASE_URL={:?}", 
                std::env::var("SUPABASE_URL").unwrap_or("NOT SET".to_string())
            );

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_sales_data,
            commands::print_receipt
        ])
        .on_window_event(|window, event| {
            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    window.hide().unwrap();
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}