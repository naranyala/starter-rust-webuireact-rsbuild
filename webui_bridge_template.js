// WebUI JavaScript Bridge for communication with Rust backend
(function() {
    console.log('WebUI JavaScript Bridge loaded');

    // WebSocket connection states (matching WebSocket API)
    const WS_STATE = {
        CONNECTING: 0,
        OPEN: 1,
        CLOSING: 2,
        CLOSED: 3,
        UNINSTANTIATED: -1
    };

    // Custom connection states for tracking
    const ConnectionState = {
        UNINSTANTIATED: 'uninstantiated',
        CONNECTING: 'connecting',
        CONNECTING_HANDSHAKE: 'connecting_handshake',
        OPEN: 'open',
        AUTHENTICATING: 'authenticating',
        AUTHENTICATED: 'authenticated',
        READY: 'ready',
        CLOSING: 'closing',
        CLOSED: 'closed',
        RECONNECTING: 'reconnecting',
        ERROR: 'error'
    };

    // Error types for detailed tracking
    const ErrorType = {
        CONNECTION_REFUSED: 'CONNECTION_REFUSED',
        CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
        HANDSHAKE_FAILED: 'HANDSHAKE_FAILED',
        PROTOCOL_ERROR: 'PROTOCOL_ERROR',
        SERIALIZATION_ERROR: 'SERIALIZATION_ERROR',
        TRANSPORT_ERROR: 'TRANSPORT_ERROR',
        SOCKET_ERROR: 'SOCKET_ERROR',
        PARSE_ERROR: 'PARSE_ERROR',
        TIMEOUT: 'TIMEOUT',
        UNKNOWN: 'UNKNOWN'
    };

    // Create a WebSocket connection to the backend
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to the WebSocket server running on dynamic port
    const wsHost = window.location.hostname;
    const wsPort = {{WEBSOCKET_PORT}};
    const wsUrl = wsProtocol + '//' + wsHost + ':' + wsPort;

    let ws = null;
    let connectionState = ConnectionState.UNINSTANTIATED;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const initialReconnectInterval = 3000; // 3 seconds
    const maxReconnectInterval = 30000; // 30 seconds
    const connectionTimeout = 10000; // 10 seconds

    // Track detailed error information
    let lastError = null;
    let lastErrorTimestamp = null;

    // Store promises for pending requests to enable request-response correlation
    const pendingRequests = new Map();

    // Connection state change tracking
    function setConnectionState(newState, reason = null) {
        const oldState = connectionState;
        connectionState = newState;
        console.log('WebSocket state: ' + oldState + ' -> ' + newState, reason ? '(' + reason + ')' : '');

        window.dispatchEvent(new CustomEvent('webui_connection_state_change', {
            detail: {
                oldState,
                newState,
                reason,
                timestamp: Date.now()
            }
        }));
    }

    function createErrorObject(type, message, details = {}) {
        const error = {
            type,
            message,
            timestamp: Date.now(),
            ...details
        };
        lastError = error;
        lastErrorTimestamp = Date.now();
        return error;
    }

    function connect() {
        if (reconnectAttempts >= maxReconnectAttempts) {
            console.error('Maximum reconnection attempts reached. Stopping reconnection.');
            setConnectionState(ConnectionState.ERROR, 'max_reconnect_attempts');
            window.dispatchEvent(new CustomEvent('webui_connection_failed', {
                detail: createErrorObject(ErrorType.CONNECTION_REFUSED, 'Maximum reconnection attempts reached')
            }));
            return;
        }

        try {
            const attempt = reconnectAttempts + 1;
            console.log('Attempting to connect to WebSocket (' + attempt + '/' + maxReconnectAttempts + ')');
            setConnectionState(ConnectionState.CONNECTING, 'attempt_' + attempt);

            // Set up connection timeout
            const connectionTimer = setTimeout(() => {
                if (ws && ws.readyState === WS_STATE.CONNECTING) {
                    console.error('WebSocket connection timeout');
                    ws.close();
                    handleConnectionError(createErrorObject(ErrorType.CONNECTION_TIMEOUT, 'Connection timeout after 10 seconds'));
                }
            }, connectionTimeout);

            ws = new WebSocket(wsUrl);

            ws.onopen = function(event) {
                clearTimeout(connectionTimer);
                console.log('WebUI WebSocket connected');
                setConnectionState(ConnectionState.OPEN, 'onopen');
                reconnectAttempts = 0; // Reset on successful connection

                // Dispatch connection status event
                window.dispatchEvent(new CustomEvent('webui_connected', {
                    detail: {
                        timestamp: Date.now(),
                        url: wsUrl,
                        readyState: ws.readyState
                    }
                }));
                
                // Emit UI ready event to signal that frontend is ready
                if (window.WebUI) {
                    window.WebUI.send(JSON.stringify({
                        id: 'ui_ready_' + Date.now(),
                        name: 'ui.ready',
                        payload: { message: 'Frontend UI is ready and connected' },
                        timestamp: Date.now(),
                        source: 'frontend'
                    }));
                }
            };

            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    console.log('WebUI received message:', data);

                    // Check if this is a response to a previous request
                    if (data.id && pendingRequests.has(data.id)) {
                        const requestPromise = pendingRequests.get(data.id);
                        pendingRequests.delete(data.id);

                        // Resolve the promise with the response
                        if (data.payload && data.payload.success !== undefined && !data.payload.success) {
                            // Reject if the response indicates failure
                            requestPromise.reject(new Error(data.payload.error || 'Request failed'));
                        } else {
                            // Resolve with the payload
                            requestPromise.resolve(data.payload || data);
                        }
                        return;
                    }

                    // Handle incoming messages from backend
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

                    // Check for error responses
                    if (data.name === 'error') {
                        console.error('Backend error:', data.payload);
                        window.dispatchEvent(new CustomEvent('webui_error', { detail: data.payload }));
                        return;
                    }

                    // Check for WebSocketError from backend
                    if (data.error_type) {
                        console.error('WebSocket error from backend:', data);
                        window.dispatchEvent(new CustomEvent('webui_backend_error', {
                            detail: createErrorObject(
                                data.error_type,
                                data.message,
                                data.details
                            )
                        }));
                        return;
                    }

                    // Trigger generic webui_message event
                    window.dispatchEvent(new CustomEvent('webui_message', { detail: data }));
                } catch(e) {
                    console.error('Error parsing WebUI message:', e, event.data);
                    window.dispatchEvent(new CustomEvent('webui_error', {
                        detail: createErrorObject(ErrorType.PARSE_ERROR, e.message, { raw_data: event.data })
                    }));
                }
            };

            function handleConnectionError(error) {
                lastError = error;
                lastErrorTimestamp = Date.now();
                console.error('WebSocket connection error:', error);
                setConnectionState(ConnectionState.ERROR, error.type);
                window.dispatchEvent(new CustomEvent('webui_error', { detail: error }));
            }

            ws.onclose = function(event) {
                clearTimeout(connectionTimer);
                console.log('WebUI WebSocket disconnected', {
                    code: event.code,
                    reason: event.reason,
                    wasClean: event.wasClean
                });

                const oldState = connectionState;
                setConnectionState(ConnectionState.CLOSED, 'code_' + event.code);

                // Dispatch disconnection event
                window.dispatchEvent(new CustomEvent('webui_disconnected', {
                    detail: {
                        code: event.code,
                        reason: event.reason,
                        wasClean: event.wasClean,
                        timestamp: Date.now(),
                        lastError: lastError
                    }
                }));

                // Don't attempt to reconnect if this was a clean close
                if (event.wasClean && event.code === 1000) {
                    console.log('Clean close, not attempting to reconnect');
                    return;
                }

                // Check if we should reconnect
                if (reconnectAttempts < maxReconnectAttempts && oldState !== ConnectionState.CLOSING) {
                    // Attempt to reconnect after delay (exponential backoff)
                    reconnectAttempts++;
                    const delay = Math.min(
                        initialReconnectInterval * Math.pow(1.5, reconnectAttempts - 1),
                        maxReconnectInterval
                    );
                    console.log('Attempting to reconnect in ' + delay + 'ms (attempt ' + reconnectAttempts + ')');
                    setConnectionState(ConnectionState.RECONNECTING, 'attempt_' + reconnectAttempts);

                    setTimeout(() => {
                        connect();
                    }, delay);
                } else if (reconnectAttempts >= maxReconnectAttempts) {
                    setConnectionState(ConnectionState.ERROR, 'max_reconnect_attempts_reached');
                    window.dispatchEvent(new CustomEvent('webui_connection_failed', {
                        detail: createErrorObject(ErrorType.CONNECTION_REFUSED, 'Maximum reconnection attempts reached')
                    }));
                }
            };

            ws.onerror = function(error) {
                console.error('WebSocket error:', error);
                handleConnectionError(createErrorObject(ErrorType.SOCKET_ERROR, error.message, { error: error }));
            };

            // Handle ping/pong for connection health
            ws.onping = function() {
                console.log('Received ping from server');
            };

            ws.onpong = function() {
                console.log('Received pong from server');
            };
        } catch(e) {
            console.error('Failed to create WebUI WebSocket connection:', e);
            handleConnectionError(createErrorObject(ErrorType.TRANSPORT_ERROR, e.message, { error: e }));
        }
    }

    // Check connection state before any operation
    function getConnectionStateInfo() {
        return {
            state: connectionState,
            readyState: ws ? ws.readyState : WS_STATE.UNINSTANTIATED,
            readyStateName: ws ? ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState] : 'UNINSTANTIATED',
            isConnected: ws && ws.readyState === WS_STATE.OPEN,
            reconnectAttempts,
            maxReconnectAttempts,
            lastError,
            lastErrorTimestamp
        };
    }

    // Initialize connection
    connect();

    // Expose WebUI functions to global scope
    window.WebUI = {
        getConnectionState: getConnectionStateInfo,
        isConnected: function() {
            return ws && ws.readyState === WS_STATE.OPEN;
        },
        getReadyState: function() {
            return ws ? ws.readyState : WS_STATE.UNINSTANTIATED;
        },
        send: function(data) {
            if (!ws || ws.readyState !== WS_STATE.OPEN) {
                console.warn('WebSocket not connected, cannot send:', data);
                window.dispatchEvent(new CustomEvent('webui_send_failed', {
                    detail: createErrorObject(ErrorType.TRANSPORT_ERROR, 'WebSocket not connected')
                }));
                return false;
            }
            try {
                ws.send(JSON.stringify(data));
                return true;
            } catch(e) {
                console.error('Error sending data:', e);
                window.dispatchEvent(new CustomEvent('webui_send_failed', {
                    detail: createErrorObject(ErrorType.SERIALIZATION_ERROR, e.message)
                }));
                return false;
            }
        },
        onMessage: function(callback) {
            window.addEventListener('webui_message', function(event) {
                callback(event.detail);
            });
        },
        onConnectionStateChange: function(callback) {
            window.addEventListener('webui_connection_state_change', function(event) {
                callback(event.detail);
            });
        },
        onError: function(callback) {
            window.addEventListener('webui_error', function(event) {
                callback(event.detail);
            });
        },
        // Enhanced call function with promise-based response handling
        call: function(functionName, data, timeoutMs = 10000) {
            return new Promise((resolve, reject) => {
                if (!ws || ws.readyState !== WS_STATE.OPEN) {
                    console.warn('WebUI WebSocket not connected, cannot call:', functionName);
                    const err = createErrorObject(ErrorType.TRANSPORT_ERROR, 'WebSocket not connected');
                    window.dispatchEvent(new CustomEvent('webui_call_failed', { detail: err }));
                    reject(new Error('WebSocket not connected'));
                    return;
                }

                const id = Math.random().toString(36).substring(2, 15) + '_' + Date.now();
                const message = {
                    id: id,
                    name: functionName,
                    payload: data || {},
                    timestamp: Date.now(),
                    source: 'frontend'
                };

                console.log('webui.call:', functionName, data, 'with id:', id);

                // Store the promise to resolve/reject when response comes
                pendingRequests.set(id, { resolve, reject });

                try {
                    // Send the function call through WebSocket
                    ws.send(JSON.stringify(message));
                } catch(e) {
                    pendingRequests.delete(id);
                    const err = createErrorObject(ErrorType.SERIALIZATION_ERROR, e.message);
                    window.dispatchEvent(new CustomEvent('webui_call_failed', { detail: err }));
                    reject(err);
                    return;
                }

                // Set timeout to reject the promise if no response comes
                setTimeout(() => {
                    if (pendingRequests.has(id)) {
                        pendingRequests.delete(id);
                        console.warn('Timeout waiting for response to ' + functionName + ' (id: ' + id + ')');
                        const err = createErrorObject(ErrorType.TIMEOUT, 'Timeout waiting for response to ' + functionName);
                        window.dispatchEvent(new CustomEvent('webui_call_timeout', { detail: err }));
                        reject(new Error('Timeout waiting for response to ' + functionName));
                    }
                }, timeoutMs);
            });
        },
        // Manual reconnection
        reconnect: function() {
            if (ws) {
                ws.close();
            }
            reconnectAttempts = 0;
            connect();
        },
        // Manual disconnection
        disconnect: function() {
            if (ws) {
                ws.close();
            }
            setConnectionState(ConnectionState.CLOSED, 'manual_disconnect');
        },
        // Get error info
        getLastError: function() {
            return lastError;
        }
    };

    // Expose functions that frontend expects with enhanced error handling
    window.getUsers = function(timeoutMs = 10000) {
        console.log('getUsers called');
        return window.WebUI.call('get_users', {}, timeoutMs)
            .then(response => {
                window.dispatchEvent(new CustomEvent('db_response', { detail: response }));
                return response;
            })
            .catch(error => {
                console.error('Error getting users:', error);
                // Dispatch error response to prevent infinite loading
                window.dispatchEvent(new CustomEvent('db_response', {
                    detail: { success: false, error: error.message, data: [] }
                }));
                throw error;
            });
    };

    window.getDbStats = function(timeoutMs = 10000) {
        console.log('getDbStats called');
        return window.WebUI.call('get_db_stats', {}, timeoutMs)
            .then(response => {
                window.dispatchEvent(new CustomEvent('stats_response', { detail: response }));
                return response;
            })
            .catch(error => {
                console.error('Error getting DB stats:', error);
                window.dispatchEvent(new CustomEvent('stats_response', {
                    detail: { success: false, error: error.message, stats: { users: 0, tables: [] } }
                }));
                throw error;
            });
    };

    // Enhanced webui.call() - Send a call to Rust backend and expect response
    // This is now aliased to the promise-based version above
    if (!window.webui) {
        window.webui = window.WebUI;
    }

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

    // Utility function to check connection status
    window.webui_is_connected = function() {
        return window.WebUI.isConnected();
    };

    // Utility function to get connection status details
    window.webui_connection_status = function() {
        return getConnectionStateInfo();
    };

    console.log('WebUI bridge initialized with enhanced communication features');
})();