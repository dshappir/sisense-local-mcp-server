# Sisense Local MCP Server

A Model Context Protocol (MCP) server that provides access to Sisense data and analytics through a standardized interface. This server allows AI assistants and other MCP clients to interact with Sisense dashboards, data sources, and execute queries.

## Features

- 🔌 **MCP Protocol Support** - Full Model Context Protocol implementation
- 📊 **Sisense Integration** - Access to dashboards, data sources, and analytics
- 🛠️ **Tool Support** - 8 built-in tools for Sisense operations
- 📚 **Resource Access** - Browse and read Sisense dashboards as resources
- 🔐 **Authentication** - Support for Sisense API tokens
- 🧪 **Comprehensive Testing** - Full test coverage with Jest
- 📝 **TypeScript** - Fully typed with modern TypeScript features
- 🎨 **Code Quality** - ESLint, Prettier, and modern development tools

## Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0
- Access to a Sisense instance + SDK API

## Installation

1. **Clone the repository:**

    ```bash
    git clone git@github.com:dshappir/sisense-local-mcp-server.git
    cd sisense-local-mcp-server
    ```

2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up environment variables:**

    ```bash
    cp env.example .env
    ```

    Edit `.env` with your Sisense configuration:

    ```env
    # Sisense Configuration
    SISENSE_URL=https://your-sisense-instance.com
    SISENSE_API_KEY=your-api-key

    # Server & Debug Settings
    ...
    ```

4. **Build the project:**

    ```bash
    npm run build
    ```

## Configuring Cursor

To use this MCP server with Cursor IDE, follow these steps:

### Step 1: Build the Project

Ensure the project is built before configuring Cursor (see above).
This creates the `dist/` directory with the compiled JavaScript files.

### Step 2: Get the Absolute Path

You'll need the absolute path to the built server file (`dist/index.js`). You can get this by:

**On macOS/Linux:**

```bash
pwd  # Shows current directory
# Example output: /Users/username/sisense-local-mcp-server
# Full path would be: /Users/username/sisense-local-mcp-server/dist/index.js
```

**On Windows:**

```cmd
cd
REM Example output: C:\Users\username\sisense-local-mcp-server
REM Full path would be: C:\Users\username\sisense-local-mcp-server\dist\index.js
```

### Step 3: Configure in Cursor Settings

1. **Open Cursor Settings:**
    - Press `Cmd + Shift + P` (Mac) or `Ctrl + Shift + P,` (Windows/Linux) to open Command Palette
    - Select `View: Open MCP Settings`

2. **Add a New MCP Server:**
    - Click the `+ Add New MCP Server` button

3. **Configure the Server:**
   In the `mcp.json` file that opens for editing, add the following JSON fragment, updating the `args` path accordingly:

    ```JSON
         "sisense": {
             "command": "node",
             "args": [
                 "${userHome}/sisense-local-mcp-server/dist/index.js"
             ],
             "env": {
                 "SISENSE_URL": "<running Sisense instance URL>",
                 "SISENSE_API_KEY": "<Sisense API key>"
             }
         }
    ```

    Close the the tab (saving the file).

4. **Manage the MCP server:**
    - In the `Installed MCP servers` section you should see a new entry with the name `sisense`
    - It should have a green dot next to it, indicating that it is running. If not, try to disable/enable it, and restart Cursor
    - It should show that it has tools enabled

### Step 4: Verify the Configuration

- Try asking Cursor to use one of the Sisense tools, for example:
    - "List all sisense data models"
    - "Get information about the sisense server"

### Troubleshooting Cursor Configuration

If the server doesn't start or tools aren't available:

1. **Check Build Status:**
    - Ensure you've run `npm run build` successfully
    - The `dist/` directory should exist and contain compiled files

2. **Check the Path:**
    - Ensure the absolute path to `dist/index.js` is correct
    - Verify the file exists: `ls dist/index.js` (Mac/Linux) or `dir dist\index.js` (Windows)

3. **Check Sisense settings:**
    - Verify Sisense instance exists and is working at the URL specified
    - Make sure API key is correct and up-to-date

4. **Check Cursor Logs:**
    - Open Cursor's developer console for error messages
    - Look for MCP server connection errors

5. **Manual Test:**
    - Try running the server manually to ensure it works:
        ```bash
        echo '{"jsonrpc":"2.0", "id":1, "method":"tools/list", "params":{}}' | node dist/index.js
        ```
    - The server should start without errors (it will wait for input on stdin)
    - Show output a JSON of the available tools, including input/output configuration

## Usage

### Development Mode

Start the server in development mode with hot reloading:

```bash
npm run dev
```

### Production Mode

Build and start the server:

```bash
npm run build
npm start
```

### Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type checking
npm run type-check
```

### Debugging

The project is configured for debugging with Cursor/VS Code using Node.js inspector.

#### Command Line Debugging

```bash
# Debug production build (--inspect)
npm run debug

# Debug production build (--inspect-brk - breaks on first line)
npm run debug:brk

