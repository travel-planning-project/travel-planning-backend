@echo off
echo ========================================
echo    🚀 Smart Travel Planner Launcher 🚀
echo ========================================
echo.
echo Starting the Smart Travel Planner application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo Node.js detected:
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo npm detected:
npm --version
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo Backend dependencies installed
    echo.
)

if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo Frontend dependencies installed
    echo.
)

echo Starting servers...
echo.

REM Start backend server in a new window
echo Starting Backend Server (Port 5000)...
start "Smart Travel Planner - Backend" cmd /k "cd /d %~dp0backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend server in a new window
echo Starting Frontend Server (Port 3000)...
start "Smart Travel Planner - Frontend" cmd /k "cd /d %~dp0frontend && npm start"

REM Wait a moment for frontend to start
timeout /t 8 /nobreak >nul

echo.
echo ========================================
echo    Launch Complete!
echo ========================================
echo.
echo Backend API: http://localhost:5000
echo Frontend App: http://localhost:3000
echo.
echo The app should open automatically in your browser.
echo If not, manually navigate to: http://localhost:3000
echo.
echo Note: Keep both terminal windows open while using the app
echo To stop the app: Close both terminal windows or press Ctrl+C in each
echo.
echo ========================================

REM Try to open the app in default browser
start http://localhost:3000

echo.
echo Smart Travel Planner is now running!
echo Press any key to close this launcher window...
pause >nul
