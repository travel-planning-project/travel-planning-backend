#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

console.log('========================================');
console.log('   🚀 Smart Travel Planner Launcher 🚀');
console.log('========================================');
console.log('');
console.log('Starting the Smart Travel Planner application...');
console.log('');

// Check if Node.js is available
console.log('✅ Node.js detected:', process.version);
console.log('');

// Function to spawn a process in a new terminal/window
function spawnInNewWindow(command, args, cwd, title) {
    const platform = os.platform();
    
    if (platform === 'win32') {
        // Windows
        return spawn('cmd', ['/c', 'start', `"${title}"`, 'cmd', '/k', `cd /d "${cwd}" && ${command} ${args.join(' ')}`], {
            detached: true,
            stdio: 'ignore'
        });
    } else if (platform === 'darwin') {
        // macOS
        const script = `cd "${cwd}" && ${command} ${args.join(' ')}`;
        return spawn('osascript', ['-e', `tell app "Terminal" to do script "${script}"`], {
            detached: true,
            stdio: 'ignore'
        });
    } else {
        // Linux and others
        if (process.env.DISPLAY) {
            // Try gnome-terminal first
            try {
                return spawn('gnome-terminal', ['--title', title, '--', 'bash', '-c', `cd "${cwd}" && ${command} ${args.join(' ')}; exec bash`], {
                    detached: true,
                    stdio: 'ignore'
                });
            } catch (e) {
                // Fallback to xterm
                return spawn('xterm', ['-title', title, '-e', `bash -c "cd '${cwd}' && ${command} ${args.join(' ')}; exec bash"`], {
                    detached: true,
                    stdio: 'ignore'
                });
            }
        } else {
            // No display, run in background
            return spawn(command, args, {
                cwd: cwd,
                detached: true,
                stdio: 'ignore'
            });
        }
    }
}

// Function to open URL in default browser
function openBrowser(url) {
    const platform = os.platform();
    let command;
    
    if (platform === 'win32') {
        command = 'start';
    } else if (platform === 'darwin') {
        command = 'open';
    } else {
        command = 'xdg-open';
    }
    
    spawn(command, [url], { detached: true, stdio: 'ignore' });
}

async function main() {
    const backendPath = path.join(__dirname, 'backend');
    const frontendPath = path.join(__dirname, 'frontend');
    
    console.log('🖥️  Starting Backend Server (Port 5000)...');
    const backend = spawnInNewWindow('npm', ['start'], backendPath, 'Smart Travel Planner - Backend');
    
    // Wait for backend to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🎨 Starting Frontend Server (Port 3000)...');
    const frontend = spawnInNewWindow('npm', ['start'], frontendPath, 'Smart Travel Planner - Frontend');
    
    // Wait for frontend to start
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('');
    console.log('========================================');
    console.log('    🎉 Launch Complete! 🎉');
    console.log('========================================');
    console.log('');
    console.log('🖥️  Backend API: http://localhost:5000');
    console.log('🎨 Frontend App: http://localhost:3000');
    console.log('');
    console.log('The app should open automatically in your browser.');
    console.log('If not, manually navigate to: http://localhost:3000');
    console.log('');
    console.log('📝 Note: Keep terminal windows open while using the app');
    console.log('🛑 To stop the app: Close terminal windows or press Ctrl+C');
    console.log('');
    console.log('🚀 Smart Travel Planner is now running!');
    console.log('========================================');
    
    // Open browser
    console.log('🌐 Opening browser...');
    openBrowser('http://localhost:3000');
    
    // Keep the launcher running
    process.stdin.resume();
}

main().catch(console.error);
