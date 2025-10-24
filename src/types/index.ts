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
        public readonly statusCode: number = 500,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'MCPServerError';
        // Store the code and statusCode as instance properties
        this.code = code;
        this.statusCode = statusCode;

        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, MCPServerError.prototype);
    }
}

export class ValidationError extends MCPServerError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'VALIDATION_ERROR', 400, context);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}

export class AuthenticationError extends MCPServerError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'AUTHENTICATION_ERROR', 401, context);
        this.name = 'AuthenticationError';
        Object.setPrototypeOf(this, AuthenticationError.prototype);
    }
}

export class NotFoundError extends MCPServerError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'NOT_FOUND', 404, context);
        this.name = 'NotFoundError';
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class ConfigurationError extends MCPServerError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'CONFIGURATION_ERROR', 500, context);
        this.name = 'ConfigurationError';
        Object.setPrototypeOf(this, ConfigurationError.prototype);
    }
}

export class ExternalServiceError extends MCPServerError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'EXTERNAL_SERVICE_ERROR', 502, context);
        this.name = 'ExternalServiceError';
        Object.setPrototypeOf(this, ExternalServiceError.prototype);
    }
}

export class NetworkError extends MCPServerError {
    constructor(message: string, context?: Record<string, unknown>) {
        super(message, 'NETWORK_ERROR', 503, context);
        this.name = 'NetworkError';
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}

// Logger Interface
export interface Logger {
    error(message: string, data?: Record<string, unknown>): void;
    warn(message: string, data?: Record<string, unknown>): void;
    info(message: string, data?: Record<string, unknown>): void;
    debug(message: string, data?: Record<string, unknown>): void;
}

// MCP Server Instance
export interface MCPServerInstance {
    server: Server;
    transport: StdioServerTransport;
    start(): Promise<void>;
    stop(): Promise<void>;
}
