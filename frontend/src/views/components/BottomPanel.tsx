/**
 * Unified Bottom Panel - DevTools & WebSocket Status
 * 
 * Combines WebSocket status monitoring with comprehensive developer tools:
 * - System metrics (backend & frontend)
 * - Event bus activity
 * - WebSocket connection status
 * - Error logs
 * - Database stats
 * - Configuration
 * - Debug tools
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EventBus, AppEventType } from '../../models/event-bus';
import { ErrorLogger, useErrorLogger } from '../../services/error-logger';
import type { WsStatus } from '../../types';

// Types
interface SystemMetrics {
  timestamp: string;
  uptime_secs: number;
  memory: {
    process_memory_mb: number;
    available_system_mb: number;
  };
  connections: {
    websocket_active: number;
    http_requests_total: number;
  };
  database: {
    tables: { name: string; row_count: number }[];
    total_records: number;
  };
  events: {
    total_emitted: number;
    recent_events: { id: string; name: string; timestamp: string; source: string }[];
  };
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  message: string;
  source: 'frontend' | 'backend';
  category?: string;
}

interface TabProps {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

// Unified Bottom Panel Component
export const BottomPanel: React.FC<{ wsStatus: WsStatus }> = ({ wsStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'metrics' | 'events' | 'errors' | 'console' | 'config' | 'debug'>('status');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<{type: string; content: string}[]>([]);
  const [wsDebugExpanded, setWsDebugExpanded] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Auto-scroll console
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutput]);

  // Fetch system metrics periodically
  useEffect(() => {
    if (!isOpen && activeTab !== 'status') return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/devtools/metrics');
        if (response.ok) {
          const data = await response.json();
          setSystemMetrics(data);
        }
      } catch (error) {
        // Backend not available, use frontend-only metrics
        setSystemMetrics({
          timestamp: new Date().toISOString(),
          uptime_secs: 0,
          memory: { process_memory_mb: 0, available_system_mb: 0 },
          connections: { websocket_active: 0, http_requests_total: 0 },
          database: { tables: [], total_records: 0 },
          events: { total_emitted: 0, recent_events: [] },
        });
      }
    };

    if (activeTab === 'metrics') {
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  // Subscribe to events
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = EventBus.subscribeAll((event) => {
      setEvents(prev => [...prev.slice(-99), {
        id: event.id,
        name: event.name,
        timestamp: new Date(event.timestamp).toISOString(),
        source: event.source,
        payload: event.payload,
      }]);

      // Also add to logs
      addLog({
        id: event.id,
        timestamp: new Date(event.timestamp).toISOString(),
        level: event.source === 'backend' ? 'info' : 'debug',
        message: `${event.name}`,
        source: event.source as 'frontend' | 'backend',
        category: 'event',
      });
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Subscribe to errors
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = EventBus.subscribe(AppEventType.BACKEND_ERROR, (event) => {
      addLog({
        id: `err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: event.payload.error?.message || 'Unknown error',
        source: 'backend',
        category: 'error',
      });
    });

    return () => unsubscribe();
  }, [isOpen]);

  const addLog = useCallback((log: LogEntry) => {
    setLogs(prev => [...prev.slice(-199), log]);
  }, []);

  const executeConsoleCommand = useCallback((command: string) => {
    const output: {type: string; content: string}[] = [];
    
    try {
      // eslint-disable-next-line no-eval
      const result = eval(command);
      output.push({
        type: 'success',
        content: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result),
      });
    } catch (error) {
      output.push({
        type: 'error',
        content: error instanceof Error ? error.message : String(error),
      });
    }

    setConsoleOutput(prev => [...prev, { type: 'input', content: `> ${command}` }, ...output]);
  }, []);

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consoleInput.trim()) {
      executeConsoleCommand(consoleInput.trim());
      setConsoleInput('');
    }
  };

  const formatUptime = (secs: number): string => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;
    return `${hours}h ${mins}m ${seconds}s`;
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      debug: '#6b7280',
      info: '#3b82f6',
      warning: '#f59e0b',
      error: '#ef4444',
      critical: '#dc2626',
    };
    return colors[level] || '#6b7280';
  };

  const getStatusColor = () => {
    switch (wsStatus) {
      case 'connected': return '#166534';
      case 'connecting': return '#854d0e';
      case 'disconnected': return '#991b1b';
    }
  };

  const getStatusBorder = () => {
    switch (wsStatus) {
      case 'connected': return '#22c55e';
      case 'connecting': return '#eab308';
      case 'disconnected': return '#ef4444';
    }
  };

  const getStatusText = () => {
    switch (wsStatus) {
      case 'connected': return '#86efac';
      case 'connecting': return '#fde047';
      case 'disconnected': return '#fca5a5';
    }
  };

  const getIcon = () => {
    switch (wsStatus) {
      case 'connected': return '●';
      case 'connecting': return '◐';
      case 'disconnected': return '○';
    }
  };

  const TabButton: React.FC<TabProps> = ({ label, icon, active, onClick, badge }) => (
    <button
      onClick={onClick}
      style={{
        padding: '8px 12px',
        background: active ? '#3b82f6' : 'transparent',
        color: active ? '#fff' : '#9ca3af',
        border: 'none',
        borderRadius: '6px 6px 0 0',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.background = '#374151';
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <span>{icon}</span>
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: '#ef4444',
          color: '#fff',
          fontSize: '10px',
          padding: '1px 6px',
          borderRadius: '10px',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

  const errorCount = logs.filter(l => l.level === 'error' || l.level === 'critical').length;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && activeTab === 'status') setActiveTab('metrics');
        }}
        style={{
          position: 'absolute',
          top: '-32px',
          right: '20px',
          background: isOpen ? '#3b82f6' : '#1f2937',
          color: '#fff',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
          transition: 'background 0.2s',
        }}
      >
        <span style={{ fontSize: '14px' }}>{isOpen ? '▼' : '▲'}</span>
        DevTools
        {errorCount > 0 && (
          <span style={{
            background: '#ef4444',
            color: '#fff',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '10px',
          }}>
            {errorCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          background: '#111827',
          borderTop: `2px solid ${getStatusBorder()}`,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Status Bar (always visible) */}
          <div
            style={{
              backgroundColor: getStatusColor(),
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: getStatusText(),
              cursor: 'pointer',
            }}
            onClick={() => setWsDebugExpanded(!wsDebugExpanded)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>{getIcon()}</span>
              <span>WS: {wsStatus}</span>
              <span style={{ opacity: 0.7 }}>|</span>
              <span>Connection: {getStatusText().replace('#', '')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                Reconnect: {(window as any).WebUI?.getConnectionState()?.reconnectAttempts || 0}
              </span>
              <span style={{ fontSize: '12px' }}>{wsDebugExpanded ? '▲' : '▼'}</span>
            </div>
          </div>

          {/* WebSocket Debug Details */}
          {wsDebugExpanded && (
            <div
              style={{
                padding: '8px 12px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#cbd5e1',
                backgroundColor: 'rgba(0,0,0,0.2)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '8px',
              }}
            >
              <div><strong>URL:</strong> {window.location.protocol === 'https:' ? 'wss://' : 'ws://'}{window.location.host}/_webui_ws_connect</div>
              <div><strong>State:</strong> {(window as any).WebUI?.getConnectionState()?.state || 'unknown'}</div>
              <div><strong>Ready:</strong> {['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][(window as any).WebUI?.getReadyState()] || 'UNINSTANTIATED'}</div>
              <div><strong>Last Error:</strong> {(window as any).WebUI?.getLastError()?.message || 'None'}</div>
            </div>
          )}

          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #374151',
            padding: '0 8px',
            background: '#1f2937',
            overflowX: 'auto',
          }}>
            <TabButton
              id="status"
              label="Status"
              icon="📊"
              active={activeTab === 'status'}
              onClick={() => setActiveTab('status')}
            />
            <TabButton
              id="metrics"
              label="Metrics"
              icon="⏱️"
              active={activeTab === 'metrics'}
              onClick={() => setActiveTab('metrics')}
            />
            <TabButton
              id="events"
              label="Events"
              icon="⚡"
              active={activeTab === 'events'}
              onClick={() => setActiveTab('events')}
              badge={events.length}
            />
            <TabButton
              id="errors"
              label="Errors"
              icon="⚠️"
              active={activeTab === 'errors'}
              onClick={() => setActiveTab('errors')}
              badge={errorCount}
            />
            <TabButton
              id="console"
              label="Console"
              icon="💻"
              active={activeTab === 'console'}
              onClick={() => setActiveTab('console')}
            />
            <TabButton
              id="config"
              label="Config"
              icon="⚙️"
              active={activeTab === 'config'}
              onClick={() => setActiveTab('config')}
            />
            <TabButton
              id="debug"
              label="Debug"
              icon="🔧"
              active={activeTab === 'debug'}
              onClick={() => setActiveTab('debug')}
            />
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            fontSize: '12px',
            color: '#e5e7eb',
          }}>
            {/* Status Tab - Quick Overview */}
            {activeTab === 'status' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <StatusCard
                  title="⏱️ Uptime"
                  value={systemMetrics ? formatUptime(systemMetrics.uptime_secs) : 'N/A'}
                  color="#3b82f6"
                />
                <StatusCard
                  title="💾 Memory"
                  value={systemMetrics ? `${systemMetrics.memory.available_system_mb.toFixed(0)} MB` : 'N/A'}
                  color="#10b981"
                />
                <StatusCard
                  title="🔌 WebSocket"
                  value={`${systemMetrics?.connections.websocket_active ?? 0} active`}
                  color={wsStatus === 'connected' ? '#22c55e' : '#f59e0b'}
                />
                <StatusCard
                  title="📦 Database"
                  value={`${systemMetrics?.database.total_records ?? 0} records`}
                  color="#8b5cf6"
                />
                <StatusCard
                  title="⚡ Events"
                  value={`${events.length} captured`}
                  color="#f59e0b"
                />
                <StatusCard
                  title="📝 Logs"
                  value={`${logs.length} entries (${errorCount} errors)`}
                  color={errorCount > 0 ? '#ef4444' : '#6b7280'}
                />
              </div>
            )}

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
              <div>
                <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '14px' }}>System Metrics</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <MetricCard
                    title="⏱️ Uptime"
                    value={systemMetrics ? formatUptime(systemMetrics.uptime_secs) : 'N/A'}
                  />
                  <MetricCard
                    title="💾 Memory"
                    value={systemMetrics ? `${systemMetrics.memory.available_system_mb.toFixed(0)} MB available` : 'N/A'}
                  />
                  <MetricCard
                    title="🔌 WebSocket"
                    value={`${systemMetrics?.connections.websocket_active ?? 0} active`}
                  />
                  <MetricCard
                    title="📦 Database"
                    value={`${systemMetrics?.database.total_records ?? 0} records`}
                  />
                </div>
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
                  {events.length} events captured • Auto-scrolling
                </div>
                {events.slice(-50).reverse().map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '6px',
                      borderBottom: '1px solid #374151',
                      display: 'flex',
                      gap: '10px',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ color: '#6b7280', minWidth: '100px' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{
                      color: event.source === 'backend' ? '#3b82f6' : '#10b981',
                      fontWeight: 500,
                      minWidth: '70px',
                    }}>
                      [{event.source}]
                    </span>
                    <span style={{ color: '#fbbf24' }}>{event.name}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}

            {/* Errors Tab */}
            {activeTab === 'errors' && (
              <div style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
                  {errorCount} errors • Last 50 entries
                </div>
                {logs.filter(l => l.level === 'error' || l.level === 'critical').slice(-50).reverse().map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '6px',
                      borderBottom: '1px solid #374151',
                      borderLeft: `3px solid ${getLevelColor(log.level)}`,
                      paddingLeft: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{
                        color: getLevelColor(log.level),
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        fontSize: '10px',
                      }}>
                        {log.level}
                      </span>
                      <span style={{ color: '#9ca3af' }}>[{log.source}]</span>
                    </div>
                    <div style={{ color: '#ef4444', marginBottom: '4px' }}>{log.message}</div>
                    {log.category && (
                      <span style={{
                        background: '#374151',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                      }}>
                        {log.category}
                      </span>
                    )}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}

            {/* Console Tab */}
            {activeTab === 'console' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '350px' }}>
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  background: '#000',
                  padding: '10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}>
                  {consoleOutput.map((line, i) => (
                    <div
                      key={i}
                      style={{
                        color: line.type === 'error' ? '#ef4444' : line.type === 'input' ? '#9ca3af' : '#10b981',
                        marginBottom: '4px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {line.content}
                    </div>
                  ))}
                  <div ref={consoleEndRef} />
                </div>
                <form onSubmit={handleConsoleSubmit} style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={consoleInput}
                    onChange={(e) => setConsoleInput(e.target.value)}
                    placeholder="Enter JavaScript expression..."
                    style={{
                      flex: 1,
                      background: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      color: '#e5e7eb',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    Run
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsoleOutput([])}
                    style={{
                      background: '#374151',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                  >
                    Clear
                  </button>
                </form>
              </div>
            )}

            {/* Config Tab */}
            {activeTab === 'config' && (
              <div>
                <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '14px' }}>Application Configuration</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  <ConfigRow label="App Name" value="Rust WebUI Application" />
                  <ConfigRow label="Version" value="1.0.0" />
                  <ConfigRow label="Frontend" value="React 18 + TypeScript" />
                  <ConfigRow label="Backend" value="Rust + WebUI" />
                  <ConfigRow label="Database" value="SQLite" />
                  <ConfigRow label="WebSocket Port" value="9000" />
                  <ConfigRow label="HTTP Port" value="8080" />
                </div>
              </div>
            )}

            {/* Debug Tab */}
            {activeTab === 'debug' && (
              <div>
                <h3 style={{ marginBottom: '16px', color: '#fff', fontSize: '14px' }}>🔧 Debug Tools</h3>
                <p style={{ color: '#9ca3af', marginBottom: '16px', fontSize: '11px' }}>
                  Test error handling and application boundaries
                </p>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      console.log('Test error triggered!');
                      throw new Error('🧪 Test error: This is a test error from DevTools!');
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                  >
                    🧪 Trigger Error
                  </button>

                  <button
                    onClick={() => {
                      console.warn('Test warning triggered!');
                      throw new Error('⚠️ Test warning: This is a test warning!');
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#f59e0b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                  >
                    ⚠️ Trigger Warning
                  </button>

                  <button
                    onClick={() => {
                      console.log('Test info logged!');
                      alert('ℹ️ Test info: Check console for logs');
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  >
                    ℹ️ Log Info
                  </button>

                  <button
                    onClick={() => {
                      setLogs([]);
                      setEvents([]);
                      setConsoleOutput([]);
                    }}
                    style={{
                      padding: '8px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: '#374151',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#374151'}
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Status Card Component (for status tab)
const StatusCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
  <div style={{
    background: '#1f2937',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #374151',
  }}>
    <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '6px' }}>{title}</div>
    <div style={{ color, fontSize: '18px', fontWeight: 600 }}>{value}</div>
  </div>
);

// Metric Card Component (for metrics tab)
const MetricCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div style={{
    background: '#1f2937',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #374151',
  }}>
    <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '8px' }}>{title}</div>
    <div style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>{value}</div>
  </div>
);

// Config Row Component
const ConfigRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px',
    background: '#1f2937',
    borderRadius: '6px',
  }}>
    <span style={{ color: '#9ca3af', fontSize: '12px' }}>{label}</span>
    <span style={{ color: '#3b82f6', fontWeight: 500, fontSize: '12px' }}>{value}</span>
  </div>
);
