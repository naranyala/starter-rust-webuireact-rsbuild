#!/bin/bash

# Master build and run script for Rust WebUI Vue project
# This script handles the complete build pipeline for frontend and backend

set -e  # Exit on any error

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Timestamp function
timestamp() {
    date '+%Y-%m-%d %H:%M:%S.%3N'
}

# Enhanced logging function
log() {
    local level=$1
    local message=$2
    local timestamp_val=$(timestamp)
    local elapsed=$(( $(date +%s%N) / 1000000 - START_TIME_MS ))
    
    # Log to console with colors
    case $level in
        "INFO")
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
        *)
            echo -e "\033[37m[$level]\033[0m \033[90m[$timestamp_val]\033[0m \033[36m[$elapsed ms]\033[0m $message"
            ;;
    esac
    
    # Log to file in JSON format
    if [ -n "$BUILD_LOG_FILE" ]; then
        printf '{"timestamp":"%s","level":"%s","message":"%s","elapsed_ms":%d}\n' \
            "$timestamp_val" "$level" "$message" "$elapsed" >> "$BUILD_LOG_FILE"
    fi
}

# Initialize start time
START_TIME_MS=$(date +%s%N)/1000000
BUILD_LOG_FILE=${BUILD_LOG_FILE:-"./build.log"}

# Clear log file if it exists
if [ -f "$BUILD_LOG_FILE" ]; then
    rm "$BUILD_LOG_FILE"
fi

log "INFO" "======================================"
log "INFO" "Rust WebUI Application - Build Script"
log "INFO" "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_prerequisites() {
    log "STEP" "Checking prerequisites..."

    # Check for Bun
    if ! command -v bun &> /dev/null; then
        log "ERROR" "Bun is not installed. Please install Bun from https://bun.sh/"
        exit 1
    fi
    log "INFO" "Bun found: $(bun --version)"

    # Check for Cargo/Rust
    if ! command -v cargo &> /dev/null; then
        log "ERROR" "Cargo is not installed. Please install Rust from https://rustup.rs/"
        exit 1
    fi
    log "INFO" "Cargo found: $(cargo --version)"

    log "INFO" "Prerequisites check completed"
}

# Install frontend dependencies if needed
install_frontend_deps() {
    log "STEP" "Installing frontend dependencies..."

    if [ ! -d "frontend/node_modules" ]; then
        log "INFO" "Installing npm packages..."
        cd frontend
        bun install
        cd ..
        log "INFO" "Frontend dependencies installed!"
    else
        log "INFO" "Frontend dependencies already installed."
    fi

    log "INFO" "Frontend dependencies installation completed"
}

# Build frontend
build_frontend() {
    log "STEP" "Building frontend..."

    if [ ! -f "build-frontend.js" ]; then
        log "ERROR" "build-frontend.js not found!"
        exit 1
    fi

    # Set environment variables for enhanced logging in frontend build
    export BUILD_LOG_LEVEL=${BUILD_LOG_LEVEL:-"info"}
    export BUILD_LOG_TO_FILE=${BUILD_LOG_TO_FILE:-"true"}
    export BUILD_LOG_FILE_PATH="./frontend-build.log"
    
    bun build-frontend.js

    if [ ! -d "frontend/dist" ]; then
        log "ERROR" "Frontend build failed - dist directory not found!"
        exit 1
    fi

    log "INFO" "Frontend build completed!"

    # Log build metrics
    if [ -d "frontend/dist" ]; then
        local js_files=$(find frontend/dist -name "*.js" | wc -l)
        local css_files=$(find frontend/dist -name "*.css" | wc -l)
        local total_size=$(du -sh frontend/dist 2>/dev/null | cut -f1)
        log "INFO" "Frontend build metrics: ${js_files} JS files, ${css_files} CSS files, ${total_size} total size"
    fi
}

# Build Rust application
build_rust() {
    log "STEP" "Building Rust application..."

    # Clean previous build artifacts if requested
    if [ "$1" == "--clean" ]; then
        log "INFO" "Cleaning previous Rust build..."
        cargo clean
    fi

    # Record start time for Rust build
    local rust_build_start=$(date +%s%N)/1000000
    
    # Build the Rust application
    cargo build
    
    local rust_build_duration=$(( $(date +%s%N)/1000000 - rust_build_start ))

    if [ ! -f "target/debug/rustwebui-app" ]; then
        log "ERROR" "Rust build failed - executable not found!"
        exit 1
    fi

    log "INFO" "Rust build completed! (Duration: ${rust_build_duration}ms)"

    # Log build metrics
    if [ -f "target/debug/rustwebui-app" ]; then
        local binary_size=$(stat -c%s "target/debug/rustwebui-app" 2>/dev/null)
        log "INFO" "Rust binary size: ${binary_size} bytes"
    fi
}

