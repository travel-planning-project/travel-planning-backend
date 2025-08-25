#!/bin/bash

echo "========================================"
echo "   🚀 Smart Travel Planner Launcher 🚀"
echo "========================================"
echo ""
echo "Starting the Smart Travel Planner application..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed or not in PATH"
    exit 1
fi

echo "✅ npm detected: $(npm --version)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✅ Backend dependencies installed"
    echo ""
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
    echo ""
fi

echo "🔧 Starting servers..."
echo ""

# Function to start backend
start_backend() {
    echo "🖥️  Starting Backend Server (Port 5000)..."
    cd backend
    npm start
}

# Function to start frontend
start_frontend() {
    echo "🎨 Starting Frontend Server (Port 3000)..."
    cd frontend
    npm start
}

# Check if we're on macOS, Linux, or WSL
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS"
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'/backend\" && npm start"' &
    sleep 3
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'/frontend\" && npm start"' &
    sleep 8
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux"
    if command -v gnome-terminal &> /dev/null; then
        gnome-terminal -- bash -c "cd backend && npm start; exec bash" &
        sleep 3
        gnome-terminal -- bash -c "cd frontend && npm start; exec bash" &
        sleep 8
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:3000
        fi
    elif command -v xterm &> /dev/null; then
        xterm -e "cd backend && npm start" &
        sleep 3
        xterm -e "cd frontend && npm start" &
        sleep 8
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:3000
        fi
    else
        echo "⚠️  No suitable terminal emulator found. Starting in background..."
        start_backend &
        sleep 3
        start_frontend &
        sleep 8
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:3000
        fi
    fi
else
    # WSL or other Unix-like systems
    echo "🖥️  Detected Unix-like system"
    start_backend &
    sleep 3
    start_frontend &
    sleep 8
    # Try to open in Windows browser if in WSL
    if command -v cmd.exe &> /dev/null; then
        cmd.exe /c start http://localhost:3000
    elif command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    fi
fi

echo ""
echo "========================================"
echo "    🎉 Launch Complete! 🎉"
echo "========================================"
echo ""
echo "🖥️  Backend API: http://localhost:5000"
echo "🎨 Frontend App: http://localhost:3000"
echo ""
echo "The app should open automatically in your browser."
echo "If not, manually navigate to: http://localhost:3000"
echo ""
echo "📝 Note: Keep terminal windows open while using the app"
echo "🛑 To stop the app: Press Ctrl+C in the terminal windows"
echo ""
echo "🚀 Smart Travel Planner is now running!"
echo "========================================"
