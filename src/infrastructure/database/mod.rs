//! Database infrastructure - SQLite implementation

use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use anyhow::Result;

/// Database wrapper for SQLite connection
pub struct Database {
    connection: Arc<Mutex<Connection>>,
}

impl Database {
    /// Create a new database connection
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        conn.execute_batch("PRAGMA journal_mode=WAL;")?;
        
        Ok(Self {
            connection: Arc::new(Mutex::new(conn)),
        })
    }
    
    /// Initialize database schema
    pub fn init(&self) -> Result<()> {
        let conn = self.connection.lock().unwrap();
        
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                status TEXT NOT NULL DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;
        
        Ok(())
    }
    
    /// Insert sample data if not exists
    pub fn insert_sample_data(&self) -> Result<()> {
        let conn = self.connection.lock().unwrap();
        
        // Check if data exists
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM users",
            [],
            |row| row.get(0),
        )?;
        
        if count == 0 {
            // Insert sample users
            let users = [
                ("John Doe", "john@example.com", "admin", "active"),
                ("Jane Smith", "jane@example.com", "user", "active"),
                ("Bob Johnson", "bob@example.com", "user", "inactive"),
                ("Alice Brown", "alice@example.com", "editor", "active"),
            ];
            
            for (name, email, role, status) in users {
                conn.execute(
                    "INSERT INTO users (name, email, role, status) VALUES (?1, ?2, ?3, ?4)",
                    (name, email, role, status),
                )?;
            }
        }
        
        Ok(())
    }
    
    /// Get all users
    pub fn get_all_users(&self) -> Result<Vec<crate::domain::User>> {
        use crate::domain::{User, UserRole, UserStatus};
        use chrono::Utc;
        
        let conn = self.connection.lock().unwrap();
        let mut stmt = conn.prepare("SELECT id, name, email, role, status, created_at FROM users")?;
        
        let users = stmt.query_map([], |row| {
            let role_str: String = row.get(3)?;
            let status_str: String = row.get(4)?;;
            let created_at_str: String = row.get(5)?;
            
            let role = match role_str.as_str() {
                "admin" => UserRole::Admin,
                "editor" => UserRole::Editor,
                _ => UserRole::User,
            };
            
            let status = match status_str.as_str() {
                "active" => UserStatus::Active,
                "inactive" => UserStatus::Inactive,
                _ => UserStatus::Pending,
            };
            
            let _created_at = chrono::NaiveDateTime::parse_from_str(&created_at_str, "%Y-%m-%d %H:%M:%S")
                .unwrap_or_else(|_| Utc::now().naive_utc())
                .and_utc();
            
            Ok(User::new(
                row.get(0)?,
                row.get(1)?,
                row.get(2)?,
                role,
                status,
            ))
        })?;
        
        let mut result = Vec::new();
        for user in users {
            result.push(user?);
        }
        
        Ok(result)
    }
    
    /// Get database statistics
    pub fn get_stats(&self) -> Result<crate::domain::DatabaseStats> {
        use crate::domain::DatabaseStats;
        
        let conn = self.connection.lock().unwrap();
        
        let users_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM users",
            [],
            |row| row.get(0),
        )?;
        
        let tables = vec!["users".to_string()];
        
        Ok(DatabaseStats {
            users_count,
            tables,
        })
    }
}
