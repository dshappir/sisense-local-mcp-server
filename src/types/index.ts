import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { LogLevel } from '../config/environment.js';

// MCP Server Configuration
export interface MCPServerConfig {
    name: string;
    version: string;
    description: string;
    host: string;
    port: number;
    logLevel: LogLevel;
}

// Sisense Configuration
export interface SisenseConfig {
    url: string;
    apiKey: string;
}

// Tool Definition
export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
}

// Resource Definition
export interface ResourceDefinition {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
}

// Error Types
export class MCPServerError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly statusCode: number = 500
    ) {
        super(message);
        this.name = 'MCPServerError';
        // Store the code and statusCode as instance properties
        this.code = code;
        this.statusCode = statusCode;
    }
}

export class ValidationError extends MCPServerError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR', 400);
        this.name = 'ValidationError';
    }
}

export class AuthenticationError extends MCPServerError {
    constructor(message: string) {
        super(message, 'AUTHENTICATION_ERROR', 401);
        this.name = 'AuthenticationError';
    }
}

export class NotFoundError extends MCPServerError {
    constructor(message: string) {
        super(message, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}

// Logger Interface
export interface Logger {
    error(message: string, ..._args: unknown[]): void;
    warn(message: string, ..._args: unknown[]): void;
    info(message: string, ..._args: unknown[]): void;
    debug(message: string, ..._args: unknown[]): void;
}

// MCP Server Instance
export interface MCPServerInstance {
    server: Server;
    transport: StdioServerTransport;
    start(): Promise<void>;
    stop(): Promise<void>;
}
