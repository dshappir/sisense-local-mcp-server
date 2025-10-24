import {
    validateInput,
    validateResourceUri,
    validateDashboardId,
    validateCubeId,
    validateQuery,
    validateSisenseConfig,
    dashboardIdSchema,
    cubeIdSchema,
    querySchema,
    getDashboardInputSchema,
    getDashboardWidgetsInputSchema,
    executeQueryInputSchema,
    getCubeMetadataInputSchema,
    resourceUriSchema,
    sisenseConfigSchema,
} from '../../src/utils/validation.js';
import { ValidationError } from '../../src/types/index.js';

describe('Validation Utils', () => {
    describe('validateInput', () => {
        it('should validate input successfully with valid data', () => {
            const schema = dashboardIdSchema;
            const result = validateInput(schema, 'valid-dashboard-id');
            expect(result).toBe('valid-dashboard-id');
        });

        it('should throw ValidationError with invalid data', () => {
            const schema = dashboardIdSchema;
            expect(() => validateInput(schema, '')).toThrow(ValidationError);
        });

        it('should include context in ValidationError', () => {
            const schema = dashboardIdSchema;
            try {
                validateInput(schema, '');
            } catch (error) {
                expect(error).toBeInstanceOf(ValidationError);
                expect(error.context).toBeDefined();
                expect(error.context?.errors).toBeDefined();
                expect(error.context?.input).toBeDefined();
            }
        });
    });

    describe('validateResourceUri', () => {
        it('should validate correct dashboard URI', () => {
            const result = validateResourceUri('sisense://dashboard/123');
            expect(result).toBe('sisense://dashboard/123');
        });

        it('should validate correct cube URI', () => {
            const result = validateResourceUri('sisense://cube/456');
            expect(result).toBe('sisense://cube/456');
        });

        it('should throw ValidationError for invalid URI format', () => {
            expect(() => validateResourceUri('invalid-uri')).toThrow(ValidationError);
            expect(() => validateResourceUri('sisense://invalid/123')).toThrow(ValidationError);
            expect(() => validateResourceUri('sisense://dashboard')).toThrow(ValidationError);
        });
    });

    describe('validateDashboardId', () => {
        it('should validate correct dashboard ID', () => {
            const result = validateDashboardId('dashboard-123');
            expect(result).toBe('dashboard-123');
        });

        it('should throw ValidationError for empty dashboard ID', () => {
            expect(() => validateDashboardId('')).toThrow(ValidationError);
        });

        it('should throw ValidationError for non-string dashboard ID', () => {
            expect(() => validateDashboardId(123 as any)).toThrow(ValidationError);
        });
    });

    describe('validateCubeId', () => {
        it('should validate correct cube ID', () => {
            const result = validateCubeId('cube-456');
            expect(result).toBe('cube-456');
        });

        it('should throw ValidationError for empty cube ID', () => {
            expect(() => validateCubeId('')).toThrow(ValidationError);
        });
    });

    describe('validateQuery', () => {
        it('should validate correct query object', () => {
            const query = {
                query: 'SELECT * FROM table',
                parameters: { limit: 10 },
                limit: 100,
                offset: 0,
            };
            const result = validateQuery(query);
            expect(result).toEqual(query);
        });

        it('should validate minimal query object', () => {
            const query = { query: 'SELECT * FROM table' };
            const result = validateQuery(query);
            expect(result).toEqual(query);
        });

        it('should throw ValidationError for empty query', () => {
            expect(() => validateQuery({ query: '' })).toThrow(ValidationError);
        });

        it('should throw ValidationError for missing query', () => {
            expect(() => validateQuery({})).toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid limit', () => {
            expect(() => validateQuery({ query: 'SELECT *', limit: -1 })).toThrow(ValidationError);
        });

        it('should throw ValidationError for invalid offset', () => {
            expect(() => validateQuery({ query: 'SELECT *', offset: -1 })).toThrow(ValidationError);
        });
    });

    describe('validateSisenseConfig', () => {
        it('should validate correct Sisense config', () => {
            const config = {
                url: 'https://sisense.example.com',
                apiKey: 'valid-api-key',
            };
            const result = validateSisenseConfig(config);
            expect(result).toEqual(config);
        });

        it('should throw ValidationError for invalid URL', () => {
            expect(() =>
                validateSisenseConfig({
                    url: 'invalid-url',
                    apiKey: 'valid-key',
                })
            ).toThrow(ValidationError);
        });

        it('should throw ValidationError for empty API key', () => {
            expect(() =>
                validateSisenseConfig({
                    url: 'https://sisense.example.com',
                    apiKey: '',
                })
            ).toThrow(ValidationError);
        });
    });

    describe('Schema definitions', () => {
        describe('dashboardIdSchema', () => {
            it('should accept valid dashboard IDs', () => {
                expect(() => dashboardIdSchema.parse('dashboard-123')).not.toThrow();
                expect(() => dashboardIdSchema.parse('123')).not.toThrow();
                expect(() => dashboardIdSchema.parse('dashboard_with_underscores')).not.toThrow();
            });

            it('should reject invalid dashboard IDs', () => {
                expect(() => dashboardIdSchema.parse('')).toThrow();
                expect(() => dashboardIdSchema.parse(null)).toThrow();
                expect(() => dashboardIdSchema.parse(undefined)).toThrow();
            });
        });

        describe('cubeIdSchema', () => {
            it('should accept valid cube IDs', () => {
                expect(() => cubeIdSchema.parse('cube-456')).not.toThrow();
                expect(() => cubeIdSchema.parse('456')).not.toThrow();
            });

            it('should reject invalid cube IDs', () => {
                expect(() => cubeIdSchema.parse('')).toThrow();
                expect(() => cubeIdSchema.parse(null)).toThrow();
            });
        });

        describe('querySchema', () => {
            it('should accept valid query objects', () => {
                const validQuery = {
                    query: 'SELECT * FROM table',
                    parameters: { param1: 'value1' },
                    limit: 100,
                    offset: 0,
                };
                expect(() => querySchema.parse(validQuery)).not.toThrow();
            });

            it('should reject invalid query objects', () => {
                expect(() => querySchema.parse({ query: '' })).toThrow();
                expect(() => querySchema.parse({})).toThrow();
                expect(() => querySchema.parse({ query: 'SELECT *', limit: -1 })).toThrow();
            });
        });

        describe('resourceUriSchema', () => {
            it('should accept valid resource URIs', () => {
                expect(() => resourceUriSchema.parse('sisense://dashboard/123')).not.toThrow();
                expect(() => resourceUriSchema.parse('sisense://cube/456')).not.toThrow();
            });

            it('should reject invalid resource URIs', () => {
                expect(() => resourceUriSchema.parse('invalid-uri')).toThrow();
                expect(() => resourceUriSchema.parse('sisense://invalid/123')).toThrow();
                expect(() => resourceUriSchema.parse('sisense://dashboard')).toThrow();
            });
        });

        describe('sisenseConfigSchema', () => {
            it('should accept valid Sisense configs', () => {
                const validConfig = {
                    url: 'https://sisense.example.com',
                    apiKey: 'valid-api-key',
                };
                expect(() => sisenseConfigSchema.parse(validConfig)).not.toThrow();
            });

            it('should reject invalid Sisense configs', () => {
                expect(() =>
                    sisenseConfigSchema.parse({
                        url: 'invalid-url',
                        apiKey: 'valid-key',
                    })
                ).toThrow();
                expect(() =>
                    sisenseConfigSchema.parse({
                        url: 'https://sisense.example.com',
                        apiKey: '',
                    })
                ).toThrow();
            });
        });
    });

    describe('Tool input schemas', () => {
        describe('getDashboardInputSchema', () => {
            it('should validate correct input', () => {
                const input = { dashboardId: 'dashboard-123' };
                expect(() => getDashboardInputSchema.parse(input)).not.toThrow();
            });

            it('should reject missing dashboardId', () => {
                expect(() => getDashboardInputSchema.parse({})).toThrow();
            });
        });

        describe('getDashboardWidgetsInputSchema', () => {
            it('should validate correct input', () => {
                const input = { dashboardId: 'dashboard-123' };
                expect(() => getDashboardWidgetsInputSchema.parse(input)).not.toThrow();
            });
        });

        describe('executeQueryInputSchema', () => {
            it('should validate correct input', () => {
                const input = { query: { query: 'SELECT * FROM table' } };
                expect(() => executeQueryInputSchema.parse(input)).not.toThrow();
            });
        });

        describe('getCubeMetadataInputSchema', () => {
            it('should validate correct input', () => {
                const input = { cubeId: 'cube-456' };
                expect(() => getCubeMetadataInputSchema.parse(input)).not.toThrow();
            });
        });
    });
});
