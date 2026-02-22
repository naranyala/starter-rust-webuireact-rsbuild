use lazy_static::lazy_static;
use tracing::{info, error};
use std::sync::{Arc, Mutex};
use webui_rs::webui;
use crate::infrastructure::event_bus::{EventBus, AppEventType};
use tokio;

// Consolidated handlers module combining all previous handler modules
// Combines: ui_handlers, counter_handlers, db_handlers, sysinfo_handlers, utils_handlers, advanced_handlers, enhanced_handlers

// Shared database reference using lazy static
lazy_static! {
    pub static ref DATABASE: Arc<Mutex<Option<Arc<crate::model::core::Database>>>> =
        Arc::new(Mutex::new(None));
}

pub fn init_database(db: Arc<crate::model::core::Database>) {
    let mut db_guard = DATABASE.lock().unwrap();
    *db_guard = Some(db);
}

pub fn setup_ui_handlers(window: &mut webui::Window) {
    // Setup basic UI handlers
    window.bind("increment_counter", |_event| {
        info!("Increment counter event received");
        
        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            let bus_clone = bus.clone();
            tokio::spawn(async move {
                if let Err(e) = bus_clone.emit_simple(
                    &AppEventType::CounterIncremented.to_string(),
                    serde_json::json!({
                        "value": 1
                    }),
                ).await {
                    error!("Failed to emit counter incremented event: {}", e);
                }
            });
        }
        
        // Increment counter logic would go here
        webui::exit(); // Exit for demo purposes
    });

    window.bind("reset_counter", |_event| {
        info!("Reset counter event received");
        
        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            let bus_clone = bus.clone();
            tokio::spawn(async move {
                if let Err(e) = bus_clone.emit_simple(
                    "counter.reset",
                    serde_json::json!({}),
                ).await {
                    error!("Failed to emit counter reset event: {}", e);
                }
            });
        }
    });

    info!("UI handlers registered");
}

pub fn setup_counter_handlers(window: &mut webui::Window) {
    // Counter-specific handlers
    window.bind("get_counter_value", |_event| {
        info!("Get counter value event received");
        
        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                "counter.value.request",
                serde_json::json!({
                    "request_id": uuid::Uuid::new_v4().to_string()
                }),
            )) {
                error!("Failed to emit counter value request event: {}", e);
            }
        }
    });

    info!("Counter handlers registered");
}

pub fn setup_db_handlers(window: &mut webui::Window) {
    // First, set up global JavaScript functions that the frontend can call
    let get_users_js = r#"
        window.getUsers = function() {
            webui.call('get_users');
        };
        window.getDbStats = function() {
            webui.call('get_db_stats');
        };
        console.log('Database functions exposed to window');
    "#;
    window.run_js(get_users_js);
    
    // Database handlers - these are called via webui.call() from frontend
    window.bind("get_users", |_event| {
        info!("Get users event received");
        
        // Get database instance
        if let Ok(db_guard) = DATABASE.lock() {
            if let Some(ref db) = *db_guard {
                match db.get_all_users() {
                    Ok(users) => {
                        // Send response back to frontend via JavaScript
                        let response = serde_json::json!({
                            "success": true,
                            "data": users
                        });
                        let js_code = format!(
                            "window.dispatchEvent(new CustomEvent('db_response', {{ detail: {} }}))",
                            response
                        );
                        _event.get_window().run_js(&js_code);
                        
                        // Emit event through event bus
                        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
                            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                                &AppEventType::DatabaseOperation.to_string(),
                                serde_json::json!({
                                    "operation": "get_users_success",
                                    "count": users.len()
                                }),
                            )) {
                                error!("Failed to emit database operation event: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to get users: {}", e);
                        
                        let response = serde_json::json!({
                            "success": false,
                            "error": e.to_string()
                        });
                        let js_code = format!(
                            "window.dispatchEvent(new CustomEvent('db_response', {{ detail: {} }}))",
                            response
                        );
                        _event.get_window().run_js(&js_code);
                        
                        // Emit error event through event bus
                        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
                        if let Err(err) = futures::executor::block_on(bus.emit_simple(
                            &AppEventType::DatabaseOperation.to_string(),
                            serde_json::json!({
                                "operation": "get_users_error",
                                "error": e.to_string()
                            }),
                        )) {
                                error!("Failed to emit database error event: {}", err);
                            }
                        }
                    }
                }
            } else {
                error!("Database not initialized");
                
                let response = serde_json::json!({
                    "success": false,
                    "error": "Database not initialized"
                });
                let js_code = format!(
                    "window.dispatchEvent(new CustomEvent('db_response', {{ detail: {} }}))",
                    response
                );
                _event.get_window().run_js(&js_code);
            }
        } else {
            error!("Failed to acquire database lock");

            let response = serde_json::json!({
                "success": false,
                "error": "Failed to acquire database lock"
            });
            let js_code = format!(
                "window.dispatchEvent(new CustomEvent('db_response', {{ detail: {} }}))",
                response
            );
            _event.get_window().run_js(&js_code);
        }
    });

    window.bind("get_db_stats", |_event| {
        info!("Get DB stats event received");
        
        // Get database instance
        if let Ok(db_guard) = DATABASE.lock() {
            if let Some(ref db) = *db_guard {
                match db.get_db_stats() {
                    Ok(stats) => {
                        let response = serde_json::json!({
                            "success": true,
                            "stats": stats
                        });
                        let js_code = format!(
                            "window.dispatchEvent(new CustomEvent('stats_response', {{ detail: {} }}))",
                            response
                        );
                        _event.get_window().run_js(&js_code);
                        
                        // Emit event through event bus
                        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
                            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                                "database.stats.response",
                                serde_json::json!({
                                    "operation": "get_stats_success",
                                    "stats": &stats
                                }),
                            )) {
                                error!("Failed to emit database stats response event: {}", e);
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to get database stats: {}", e);
                        
                        let response = serde_json::json!({
                            "success": false,
                            "error": e.to_string()
                        });
                        let js_code = format!(
                            "window.dispatchEvent(new CustomEvent('stats_response', {{ detail: {} }}))",
                            response
                        );
                        _event.get_window().run_js(&js_code);
                        
                        // Emit error event through event bus
                        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
                            if let Err(err) = futures::executor::block_on(bus.emit_simple(
                                &AppEventType::DatabaseOperation.to_string(),
                                serde_json::json!({
                                    "operation": "get_stats_error",
                                    "error": e.to_string()
                                }),
                            )) {
                                error!("Failed to emit database stats error event: {}", err);
                            }
                        }
                    }
                }
            } else {
                error!("Database not initialized");
                
                let response = serde_json::json!({
                    "success": false,
                    "error": "Database not initialized"
                });
                let js_code = format!(
                    "window.dispatchEvent(new CustomEvent('stats_response', {{ detail: {} }}))",
                    response
                );
                _event.get_window().run_js(&js_code);
            }
        } else {
            error!("Failed to acquire database lock");

            let response = serde_json::json!({
                "success": false,
                "error": "Failed to acquire database lock"
            });
            let js_code = format!(
                "window.dispatchEvent(new CustomEvent('stats_response', {{ detail: {} }}))",
                response
            );
            _event.get_window().run_js(&js_code);
        }
    });

    info!("Database handlers registered");
}

