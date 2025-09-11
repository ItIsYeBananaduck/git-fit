#!/bin/bash

# Development Environment Setup Script
# This script ensures pnpm is installed and dependencies are set up correctly

set -e

echo "🔧 Setting up development environment for git-fit..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm globally..."
    npm install -g pnpm@10.13.1
else
    echo "✅ pnpm is already installed: $(pnpm --version)"
fi

# Verify pnpm version
PNPM_VERSION=$(pnpm --version)
EXPECTED_VERSION="10.13.1"
if [[ "$PNPM_VERSION" != "$EXPECTED_VERSION" ]]; then
    echo "⚠️  Warning: pnpm version mismatch. Expected $EXPECTED_VERSION, got $PNPM_VERSION"
    echo "📦 Updating pnpm to correct version..."
    npm install -g pnpm@$EXPECTED_VERSION
fi

echo "🔍 Verifying pnpm installation..."
which pnpm
pnpm --version

# Install root dependencies
echo "📦 Installing root dependencies..."
cd "$(dirname "$0")/.."
pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Install app dependencies
echo "📦 Installing app dependencies..."
cd app
pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Verify build works
echo "🏗️  Testing build process..."
pnpm run build

echo "✅ Development environment setup complete!"
echo ""
echo "🚀 You can now run:"
echo "   cd app && pnpm run dev    # Start development server"
echo "   cd app && pnpm run build  # Build for production"
echo "   cd app && pnpm run test   # Run tests"
echo "   cd app && pnpm run lint   # Run linter"