/**
 * DevTools Bottom Panel
 * 
 * Comprehensive developer tools panel exposing:
 * - System metrics (backend & frontend)
 * - Event bus activity
 * - WebSocket connection status
 * - Error logs
 * - Database stats
 * - Configuration
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EventBus, AppEventType } from '../../models/event-bus';
import { ErrorLogger, useErrorLogger } from '../../services/error-logger';

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
  active: boolean;
  onClick: () => void;
  badge?: number;
}

// DevTools Panel Component
export const DevToolsPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'events' | 'errors' | 'console' | 'config'>('metrics');
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleOutput, setConsoleOutput] = useState<{type: string; content: string}[]>([]);
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
    if (!isOpen) return;

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

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

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

  const TabButton: React.FC<TabProps> = ({ label, active, onClick, badge }) => (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        background: active ? '#3b82f6' : 'transparent',
        color: active ? '#fff' : '#9ca3af',
        border: 'none',
        borderRadius: '6px 6px 0 0',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: '#ef4444',
          color: '#fff',
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '10px',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );

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
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          top: '-36px',
          right: '20px',
          background: isOpen ? '#3b82f6' : '#1f2937',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px 8px 0 0',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.2)',
        }}
      >
        <span style={{ fontSize: '16px' }}>{isOpen ? '▼' : '▲'}</span>
        DevTools
        {logs.filter(l => l.level === 'error' || l.level === 'critical').length > 0 && (
          <span style={{
            background: '#ef4444',
            color: '#fff',
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '10px',
          }}>
            {logs.filter(l => l.level === 'error' || l.level === 'critical').length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          background: '#111827',
          borderTop: '1px solid #374151',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #374151',
            padding: '0 8px',
            background: '#1f2937',
          }}>
            <TabButton
              id="metrics"
              label="📊 Metrics"
              active={activeTab === 'metrics'}
              onClick={() => setActiveTab('metrics')}
            />
            <TabButton
              id="events"
              label="⚡ Events"
              active={activeTab === 'events'}
              onClick={() => setActiveTab('events')}
              badge={events.length}
            />
            <TabButton
              id="errors"
              label="⚠️ Errors"
              active={activeTab === 'errors'}
              onClick={() => setActiveTab('errors')}
              badge={logs.filter(l => l.level === 'error' || l.level === 'critical').length}
            />
            <TabButton
              id="console"
              label="💻 Console"
              active={activeTab === 'console'}
              onClick={() => setActiveTab('console')}
            />
            <TabButton
              id="config"
              label="⚙️ Config"
              active={activeTab === 'config'}
              onClick={() => setActiveTab('config')}
            />
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            fontSize: '13px',
            color: '#e5e7eb',
          }}>
            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
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
                <MetricCard
                  title="⚡ Events"
                  value={`${events.length} captured`}
                />
                <MetricCard
                  title="📝 Logs"
                  value={`${logs.length} entries`}
                />
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
                  {events.length} events captured • Auto-scrolling
                </div>
                {events.slice(-50).reverse().map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid #374151',
                      display: 'flex',
                      gap: '12px',
                    }}
                  >
                    <span style={{ color: '#6b7280', minWidth: '150px' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span style={{
                      color: event.source === 'backend' ? '#3b82f6' : '#10b981',
                      fontWeight: 500,
                      minWidth: '80px',
                    }}>
                      [{event.source}]
                    </span>
                    <span style={{ color: '#fbbf24' }}>{event.name}</span>
                    <span style={{ color: '#9ca3af', flex: 1 }}>
                      {JSON.stringify(event.payload).slice(0, 100)}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}

            {/* Errors Tab */}
            {activeTab === 'errors' && (
              <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                <div style={{ marginBottom: '8px', color: '#9ca3af' }}>
                  {logs.filter(l => l.level === 'error' || l.level === 'critical').length} errors • Last 50 entries
                </div>
                {logs.filter(l => l.level === 'error' || l.level === 'critical').slice(-50).reverse().map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '8px',
                      borderBottom: '1px solid #374151',
                      borderLeft: `3px solid ${getLevelColor(log.level)}`,
                      paddingLeft: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#6b7280' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span style={{
                        color: getLevelColor(log.level),
                        fontWeight: 600,
                        textTransform: 'uppercase',
                      }}>
                        {log.level}
                      </span>
                      <span style={{ color: '#9ca3af' }}>[{log.source}]</span>
                    </div>
                    <div style={{ color: '#ef4444', marginBottom: '4px' }}>{log.message}</div>
                    {log.category && (
                      <span style={{
                        background: '#374151',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
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
              <div style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  background: '#000',
                  padding: '12px',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
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
                <form onSubmit={handleConsoleSubmit} style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
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
                      padding: '8px 12px',
                      color: '#e5e7eb',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
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
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
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
                <h3 style={{ marginBottom: '16px', color: '#fff' }}>Application Configuration</h3>
                <div style={{ display: 'grid', gap: '12px' }}>
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
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
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
    padding: '12px',
    background: '#1f2937',
    borderRadius: '6px',
  }}>
    <span style={{ color: '#9ca3af' }}>{label}</span>
    <span style={{ color: '#3b82f6', fontWeight: 500 }}>{value}</span>
  </div>
);
