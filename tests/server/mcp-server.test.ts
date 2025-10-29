import { SisenseMCPServer } from '../../src/server/mcp-server';
import { SwaggerClient, ToolGenerator } from '../../src/services';
import { ValidationError } from '../../src/types/index.js';

// Mock the services
jest.mock('../../src/services/swagger-client');
jest.mock('../../src/services/tool-generator');

const MockedSwaggerClient = SwaggerClient as jest.MockedClass<typeof SwaggerClient>;
const MockedToolGenerator = ToolGenerator as jest.MockedClass<typeof ToolGenerator>;

describe('SisenseMCPServer', () => {
    let server: SisenseMCPServer;
    let mockSwaggerClient: jest.Mocked<SwaggerClient>;
    let mockToolGenerator: jest.Mocked<ToolGenerator>;

    beforeEach(async () => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockSwaggerClient = {
            isConfigured: jest.fn().mockReturnValue(true),
            makeRequest: jest.fn(),
            makeApiRequest: jest.fn(),
        } as any;

        mockToolGenerator = {
            generateTools: jest.fn().mockResolvedValue([]),
        } as any;

        // Mock the constructors
        MockedSwaggerClient.mockImplementation(() => mockSwaggerClient);
        MockedToolGenerator.mockImplementation(() => mockToolGenerator);

        server = new SisenseMCPServer();

        // Wait for dynamic tools initialization to complete
        await new Promise(resolve => setTimeout(resolve, 50));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('tool execution', () => {
        it('should throw ValidationError for unknown tools when no dynamic tools are available', async () => {
            // Mock empty tools array
            mockToolGenerator.generateTools.mockResolvedValue([]);

            await expect(server['callTool']('unknown_tool', {})).rejects.toThrow(ValidationError);
        });

        it('should execute dynamic tools when available', async () => {
            const mockTool = {
                name: 'test_tool',
                description: 'Test tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        param: { type: 'string' },
                    },
                },
            };

            // Set up mocks for this specific test
            mockToolGenerator.generateTools.mockResolvedValue([mockTool]);
            mockSwaggerClient.makeApiRequest.mockResolvedValue({ result: 'success' });

            // Create a new server instance with the mocked tools
            const testServer = new SisenseMCPServer();

            // Wait for dynamic tools initialization
            await new Promise(resolve => setTimeout(resolve, 100));

            const result = await testServer['callTool']('test_tool', { param: 'value' });

            expect(result).toBeDefined();
            expect(result.content).toBeDefined();
        });
    });

    describe('resource handling', () => {
        it('should return empty resources (current implementation)', async () => {
            const resources = await server['getAvailableResources']();
            expect(resources).toEqual([]);
        });

        it('should throw ValidationError for unsupported resource URI', async () => {
            await expect(server['readResource']('unsupported://resource')).rejects.toThrow(
                ValidationError
            );
        });

        it('should throw ValidationError for unsupported resource type', async () => {
            await expect(server['readResource']('sisense://unknown/123')).rejects.toThrow(
                ValidationError
            );
        });

        it('should throw ValidationError for missing resource ID', async () => {
            await expect(server['readResource']('sisense://dashboard/')).rejects.toThrow(
                ValidationError
            );
        });
    });

    describe('tool definitions', () => {
        it('should return correct tool definitions', async () => {
            const mockTools = [
                {
                    name: 'test_tool_1',
                    description: 'Test tool 1',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            param1: { type: 'string' },
                        },
                    },
                },
                {
                    name: 'test_tool_2',
                    description: 'Test tool 2',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            param2: { type: 'number' },
                        },
                    },
                },
            ];

            // Set up mocks for this specific test
            mockToolGenerator.generateTools.mockResolvedValue(mockTools);

            // Create a new server instance with the mocked tools
            const testServer = new SisenseMCPServer();

            // Wait for dynamic tools initialization to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            const tools = testServer['getAvailableTools']();

            expect(Array.isArray(tools)).toBe(true);
            expect(tools).toEqual(mockTools);

            // Check that tool structure is correct
            if (tools.length > 0) {
                const firstTool = tools[0];
                expect(firstTool).toHaveProperty('name');
                expect(firstTool).toHaveProperty('description');
                expect(firstTool).toHaveProperty('inputSchema');
            }
        });

        it('should return empty tools when SwaggerClient is not configured', async () => {
            // Set up mocks for this specific test
            mockSwaggerClient.isConfigured.mockReturnValue(false);
            mockToolGenerator.generateTools.mockResolvedValue([]);

            // Create a new server instance with the mocked configuration
            const testServer = new SisenseMCPServer();

            // Wait for dynamic tools initialization to complete
            await new Promise(resolve => setTimeout(resolve, 100));

            const tools = testServer['getAvailableTools']();
            expect(tools).toEqual([]);
        });
    });
});