# Debug development mode (--inspect)
npm run debug:dev

# Debug development mode (--inspect-brk - breaks on first line)
npm run debug:dev:brk
```

#### Cursor/VS Code Debugging

1. **Open the project in Cursor/VS Code**
2. **Go to the Debug panel** (Ctrl+Shift+D / Cmd+Shift+D)
3. **Select a debug configuration:**
    - `Debug Production (--inspect)` - Debug built application
    - `Debug Production (--inspect-brk)` - Debug built application with break on start
    - `Debug Development (--inspect)` - Debug TypeScript source directly
    - `Debug Development (--inspect-brk)` - Debug TypeScript source with break on start
    - `Attach to Process` - Attach to an already running debug process
    - `Debug Tests` - Debug Jest tests

4. **Set breakpoints** by clicking in the gutter next to line numbers
5. **Start debugging** by pressing F5 or clicking the play button

#### Debug Configuration Details

- **Production debugging** uses the compiled JavaScript in `dist/`
- **Development debugging** uses TypeScript source files directly with `tsx`
- **Environment variables** are set for optimal debugging (LOG_LEVEL=debug, DEBUG=true)
- **Source maps** are enabled for proper TypeScript debugging
- **Node internals** are excluded from debugging for cleaner experience

#### Attaching to External Process

If you have a process already running with `--inspect` or `--inspect-brk`:

1. Start your process: `npm run debug` or `npm run debug:brk`
2. Select "Attach to Process" in the debug panel
3. The debugger will attach to the running process on port 9229

## Available Tools

The MCP server provides the following tools:

### Server Information

- **`get_server_info`** - Get information about the Sisense server

### Data Sources

- **`list_data_sources`** - List all available data sources
- **`list_cubes`** - List all available cubes
- **`get_cube_metadata`** - Get metadata for a specific cube

### Dashboards

- **`list_dashboards`** - List all dashboards
- **`get_dashboard`** - Get details of a specific dashboard
- **`get_dashboard_widgets`** - Get widgets from a specific dashboard

### Query Execution

- **`execute_query`** - Execute a query against Sisense

## Available Resources

The server exposes Sisense dashboards as MCP resources:

- **`sisense://dashboard/{id}`** - Access dashboard data as JSON

## Configuration

### Environment Variables

| Variable                 | Description                | Default                          | Required |
| ------------------------ | -------------------------- | -------------------------------- | -------- |
| `MCP_SERVER_NAME`        | Server name                | `sisense-local-mcp-server`       | No       |
| `MCP_SERVER_VERSION`     | Server version             | `1.0.0`                          | No       |
| `MCP_SERVER_DESCRIPTION` | Server description         | `Local (STD) Sisense MCP server` | No       |
| `LOG_LEVEL`              | Log level                  | `info`                           | No       |
| `SISENSE_URL`            | Sisense instance URL       | -                                | Yes      |
| `SISENSE_API_KEY`        | API key for authentication | -                                | Yes      |
| `NODE_ENV`               | Environment                | `development`                    | No       |
| `DEBUG`                  | Debug mode                 | `false`                          | No       |

## Project Structure

```
src/
├── config/
│   └── environment.ts      # Environment configuration
├── server/
│   └── mcp-server.ts       # Main MCP server implementation
├── services/
│   └── sisense.ts          # Sisense API service
├── types/
│   └── index.ts            # TypeScript type definitions
├── utils/
│   └── logger.ts           # Logging utility
└── index.ts                # Application entry point

tests/
├── setup.ts                # Test setup
├── services/
│   └── sisense.test.ts     # Sisense service tests
├── server/
│   └── mcp-server.test.ts  # MCP server tests
└── utils/
    └── logger.test.ts      # Logger tests
```

## Development

### Code Style

This project uses:

- **TypeScript** with strict type checking
- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing

### Adding New Tools

1. Add the tool definition to `getAvailableTools()` in `mcp-server.ts`
2. Implement the tool logic in `callTool()` method
3. Add corresponding methods to `SisenseService` if needed
4. Write tests for the new tool

### Adding New Resources

1. Add resource handling in `getAvailableResources()` and `readResource()` methods
2. Implement the resource fetching logic
3. Add tests for the new resource type

## Troubleshooting

### Common Issues

1. **Authentication Errors**
    - Verify your Sisense credentials are correct
    - Check that the Sisense URL is accessible
    - Ensure you're using either token or username/password authentication

2. **Connection Issues**
    - Verify the Sisense URL is correct and accessible
    - Check network connectivity
    - Ensure proper firewall settings

3. **Build Issues**
    - Ensure you're using Node.js >= 22.0.0
    - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
    - Check TypeScript configuration

### Debug Mode

Enable debug logging by setting `DEBUG=true` in your `.env` file:

```env
DEBUG=true
LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes: `git commit -m 'Add feature'`
7. Push to the branch: `git push origin feature-name`
8. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review existing issues in the repository
3. Create a new issue with detailed information about your problem
