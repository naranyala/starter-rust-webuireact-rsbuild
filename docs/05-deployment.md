# Deployment Guide

This guide covers production deployment procedures, distribution packaging, and platform-specific builds.

## Production Build

### Full Production Build

```bash
# Clean previous builds
./run.sh --clean

# Build with optimizations
./run.sh --release
```

### Manual Production Build

#### Backend

```bash
# Release build with optimizations
cargo build --release

# Binary location
# target/release/rustwebui-app
```

#### Frontend

```bash
cd frontend

# Production build
bun run build

# Built files location
# frontend/dist/
```

### Build Verification

```bash
# Verify backend binary
ls -la target/release/app
file target/release/app

# Verify frontend build
ls -la frontend/dist/
cat frontend/dist/index.html
```

## Distribution Packaging

### Using Build Script

```bash
# Build distribution package
./build-dist.sh
```

### Manual Packaging

```bash
# Create distribution directory
mkdir -p dist/rustwebui-app
mkdir -p dist/rustwebui-app/frontend

# Copy binary
cp target/release/app dist/rustwebui-app/

# Copy frontend files
cp -r frontend/dist/* dist/rustwebui-app/frontend/

# Copy configuration
cp app.config.toml dist/rustwebui-app/

# Create archive
cd dist
tar -czf rustwebui-app-linux.tar.gz rustwebui-app/
```

### Distribution Contents

```
rustwebui-app/
├── app                      # Main executable
├── app.config.toml          # Configuration file
├── frontend/
│   ├── index.html           # Main HTML file
│   ├── static/
│   │   ├── js/              # JavaScript bundles
│   │   └── css/             # CSS files
│   └── winbox.min.js        # Window library
│   └── winbox.min.css       # Window styles
└── application.log          # Log file (created on first run)
```

## Platform-Specific Builds

### Linux

#### Current Distribution

```bash
# Build for current Linux distribution
cargo build --release

# Verify binary
ldd target/release/app
```

#### Universal Linux (musl)

```bash
# Install musl target
rustup target add x86_64-unknown-linux-musl

# Install musl tools (Debian/Ubuntu)
sudo apt-get install musl-tools

# Build static binary
cargo build --release --target x86_64-unknown-linux-musl
```

#### ARM64 (Raspberry Pi, etc.)

```bash
# Install ARM64 target
rustup target add aarch64-unknown-linux-gnu

# Install cross-compilation tools
sudo apt-get install gcc-aarch64-linux-gnu

# Build for ARM64
cargo build --release --target aarch64-unknown-linux-gnu
```

### macOS

#### Intel macOS

```bash
# Build for Intel macOS
rustup target add x86_64-apple-darwin
cargo build --release --target x86_64-apple-darwin
```

#### Apple Silicon (M1/M2/M3)

```bash
# Build for Apple Silicon
rustup target add aarch64-apple-darwin
cargo build --release --target aarch64-apple-darwin
```

#### Universal Binary

```bash
# Build both architectures
cargo build --release --target aarch64-apple-darwin
cargo build --release --target x86_64-apple-darwin

# Create universal binary
lipo -create \
  target/aarch64-apple-darwin/release/rustwebui-app \
  target/x86_64-apple-darwin/release/rustwebui-app \
  -output target/release/rustwebui-app-universal
```

### Windows

#### Native Windows Build

```bash
# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Build for Windows (from Windows)
cargo build --release --target x86_64-pc-windows-msvc
```

#### Cross-Compile from Linux

```bash
# Install mingw-w64
sudo apt-get install mingw-w64

# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Configure linker (.cargo/config.toml)
[target.x86_64-pc-windows-msvc]
linker = "x86_64-w64-mingw32-gcc"

# Build for Windows
cargo build --release --target x86_64-pc-windows-msvc
```

#### Windows Installer (WiX)

```bash
# Install cargo-wix
cargo install cargo-wix

# Build installer
cargo wix
```

## Configuration for Production

### Production Configuration

Edit app.config.toml:

```toml
[app]
name = "Rust WebUI Application"
version = "1.0.0"

[database]
path = "/var/lib/rustwebui-app/app.db"
create_sample_data = false

[window]
title = "Rust WebUI Application"
width = 1200
height = 800
min_width = 800
min_height = 600
resizable = true

[logging]
level = "warn"
file = "/var/log/rustwebui-app/application.log"
append = true

[features]
dark_mode = true
show_tray_icon = false
```

### Production Considerations

1. Set create_sample_data = false
2. Set logging level to warn or error
3. Use absolute paths for database and logs
4. Configure appropriate window size
5. Disable development features

