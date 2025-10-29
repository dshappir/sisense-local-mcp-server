#!/usr/bin/env node

/**
 * Debug-friendly MCP server launcher
 * This script helps debug MCP servers by providing better error handling and logging
 */

import { spawn } from 'child_process';
import { logger } from './dist/utils/logger.js';

const SISENSE_URL = process.env.SISENSE_URL || 'http://10.220.73.124:30845/';
const SISENSE_API_KEY = process.env.SISENSE_API_KEY || '';

console.log('🚀 Starting Sisense MCP Server in debug mode...');
console.log('📡 Sisense URL:', SISENSE_URL);
console.log('🔑 API Key configured:', Boolean(SISENSE_API_KEY));
console.log('');

// Set environment variables
process.env.SISENSE_URL = SISENSE_URL;
process.env.SISENSE_API_KEY = SISENSE_API_KEY;
process.env.LOG_LEVEL = 'debug';

// Start the MCP server
const serverProcess = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env }
});

serverProcess.on('error', (error) => {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
});

serverProcess.on('exit', (code, signal) => {
    if (signal) {
        console.log(`🛑 MCP server terminated by signal: ${signal}`);
    } else {
        console.log(`🛑 MCP server exited with code: ${code}`);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down MCP server...');
    serverProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down MCP server...');
    serverProcess.kill('SIGTERM');
    process.exit(0);
});

console.log('✅ MCP server started. Press Ctrl+C to stop.');
