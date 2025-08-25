#!/bin/bash

echo "🚀 Starting Smart Travel Planner..."
echo ""

# Kill any existing processes on ports 3000 and 5000
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*3000" 2>/dev/null || true
pkill -f "node.*5000" 2>/dev/null || true
pkill -f "npm.*start" 2>/dev/null || true

echo "✅ Cleanup complete"
echo ""

# Start backend in background
echo "🖥️  Starting Backend (Port 5000)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend in background
echo "🎨 Starting Frontend (Port 3000)..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 8

echo ""
echo "========================================="
echo "    🎉 Smart Travel Planner Running! 🎉"
echo "========================================="
echo ""
echo "🖥️  Backend API: http://localhost:5000"
echo "🎨 Frontend App: http://localhost:3000"
echo ""
echo "🌐 Opening browser..."

# Try to open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000
elif command -v open > /dev/null; then
    open http://localhost:3000
elif command -v start > /dev/null; then
    start http://localhost:3000
else
    echo "Please manually open: http://localhost:3000"
fi

echo ""
echo "📝 Press Ctrl+C to stop both servers"
echo "🚀 Enjoy your travel planning!"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    pkill -f "node.*3000" 2>/dev/null || true
    pkill -f "node.*5000" 2>/dev/null || true
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait
