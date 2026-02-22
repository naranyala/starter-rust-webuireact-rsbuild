use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tracing::{info, error};
use webui_rs::webui;

// Import consolidated modules
mod model;
mod infrastructure;
mod viewmodel;
mod tests;
mod presentation;

use model::core::{init_logging_with_config, AppConfig, Database};

use infrastructure::event_bus::EventBus;
use infrastructure::logging::error_logger;

use viewmodel::websocket_handler::start_websocket_server;
use viewmodel::handlers::*;

// Build-time generated config
include!(concat!(env!("OUT_DIR"), "/build_config.rs"));

fn start_http_server(port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let frontend_path = std::path::PathBuf::from("frontend/dist");
    let devtools_api = crate::presentation::devtools::DevToolsApi::new();

    info!("Starting HTTP server on port {} for frontend files", port);
    info!(
        "Serving files from: {}",
        frontend_path
            .canonicalize()
            .unwrap_or(frontend_path.clone())
            .display()
    );

    let server = tiny_http::Server::http(format!("0.0.0.0:{}", port))?;

    thread::spawn(move || {
        info!("HTTP server listening on http://localhost:{}", port);

        for request in server.incoming_requests() {
            let url = request.url().to_string();
            
            // Handle WebUI JavaScript bridge request
            if url == "/webui.js" {
                // Serve a minimal WebUI JavaScript bridge
                let webui_js_content = r#"
// WebUI JavaScript Bridge for communication with Rust backend
(function() {
    console.log('WebUI JavaScript Bridge loaded');
    
    // Create a WebSocket connection to the backend
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = wsProtocol + '//' + window.location.host + '/_webui_ws_connect';
    
    let ws = null;
    let isConnected = false;
    let reconnectAttempts = 0;
    let lastError = null;
    
    function connect() {
        try {
            ws = new WebSocket(wsUrl);
            
            ws.onopen = function(event) {
                console.log('WebUI WebSocket connected');
                isConnected = true;
                reconnectAttempts = 0;
                lastError = null;
            };
            
            ws.onmessage = function(event) {
                console.log('WebUI received message:', event.data);
                // Handle incoming messages from backend
                try {
                    const data = JSON.parse(event.data);
                    console.log('Parsed message:', data);
                    
                    // Check for function responses based on the name
                    if (data.name === 'get_users') {
                        // This is a response to get_users
                        window.dispatchEvent(new CustomEvent('db_response', { detail: data.payload || data }));
                        return;
                    }
                    
                    if (data.name === 'get_db_stats') {
                        // This is a response to get_db_stats
                        window.dispatchEvent(new CustomEvent('stats_response', { detail: data.payload || data }));
                        return;
                    }
                    
                    // Check for db_response event
                    if (data.name === 'db_response' || (data.payload && data.payload.success !== undefined)) {
                        const payload = data.payload || data;
                        window.dispatchEvent(new CustomEvent('db_response', { detail: payload }));
                        return;
                    }
                    
                    // Check for stats_response event
                    if (data.name === 'stats_response' || (data.payload && data.payload.stats !== undefined)) {
                        const payload = data.payload || data;
                        window.dispatchEvent(new CustomEvent('stats_response', { detail: payload }));
                        return;
                    }
                    
                    // Trigger generic webui_message event
                    window.dispatchEvent(new CustomEvent('webui_message', { detail: data }));
                } catch(e) {
                    console.error('Error parsing WebUI message:', e);
                }
            };
            
            ws.onclose = function(event) {
                console.log('WebUI WebSocket disconnected');
                isConnected = false;
                reconnectAttempts++;
                // Attempt to reconnect after delay
                setTimeout(connect, 3000);
            };
            
            ws.onerror = function(error) {
                console.error('WebUI WebSocket error:', error);
                lastError = { message: error.message || 'WebSocket error' };
            };
        } catch(e) {
            console.error('Failed to create WebUI WebSocket connection:', e);
        }
    }
    
    // Initialize connection
    connect();
    
    // Expose WebUI functions to global scope
    window.WebUI = {
        isConnected: function() {
            return isConnected;
        },
        getConnectionState: function() {
            let state = 'closed';
            if (isConnected) {
                state = 'ready';
            } else if (ws && ws.readyState === 0) {
                state = 'connecting';
            } else if (ws && ws.readyState === 1) {
                state = 'open';
            } else if (reconnectAttempts > 0) {
                state = 'reconnecting';
            }
            return {
                state: state,
                reconnectAttempts: reconnectAttempts
            };
        },
        getReadyState: function() {
            return ws ? ws.readyState : 3; // 3 = CLOSED
        },
        getLastError: function() {
            return lastError;
        },
        send: function(data) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
                return true;
            }
            console.warn('WebUI WebSocket not connected');
            return false;
        },
        onMessage: function(callback) {
            window.addEventListener('webui_message', function(event) {
                callback(event.detail);
            });
        }
    };
    
    // Expose functions that frontend expects
    window.getUsers = function() {
        console.log('getUsers called');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                id: Math.random().toString(36).substring(2, 15),
                name: 'get_users',
                payload: {},
                timestamp: Date.now(),
                source: 'frontend'
            }));
        } else {
            console.warn('WebSocket not connected');
            // Dispatch empty response to prevent infinite loading
            window.dispatchEvent(new CustomEvent('db_response', { 
                detail: { success: false, error: 'WebSocket not connected', data: [] } 
            }));
        }
    };
    
    window.getDbStats = function() {
        console.log('getDbStats called');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                id: Math.random().toString(36).substring(2, 15),
                name: 'get_db_stats',
                payload: {},
                timestamp: Date.now(),
                source: 'frontend'
            }));
        } else {
            console.warn('WebSocket not connected');
            window.dispatchEvent(new CustomEvent('stats_response', { 
                detail: { success: false, error: 'WebSocket not connected', stats: { users: 0, tables: [] } } 
            }));
        }
    };
    
    // webui.call() - Send a call to Rust backend and expect response
    window.webui = {
        call: function(functionName, data) {
            console.log('webui.call:', functionName, data);
            // Send the function call through WebSocket
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    id: Math.random().toString(36).substring(2, 15),
                    name: functionName,
                    payload: data || {},
                    timestamp: Date.now(),
                    source: 'frontend'
                }));
                return true;
            }
            console.warn('WebUI WebSocket not connected, cannot call:', functionName);
            return false;
        }
    };
    
    // Bind function for UI elements (original WebUI behavior)
    window.webui_bind = function(elementId, callback) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener('click', function() {
                callback();
            });
        }
    };
    
    // Return function for sending data back to backend
    window.webui_return = function(id, data) {
        window.WebUI.send({ id: id, data: data });
    };
    
    console.log('WebUI bridge initialized with getUsers/getDbStats functions');
})();
"#;

                let response = tiny_http::Response::from_data(webui_js_content)
                    .with_header(
                        tiny_http::Header::from_bytes(
                            &b"Content-Type"[..],
                            b"application/javascript",
                        )
                        .unwrap(),
                    )
                    .with_header(
                        tiny_http::Header::from_bytes(
                            &b"Cache-Control"[..],
                            b"no-cache, no-store, must-revalidate",
                        )
                        .unwrap(),
                    );

                if let Err(e) = request.respond(response) {
                    error!(error = %e, "Error sending WebUI JS response");
                }
                
                continue; // Skip the rest of the processing
            }

            // Handle DevTools API requests
            if url.starts_with("/api/devtools/") {
                let response_data = match url.as_str() {
                    "/api/devtools/metrics" => {
                        serde_json::to_string(&devtools_api.get_system_metrics()).unwrap_or_default()
                    }
                    "/api/devtools/health" => {
                        serde_json::to_string(&devtools_api.execute_command("health", serde_json::json!({}))).unwrap_or_default()
                    }
                    "/api/devtools/info" => {
                        serde_json::to_string(&devtools_api.execute_command("info", serde_json::json!({}))).unwrap_or_default()
                    }
                    _ => {
                        serde_json::json!({ "error": "Unknown DevTools endpoint" }).to_string()
                    }
                };

                let response = tiny_http::Response::from_data(response_data)
                    .with_header(
                        tiny_http::Header::from_bytes(
                            &b"Content-Type"[..],
                            b"application/json",
                        )
                        .unwrap(),
                    )
                    .with_header(
                        tiny_http::Header::from_bytes(
                            &b"Access-Control-Allow-Origin"[..],
                            b"*",
                        )
                        .unwrap(),
                    );

                if let Err(e) = request.respond(response) {
                    error!(error = %e, "Error sending DevTools API response");
                }

                continue;
            }

            let path = if url == "/" {
                frontend_path.join("index.html")
            } else {
                frontend_path.join(url.trim_start_matches('/'))
            };

            info!("HTTP Request: {} -> {:?}", url, path);

            if path.exists() && path.is_file() {
                match std::fs::read(&path) {
                    Ok(content) => {
                        let content_type = mime_guess::from_path(&path)
                            .first_or_octet_stream()
                            .to_string();

                        let response = tiny_http::Response::from_data(content).with_header(
                            tiny_http::Header::from_bytes(
                                &b"Content-Type"[..],
                                content_type.as_bytes(),
                            )
                            .unwrap(),
                        );

                        if let Err(e) = request.respond(response) {
                            error!(error = %e, "Error sending response");
                        }
                    }
                    Err(e) => {
                        error!(error = %e, file_path = ?path, "Error reading file");
                        let response = tiny_http::Response::from_string(format!("Error: {}", e))
                            .with_status_code(500);
                        let _ = request.respond(response);
                    }
                }
            } else {
                let response = tiny_http::Response::from_string("Not Found").with_status_code(404);
                let _ = request.respond(response);
            }
        }
    });

    Ok(())
}

