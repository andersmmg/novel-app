use hunspell_rs::Hunspell;
use std::sync::Mutex;
use tauri::{Manager, State};

// Wrapper to make Hunspell Send (unsafe but necessary for Tauri state if we lock it properly)
struct SafeHunspell(Hunspell);

unsafe impl Send for SafeHunspell {}
unsafe impl Sync for SafeHunspell {}

struct SpellCheckState {
    hunspell: Mutex<Option<SafeHunspell>>,
    custom_words: Mutex<Vec<String>>,
    current_language: Mutex<Option<String>>,
}

struct StartupFile {
    path: Mutex<Option<String>>,
    content: Mutex<Option<String>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_available_languages() -> Result<Vec<String>, String> {
    // TODO: Return available languages based on dictionary files
    Ok(vec!["en_US".to_string(), "tok".to_string()])
}

#[tauri::command]
fn init_spell_check(
    app: tauri::AppHandle,
    state: State<'_, SpellCheckState>,
    aff_path: String,
    dic_path: String,
    custom_words: Vec<String>,
) -> Result<(), String> {
    println!("Init Spell Check: aff={}, dic={}", aff_path, dic_path);

    use tauri::path::BaseDirectory;

    let dict_file_path = app
        .path()
        .resolve("custom_dictionary.txt", BaseDirectory::AppConfig)
        .map_err(|e| format!("Failed to resolve config path: {}", e))?;

    if let Some(parent) = dict_file_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let mut persistent_words: Vec<String> = Vec::new();
    if dict_file_path.exists() {
        let content = std::fs::read_to_string(&dict_file_path)
            .map_err(|e| format!("Failed to read custom dictionary: {}", e))?;
        persistent_words = content
            .lines()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
    }

    let mut merged_words = persistent_words;
    let mut changed = false;
    for word in custom_words {
        if !merged_words.contains(&word) {
            merged_words.push(word);
            changed = true;
        }
    }

    if changed || !dict_file_path.exists() {
        let content = merged_words.join("\n");
        std::fs::write(&dict_file_path, content)
            .map_err(|e| format!("Failed to write custom dictionary: {}", e))?;
    }

    let language = aff_path
        .split('/')
        .last()
        .and_then(|f| f.split('.').next())
        .unwrap_or("en_US");

    let try_paths = vec![
        (aff_path.clone(), dic_path.clone()),
        // Fallback for dev mode
        (
            format!("../public/dictionaries/{}.aff", language),
            format!("../public/dictionaries/{}.dic", language),
        ),
        (
            format!("public/dictionaries/{}.aff", language),
            format!("public/dictionaries/{}.dic", language),
        ),
        // Fallback relative to executable in target/debug
        (
            format!("../../../public/dictionaries/{}.aff", language),
            format!("../../../public/dictionaries/{}.dic", language),
        ),
        // Fallback for src-tauri/dictionaries
        (
            format!("dictionaries/{}.aff", language),
            format!("dictionaries/{}.dic", language),
        ),
    ];

    let mut hunspell = None;

    for (aff, dic) in try_paths {
        println!("Trying dictionary paths: aff={}, dic={}", aff, dic);
        if std::path::Path::new(&aff).exists() && std::path::Path::new(&dic).exists() {
            hunspell = Some(Hunspell::new(&aff, &dic));
            println!("Successfully loaded dictionaries from: {}", aff);
            break;
        }
    }

    let hunspell = hunspell.ok_or("Failed to find dictionary files in any expected location")?;

    let mut state_hunspell = state.hunspell.lock().map_err(|_| "Failed to lock mutex")?;
    *state_hunspell = Some(SafeHunspell(hunspell));

    let mut state_custom = state
        .custom_words
        .lock()
        .map_err(|_| "Failed to lock mutex")?;
    *state_custom = merged_words;

    let mut state_lang = state
        .current_language
        .lock()
        .map_err(|_| "Failed to lock mutex")?;
    *state_lang = Some(language.to_string());

    println!(
        "Spell Check Initialized for language '{}' with {} custom words",
        language,
        state_custom.len()
    );

    Ok(())
}

#[tauri::command]
fn add_custom_word(
    app: tauri::AppHandle,
    state: State<'_, SpellCheckState>,
    word: String,
) -> Result<(), String> {
    let mut custom = state
        .custom_words
        .lock()
        .map_err(|_| "Failed to lock mutex")?;

    if !custom.contains(&word) {
        custom.push(word.clone());

        use std::io::Write;
        use tauri::path::BaseDirectory;

        let dict_file_path = app
            .path()
            .resolve("custom_dictionary.txt", BaseDirectory::AppConfig)
            .map_err(|e| format!("Failed to resolve config path: {}", e))?;

        let mut file = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(dict_file_path)
            .map_err(|e| format!("Failed to open dictionary file: {}", e))?;

        writeln!(file, "{}", word).map_err(|e| format!("Failed to append to dictionary: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn exit_app() {
    std::process::exit(0);
}

#[derive(serde::Serialize)]
struct ErrorRange {
    word: String,
    index: usize,
    length: usize,
}

#[tauri::command]
fn check_text(state: State<'_, SpellCheckState>, text: String) -> Result<Vec<ErrorRange>, String> {
    let hunspell_guard = state.hunspell.lock().map_err(|_| "Failed to lock mutex")?;
    let safe_hunspell = hunspell_guard
        .as_ref()
        .ok_or("Spell checker not initialized")?;
    let hunspell = &safe_hunspell.0;

    let custom_guard = state
        .custom_words
        .lock()
        .map_err(|_| "Failed to lock mutex")?;

    let mut errors = Vec::new();

    let re = regex::Regex::new(r"\b\w+(?:['’]\w+)?\b").map_err(|e| e.to_string())?;

    let mut last_byte_pos = 0;
    let mut last_utf16_pos = 0;

    for cap in re.captures_iter(&text) {
        if let Some(m) = cap.get(0) {
            let word = m.as_str();
            let start_byte = m.start();

            // Calculate UTF-16 offset
            // Advance from last_byte_pos to start_byte
            let prefix = &text[last_byte_pos..start_byte];
            let prefix_utf16_len = prefix.encode_utf16().count();
            let start_utf16 = last_utf16_pos + prefix_utf16_len;

            last_byte_pos = start_byte;
            last_utf16_pos = start_utf16;

            if custom_guard.contains(&word.to_string()) {
                continue;
            }

            let normalized = word.replace("’", "'");

            if !hunspell.check(word) && !hunspell.check(&normalized) {
                let word_utf16_len = word.encode_utf16().count();
                errors.push(ErrorRange {
                    word: word.to_string(),
                    index: start_utf16,
                    length: word_utf16_len,
                });
            }
        }
    }

    Ok(errors)
}

#[tauri::command]
fn get_suggestions(state: State<'_, SpellCheckState>, word: String) -> Result<Vec<String>, String> {
    let hunspell_guard = state.hunspell.lock().map_err(|_| "Failed to lock mutex")?;
    let safe_hunspell = hunspell_guard
        .as_ref()
        .ok_or("Spell checker not initialized")?;
    let hunspell = &safe_hunspell.0;

    let suggestions = hunspell.suggest(&word);
    println!("Suggestions for '{}': {:?}", word, suggestions);
    Ok(suggestions)
}

#[tauri::command]
fn get_startup_file(state: State<'_, StartupFile>) -> Result<Option<(String, String)>, String> {
    let path_guard = state.path.lock().map_err(|_| "Failed to lock path mutex")?;
    let content_guard = state
        .content
        .lock()
        .map_err(|_| "Failed to lock content mutex")?;

    if let (Some(p), Some(c)) = (path_guard.as_ref(), content_guard.as_ref()) {
        Ok(Some((p.clone(), c.clone())))
    } else {
        Ok(None)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let format = time::macros::format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .format(move |out, message, record| {
                    out.finish(format_args!(
                        "[{}][{}] {}",
                        tauri_plugin_log::TimezoneStrategy::UseLocal
                            .get_now()
                            .format(&format)
                            .unwrap(),
                        record.level(),
                        message
                    ))
                })
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(SpellCheckState {
            hunspell: Mutex::new(None),
            custom_words: Mutex::new(Vec::new()),
            current_language: Mutex::new(None),
        })
        .setup(|app| {
            let args: Vec<String> = std::env::args().collect();
            let mut start_path = None;
            let mut start_content = None;

            if args.len() > 1 {
                for arg in &args[1..] {
                    if !arg.starts_with("-") {
                        if let Ok(content) = std::fs::read_to_string(arg) {
                            start_path = Some(arg.clone());
                            start_content = Some(content);
                            break;
                        }
                    }
                }
            }

            app.manage(StartupFile {
                path: Mutex::new(start_path),
                content: Mutex::new(start_content),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            read_file,
            write_file,
            get_available_languages,
            init_spell_check,
            check_text,
            get_suggestions,
            check_text,
            get_suggestions,
            add_custom_word,
            get_startup_file,
            exit_app
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
