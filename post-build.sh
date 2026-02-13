#!/usr/bin/env bash

# Post-build script to rename the executable and prepare distribution
# This script runs after cargo build completes

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
    local elapsed=$(( $(date +%s%N) / 1000000 - POST_BUILD_START_TIME_MS ))
    
    # Log to console with colors
    case $level in
        "POST")
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
    if [ -n "$POST_BUILD_LOG_FILE" ]; then
        printf '{"timestamp":"%s","level":"%s","message":"%s","elapsed_ms":%d}\n' \
            "$timestamp_val" "$level" "$message" "$elapsed" >> "$POST_BUILD_LOG_FILE"
    fi
}

# Initialize start time
POST_BUILD_START_TIME_MS=$(date +%s%N)/1000000
POST_BUILD_LOG_FILE=${POST_BUILD_LOG_FILE:-"./post-build.log"}

# Clear log file if it exists
if [ -f "$POST_BUILD_LOG_FILE" ]; then
    rm "$POST_BUILD_LOG_FILE"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log "INFO" "============================================="
log "INFO" "Post-build Configuration"
log "INFO" "============================================="

# Read executable name from config
EXECUTABLE_NAME=$(grep -A1 '\[executable\]' app.config.toml 2>/dev/null | grep 'name' | cut -d'=' -f2 | tr -d ' "' || echo "app")

if [ -z "$EXECUTABLE_NAME" ]; then
    EXECUTABLE_NAME="app"
fi

log "POST" "Configured executable name: $EXECUTABLE_NAME"

# Get the package name from Cargo.toml
PACKAGE_NAME=$(grep '^name = ' Cargo.toml | head -1 | cut -d'"' -f2)

# Define source and target paths
SOURCE_BIN="target/debug/$PACKAGE_NAME"
SOURCE_BIN_RELEASE="target/release/$PACKAGE_NAME"
TARGET_BIN="target/debug/$EXECUTABLE_NAME"
TARGET_BIN_RELEASE="target/release/$EXECUTABLE_NAME"

# Rename debug build
if [ -f "$SOURCE_BIN" ]; then
    if [ "$SOURCE_BIN" != "$TARGET_BIN" ]; then
        log "POST" "Renaming debug binary: $PACKAGE_NAME -> $EXECUTABLE_NAME"
        mv "$SOURCE_BIN" "$TARGET_BIN"
    else
        log "POST" "Debug binary already named: $EXECUTABLE_NAME"
    fi
fi

# Rename release build
if [ -f "$SOURCE_BIN_RELEASE" ]; then
    if [ "$SOURCE_BIN_RELEASE" != "$TARGET_BIN_RELEASE" ]; then
        log "POST" "Renaming release binary: $PACKAGE_NAME -> $EXECUTABLE_NAME"
        mv "$SOURCE_BIN_RELEASE" "$TARGET_BIN_RELEASE"
    else
        log "POST" "Release binary already named: $EXECUTABLE_NAME"
    fi
fi

# Also handle Windows .exe files
if [ -f "$SOURCE_BIN.exe" ]; then
    log "POST" "Renaming debug binary (Windows): $PACKAGE_NAME.exe -> $EXECUTABLE_NAME.exe"
    mv "$SOURCE_BIN.exe" "$TARGET_BIN.exe"
fi

if [ -f "$SOURCE_BIN_RELEASE.exe" ]; then
    log "POST" "Renaming release binary (Windows): $PACKAGE_NAME.exe -> $EXECUTABLE_NAME.exe"
    mv "$SOURCE_BIN_RELEASE.exe" "$TARGET_BIN_RELEASE.exe"
fi

# Verify static linking (Linux)
if [ -f "$TARGET_BIN_RELEASE" ]; then
    log "INFO" "Verifying static linking..."
    if command -v ldd &> /dev/null; then
        log "INFO" "Library dependencies for release build:"
        ldd "$TARGET_BIN_RELEASE" 2>/dev/null | head -20 || log "INFO" "(statically linked or ldd not available)"
    fi
fi

log "INFO" "============================================="
log "INFO" "Post-build configuration complete!"
log "INFO" "============================================="
log "POST" "Executable: $EXECUTABLE_NAME"
log "INFO" "To run:"
log "INFO" "  Debug:   ./$TARGET_BIN"
log "INFO" "  Release: ./$TARGET_BIN_RELEASE"
log "INFO" "For distribution builds, run:"
log "INFO" "  ./build-dist.sh build-release"
log "INFO" "============================================="

TOTAL_ELAPSED=$(( $(date +%s%N)/1000000 - POST_BUILD_START_TIME_MS ))
log "INFO" "Post-build process completed! Total duration: ${TOTAL_ELAPSED}ms"