#[tokio::main]
async fn main() {
    // Load application configuration
    let config = match AppConfig::load() {
        Ok(config) => {
            eprintln!("\x1b[32m✓ Configuration loaded successfully!\x1b[0m");
            eprintln!("\x1b[36m  Application: {} v{}\x1b[0m",
                config.get_app_name(),
                config.get_version()
            );
            config
        }
        Err(ref e) => {
            error_logger::log_error_with_severity(
                "config_load_error",
                e.as_ref(),
                error_logger::ErrorContext::new()
                    .with_module("main")
                    .with_function("main")
                    .with_file(line!()),
                error_logger::ErrorSeverity::Warning,
                None,
            );
            eprintln!("\x1b[33m⚠ Failed to load configuration, using defaults\x1b[0m");
            AppConfig::default()
        }
    };

    // Initialize logging system with config settings
    if let Err(ref e) = init_logging_with_config(
        Some(config.get_log_file()),
        config.get_log_level(),
        config.is_append_log(),
    ) {
        error_logger::log_error_with_severity(
            "logging_init",
            e.as_ref(),
            error_logger::ErrorContext::new()
                .with_module("main")
                .with_function("main")
                .with_file(line!()),
            error_logger::ErrorSeverity::Critical,
            Some("Check file permissions and disk space"),
        );
        eprintln!("\x1b[31m✗ Failed to initialize logger\x1b[0m");
        return;
    }

    info!("=============================================");
    info!(
        "Starting: {} v{}",
        config.get_app_name(),
        config.get_version()
    );
    info!("=============================================");

    // Initialize event bus
    let event_bus = EventBus::global();
    info!("Event bus initialized");

    // Emit application start event
    if let Err(e) = event_bus.emit_simple(
        "app.start",
        serde_json::json!({
            "app_name": config.get_app_name(),
            "version": config.get_version()
        }),
    ).await {
        error!(error = %e, "Failed to emit app start event");
    }

    // Start WebSocket server in a separate task
    let event_bus_for_ws = event_bus.clone();
    tokio::spawn(async move {
        if let Err(e) = start_websocket_server(event_bus_for_ws, 9000).await {
            error!(error = %e, "Failed to start WebSocket server");
        }
    });
    info!("WebSocket server started on ws://127.0.0.1:9000");

    info!("Application starting...");

    // Get database path from config
    let db_path = config.get_db_path();
    info!("Database path: {}", db_path);

    // Initialize SQLite database
    let db = match Database::new(db_path) {
        Ok(db) => {
            info!("Database initialized successfully");
            if let Err(e) = db.init() {
                error!(error = %e, "Failed to initialize database schema");
                return;
            }
            if config.should_create_sample_data() {
                if let Err(e) = db.insert_sample_data() {
                    error!(error = %e, "Failed to insert sample data");
                    return;
                }
                info!("Sample data created (if not exists)");
                
                // Emit data change event
                if let Err(e) = event_bus.emit_simple(
                    "data.created",
                    serde_json::json!({
                        "table": "users",
                        "count": 4,
                        "action": "sample_data_insertion"
                    }),
                ).await {
                    error!(error = %e, "Failed to emit data created event");
                }
            }
            Arc::new(db)
        }
        Err(e) => {
            error!(error = %e, "Failed to initialize database");
            return;
        }
    };

    // Initialize database handlers with the database instance
    init_database(Arc::clone(&db));

    // Start HTTP server for frontend files
    let http_port = 8080u16;
    if let Err(e) = start_http_server(http_port) {
        error!(error = %e, "Failed to start HTTP server");
        return;
    }

    // Give the server a moment to start
    thread::sleep(Duration::from_millis(100));

    // Create a new window
    let mut my_window = webui::Window::new();

    // Set up UI event handlers
    setup_ui_handlers(&mut my_window);
    setup_counter_handlers(&mut my_window);
    setup_db_handlers(&mut my_window);
    setup_sysinfo_handlers(&mut my_window);
    setup_utils_handlers(&mut my_window);
    setup_advanced_handlers(&mut my_window);
    setup_enhanced_handlers(&mut my_window);

    // Get window settings from config
    let window_title = config.get_window_title();
    info!("Window title: {}", window_title);

    // Show the built React.js application via HTTP server
    let url = format!("http://localhost:{}", http_port);
    info!("Loading application UI from {}", url);
    my_window.show(&url);

    // Emit UI ready event
    if let Err(e) = event_bus.emit_simple(
        "ui.ready",
        serde_json::json!({
            "url": url,
            "port": http_port
        }),
    ).await {
        error!(error = %e, "Failed to emit UI ready event");
    }

    info!("Application started successfully, waiting for events...");
    info!("=============================================");

    // Wait until all windows are closed
    webui::wait();

    // Emit shutdown event
    if let Err(e) = event_bus.emit_simple(
        "app.shutdown",
        serde_json::json!({}),
    ).await {
        error!(error = %e, "Failed to emit app shutdown event");
    }

    info!("Application shutting down...");
    info!("=============================================");
}