pub fn setup_sysinfo_handlers(window: &mut webui::Window) {
    // First, expose system info function
    let get_sysinfo_js = r#"
        window.getSystemInfo = function() {
            webui.call('get_system_info');
        };
        console.log('System info function exposed to window');
    "#;
    window.run_js(get_sysinfo_js);
    
    // System info handlers
    window.bind("get_system_info", |_event| {
        info!("Get system info event received");
        
        let sysinfo = serde_json::json!({
            "platform": std::env::consts::OS,
            "arch": std::env::consts::ARCH,
            "family": std::env::consts::FAMILY,
            "os_version": "Linux",
            "app_version": "1.0.0",
            "rust_version": env!("CARGO_PKG_VERSION"),
            "memory_usage": 0,
            "cpu_cores": 0
        });
        
        let js_code = format!(
            "window.dispatchEvent(new CustomEvent('sysinfo_response', {{ detail: {} }}))",
            sysinfo
        );
        _event.get_window().run_js(&js_code);
        
        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                &AppEventType::SystemHealthCheck.to_string(),
                serde_json::json!({
                    "type": "system_info_request"
                }),
            )) {
                error!("Failed to emit system info request event: {}", e);
            }
        }
    });

    info!("System info handlers registered");
}

pub fn setup_utils_handlers(window: &mut webui::Window) {
    // Utility handlers
    window.bind("open_folder", |_event| {
        info!("Open folder event received");
        
        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                "utility.folder.open",
                serde_json::json!({}),
            )) {
                error!("Failed to emit open folder event: {}", e);
            }
        }
    });

    window.bind("organize_images", |_event| {
        info!("Organize images event received");
        
        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                "utility.images.organize",
                serde_json::json!({}),
            )) {
                error!("Failed to emit organize images event: {}", e);
            }
        }
    });

    info!("Utility handlers registered");
}

pub fn setup_advanced_handlers(window: &mut webui::Window) {
    // Advanced handlers
    window.bind("advanced_operation", |_event| {
        info!("Advanced operation event received");
        
        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                "advanced.operation",
                serde_json::json!({}),
            )) {
                error!("Failed to emit advanced operation event: {}", e);
            }
        }
    });

    info!("Advanced handlers registered");
}

pub fn setup_enhanced_handlers(window: &mut webui::Window) {
    // Enhanced handlers
    window.bind("enhanced_feature", |_event| {
        info!("Enhanced feature event received");

        // Emit event through event bus
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                "enhanced.feature",
                serde_json::json!({}),
            )) {
                error!("Failed to emit enhanced feature event: {}", e);
            }
        }
    });

    info!("Enhanced handlers registered");
}

#[allow(dead_code)]
pub fn setup_window_tracking_handlers(window: &mut webui::Window) {
    // Window tracking handlers
    window.bind("window_state_change", |_event| {
        info!("Window state change event received");

        // For WebUI events, the data is typically passed as JSON in the payload
        // We'll handle this by expecting the payload to be passed in the event
        // Since we can't directly access the payload from the event in this way,
        // we'll log that the event was received and let the WebSocket handle the detailed data
        
        info!("Window state change event received - will be handled by WebSocket");

        // Emit event through event bus to notify that a window state change occurred
        if let Ok(bus) = std::panic::catch_unwind(|| EventBus::global()) {
            if let Err(e) = futures::executor::block_on(bus.emit_simple(
                "window.state.change.event",
                serde_json::json!({
                    "message": "Window state change event received"
                }),
            )) {
                error!("Failed to emit window state change event: {}", e);
            }
        }
    });

    info!("Window tracking handlers registered");
}
