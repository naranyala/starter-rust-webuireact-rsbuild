#!/usr/bin/env bash

#===============================================================================
# Cross-Platform Distribution Build Script
# Builds self-contained executables for Windows, macOS, and Linux
#===============================================================================

set -e

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S.%3N'
}

# Enhanced logging function
log() {
    local level=$1
    local message=$2
    local timestamp_val=$(timestamp)
    local elapsed=$(( $(date +%s%N) / 1000000 - DIST_START_TIME_MS ))
    
    # Log to console with colors
    case $level in
        "DIST")
            echo -e "\033[32m[$level]\033[0m \033[90m[$timestamp_val]\033[0m \033[36m[$elapsed ms]\033[0m $message"
            ;;
        "WARN")
            echo -e "\033[33m[$level]\033[0m \033[90m[$timestamp_val]\033[0m \033[36m[$elapsed ms]\033[0m $message"
            ;;
        "ERROR")
            echo -e "\033[31m[$level]\033[0m \033[90m[$timestamp_val]\033[0m \033[36m[$elapsed ms]\033[0m $message"
            ;;
        "STEP")
            echo -e "\033[34m[$level]\033[0m \033[90m[$timestamp_val]\033[0m \033[36m[$elapsed ms]\033[0m $message"
            ;;
        "INFO")
            echo -e "\033[36m[$level]\033[0m \033[90m[$timestamp_val]\033[0m \033[36m[$elapsed ms]\033[0m $message"
            ;;
        *)
            echo -e "\033[37m[$level]\033[0m \033[90m[$timestamp_val]\033[0m \033[36m[$elapsed ms]\033[0m $message"
            ;;
    esac
    
    # Log to file in JSON format
    if [ -n "$DIST_BUILD_LOG_FILE" ]; then
        printf '{"timestamp":"%s","level":"%s","message":"%s","elapsed_ms":%d}\n' \
            "$timestamp_val" "$level" "$message" "$elapsed" >> "$DIST_BUILD_LOG_FILE"
    fi
}

# Initialize start time
DIST_START_TIME_MS=$(date +%s%N)/1000000
DIST_BUILD_LOG_FILE=${DIST_BUILD_LOG_FILE:-"./dist-build.log"}

# Clear log file if it exists
if [ -f "$DIST_BUILD_LOG_FILE" ]; then
    rm "$DIST_BUILD_LOG_FILE"
fi

log "INFO" "========================================"
log "INFO" "Cross-Platform Distribution Builder"
log "INFO" "========================================"

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME=""
APP_VERSION="1.0.0"
DIST_DIR="dist"
PLATFORM=""
ARCH=""

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        Linux*)     PLATFORM="linux";;
        Darwin*)    PLATFORM="macos";;
        CYGWIN*|MINGW*|MSYS*) PLATFORM="windows";;
        *)          PLATFORM="unknown";;
    esac
    log "INFO" "Detected platform: $PLATFORM"
}

# Architecture detection
detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64)   ARCH="x64";;
        aarch64|arm64)  ARCH="arm64";;
        armv7l)         ARCH="arm";;
        *)              ARCH="x64";;
    esac
    log "INFO" "Detected architecture: $ARCH"
}

# Read configuration from app.config.toml
read_config() {
    log "STEP" "Reading configuration..."

    if [ -f "app.config.toml" ]; then
        # Read executable name
        APP_NAME=$(grep -A1 '\[executable\]' app.config.toml 2>/dev/null | grep 'name' | cut -d'=' -f2 | tr -d ' "' || echo "app")
        # Read version
        APP_VERSION=$(grep '^version = ' Cargo.toml 2>/dev/null | cut -d'"' -f2 || echo "1.0.0")
    else
        APP_NAME="app"
        APP_VERSION="1.0.0"
    fi

    # Fallback to cargo package name
    if [ -z "$APP_NAME" ]; then
        APP_NAME=$(grep '^name = ' Cargo.toml | head -1 | cut -d'"' -f2 || echo "rustwebui-app")
    fi

    log "DIST" "App name: $APP_NAME"
    log "DIST" "App version: $APP_VERSION"
}

