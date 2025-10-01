use serde::{Deserialize, Serialize};

mod commands;

pub fn run() {
    // Load .env so SUPABASE_URL / SUPABASE_KEY are available to commands
    dotenvy::dotenv().ok();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::get_sales_data])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}