# Run post-build script
post_build() {
    log "STEP" "Running post-build steps..."

    if [ -f "post-build.sh" ]; then
        chmod +x post-build.sh
        ./post-build.sh
        log "INFO" "Post-build completed!"
    else
        log "WARN" "post-build.sh not found - skipping post-build steps"
    fi
}

# Build release version
build_release() {
    log "STEP" "Building release version..."

    # Build frontend for production
    cd frontend
    bun install
    bun run build:incremental
    cd ..

    # Build Rust in release mode
    local release_build_start=$(date +%s%N)/1000000
    cargo build --release
    local release_build_duration=$(( $(date +%s%N)/1000000 - release_build_start ))

    # Run post-build for release
    if [ -f "post-build.sh" ]; then
        chmod +x post-build.sh
        ./post-build.sh
    fi

    log "INFO" "Release build completed! (Duration: ${release_build_duration}ms)"

    # Log release build metrics
    if [ -f "target/release/rustwebui-app" ]; then
        local release_binary_size=$(stat -c%s "target/release/rustwebui-app" 2>/dev/null)
        log "INFO" "Release binary size: ${release_binary_size} bytes"
    fi
}

# Run the application
run_app() {
    log "STEP" "Running application..."

    # Determine which executable to run
    if [ -f "target/debug/app" ]; then
        log "INFO" "Running debug version..."
        ./target/debug/app
    elif [ -f "target/release/app" ]; then
        log "INFO" "Running release version..."
        ./target/release/app
    elif [ -f "target/debug/rustwebui-app" ]; then
        log "WARN" "Using unrenamed executable..."
        ./target/debug/rustwebui-app
    else
        log "ERROR" "No executable found. Please build first."
        exit 1
    fi
}

# Clean all build artifacts
clean_all() {
    log "STEP" "Cleaning all build artifacts..."

    # Clean Rust build
    if [ -d "target" ]; then
        cargo clean
        log "INFO" "Rust build artifacts cleaned"
    fi

    # Clean frontend build
    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        log "INFO" "Frontend dist cleaned"
    fi

    # Clean caches
    if [ -d "frontend/node_modules/.cache" ]; then
        rm -rf frontend/node_modules/.cache
        log "INFO" "Frontend cache cleaned"
    fi

    # Remove lock files
    rm -f Cargo.lock

    log "INFO" "All build artifacts cleaned!"
}

# Show help
show_help() {
    log "INFO" "Usage: $0 [OPTION]"
    log "INFO" ""
    log "INFO" "Options:"
    log "INFO" "  (no option)      Build and run the application (default)"
    log "INFO" "  --build           Build only (frontend + Rust)"
    log "INFO" "  --build-frontend  Build frontend only"
    log "INFO" "  --build-rust     Build Rust only"
    log "INFO" "  --release        Build release version"
    log "INFO" "  --run            Run the application (requires build)"
    log "INFO" "  --clean          Clean all build artifacts"
    log "INFO" "  --rebuild        Clean and rebuild everything"
    log "INFO" "  --help, -h       Show this help message"
    log "INFO" ""
    log "INFO" "Examples:"
    log "INFO" "  $0               # Build and run"
    log "INFO" "  $0 --build       # Build only"
    log "INFO" "  $0 --rebuild     # Clean and rebuild"
    log "INFO" "  $0 --release     # Build release version"
    log "INFO" ""
}

# Main execution
main() {
    log "INFO" "Starting build process with arguments: $*"
    
    case "${1:-}" in
        --build)
            check_prerequisites
            install_frontend_deps
            build_frontend
            build_rust
            post_build
            log "INFO" "Build completed successfully!"
            ;;
        --build-frontend)
            check_prerequisites
            install_frontend_deps
            build_frontend
            log "INFO" "Frontend build completed successfully!"
            ;;
        --build-rust)
            check_prerequisites
            build_rust
            post_build
            log "INFO" "Rust build completed successfully!"
            ;;
        --release)
            check_prerequisites
            build_release
            log "INFO" "Release build completed successfully!"
            ;;
        --run)
            run_app
            ;;
        --clean)
            clean_all
            log "INFO" "Clean completed successfully!"
            ;;
        --rebuild)
            clean_all
            check_prerequisites
            install_frontend_deps
            build_frontend
            build_rust
            post_build
            log "INFO" "Rebuild completed successfully!"
            ;;
        --help|-h)
            show_help
            ;;
        "")
            # Default: build and run
            check_prerequisites
            install_frontend_deps
            build_frontend
            build_rust
            post_build
            log "INFO" "Build completed successfully, starting application..."
            run_app
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
    
    local total_elapsed=$(( $(date +%s%N)/1000000 - START_TIME_MS ))
    log "INFO" "Build process completed! Total duration: ${total_elapsed}ms"
}

# Run main function with all arguments
main "$@"
