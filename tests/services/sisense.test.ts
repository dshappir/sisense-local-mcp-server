import { SisenseService } from '../../src/services/sisense';

// Mock fetch globally
global.fetch = jest.fn();

describe('SisenseService', () => {
  let service: SisenseService;
  const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    service = new SisenseService({
      url: 'https://test-sisense.com',
      token: 'test-token',
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isConfigured', () => {
    it('should return true when properly configured with token', () => {
      expect(service.isConfigured()).toBe(true);
    });

    it('should return true when properly configured with username and password', () => {
      const serviceWithAuth = new SisenseService({
        url: 'https://test-sisense.com',
        username: 'test-user',
        password: 'test-pass',
      });
      expect(serviceWithAuth.isConfigured()).toBe(true);
    });

    it('should return false when not configured', () => {
      // Create service with empty configuration to test unconfigured state
      const unconfiguredService = new SisenseService({ url: '', apiKey: '' });
      expect(unconfiguredService.isConfigured()).toBe(false);
    });
  });

  describe('getServerInfo', () => {
    it('should fetch server info successfully', async () => {
      const mockResponse = { version: '1.0.0', status: 'ok' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResponse),
        json: async () => mockResponse,
      } as Response);

      const result = await service.getServerInfo();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-sisense.com/api/v1/server/info',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized',
      } as Response);

      await expect(service.getServerInfo()).rejects.toThrow('Sisense API error: 401 Unauthorized');
    });

    it('should throw error when not configured', async () => {
      // Create service with empty configuration to test unconfigured state
      const unconfiguredService = new SisenseService({ url: '', apiKey: '' });
      await expect(unconfiguredService.getServerInfo()).rejects.toThrow(
        'Sisense is not properly configured'
      );
    });
  });

  describe('getDashboards', () => {
    it('should fetch dashboards successfully', async () => {
      const mockDashboards = [
        { oid: '1', title: 'Dashboard 1' },
        { oid: '2', title: 'Dashboard 2' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockDashboards),
        json: async () => mockDashboards,
      } as Response);

      const result = await service.getDashboards();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-sisense.com/api/v1/dashboards',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockDashboards);
    });
  });

  describe('getDashboard', () => {
    it('should fetch specific dashboard successfully', async () => {
      const mockDashboard = { oid: '123', title: 'Test Dashboard' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockDashboard),
        json: async () => mockDashboard,
      } as Response);

      const result = await service.getDashboard('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-sisense.com/api/v1/dashboards/123',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockDashboard);
    });
  });

  describe('executeQuery', () => {
    it('should execute query successfully', async () => {
      const mockQuery = { query: 'SELECT * FROM table' };
      const mockResult = { data: [], total: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockResult),
        json: async () => mockResult,
      } as Response);

      const result = await service.executeQuery(mockQuery);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-sisense.com/api/v1/query/execute',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockQuery),
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockResult);
    });
  });
});