# Check prerequisites
check_prerequisites() {
    log "STEP" "Checking prerequisites..."

    local missing=0

    # Check for Cargo
    if ! command -v cargo &> /dev/null; then
        log "ERROR" "Cargo is not installed. Please install Rust from https://rustup.rs/"
        missing=1
    else
        log "DIST" "Cargo found: $(cargo --version)"
    fi

    # Check for Bun (frontend build)
    if ! command -v bun &> /dev/null; then
        log "WARN" "Bun is not installed. Frontend build may fail."
        log "WARN" "Install Bun from https://bun.sh/"
    else
        log "DIST" "Bun found: $(bun --version)"
    fi

    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# Build frontend
build_frontend() {
    log "STEP" "Building frontend..."

    if [ ! -d "frontend" ]; then
        log "WARN" "Frontend directory not found, skipping frontend build"
        return 0
    fi

    # Install frontend dependencies if needed
    if [ ! -d "frontend/node_modules" ]; then
        log "DIST" "Installing frontend dependencies..."
        cd frontend
        bun install
        cd ..
    fi

    # Build frontend
    if [ -f "build-frontend.js" ]; then
        # Set environment variables for enhanced logging in frontend build
        export BUILD_LOG_LEVEL=${BUILD_LOG_LEVEL:-"info"}
        export BUILD_LOG_TO_FILE=${BUILD_LOG_TO_FILE:-"true"}
        export BUILD_LOG_FILE_PATH="./frontend-dist-build.log"
        
        bun build-frontend.js
        log "DIST" "Frontend built successfully"
    else
        log "WARN" "build-frontend.js not found, skipping frontend build"
    fi

    cd "$SCRIPT_DIR"
}

# Build Rust application
build_rust() {
    log "STEP" "Building Rust application..."

    local build_type="${1:-release}"
    local build_start_time=$(date +%s%N)/1000000

    if [ "$build_type" = "release" ]; then
        cargo build --release
    else
        cargo build
    fi

    local build_duration=$(( $(date +%s%N)/1000000 - build_start_time ))
    log "DIST" "Rust build completed! (Duration: ${build_duration}ms)"
}

# Build for current platform
build_current_platform() {
    local build_type="${1:-release}"

    log "STEP" "Building for current platform ($PLATFORM-$ARCH)..."

    # Build frontend
    build_frontend

    # Build Rust
    build_rust "$build_type"

    log "DIST" "Build completed for $PLATFORM-$ARCH"
}

# Create distribution package
create_dist_package() {
    local build_type="${1:-release}"
    local output_dir="$DIST_DIR/${APP_NAME}-${APP_VERSION}-${PLATFORM}-${ARCH}"

    log "STEP" "Creating distribution package..."

    # Clean and create output directory
    rm -rf "$output_dir"
    mkdir -p "$output_dir"

    # Copy executable
    local exe_name="${APP_NAME}"
    if [ "$PLATFORM" = "windows" ]; then
        exe_name="${APP_NAME}.exe"
    fi

    local source_exe=""
    if [ "$build_type" = "release" ]; then
        source_exe="target/release/${APP_NAME}"
    else
        source_exe="target/debug/${APP_NAME}"
    fi

    # Handle different executable names from cargo
    if [ ! -f "$source_exe" ]; then
        local cargo_name=$(grep '^name = ' Cargo.toml | head -1 | cut -d'"' -f2)
        source_exe="target/${build_type}/${cargo_name}"
    fi

    if [ "$PLATFORM" = "windows" ]; then
        source_exe="${source_exe}.exe"
    fi

    if [ ! -f "$source_exe" ]; then
        log "ERROR" "Executable not found: $source_exe"
        return 1
    fi

    # Copy executable
    cp "$source_exe" "${output_dir}/${exe_name}"
    chmod +x "${output_dir}/${exe_name}"
    log "DIST" "Copied executable: $exe_name"

    # Copy static files (frontend)
    if [ -d "static" ]; then
        cp -r static "$output_dir/"
        log "DIST" "Copied static files"
    fi

    # Copy database (if exists)
    if [ -f "app.db" ]; then
        cp app.db "$output_dir/"
        log "DIST" "Copied database"
    fi

    # Copy configuration
    if [ -f "app.config.toml" ]; then
        cp app.config.toml "$output_dir/"
        log "DIST" "Copied configuration"
    fi

    # Create README for the package
    create_readme "$output_dir"

    # Create startup script (for convenience)
    create_startup_script "$output_dir"

    # Create archive
    create_archive "$output_dir"

    log "DIST" "Distribution package created: $output_dir"

    # Print package size
    local size=$(du -sh "$output_dir" 2>/dev/null | cut -f1 || echo "unknown")
    log "DIST" "Package size: $size"
}

# Create README for distribution
create_readme() {
    local dir="$1"
    local readme_file="${dir}/README.txt"

    cat > "$readme_file" << EOF
================================================================================
${APP_NAME} v${APP_VERSION}
================================================================================

Quick Start:
- ${PLATFORM}-${ARCH} Build

For ${PLATFORM}, simply run:
  ./${APP_NAME}

The application will start a local web server and open your default browser.

Configuration:
- Edit app.config.toml to customize database path, logging, etc.

Features:
- Built with Rust + WebUI + React.js
- SQLite database with bundled SQLite (no external dependencies)
- Self-contained distribution - no runtime dependencies required

================================================================================
EOF

    log "DIST" "Created README.txt"
}

# Create startup script
create_startup_script() {
    local dir="$1"
    local script_file="${dir}/start.sh"

    cat > "$script_file" << 'STARTUP_EOF'
#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Set working directory
export RUSTWEBUI_HOME="$SCRIPT_DIR"

# Run the application
./app "$@"
STARTUP_EOF

    chmod +x "$script_file"
    log "DIST" "Created startup script: start.sh"
}

# Create archive
create_archive() {
    local dir="$1"
    local archive_name=$(basename "$dir")

    log "STEP" "Creating archive..."

    cd "$DIST_DIR"

    case "$PLATFORM" in
        linux)
            tar -czf "${archive_name}.tar.gz" "$archive_name"
            log "DIST" "Created: ${archive_name}.tar.gz"
            ;;
        macos)
            tar -czf "${archive_name}.tar.gz" "$archive_name"
            log "DIST" "Created: ${archive_name}.tar.gz"
            ;;
        windows)
            if command -v zip &> /dev/null; then
                zip -rq "${archive_name}.zip" "$archive_name"
                log "DIST" "Created: ${archive_name}.zip"
            else
                log "WARN" "zip not found, skipping zip archive"
            fi
            ;;
    esac

    cd "$SCRIPT_DIR"
}

