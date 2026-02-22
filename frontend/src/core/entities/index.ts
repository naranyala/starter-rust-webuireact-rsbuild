/**
 * Core Entities
 * 
 * Entities are the basic data structures used throughout the application.
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'editor' | 'viewer';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  created_at: string;
  updated_at?: string;
}

export interface DatabaseStats {
  users_count: number;
  tables: string[];
  database_size?: number;
}

export interface Counter {
  id: string;
  value: number;
  label: string;
  created_at: string;
  updated_at: string;
}

export interface SystemInfo {
  platform: string;
  user_agent: string;
  language: string;
  screen_resolution: string;
  memory_gb?: number;
  cpu_cores?: number;
  online: boolean;
  timestamp: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  created_at: string;
}
