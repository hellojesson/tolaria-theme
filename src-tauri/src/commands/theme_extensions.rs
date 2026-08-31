use serde_json::Value;
use std::{fs, path::Path};

const MAX_THEME_FILE_BYTES: u64 = 128 * 1024;

fn read_theme_extension_file_content(path: &Path) -> Result<String, String> {
    let has_json_extension = path
        .extension()
        .and_then(|value| value.to_str())
        .is_some_and(|value| value.eq_ignore_ascii_case("json"));
    if !has_json_extension {
        return Err("Theme configuration files must use the .json extension.".to_string());
    }

    let metadata = fs::symlink_metadata(path).map_err(|_| "Theme file could not be opened.".to_string())?;
    if metadata.file_type().is_symlink() || !metadata.is_file() {
        return Err("Theme path must point to a regular file.".to_string());
    }
    if metadata.len() > MAX_THEME_FILE_BYTES {
        return Err("Theme file is larger than 128 KB.".to_string());
    }

    let content = fs::read_to_string(path).map_err(|_| "Theme file must contain UTF-8 text.".to_string())?;
    let json: Value = serde_json::from_str(&content).map_err(|_| "Theme file is not valid JSON.".to_string())?;
    let has_supported_shape = json.get("schemaVersion").and_then(Value::as_u64) == Some(1)
        && json.pointer("/variants/light").is_some_and(Value::is_object)
        && json.pointer("/variants/dark").is_some_and(Value::is_object);
    if !has_supported_shape {
        return Err("Theme file must use schema version 1 with light and dark variants.".to_string());
    }

    Ok(content)
}

#[tauri::command]
pub fn read_theme_extension_file(path: String) -> Result<String, String> {
    read_theme_extension_file_content(Path::new(&path))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_a_small_versioned_json_theme() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("ocean.tolaria-theme.json");
        let content = r#"{"schemaVersion":1,"variants":{"light":{},"dark":{}}}"#;
        fs::write(&path, content).unwrap();

        assert_eq!(read_theme_extension_file_content(&path).unwrap(), content);
    }

    #[test]
    fn rejects_non_json_and_incomplete_theme_files() {
        let directory = tempfile::tempdir().unwrap();
        let css_path = directory.path().join("theme.css");
        fs::write(&css_path, "body {}").unwrap();
        assert!(read_theme_extension_file_content(&css_path).unwrap_err().contains(".json"));

        let json_path = directory.path().join("theme.json");
        fs::write(&json_path, r#"{"schemaVersion":1,"variants":{"light":{}}}"#).unwrap();
        assert!(read_theme_extension_file_content(&json_path).unwrap_err().contains("light and dark"));
    }

    #[test]
    fn rejects_theme_files_larger_than_the_limit() {
        let directory = tempfile::tempdir().unwrap();
        let path = directory.path().join("theme.json");
        fs::write(&path, vec![b' '; MAX_THEME_FILE_BYTES as usize + 1]).unwrap();

        assert!(read_theme_extension_file_content(&path).unwrap_err().contains("128 KB"));
    }
}
