#!/bin/bash

# Mosca Tee Flatpak Build Script
# This script builds and installs Mosca Tee as a Flatpak

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FLATPAK_ID="com.moscatee.MoscaTee"
MANIFEST_FILE="com.moscatee.MoscaTee.yml"
BUILD_DIR="build"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Mosca Tee Flatpak Builder${NC}"
echo -e "${YELLOW}========================================${NC}"

# Check if flatpak-builder is installed
if ! command -v flatpak-builder &> /dev/null; then
    echo -e "${RED}Error: flatpak-builder is not installed.${NC}"
    echo "Install it with: sudo apt install flatpak flatpak-builder"
    exit 1
fi

# Check if manifest exists
if [ ! -f "$MANIFEST_FILE" ]; then
    echo -e "${RED}Error: $MANIFEST_FILE not found.${NC}"
    exit 1
fi

# Create build directory
mkdir -p "$BUILD_DIR"

echo -e "${GREEN}Building Flatpak...${NC}"
flatpak-builder \
    --force-clean \
    --user \
    --install \
    "$BUILD_DIR" \
    "$MANIFEST_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Flatpak built and installed successfully!${NC}"
    echo -e "${YELLOW}To run: flatpak run $FLATPAK_ID${NC}"
else
    echo -e "${RED}✗ Flatpak build failed.${NC}"
    exit 1
fi