# Build and package for current platform
build_and_package() {
    local build_type="${1:-release}"

    log "STEP" "Building and packaging for $PLATFORM-$ARCH..."

    build_current_platform "$build_type"
    create_dist_package "$build_type"

    log "DIST" "Build and package complete!"
}

# Cross-compilation setup (advanced)
setup_cross_compile() {
    log "STEP" "Setting up cross-compilation..."

    case "$1" in
        windows)
            log "INFO" "To cross-compile for Windows from Linux:"
            log "INFO" "  rustup target add x86_64-pc-windows-gnu"
            log "INFO" "  cargo build --release --target x86_64-pc-windows-gnu"
            ;;
        macos)
            log "INFO" "Cross-compilation for macOS requires macOS build machine"
            log "INFO" "or use osxcross (https://github.com/tpoechtrager/osxcross)"
            ;;
        linux)
            log "INFO" "For Linux ARM builds:"
            log "INFO" "  rustup target add aarch64-unknown-linux-gnu"
            log "INFO" "  cargo build --release --target aarch64-unknown-linux-gnu"
            ;;
    esac
}

# Full build for all platforms (requires CI/CD or multiple machines)
build_all_platforms() {
    log "ERROR" "Full cross-platform build requires:"
    log "ERROR" "  1. Multiple build machines (Windows, macOS, Linux)"
    log "ERROR" "  2. Or use GitHub Actions for CI/CD"
    log "ERROR" ""
    log "INFO" "Recommended approach: Use GitHub Actions workflow"
    log "INFO" "See: .github/workflows/cross-build.yml"

    log "STEP" "Building for current platform only..."
    build_and_package "release"
}

