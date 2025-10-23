#!/usr/bin/env node

import { SisenseMCPServer } from './server/mcp-server.js';
import { logger } from './utils/logger.js';
import { env, isDevelopment } from './config/environment.js';

async function main(): Promise<void> {
  try {
    // Log startup information
    logger.info('Initializing Sisense MCP Server', {
      version: env.MCP_SERVER_VERSION,
      environment: env.NODE_ENV,
      debug: isDevelopment(),
    });

    // Create and start the MCP server
    const server = new SisenseMCPServer();
    
    // Handle graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully`);
      try {
        await server.stop();
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error });
        process.exit(1);
      }
    };

    // Register signal handlers
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection', { reason, promise });
      process.exit(1);
    });

    // Start the server
    await server.start();

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    logger.error('Failed to start Sisense MCP Server', { error });
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error('Unexpected error in main', { error });
    process.exit(1);
  });
}
