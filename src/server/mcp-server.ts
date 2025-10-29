import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { env } from '../config/environment.js';
import { SwaggerClient, ToolGenerator } from '../services/index.js';
import type { MCPServerInstance, ResourceDefinition, ToolDefinition } from '../types/index.js';
import { ValidationError } from '../types/index.js';
import { safeStringify } from '../utils/json.js';
import { logger } from '../utils/logger.js';
import { validateResourceUri } from '../utils/validation.js';
export class SisenseMCPServer implements MCPServerInstance {
    public readonly server: Server;
    public readonly transport: StdioServerTransport;
    private readonly swaggerClient: SwaggerClient;
    private readonly toolGenerator: ToolGenerator;
    private dynamicTools: ToolDefinition[] = [];

    constructor() {
        this.swaggerClient = new SwaggerClient({
            url: env.SISENSE_URL || 'http://10.220.73.124:30845/',
            apiKey: env.SISENSE_API_KEY || '',
        });
        this.toolGenerator = new ToolGenerator(this.swaggerClient);

        this.server = new Server(
            {
                name: env.MCP_SERVER_NAME,
                version: env.MCP_SERVER_VERSION,
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                },
            }
        );

        this.transport = new StdioServerTransport();
        this.setupHandlers();
        this.initializeDynamicTools();
    }

    private setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            logger.debug('Listing available tools');
            return {
                tools: this.getAvailableTools(),
            };
        });

        // List available resources
        this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
            try {
                logger.debug('Listing available resources');
                return {
                    resources: await this.getAvailableResources(),
                };
            } catch (error) {
                logger.error('Error listing resources', {
                    error: error instanceof Error ? error.message : String(error),
                });
                return { resources: [] };
            }
        });

        // Read a specific resource
        this.server.setRequestHandler(ReadResourceRequestSchema, async request => {
            try {
                logger.debug('Reading resource', { uri: request.params.uri });
                return await this.readResource(request.params.uri);
            } catch (error) {
                logger.error('Error reading resource', {
                    uri: request.params.uri,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        });

        // Call a tool
        this.server.setRequestHandler(CallToolRequestSchema, async request => {
            try {
                logger.debug('Calling tool', { name: request.params.name });
                return await this.callTool(request.params.name, request.params.arguments ?? {});
            } catch (error) {
                logger.error('Tool execution error', {
                    name: request.params.name,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        });
    }

    /**
     * Initialize dynamic tools from Swagger/OpenAPI specifications
     */
    private async initializeDynamicTools(): Promise<void> {
        try {
            if (!this.swaggerClient.isConfigured()) {
                logger.warn('SwaggerClient not configured, no tools available');
                this.dynamicTools = [];
                return;
            }

            logger.info('Initializing dynamic tools from Sisense API specifications');
            this.dynamicTools = await this.toolGenerator.generateTools();

            logger.info('Successfully initialized dynamic tools', {
                toolCount: this.dynamicTools.length,
            });
        } catch (error) {
            logger.error('Failed to initialize dynamic tools, returning empty list', {
                error: error instanceof Error ? error.message : String(error),
            });
            this.dynamicTools = [];
        }
    }

    private getAvailableTools(): ToolDefinition[] {
        return this.dynamicTools;
    }

    private async getAvailableResources(): Promise<ResourceDefinition[]> {
        return [];
    }

    private async readResource(
        uri: string
    ): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
        try {
            const validatedUri = validateResourceUri(uri);
            const parts = validatedUri.split('/');
            const resourceType = parts[2]; // 'sisense://dashboard/123' -> ['sisense:', '', 'dashboard', '123']
            const resourceId = parts[3];

            if (!resourceId) {
                throw new ValidationError(`Invalid resource URI: missing resource ID`, {
                    uri: validatedUri,
                });
            }

            throw new ValidationError(`Unsupported resource type: ${resourceType}`, {
                uri: validatedUri,
                resourceType,
                supportedTypes: ['dashboard'],
            });
        } catch (error) {
            logger.error('Failed to read resource', {
                uri,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    private async callTool(
        name: string,
        args: Record<string, unknown>
    ): Promise<{ content: Array<{ type: string; text: string }> }> {
        try {
            const tool = this.dynamicTools.find(tool => tool.name === name);
            if (!tool) {
                throw new ValidationError(`Unknown tool: ${name}`);
            }
            const result = await this.executeDynamicTool(tool, args);

            return {
                content: [
                    {
                        type: 'text',
                        text: safeStringify(result, 2),
                    },
                ],
            };
        } catch (error) {
            logger.error('Tool execution failed', {
                name,
                args,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Execute a dynamic tool using API mapping
     */
    private async executeDynamicTool(
        tool: ToolDefinition,
        args: Record<string, unknown>
    ): Promise<unknown> {
        logger.debug('Executing dynamic tool', {
            toolName: tool.name,
            method: tool.method,
            path: tool.path,
        });

        let url = tool.path;
        const queryParams = new URLSearchParams();
        const headers: Record<string, string> = {};
        let body: string | undefined;

        const { properties = {}, required = [] } = tool.inputSchema;
        for (const [name, schema] of Object.entries(properties)) {
            if (Object.prototype.hasOwnProperty.call(args, name)) {
                const stringValue = String(args[name]);
                switch (schema.in) {
                    case 'path':
                        url = url.replace(`{${name}}`, encodeURIComponent(stringValue));
                        break;
                    case 'query':
                        queryParams.append(name, stringValue);
                        break;
                    case 'header':
                        headers[name] = stringValue;
                        break;
                    case 'body':
                        body = JSON.stringify(args[name]);
                        headers['Content-Type'] = 'application/json';
                        break;
                    case 'cookie':
                        // Note: Cookie handling would need to be implemented based on requirements
                        logger.debug('Cookie parameter not implemented', { name });
                        break;
                }
            } else if (required.includes(name)) {
                throw new ValidationError(`Missing required parameter: ${name}`);
            }
        }

        return this.makeApiRequest(tool.method, url, {
            headers,
            ...(body && { body }),
        });
    }

    /**
     * Make an API request using the SwaggerClient
     */
    private async makeApiRequest(
        method: string,
        endpoint: string,
        options: { headers?: Record<string, string>; body?: string } = {}
    ): Promise<unknown> {
        const requestOptions: any = {
            method,
        };

        if (options.headers) {
            requestOptions.headers = options.headers;
        }

        if (options.body !== undefined) {
            requestOptions.body = options.body;
        }

        return this.swaggerClient.makeApiRequest(endpoint, requestOptions);
    }

    public async start(): Promise<void> {
        logger.info('Starting Sisense MCP Server', {
            name: env.MCP_SERVER_NAME,
            version: env.MCP_SERVER_VERSION,
        });

        // Add debug logging for MCP server startup
        logger.debug('MCP Server configuration', {
            transport: 'stdio',
            serverName: env.MCP_SERVER_NAME,
            serverVersion: env.MCP_SERVER_VERSION,
        });

        await this.server.connect(this.transport);
        logger.info('Sisense MCP Server started successfully');

        // Log available tools for debugging
        logger.debug('Available tools', {
            toolCount: this.dynamicTools.length,
            toolNames: this.dynamicTools.map(t => t.name),
        });
    }

    public async stop(): Promise<void> {
        logger.info('Stopping Sisense MCP Server');
        await this.server.close();
        logger.info('Sisense MCP Server stopped');
    }
}
