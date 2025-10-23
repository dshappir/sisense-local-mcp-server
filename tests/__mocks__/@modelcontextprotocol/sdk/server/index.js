// Mock for @modelcontextprotocol/sdk/server/index.js
class Server {
  constructor(config, capabilities) {
    this.config = config;
    this.capabilities = capabilities;
    this.handlers = new Map();
  }

  setRequestHandler(schema, handler) {
    this.handlers.set(schema, handler);
  }

  async connect(transport) {
    // Mock connection
    return Promise.resolve();
  }

  async close() {
    // Mock close
    return Promise.resolve();
  }
}

module.exports = { Server };
