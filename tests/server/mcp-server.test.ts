import { SisenseMCPServer } from '../../src/server/mcp-server';
import { SisenseService } from '../../src/services/sisense';

// Mock the SisenseService
jest.mock('../../src/services/sisense');
const MockedSisenseService = SisenseService as jest.MockedClass<typeof SisenseService>;

describe('SisenseMCPServer', () => {
  let server: SisenseMCPServer;
  let mockSisenseService: jest.Mocked<SisenseService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockSisenseService = {
      isConfigured: jest.fn().mockReturnValue(true),
      getServerInfo: jest.fn(),
      getDataSources: jest.fn(),
      getDashboards: jest.fn(),
      getDashboard: jest.fn(),
      getDashboardWidgets: jest.fn(),
      executeQuery: jest.fn(),
      getCubes: jest.fn(),
      getCubeMetadata: jest.fn(),
    } as any;

    // Mock the constructor
    MockedSisenseService.mockImplementation(() => mockSisenseService);

    server = new SisenseMCPServer();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('tool execution', () => {
    it('should execute get_server_info tool', async () => {
      const mockServerInfo = { version: '1.0.0', status: 'ok' };
      mockSisenseService.getServerInfo.mockResolvedValue(mockServerInfo);

      const result = await server['callTool']('get_server_info', {});

      expect(mockSisenseService.getServerInfo).toHaveBeenCalled();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockServerInfo, null, 2),
          },
        ],
      });
    });

    it('should execute list_dashboards tool', async () => {
      const mockDashboards = [
        { oid: '1', title: 'Dashboard 1' },
        { oid: '2', title: 'Dashboard 2' },
      ];
      mockSisenseService.getDashboards.mockResolvedValue(mockDashboards);

      const result = await server['callTool']('list_dashboards', {});

      expect(mockSisenseService.getDashboards).toHaveBeenCalled();
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockDashboards, null, 2),
          },
        ],
      });
    });

    it('should execute get_dashboard tool with valid arguments', async () => {
      const mockDashboard = { oid: '123', title: 'Test Dashboard' };
      mockSisenseService.getDashboard.mockResolvedValue(mockDashboard);

      const result = await server['callTool']('get_dashboard', { dashboardId: '123' });

      expect(mockSisenseService.getDashboard).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockDashboard, null, 2),
          },
        ],
      });
    });

    it('should throw error for get_dashboard tool with missing dashboardId', async () => {
      await expect(server['callTool']('get_dashboard', {})).rejects.toThrow(
        'dashboardId is required and must be a string'
      );
    });

    it('should execute execute_query tool with valid query', async () => {
      const mockQuery = { query: 'SELECT * FROM table' };
      const mockResult = { data: [], total: 0 };
      mockSisenseService.executeQuery.mockResolvedValue(mockResult);

      const result = await server['callTool']('execute_query', { query: mockQuery });

      expect(mockSisenseService.executeQuery).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockResult, null, 2),
          },
        ],
      });
    });

    it('should throw error for execute_query tool with missing query', async () => {
      await expect(server['callTool']('execute_query', {})).rejects.toThrow(
        'query is required and must be an object'
      );
    });

    it('should throw error for unknown tool', async () => {
      await expect(server['callTool']('unknown_tool', {})).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });

  describe('resource handling', () => {
    it('should get available resources when Sisense is configured', async () => {
      const mockDashboards = [
        { oid: '1', title: 'Dashboard 1' },
        { oid: '2', title: 'Dashboard 2' },
      ];
      mockSisenseService.getDashboards.mockResolvedValue(mockDashboards);

      const resources = await server['getAvailableResources']();

      expect(mockSisenseService.getDashboards).toHaveBeenCalled();
      expect(resources).toEqual([
        {
          uri: 'sisense://dashboard/1',
          name: 'Dashboard 1',
          description: undefined,
          mimeType: 'application/json',
        },
        {
          uri: 'sisense://dashboard/2',
          name: 'Dashboard 2',
          description: undefined,
          mimeType: 'application/json',
        },
      ]);
    });

    it('should return empty resources when Sisense is not configured', async () => {
      mockSisenseService.isConfigured.mockReturnValue(false);

      const resources = await server['getAvailableResources']();

      expect(resources).toEqual([]);
    });

    it('should read dashboard resource successfully', async () => {
      const mockDashboard = { oid: '123', title: 'Test Dashboard' };
      mockSisenseService.getDashboard.mockResolvedValue(mockDashboard);

      const result = await server['readResource']('sisense://dashboard/123');

      expect(mockSisenseService.getDashboard).toHaveBeenCalledWith('123');
      expect(result).toEqual({
        contents: [
          {
            uri: 'sisense://dashboard/123',
            mimeType: 'application/json',
            text: JSON.stringify(mockDashboard, null, 2),
          },
        ],
      });
    });

    it('should throw error for unsupported resource URI', async () => {
      await expect(server['readResource']('unsupported://resource')).rejects.toThrow(
        'Unsupported resource URI: unsupported://resource'
      );
    });

    it('should throw error for unsupported resource type', async () => {
      await expect(server['readResource']('sisense://unknown/123')).rejects.toThrow(
        'Unsupported resource type: unknown'
      );
    });
  });

  describe('tool definitions', () => {
    it('should return correct tool definitions', () => {
      const tools = server['getAvailableTools']();

      expect(tools).toHaveLength(8);
      expect(tools.map(t => t.name)).toEqual([
        'get_server_info',
        'list_data_sources',
        'list_dashboards',
        'get_dashboard',
        'get_dashboard_widgets',
        'execute_query',
        'list_cubes',
        'get_cube_metadata',
      ]);

      // Check that get_dashboard tool has required parameters
      const getDashboardTool = tools.find(t => t.name === 'get_dashboard');
      expect(getDashboardTool?.inputSchema).toEqual({
        type: 'object',
        properties: {
          dashboardId: {
            type: 'string',
            description: 'The ID of the dashboard to retrieve',
          },
        },
        required: ['dashboardId'],
      });
    });
  });
});
