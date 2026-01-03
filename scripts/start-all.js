#!/usr/bin/env node

/**
 * SaveIt: Recipe Edition - Smart Startup Script
 * 
 * This script intelligently starts services based on NEXT_PUBLIC_DEV_MODE:
 * - Dev Mode (true): Only starts Next.js (uses mock data)
 * - Production Mode (false): Starts Redis, Python worker, and Next.js
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    blue: '\x1b[34m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) return;

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();

            // Remove quotes if present
            value = value.replace(/^["']|["']$/g, '');

            env[key] = value;
        }
    });

    return env;
}

function checkNodeModules() {
    if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
        log('⚠️  node_modules not found. Installing dependencies...', 'yellow');
        const install = spawn('npm', ['install'], {
            stdio: 'inherit',
            shell: true
        });

        return new Promise((resolve, reject) => {
            install.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error('npm install failed'));
                }
            });
        });
    }
    return Promise.resolve();
}

async function main() {
    log('=========================================', 'blue');
    log('   SaveIt: Recipe Edition - Runner      ', 'blue');
    log('=========================================', 'blue');

    // Check dependencies
    await checkNodeModules();

    // Parse .env.local
    const envPath = path.join(__dirname, '..', '.env.local');
    const env = parseEnvFile(envPath);

    const devMode = env.NEXT_PUBLIC_DEV_MODE !== 'false';

    if (devMode) {
        log('\n✨ Mode: DEVELOPMENT (Mock Data Mode)', 'green');
        log('Using localStorage and mock services. No database or Redis required.\n', 'green');

        // Just start Next.js
        const nextDev = spawn('npm', ['run', 'dev'], {
            stdio: 'inherit',
            shell: true
        });

        nextDev.on('close', (code) => {
            process.exit(code);
        });

    } else {
        log('\n🚀 Mode: PRODUCTION (Full Pipeline Active)', 'yellow');
        log('Starting Redis, Python worker, and Next.js...\n', 'yellow');

        // Start all services with concurrently
        const prodServices = spawn('npm', ['run', 'dev:prod'], {
            stdio: 'inherit',
            shell: true
        });

        prodServices.on('close', (code) => {
            process.exit(code);
        });
    }

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        log('\n\n⏹️  Stopping services...', 'yellow');
        process.exit(0);
    });
}

main().catch(err => {
    log(`\n❌ Error: ${err.message}`, 'red');
    process.exit(1);
});
