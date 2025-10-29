import { SwaggerClient } from '../../src/services/swagger-client';
import { ToolGenerator } from '../../src/services/tool-generator';

// Mock the SwaggerClient
jest.mock('../../src/services/swagger-client');

describe('ToolGenerator', () => {
    let toolGenerator: ToolGenerator;
    let mockSwaggerClient: jest.Mocked<SwaggerClient>;

    beforeEach(() => {
        mockSwaggerClient = {
            isConfigured: jest.fn().mockReturnValue(true),
            makeRequest: jest.fn(),
            makeApiRequest: jest.fn(),
            fetchSwaggerSpec: jest.fn(),
        } as any;

        toolGenerator = new ToolGenerator(mockSwaggerClient);
    });

    describe('shouldExcludeParameter', () => {
        it('should exclude parameters in EXCLUDED_PARAMETERS list', () => {
            // Test exact matches from the exclusion list
            expect(toolGenerator['shouldExcludeParameter']('authorization')).toBe(true);
            expect(toolGenerator['shouldExcludeParameter']('x-device-id')).toBe(true);
        });

        it('should handle case-insensitive matching', () => {
            // Test case variations of excluded parameters
            expect(toolGenerator['shouldExcludeParameter']('Authorization')).toBe(true);
            expect(toolGenerator['shouldExcludeParameter']('AUTHORIZATION')).toBe(true);
            expect(toolGenerator['shouldExcludeParameter']('X-DEVICE-ID')).toBe(true);
            expect(toolGenerator['shouldExcludeParameter']('X-Device-Id')).toBe(true);
        });

        it('should not exclude non-excluded parameters', () => {
            // Test various non-excluded parameter names
            expect(toolGenerator['shouldExcludeParameter']('id')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('name')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('email')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('limit')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('offset')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('query')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('data')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('body')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('auth')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('token')).toBe(false);
            expect(toolGenerator['shouldExcludeParameter']('apiKey')).toBe(false);
        });
    });
});