# Verify self-contained nature
verify_self_contained() {
    local dir="${1:-$DIST_DIR}/${APP_NAME}-${APP_VERSION}-${PLATFORM}-${ARCH}"

    log "STEP" "Verifying self-contained package..."

    if [ ! -d "$dir" ]; then
        log "ERROR" "Directory not found: $dir"
        return 1
    fi

    # Check for executable
    if [ ! -f "$dir/${APP_NAME}" ]; then
        if [ "$PLATFORM" = "windows" ]; then
            if [ ! -f "$dir/${APP_NAME}.exe" ]; then
                log "ERROR" "Executable not found"
                return 1
            fi
        else
            log "ERROR" "Executable not found"
            return 1
        fi
    fi

    # Check for static files
    if [ ! -d "$dir/static" ]; then
        log "WARN" "Static files directory not found"
    fi

    # Verify no external library dependencies (Linux)
    if [ "$PLATFORM" = "linux" ] && command -v ldd &> /dev/null; then
        log "INFO" "Checking library dependencies..."
        local exe_path="$dir/${APP_NAME}"
        if [ -f "$exe_path" ]; then
            ldd "$exe_path" 2>/dev/null | grep -v "=> /" | grep -v "statically linked" || true
        fi
    fi

    log "DIST" "Verification complete"
}

# Clean distribution directory
clean_dist() {
    log "STEP" "Cleaning distribution directory..."

    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"
        log "DIST" "Cleaned $DIST_DIR"
    else
        log "DIST" "$DIST_DIR already clean"
    fi
}

# Show help
show_help() {
    log "INFO" "Usage: $0 [OPTION]"
    log "INFO" ""
    log "INFO" "Cross-Platform Distribution Build Script"
    log "INFO" ""
    log "INFO" "Options:"
    log "INFO" "  build              Build and create package for current platform"
    log "INFO" "  build-release     Build release version and package (default)"
    log "INFO" "  build-debug       Build debug version and package"
    log "INFO" "  build-frontend     Build frontend only"
    log "INFO" "  build-rust        Build Rust only"
    log "INFO" "  verify            Verify self-contained package"
    log "INFO" "  clean             Clean distribution directory"
    log "INFO" "  cross-setup      Show cross-compilation setup info"
    log "INFO" "  all              Build for all platforms (current platform only)"
    log "INFO" "  help, -h         Show this help message"
    log "INFO" ""
    log "INFO" "Environment Variables:"
    log "INFO" "  BUILD_TYPE        Override build type (release|debug)"
    log "INFO" ""
    log "INFO" "Examples:"
    log "INFO" "  $0 build-release  # Build release package (default)"
    log "INFO" "  $0 build-debug     # Build debug package"
    log "INFO" "  $0 verify          # Verify package"
    log "INFO" "  $0 clean           # Clean dist directory"
    log "INFO" ""
    log "INFO" "Note: Full cross-platform builds (Windows/macOS/Linux) require"
    log "INFO" "      building on each platform or using CI/CD like GitHub Actions."
}

# Main function
main() {
    log "INFO" "========================================"
    log "INFO" "Cross-Platform Distribution Builder"
    log "INFO" "========================================"

    # Detect platform and architecture
    detect_platform
    detect_arch

    # Read configuration
    read_config

    # Show header
    log "INFO" "----------------------------------------"
    log "INFO" "Building: $APP_NAME v$APP_VERSION"
    log "INFO" "Platform: $PLATFORM-$ARCH"
    log "INFO" "----------------------------------------"

    # Process command line arguments
    case "${1:-build-release}" in
        build)
            check_prerequisites
            build_and_package "${BUILD_TYPE:-release}"
            ;;
        build-release)
            check_prerequisites
            build_and_package "release"
            ;;
        build-debug)
            check_prerequisites
            build_and_package "debug"
            ;;
        build-frontend)
            build_frontend
            ;;
        build-rust)
            check_prerequisites
            build_rust "${BUILD_TYPE:-release}"
            ;;
        verify)
            verify_self_contained
            ;;
        clean)
            clean_dist
            ;;
        cross-setup)
            setup_cross_compile "${2:-}"
            ;;
        all)
            check_prerequisites
            build_all_platforms
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    
    local total_elapsed=$(( $(date +%s%N)/1000000 - DIST_START_TIME_MS ))
    log "INFO" "Distribution build process completed! Total duration: ${total_elapsed}ms"
}

# Run main with all arguments
main "$@"
