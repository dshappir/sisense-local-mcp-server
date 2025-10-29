# 🔧 MCP Server Debugging Guide

This guide explains how to debug the Sisense MCP Server using various methods.

## 🚀 Quick Start

### Method 1: VS Code Debugger (Recommended)

1. **Build the project:**

    ```bash
    npm run build
    ```

2. **Start the server with debugging:**

    ```bash
    npm run debug:attach
    ```

3. **In VS Code:**
    - Go to Run and Debug (Ctrl+Shift+D)
    - Select "Attach to Node.js (Port 9229)"
    - Click the play button

### Method 2: MCP Inspector

```bash
# Start with MCP Inspector (includes debugging)
npm run start:mcp
```

## 🔍 Debug Configurations

### Available VS Code Debug Configurations:

1. **Attach to Node.js (Port 9229)** - Attach to default debug port
2. **Attach to Node.js (Port 9230)** - Attach to alternative port
3. **Attach to Node.js (Custom Port)** - Attach to any port (prompts for port)
4. **Debug MCP Inspector (Development)** - Debug with MCP Inspector
5. **Debug MCP Inspector (Production)** - Debug production build with MCP Inspector

### Available NPM Scripts:

```bash
# Start server with debugging (port 9229)
npm run debug:attach

# Start server with custom debug port
DEBUG_PORT=9230 npm run debug:attach:port

# Start with MCP Inspector
npm run start:mcp

# Debug development version
npm run debug:dev

# Debug production version
npm run debug
```

## 🛠️ Step-by-Step Debugging

### 1. Start the Server with Debugging

```bash
# Build first
npm run build

# Start with debugging
npm run debug:attach
```

You should see output like:

```
🐛 Starting Sisense MCP Server in debug mode...
📡 Sisense URL: http://10.220.73.124:30845/
🔑 API Key configured: true
🔌 Debug port: 9229

✅ MCP server started with debugging enabled.
🔌 Attach debugger to port 9229
📝 Use VS Code debugger with "Attach to Node.js" configuration
```

### 2. Attach VS Code Debugger

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Attach to Node.js (Port 9229)"
4. Click the play button
5. Set breakpoints in your code
6. The debugger will attach and you can step through code

### 3. Test the Server

```bash
# In another terminal, test the server
node test-mcp-connection.js
```

## 🔧 Troubleshooting

### Issue: "Cannot connect to runtime process"

**Solution:**

1. Make sure the server is running with `--inspect` flag
2. Check that the debug port is correct (default: 9229)
3. Try a different port: `DEBUG_PORT=9230 npm run debug:attach:port`

### Issue: "Source maps not working"

**Solution:**

1. Make sure you've built the project: `npm run build`
2. Check that source maps are enabled in tsconfig.json
3. Use the "Debug Development" configuration for TypeScript files

### Issue: "MCP Inspector not connecting"

**Solution:**

1. Use the MCP Inspector debug configurations
2. Make sure the server is running: `npm run start:mcp`
3. Check the browser console for errors

## 📊 Debug Information

### Log Levels:

- `LOG_LEVEL=debug` - Maximum logging
- `LOG_LEVEL=info` - Standard logging
- `LOG_LEVEL=warn` - Warnings only
- `LOG_LEVEL=error` - Errors only

### Environment Variables:

```bash
# Sisense configuration
SISENSE_URL=http://10.220.73.124:30845/
SISENSE_API_KEY=your_api_key_here

# Debug configuration
LOG_LEVEL=debug
DEBUG=true
DEBUG_PORT=9229
```

## 🎯 Common Debug Scenarios

### 1. Debug Tool Generation

Set breakpoints in:

- `src/services/tool-generator.ts` - `generateTools()` method
- `src/services/swagger-client.ts` - `fetchSwaggerSpec()` method

### 2. Debug MCP Server Startup

Set breakpoints in:

- `src/server/mcp-server.ts` - `start()` method
- `src/index.ts` - `main()` function

### 3. Debug Tool Execution

Set breakpoints in:

- `src/server/mcp-server.ts` - `callTool()` method
- `src/server/mcp-server.ts` - `executeDynamicTool()` method

### 4. Debug API Calls

Set breakpoints in:

- `src/services/swagger-client.ts` - `makeRequest()` method
- `src/services/sisense.ts` - `makeRequest()` method

## 🔗 Useful Commands

```bash
# Check if debug port is in use
lsof -i :9229

# Kill processes on debug port
pkill -f "node.*--inspect"

# Test MCP server connection
node test-mcp-connection.js

# Test dynamic tool generation
node test-dynamic-tools.js
```

## 📝 Notes

- **MCP servers use stdio transport** - Traditional debuggers may not work well
- **Use MCP Inspector** for protocol-level debugging
- **Use VS Code debugger** for code-level debugging
- **Source maps** are essential for debugging TypeScript code
- **Debug ports** must be unique (9229, 9230, etc.)
