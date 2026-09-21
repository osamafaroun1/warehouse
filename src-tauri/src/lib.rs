use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use std::sync::{Arc, Mutex};
use std::path::{Path, PathBuf};

#[cfg(windows)]
fn normalize_for_node(path: &Path) -> PathBuf {
    let raw = path.to_string_lossy();
    if let Some(stripped) = raw.strip_prefix(r"\\?\UNC\") {
        return PathBuf::from(format!(r"\\{}", stripped));
    }
    if let Some(stripped) = raw.strip_prefix(r"\\?\") {
        return PathBuf::from(stripped);
    }
    path.to_path_buf()
}

#[cfg(not(windows))]
fn normalize_for_node(path: &Path) -> PathBuf {
    path.to_path_buf()
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            // Dev mode: read straight from the source tree.
            // Production: read from the bundled resource directory.
            let dist_dir: PathBuf = if cfg!(debug_assertions) {
                PathBuf::from(env!("CARGO_MANIFEST_DIR"))
                    .join("..")
                    .join("server")
                    .join("dist")
            } else {
                app.path()
                    .resource_dir()
                    .expect("kunde inte hitta resource dir")
                    .join("server")
                    .join("dist")
            };

            let server_entry = dist_dir.join("index.cjs");
            let node_dist_dir = normalize_for_node(&dist_dir);
            let node_server_entry = normalize_for_node(&server_entry);

            println!("🔍 Server entry: {:?} (exists: {})", node_server_entry, node_server_entry.exists());
            println!("🔍 Working dir for node: {:?} (exists: {})", node_dist_dir, node_dist_dir.exists());

            let app_dir = app
                .path()
                .app_data_dir()
                .expect("kunde inte hitta app data dir");
            std::fs::create_dir_all(&app_dir).expect("kunde inte skapa app data dir");
            let attachments_dir = app_dir.join("attachments");
            let node_env = if cfg!(debug_assertions) { "development" } else { "production" };

            let command = app
                .shell()
                .command("node")
                .args([node_server_entry.to_string_lossy().to_string()])
                .current_dir(&node_dist_dir)
                .env("NODE_ENV", node_env)
                .env("ATTACHMENTS_DIR", attachments_dir.to_string_lossy().to_string());

            let (mut rx, child) = command
                .spawn()
                .expect("kunde inte starta hono-server (kontrollera att Node.js är installerat)");

            let child_handle = Arc::new(Mutex::new(Some(child)));

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("[hono] {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Stderr(line) => {
                            eprintln!("[hono-error] {}", String::from_utf8_lossy(&line));
                        }
                        _ => {}
                    }
                }
            });

            if let Some(window) = app.get_webview_window("main") {
                let child_for_close = child_handle.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { .. } = event {
                        if let Some(c) = child_for_close.lock().unwrap().take() {
                            let _ = c.kill();
                            println!("[hono] server killed on window close");
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}