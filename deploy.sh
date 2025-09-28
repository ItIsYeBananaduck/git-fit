#!/bin/bash
# Adaptive fIt AI Service Deployment Script

echo "🚀 DEPLOYING ADAPTIVE FIT AI SERVICE TO FLY.IO"
echo "=================================================="

# Add flyctl to PATH
export PATH="$HOME/.fly/bin:$PATH"

# Check if authenticated
if ! flyctl apps list > /dev/null 2>&1; then
    echo "❌ Not authenticated with Fly.io"
    echo "Please run: flyctl auth login"
    echo "Then re-run this script"
    exit 1
fi

echo "✅ Fly.io authentication confirmed"

# Check if app exists
if flyctl apps list | grep -q technically-fit-ai; then
    echo "📦 App 'technically-fit-ai' exists, deploying updates..."
    flyctl deploy
else
    echo "🆕 Creating new app 'technically-fit-ai'..."
    flyctl launch --name technically-fit-ai --region iad --yes
fi

echo "🎉 DEPLOYMENT COMPLETE!"
echo "🌐 Your AI service will be available at: https://technically-fit-ai.fly.dev"
echo "🔍 Health check: https://technically-fit-ai.fly.dev/health"
echo "📚 API docs: https://technically-fit-ai.fly.dev/docs"
