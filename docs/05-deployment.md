# Deployment Guide

This guide covers deployment procedures for production environments.

## Build for Production

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

# The binary will be at:
# target/release/rustwebui-app
```

#### Frontend

```bash
cd frontend

# Production build
bun run build

# The built files will be at:
# frontend/dist/
```

## Distribution Packaging

### Using Build Script

```bash
# Build distribution package
./build-dist.sh
```

### Manual Packaging

1. Build the application
2. Copy the binary and frontend files
3. Include configuration files
4. Create archive

```bash
# Create distribution directory
mkdir -p dist/rustwebui-app
mkdir -p dist/rustwebui-app/frontend

# Copy binary
cp target/release/rustwebui-app dist/rustwebui-app/

# Copy frontend
cp -r frontend/dist/* dist/rustwebui-app/frontend/

# Copy configuration
cp app.config.toml dist/rustwebui-app/

# Create archive
cd dist
tar -czf rustwebui-app.tar.gz rustwebui-app/
```

## Platform-Specific Builds

### Linux

```bash
# Build for current Linux distribution
cargo build --release

# For specific Linux distributions, use appropriate toolchain
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl
```

### macOS

```bash
# Build for macOS
cargo build --release

# For universal binary (Intel + Apple Silicon)
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
cargo build --release --target aarch64-apple-darwin
cargo build --release --target x86_64-apple-darwin
lipo -create target/aarch64-apple-darwin/release/rustwebui-app \
       target/x86_64-apple-darwin/release/rustwebui-app \
       -output target/release/rustwebui-app-universal
```

### Windows

```bash
# Install Windows target
rustup target add x86_64-pc-windows-msvc

# Build for Windows (from Windows or cross-compile)
cargo build --release --target x86_64-pc-windows-msvc
```

## Configuration for Production

### app.config.toml

```toml
[app]
name = "Rust WebUI App"
version = "1.0.0"

[database]
path = "app.db"
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
file = "application.log"
append = true

[features]
dark_mode = true
show_tray_icon = false
```

### Production Considerations

- Set `create_sample_data = false`
- Set logging level to `warn` or `error`
- Use absolute paths for database if needed
- Configure appropriate window size

## Running in Production

### Direct Execution

```bash
# Run the application
./rustwebui-app
```

### As a Service (Linux)

#### systemd Service

Create `/etc/systemd/system/rustwebui-app.service`:

```ini
[Unit]
Description=Rust WebUI Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/rustwebui-app
ExecStart=/opt/rustwebui-app/rustwebui-app
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable rustwebui-app
sudo systemctl start rustwebui-app
sudo systemctl status rustwebui-app
```

### Docker Deployment

#### Dockerfile

```dockerfile
FROM rust:1.70 as builder

WORKDIR /app

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

# Runtime image
FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.0-dev \
    libgtk-3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/rustwebui-app ./
COPY --from=builder /app/frontend/dist ./frontend
COPY app.config.toml ./

EXPOSE 8080 9000

CMD ["./rustwebui-app"]
```

#### Build and Run

```bash
# Build image
docker build -t rustwebui-app .

# Run container
docker run -p 8080:8080 -p 9000:9000 rustwebui-app
```

## Database Migration

### Backup Database

```bash
# Copy database file
cp app.db app.db.backup

# Or use SQLite backup
sqlite3 app.db ".backup 'app.db.backup'"
```

### Restore Database

```bash
# Stop application
# Copy backup
cp app.db.backup app.db
# Start application
```

### Migrate Schema

For schema changes:

1. Backup existing database
2. Export data
3. Apply schema changes
4. Import data
5. Test thoroughly

## Monitoring

### Log Files

Application logs are written to `application.log` by default.

```bash
# View logs
tail -f application.log

# Search logs
grep "ERROR" application.log

# Rotate logs (configure logrotate)
```

### Health Checks

```bash
# Check HTTP server
curl http://localhost:8080

# Check WebSocket (manual or automated)
# Use WebSocket client to connect to ws://localhost:9000
```

### Metrics to Monitor

- Application uptime
- Memory usage
- CPU usage
- Database size
- Error rate
- WebSocket connections

## Troubleshooting

### Application Won't Start

1. Check logs: `tail -f application.log`
2. Check ports: `lsof -i :8080 -i :9000`
3. Check permissions: `ls -la rustwebui-app`
4. Check dependencies: `ldd rustwebui-app` (Linux)

### Database Issues

1. Check database file permissions
2. Remove lock files: `rm app.db-shm app.db-wal`
3. Verify database integrity: `sqlite3 app.db "PRAGMA integrity_check;"`

### Frontend Not Loading

1. Check frontend files exist in `frontend/dist/`
2. Check HTTP server logs
3. Check browser console for errors
4. Verify file permissions

## Security Considerations

### File Permissions

```bash
# Set appropriate permissions
chmod 755 rustwebui-app
chmod 644 app.config.toml
chmod 644 app.db
```

### Network Security

- Use firewall to restrict access if needed
- Consider HTTPS for production (requires WebUI configuration)
- Implement authentication if exposing externally

### Data Security

- Encrypt sensitive configuration
- Backup database regularly
- Implement proper access controls

## Update Procedure

1. Backup current installation
2. Backup database
3. Stop application
4. Deploy new version
5. Run migrations if needed
6. Start application
7. Verify functionality
8. Monitor for issues

## Next Steps

- Read the [Getting Started Guide](./01-getting-started.md) for initial setup
- Read the [Architecture Guide](./02-architecture.md) for system design
- Read the [Development Guide](./03-development.md) for development workflows
