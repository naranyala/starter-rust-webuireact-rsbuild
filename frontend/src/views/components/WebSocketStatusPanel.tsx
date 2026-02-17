// WebSocket status panel component

import React, { useState } from 'react';
import type { WsStatus } from '../types';

interface WebSocketStatusPanelProps {
  wsStatus: WsStatus;
  onTriggerError?: () => void;
}

export const WebSocketStatusPanel: React.FC<WebSocketStatusPanelProps> = ({ wsStatus, onTriggerError }) => {
  const [expanded, setExpanded] = useState(false);
  const [debugExpanded, setDebugExpanded] = useState(false);

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

  const getConnectionState = () => {
    return (window as any).WebUI?.getConnectionState()?.state || 'unknown';
  };

  const getReadyState = () => {
    const state = (window as any).WebUI?.getReadyState();
    if (state === undefined) return 'unknown';
    return ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][state] || 'UNINSTANTIATED';
  };

  const getReconnectAttempts = () => {
    return (window as any).WebUI?.getConnectionState()?.reconnectAttempts || 0;
  };

  const getLastError = () => {
    return (window as any).WebUI?.getLastError()?.message || 'None';
  };

  return (
    <div
      className="ws-status-panel"
      style={{
        backgroundColor: getStatusColor(),
        borderTop: `2px solid ${getStatusBorder()}`,
      }}
    >
      {/* Main status bar */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          height: '20px',
          minHeight: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 8px',
          cursor: 'pointer',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: getStatusText(),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{getIcon()}</span>
          <span>WS: {wsStatus}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px' }}>{expanded ? '▲' : '▼'}</span>
          <span style={{ fontSize: '10px', opacity: 0.7 }}>|</span>
          <span
            onClick={(e) => { e.stopPropagation(); setDebugExpanded(!debugExpanded); }}
            style={{ fontSize: '10px', cursor: 'pointer' }}
          >
            {debugExpanded ? 'Hide Debug' : 'Show Debug'}
          </span>
        </div>
      </div>

      {/* Expanded WebSocket details */}
      {expanded && (
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#cbd5e1',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ marginBottom: '4px' }}>
            <strong>Status:</strong> {wsStatus.toUpperCase()}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>URL:</strong> {window.location.protocol === 'https:' ? 'wss://' : 'ws://'}{window.location.host}/_webui_ws_connect
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Connection State:</strong> {getConnectionState()}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Ready State:</strong> {getReadyState()}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Reconnect Attempts:</strong> {getReconnectAttempts()}
          </div>
          <div>
            <strong>Last Error:</strong> {getLastError()}
          </div>
        </div>
      )}

      {/* Debug Tools Section */}
      {debugExpanded && (
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#e2e8f0',
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600 }}>🔧 Debug Tools</span>
            <span style={{ opacity: 0.5 }}>|</span>
            <span style={{ fontSize: '10px', opacity: 0.7 }}>Test error handling and boundaries</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                console.log('Test error triggered!');
                throw new Error('🧪 Test error: This is a test error from the Debug Tools panel!');
              }}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
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
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
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
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              ℹ️ Log Info
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