## Running in Production

### Direct Execution

```bash
# Run the application
./app

# Run with custom config
./app --config /etc/rustwebui-app/app.config.toml
```

### As a System Service (Linux)

#### systemd Service

Create /etc/systemd/system/rustwebui-app.service:

```ini
[Unit]
Description=Rust WebUI Application
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/rustwebui-app
ExecStart=/opt/rustwebui-app/app
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rustwebui-app

# Security hardening
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/lib/rustwebui-app /var/log/rustwebui-app

[Install]
WantedBy=multi-user.target
```

```bash
# Create directories
sudo mkdir -p /opt/rustwebui-app
sudo mkdir -p /var/lib/rustwebui-app
sudo mkdir -p /var/log/rustwebui-app

# Copy application
sudo cp target/release/app /opt/rustwebui-app/
sudo cp app.config.toml /opt/rustwebui-app/
sudo cp -r frontend/dist/* /opt/rustwebui-app/frontend/

# Set permissions
sudo chown -R www-data:www-data /opt/rustwebui-app
sudo chown -R www-data:www-data /var/lib/rustwebui-app
sudo chown -R www-data:www-data /var/log/rustwebui-app

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable rustwebui-app
sudo systemctl start rustwebui-app
sudo systemctl status rustwebui-app
```

#### Service Management

```bash
# View logs
journalctl -u rustwebui-app -f

# Restart service
sudo systemctl restart rustwebui-app

# Stop service
sudo systemctl stop rustwebui-app

# Disable service
sudo systemctl disable rustwebui-app
```

### macOS Launch Agent

Create ~/Library/LaunchAgents/com.rustwebui-app.plist:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.rustwebui-app</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Applications/rustwebui-app.app/Contents/MacOS/app</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

```bash
# Load agent
launchctl load ~/Library/LaunchAgents/com.rustwebui-app.plist

# Unload agent
launchctl unload ~/Library/LaunchAgents/com.rustwebui-app.plist
```

### Windows Service

Use NSSM (Non-Sucking Service Manager):

```batch
:: Download NSSM from https://nssm.cc/download

:: Install service
nssm install rustwebui-app "C:\Program Files\rustwebui-app\app.exe"

:: Configure service
nssm set rustwebui-app DisplayName "Rust WebUI Application"
nssm set rustwebui-app StartService SERVICE_AUTO_START
nssm set rustwebui-app AppDirectory "C:\Program Files\rustwebui-app"

:: Start service
nssm start rustwebui-app
```

## Docker Deployment

### Dockerfile

```dockerfile
# Build stage
FROM rust:1.75 as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-dev \
    libgtk-3-dev \
    libsoup-3.0-dev \
    libjavascriptcoregtk-4.1-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Copy source
COPY src ./src
COPY build.rs ./
COPY frontend ./frontend

# Build frontend
RUN cd frontend && bun install && bun run build

# Build backend
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.1-0 \
    libgtk-3-0 \
    libsoup-3.0-0 \
    libjavascriptcoregtk-4.1-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary and frontend
COPY --from=builder /app/target/release/app ./
COPY --from=builder /app/frontend/dist ./frontend
COPY app.config.toml ./

# Create non-root user
RUN useradd -r -u 1000 appuser
USER appuser

# Expose ports
EXPOSE 8080 9000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD curl -f http://localhost:8080/ || exit 1

# Run application
CMD ["./app"]
```

### Build and Run

```bash
# Build image
docker build -t rustwebui-app:latest .

# Run container
docker run -d \
  --name rustwebui-app \
  -p 8080:8080 \
  -p 9000:9000 \
  -v rustwebui-data:/app \
  rustwebui-app:latest

# View logs
docker logs -f rustwebui-app

# Stop container
docker stop rustwebui-app

# Remove container
docker rm rustwebui-app
```

### Docker Compose

Create docker-compose.yml:

```yaml
version: '3.8'

services:
  rustwebui-app:
    build: .
    ports:
      - "8080:8080"
      - "9000:9000"
    volumes:
      - rustwebui-data:/app
    environment:
      - RUST_LOG=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  rustwebui-data:
```

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Database Migration

### Backup Database

```bash
# Copy database file
cp app.db app.db.backup.$(date +%Y%m%d)

# SQLite backup
sqlite3 app.db ".backup 'app.db.backup.$(date +%Y%m%d)'"

# Export to SQL
sqlite3 app.db ".dump" > backup.sql
```

### Restore Database

```bash
# Stop application
# Copy backup
cp app.db.backup.YYYYMMDD app.db

# Or restore from SQL dump
sqlite3 app.db < backup.sql

# Start application
```

