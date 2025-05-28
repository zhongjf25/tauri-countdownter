// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[cfg(not(any(target_os = "android", target_os = "ios")))]
mod tray;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use tauri_plugin_autostart::MacosLauncher;
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use tray::setup_tray;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let mut app_builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());

    #[cfg(any(target_os = "android", target_os = "ios"))]
    let app_builder = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init());

    // Only add autostart plugin on desktop platforms
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let app_builder = {
        app_builder.plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
    };

    app_builder
        .setup(|app| {
            // setup the tray icon only on desktop platforms
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
            {
                setup_tray(app).unwrap();
            }
            #[cfg(any(target_os = "android", target_os = "ios"))]
            {
                let _ = app; // Suppress unused variable warning on mobile
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
