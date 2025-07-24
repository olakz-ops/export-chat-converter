#!/bin/bash

# WhatsApp Chat Converter - Server Restart Script
# Usage: ./restart-server.sh [port] [background]

PORT=${1:-8000}  # Default to port 8000 if no argument provided
BACKGROUND=${2:-false}  # Run in background if second arg is 'bg'
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔄 Restarting WhatsApp Chat Converter server..."

# Kill any existing Python HTTP servers on this port
echo "🛑 Stopping existing servers on port $PORT..."
if command -v lsof >/dev/null 2>&1; then
    lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
fi

# Also kill any Python HTTP servers (broader cleanup)
pkill -f "python3 -m http.server" 2>/dev/null || true

# Wait a moment for cleanup
sleep 2

# Verify port is free
if command -v lsof >/dev/null 2>&1; then
    if lsof -i:$PORT >/dev/null 2>&1; then
        echo "❌ Port $PORT is still in use. Trying a different port..."
        PORT=$((PORT + 1))
        echo "🔄 Using port $PORT instead"
    fi
fi

# Change to project directory
cd "$PROJECT_DIR"

# Check if we can start the server
if ! command -v python3 >/dev/null 2>&1; then
    echo "❌ python3 not found. Please install Python 3."
    exit 1
fi

# Start new server with cache-busting
echo "🚀 Starting development server on port $PORT..."
echo "📂 Serving from: $PROJECT_DIR"
echo "🌐 Open: http://localhost:$PORT"

if [ "$BACKGROUND" = "bg" ]; then
    echo "🔧 Running in background mode with cache disabled..."
    python3 "$PROJECT_DIR/dev-server.py" $PORT > /dev/null 2>&1 &
    SERVER_PID=$!
    echo "✅ Server started with PID: $SERVER_PID"
    echo "⏹️  Stop with: kill $SERVER_PID"
    
    # Test if server actually started
    sleep 1
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "✅ Server is running successfully!"
    else
        echo "❌ Server failed to start"
        exit 1
    fi
else
    echo "🔧 Cache disabled for development"
    echo "⏹️  Stop with: Ctrl+C"
    echo ""
    python3 "$PROJECT_DIR/dev-server.py" $PORT
fi