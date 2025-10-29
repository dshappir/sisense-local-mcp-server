#!/usr/bin/env node

/**
 * Test MCP server connection and communication
 * This script helps debug MCP server issues by testing the connection directly
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const SISENSE_URL = process.env.SISENSE_URL || 'http://10.220.73.124:30845/';
const SISENSE_API_KEY = process.env.SISENSE_API_KEY || '';

console.log('🧪 Testing MCP Server Connection...');
console.log('📡 Sisense URL:', SISENSE_URL);
console.log('🔑 API Key configured:', Boolean(SISENSE_API_KEY));
console.log('');

// Set environment variables
process.env.SISENSE_URL = SISENSE_URL;
process.env.SISENSE_API_KEY = SISENSE_API_KEY;
process.env.LOG_LEVEL = 'debug';

// Test MCP server with a simple request
async function testMCPServer() {
    return new Promise((resolve, reject) => {
        const serverProcess = spawn('node', ['dist/index.js'], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env },
        });

        let output = '';
        let errorOutput = '';

        serverProcess.stdout.on('data', data => {
            output += data.toString();
            console.log('📤 Server output:', data.toString().trim());
        });

        serverProcess.stderr.on('data', data => {
            errorOutput += data.toString();
            console.log('⚠️  Server error:', data.toString().trim());
        });

        // Send a simple MCP request to test the server
        const testRequest = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {},
        };

        console.log('📨 Sending test request:', JSON.stringify(testRequest, null, 2));

        serverProcess.stdin.write(JSON.stringify(testRequest) + '\n');

        // Wait for response
        setTimeout(2000).then(() => {
            console.log('📥 Server response received');
            console.log('📊 Full output:', output);
            if (errorOutput) {
                console.log('❌ Errors:', errorOutput);
            }

            serverProcess.kill();
            resolve({ output, errorOutput });
        });

        serverProcess.on('error', error => {
            console.error('❌ Failed to start MCP server:', error);
            reject(error);
        });

        serverProcess.on('exit', (code, signal) => {
            console.log(`🛑 MCP server exited with code: ${code}, signal: ${signal}`);
        });
    });
}

// Run the test
testMCPServer()
    .then(result => {
        console.log('✅ MCP server test completed');
        console.log('📋 Results:', result);
    })
    .catch(error => {
        console.error('❌ MCP server test failed:', error);
        process.exit(1);
    });
