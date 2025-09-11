#!/bin/bash

# Validate pnpm setup and dependencies
# This script checks if the development environment is properly configured

echo "🔍 Validating pnpm setup and dependencies..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📌 Node.js version: $NODE_VERSION"

# Check if minimum Node.js version is met (v20+)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_MAJOR_VERSION" -lt 20 ]; then
    echo "❌ Error: Node.js version 20 or higher is required. Current: $NODE_VERSION"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed. Run 'npm install -g pnpm@10.13.1' to install."
    exit 1
fi

# Check pnpm version
PNPM_VERSION=$(pnpm --version)
EXPECTED_VERSION="10.13.1"
echo "📌 pnpm version: $PNPM_VERSION"

if [[ "$PNPM_VERSION" != "$EXPECTED_VERSION" ]]; then
    echo "⚠️  Warning: Expected pnpm version $EXPECTED_VERSION, but found $PNPM_VERSION"
    echo "   Run 'npm install -g pnpm@$EXPECTED_VERSION' to install the correct version."
fi

# Check root package.json packageManager field
ROOT_PACKAGE_MANAGER=$(grep '"packageManager"' package.json 2>/dev/null | sed 's/.*"packageManager": *"\([^"]*\)".*/\1/')
if [[ -n "$ROOT_PACKAGE_MANAGER" ]]; then
    echo "📌 Root packageManager: $ROOT_PACKAGE_MANAGER"
fi

# Check if root dependencies are installed
if [[ ! -d "node_modules" ]]; then
    echo "⚠️  Warning: Root node_modules not found. Run 'pnpm install' in the root directory."
fi

# Check if app dependencies are installed
if [[ ! -d "app/node_modules" ]]; then
    echo "⚠️  Warning: App node_modules not found. Run 'pnpm install' in the app directory."
fi

# Check for lockfile consistency
echo "🔍 Checking lockfile consistency..."
cd app
if ! pnpm install --frozen-lockfile --dry-run >/dev/null 2>&1; then
    echo "⚠️  Warning: App lockfile may be out of sync with package.json"
    echo "   Run 'pnpm install --no-frozen-lockfile' to update the lockfile."
fi

cd ..
if ! pnpm install --frozen-lockfile --dry-run >/dev/null 2>&1; then
    echo "⚠️  Warning: Root lockfile may be out of sync with package.json"
    echo "   Run 'pnpm install --no-frozen-lockfile' to update the lockfile."
fi

# Test if build works
echo "🏗️  Testing build..."
cd app
if pnpm run build >/dev/null 2>&1; then
    echo "✅ Build test passed"
else
    echo "❌ Build test failed. Check dependencies and configuration."
    exit 1
fi

echo "✅ pnpm setup validation complete!"
echo ""
echo "Environment is ready for development. You can now run:"
echo "   cd app && pnpm run dev    # Start development server"
echo "   cd app && pnpm run test   # Run tests"
echo "   cd app && pnpm run lint   # Run linter"