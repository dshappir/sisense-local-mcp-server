import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { MCPServerInstance, ToolDefinition, ResourceDefinition } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { safeStringify } from '../utils/json.js';
import { SisenseService } from '../services/sisense.js';
import { env } from '../config/environment.js';

export class SisenseMCPServer implements MCPServerInstance {
    public readonly server: Server;
    public readonly transport: StdioServerTransport;
    private readonly sisenseService: SisenseService;

    constructor() {
        this.sisenseService = new SisenseService();
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

    private getAvailableTools(): ToolDefinition[] {
        return [
            {
                name: 'get_server_info',
                description: 'Get information about the Sisense server',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'list_data_sources',
                description: 'List all available data sources in Sisense',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'list_dashboards',
                description: 'List all dashboards in Sisense',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_dashboard',
                description: 'Get details of a specific dashboard',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dashboardId: {
                            type: 'string',
                            description: 'The ID of the dashboard to retrieve',
                        },
                    },
                    required: ['dashboardId'],
                },
            },
            {
                name: 'get_dashboard_widgets',
                description: 'Get widgets from a specific dashboard',
                inputSchema: {
                    type: 'object',
                    properties: {
                        dashboardId: {
                            type: 'string',
                            description: 'The ID of the dashboard',
                        },
                    },
                    required: ['dashboardId'],
                },
            },
            {
                name: 'execute_query',
                description: 'Execute a query against Sisense',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'object',
                            description: 'The query object to execute',
                        },
                    },
                    required: ['query'],
                },
            },
            {
                name: 'list_cubes',
                description: 'List all available cubes in Sisense',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
            {
                name: 'get_cube_metadata',
                description: 'Get metadata for a specific cube',
                inputSchema: {
                    type: 'object',
                    properties: {
                        cubeId: {
                            type: 'string',
                            description: 'The ID of the cube',
                        },
                    },
                    required: ['cubeId'],
                },
            },
        ];
    }

    private async getAvailableResources(): Promise<ResourceDefinition[]> {
        if (!this.sisenseService.isConfigured()) {
            logger.warn('Sisense not configured, returning empty resources list');
            return [];
        }

        try {
            const dashboards = await this.sisenseService.getDashboards();
            return dashboards.map((dashboard: any) => ({
                uri: `sisense://dashboard/${dashboard.oid}`,
                name: dashboard.title || `Dashboard ${dashboard.oid}`,
                description: dashboard.description,
                mimeType: 'application/json',
            }));
        } catch (error) {
            logger.error('Failed to get available resources', { error });
            return [];
        }
    }

    private async readResource(
        uri: string
    ): Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }> {
        if (!uri.startsWith('sisense://')) {
            throw new Error(`Unsupported resource URI: ${uri}`);
        }

        const parts = uri.split('/');
        const resourceType = parts[2]; // 'sisense://dashboard/123' -> ['sisense:', '', 'dashboard', '123']
        const resourceId = parts[3];

        if (!resourceId) {
            throw new Error(`Invalid resource URI: ${uri}`);
        }

        try {
            let data: Record<string, unknown>;

            switch (resourceType) {
                case 'dashboard':
                    data = await this.sisenseService.getDashboard(resourceId);
                    break;
                default:
                    throw new Error(`Unsupported resource type: ${resourceType}`);
            }

            return {
                contents: [
                    {
                        uri,
                        mimeType: 'application/json',
                        text: safeStringify(data, 2),
                    },
                ],
            };
        } catch (error) {
            logger.error('Failed to read resource', { uri, error });
            throw error;
        }
    }

    private async callTool(
        name: string,
        args: Record<string, unknown>
    ): Promise<{ content: Array<{ type: string; text: string }> }> {
        try {
            let result: unknown;

            switch (name) {
                case 'get_server_info':
                    result = await this.sisenseService.getServerInfo();
                    break;
                case 'list_data_sources':
                    result = await this.sisenseService.getDataSources();
                    break;
                case 'list_dashboards':
                    result = await this.sisenseService.getDashboards();
                    break;
                case 'get_dashboard':
                    if (!args['dashboardId'] || typeof args['dashboardId'] !== 'string') {
                        throw new Error('dashboardId is required and must be a string');
                    }
                    result = await this.sisenseService.getDashboard(args['dashboardId']);
                    break;
                case 'get_dashboard_widgets':
                    if (!args['dashboardId'] || typeof args['dashboardId'] !== 'string') {
                        throw new Error('dashboardId is required and must be a string');
                    }
                    result = await this.sisenseService.getDashboardWidgets(args['dashboardId']);
                    break;
                case 'execute_query':
                    if (!args['query'] || typeof args['query'] !== 'object') {
                        throw new Error('query is required and must be an object');
                    }
                    result = await this.sisenseService.executeQuery(
                        args['query'] as Record<string, unknown>
                    );
                    break;
                case 'list_cubes':
                    result = await this.sisenseService.getCubes();
                    break;
                case 'get_cube_metadata':
                    if (!args['cubeId'] || typeof args['cubeId'] !== 'string') {
                        throw new Error('cubeId is required and must be a string');
                    }
                    result = await this.sisenseService.getCubeMetadata(args['cubeId']);
                    break;
                default:
                    throw new Error(`Unknown tool: ${name}`);
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: safeStringify(result, 2),
                    },
                ],
            };
        } catch (error) {
            logger.error('Tool execution failed', { name, args, error });
            throw error;
        }
    }

    public async start(): Promise<void> {
        logger.info('Starting Sisense MCP Server', {
            name: env.MCP_SERVER_NAME,
            version: env.MCP_SERVER_VERSION,
        });

        await this.server.connect(this.transport);
        logger.info('Sisense MCP Server started successfully');
    }

    public async stop(): Promise<void> {
        logger.info('Stopping Sisense MCP Server');
        await this.server.close();
        logger.info('Sisense MCP Server stopped');
    }
}
