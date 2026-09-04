use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExcEntry {
    pub name: String,
    pub api: String,
    pub api_latest_field: String,
    pub download_base: String,
}

#[derive(Debug, Deserialize)]
struct ExcConfig {
    exc: Vec<ExcEntry>,
}

fn base_dir(app: &AppHandle) -> PathBuf {
    app.path().app_data_dir().expect("app_data_dir failed")
}

fn exc_json_path(app: &AppHandle) -> PathBuf {
    base_dir(app).join("exc.json")
}

fn exc_folder(app: &AppHandle, name: &str) -> PathBuf {
    base_dir(app).join("exc").join(name)
}

#[tauri::command]
fn get_exc_list(app: AppHandle) -> Result<Vec<ExcEntry>, String> {
    let path = exc_json_path(&app);

    if !path.exists() {
        let dir = base_dir(&app);
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

        let default_config = serde_json::json!({
            "exc": [{
                "name": "Delta",
                "api": "https://delta.filenetwork.vip/get_files.php",
                "api_latest_field": "latest_apk",
                "download_base": "https://delta.filenetwork.vip/file/"
            }]
        });
        fs::write(&path, serde_json::to_string_pretty(&default_config).unwrap())
            .map_err(|e| e.to_string())?;
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let config: ExcConfig = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    for entry in &config.exc {
        let _ = fs::create_dir_all(exc_folder(&app, &entry.name));
    }

    Ok(config.exc)
}

#[tauri::command]
async fn fetch_latest_version(api_url: String, field: String) -> Result<Option<String>, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    let response = client
        .get(&api_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;

    if let Some(files) = json.get(&field).and_then(|v| v.as_array()) {
        if let Some(first) = files.first() {
            if let Some(name) = first.get("name").and_then(|v| v.as_str()) {
                return Ok(Some(name.to_string()));
            }
        }
    }
    Ok(None)
}

#[tauri::command]
fn get_installed_apk(app: AppHandle, exc_name: String) -> Option<String> {
    let dir = exc_folder(&app, &exc_name);

    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
        return None;
    }

    let mut apks: Vec<_> = fs::read_dir(&dir)
        .ok()?
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .extension()
                .map(|x| x.to_ascii_lowercase() == "apk")
                .unwrap_or(false)
        })
        .collect();

    apks.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).ok());
    apks.last().map(|e| e.file_name().to_string_lossy().to_string())
}

#[tauri::command]
fn open_download_in_browser(url: String) -> Result<(), String> {
    std::process::Command::new("cmd")
        .args(["/c", "start", "", &url])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn check_and_move_download(app: AppHandle, exc_name: String, filename: String) -> bool {
    let downloads = dirs::download_dir()
        .unwrap_or_else(|| dirs::home_dir().unwrap_or_default().join("Downloads"));

    let source = downloads.join(&filename);

    if !source.exists() {
        return false;
    }

    // Still downloading if temp file exists
    if downloads.join(format!("{}.crdownload", &filename)).exists()
        || downloads.join(format!("{}.part", &filename)).exists()
    {
        return false;
    }

    let dest_dir = exc_folder(&app, &exc_name);
    let _ = fs::create_dir_all(&dest_dir);
    let dest = dest_dir.join(&filename);

    if fs::rename(&source, &dest).is_ok() {
        return true;
    }
    if fs::copy(&source, &dest).is_ok() {
        let _ = fs::remove_file(&source);
        return true;
    }
    false
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_exc_list,
            fetch_latest_version,
            get_installed_apk,
            open_download_in_browser,
            check_and_move_download,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
