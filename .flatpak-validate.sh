#!/bin/bash

# Mosca Tee Flatpak Validation Script
# This script validates your environment for Flatpak building
# Run this on Linux Mint before building

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Mosca Tee Flatpak Environment Validator${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if command exists
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

# Track failures
FAILED=0

echo -e "${YELLOW}Checking required tools...${NC}"
echo ""

# Check for flatpak
if ! check_command flatpak; then
    echo -e "${RED}  Install with: sudo apt install flatpak${NC}"
    FAILED=$((FAILED + 1))
fi

# Check for flatpak-builder
if ! check_command flatpak-builder; then
    echo -e "${RED}  Install with: sudo apt install flatpak-builder${NC}"
    FAILED=$((FAILED + 1))
fi

# Check for git
if ! check_command git; then
    echo -e "${RED}  Install with: sudo apt install git${NC}"
    FAILED=$((FAILED + 1))
fi

# Check for required runtimes
echo ""
echo -e "${YELLOW}Checking Flatpak runtimes...${NC}"
echo ""

REQUIRED_RUNTIMES=(
    "org.freedesktop.Platform/x86_64/23.08"
    "org.freedesktop.Sdk/x86_64/23.08"
    "org.freedesktop.Sdk.Extension.node18/x86_64/23.08"
    "org.electronjs.Electron2.BaseApp/x86_64/23.08"
)

for runtime in "${REQUIRED_RUNTIMES[@]}"; do
    if flatpak info "$runtime" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $runtime is installed"
    else
        echo -e "${RED}✗${NC} $runtime is NOT installed"
        echo -e "${YELLOW}  Install with: sudo flatpak install flathub $runtime${NC}"
        FAILED=$((FAILED + 1))
    fi
done

# Check disk space
echo ""
echo -e "${YELLOW}Checking disk space...${NC}"
echo ""

AVAILABLE_SPACE=$(df -BG . | tail -1 | awk '{print $(NF-2)}' | sed 's/G//')
REQUIRED_SPACE=5

if [ "$AVAILABLE_SPACE" -ge "$REQUIRED_SPACE" ]; then
    echo -e "${GREEN}✓${NC} Sufficient disk space: ${AVAILABLE_SPACE}GB available (need ${REQUIRED_SPACE}GB)"
else
    echo -e "${RED}✗${NC} Insufficient disk space: ${AVAILABLE_SPACE}GB available (need ${REQUIRED_SPACE}GB)"
    FAILED=$((FAILED + 1))
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Ready to build Flatpak${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Clone the repository: git clone https://github.com/moscatee/mosca-tee.git"
    echo "2. Enter directory: cd mosca-tee"
    echo "3. Make build script executable: chmod +x .flatpak-build.sh"
    echo "4. Run build: ./.flatpak-build.sh"
    exit 0
else
    echo -e "${RED}✗ $FAILED check(s) failed. Please install missing components above.${NC}"
    exit 1
fi