### Migrate Schema

```bash
# 1. Backup existing database
cp app.db app.db.backup

# 2. Export data
sqlite3 app.db ".dump users" > users.sql

# 3. Apply schema changes
sqlite3 app.db < schema_changes.sql

# 4. Import data
sqlite3 app.db < users.sql

# 5. Verify
sqlite3 app.db "SELECT COUNT(*) FROM users;"
```

## Monitoring

### Log Files

```bash
# View logs
tail -f application.log

# View last 100 lines
tail -n 100 application.log

# Search for errors
grep "ERROR" application.log

# Search by timestamp
grep "2024-" application.log

# Rotate logs
logrotate /etc/logrotate.d/rustwebui-app
```

### Health Checks

```bash
# Check HTTP server
curl http://localhost:8080

# Check WebSocket (using websocat)
websocat ws://localhost:9000

# Check process
ps aux | grep rustwebui-app

# Check ports
lsof -i :8080
lsof -i :9000
```

### Metrics to Monitor

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Uptime | Application running time | < 99.9% |
| Memory Usage | RSS memory | > 500 MB |
| CPU Usage | CPU utilization | > 80% |
| Database Size | app.db file size | > 1 GB |
| Error Rate | Errors per minute | > 10/min |
| WebSocket Connections | Active connections | > 100 |
| Response Time | HTTP response time | > 1s |

### Prometheus Metrics (Optional)

Add prometheus exporter:

```rust
// In main.rs
use prometheus::{Registry, Counter, Gauge};

let registry = Registry::new();
let requests = Counter::new("requests_total", "Total requests")?;
let memory = Gauge::new("memory_bytes", "Memory usage")?;
registry.register(Box::new(requests))?;
registry.register(Box::new(memory))?;
```

## Security Considerations

### File Permissions

```bash
# Set appropriate permissions
chmod 755 app
chmod 644 app.config.toml
chmod 644 app.db

# Set ownership
chown www-data:www-data app.db
chown www-data:www-data application.log
```

### Network Security

```bash
# Firewall rules (ufw)
sudo ufw allow 8080/tcp
sudo ufw allow 9000/tcp

# Or restrict to localhost
sudo ufw allow from 127.0.0.1 to any port 8080
sudo ufw allow from 127.0.0.1 to any port 9000
```

### Data Security

```bash
# Encrypt sensitive configuration
# Use environment variables for secrets
export DATABASE_PASSWORD="secret"

# Backup encryption
gpg -c app.db.backup
```

## Update Procedure

### Zero-Downtime Update

```bash
# 1. Backup current installation
cp -r /opt/rustwebui-app /opt/rustwebui-app.backup

# 2. Backup database
cp /var/lib/rustwebui-app/app.db /var/lib/rustwebui-app/app.db.backup

# 3. Stop application
sudo systemctl stop rustwebui-app

# 4. Deploy new version
cp target/release/app /opt/rustwebui-app/

# 5. Run migrations if needed
# ./run-migrations.sh

# 6. Start application
sudo systemctl start rustwebui-app

# 7. Verify functionality
curl http://localhost:8080

# 8. Monitor for issues
journalctl -u rustwebui-app -f
```

### Rollback Procedure

```bash
# 1. Stop application
sudo systemctl stop rustwebui-app

# 2. Restore previous version
cp /opt/rustwebui-app.backup/app /opt/rustwebui-app/

# 3. Restore database if needed
cp /var/lib/rustwebui-app/app.db.backup /var/lib/rustwebui-app/app.db

# 4. Start application
sudo systemctl start rustwebui-app

# 5. Verify
curl http://localhost:8080
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
journalctl -u rustwebui-app -n 50

# Check ports
lsof -i :8080 -i :9000

# Check permissions
ls -la /opt/rustwebui-app/

# Check dependencies
ldd /opt/rustwebui-app/app
```

### Database Issues

```bash
# Check database integrity
sqlite3 app.db "PRAGMA integrity_check;"

# Remove lock files
rm app.db-shm app.db-wal

# Vacuum database
sqlite3 app.db "VACUUM;"
```

### Frontend Not Loading

```bash
# Check frontend files
ls -la /opt/rustwebui-app/frontend/

# Check HTTP server logs
journalctl -u rustwebui-app | grep HTTP

# Check browser console
# Open DevTools > Console
```

## Next Steps

- Read the [Getting Started Guide](./01-getting-started.md) for initial setup
- Read the [Architecture Guide](./02-architecture.md) for system design
- Read the [Development Guide](./03-development.md) for development workflows
