// Type definitions for App component

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export interface DbStats {
  users: number;
  tables: string[];
}

export interface WindowState {
  id: string;
  title: string;
  minimized: boolean;
  maximized?: boolean;
  focused: boolean;
  createdAt: number;
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export interface Logger {
  info: (message: string, meta?: Record<string, any>) => void;
  warn: (message: string, meta?: Record<string, any>) => void;
  error: (message: string, meta?: Record<string, any>) => void;
  debug: (message: string, meta?: Record<string, any>) => void;
}

export interface WindowGlobal {
  WinBox: any;
  getUsers?: () => void;
  getDbStats?: () => void;
  refreshUsers?: () => void;
  searchUsers?: () => void;
  Logger?: Logger;
  WebUI?: {
    isConnected: () => boolean;
    getConnectionState: () => { state: string; reconnectAttempts: number };
    getReadyState: () => number;
    getLastError: () => { message: string } | null;
    send: (data: any) => boolean;
    onMessage: (callback: (data: any) => void) => void;
  };
  webui?: {
    call: (functionName: string, data: any) => boolean;
  };
}
