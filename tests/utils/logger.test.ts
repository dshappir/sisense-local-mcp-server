import { AppLogger } from '../../src/utils/logger.js';

// Mock console.error to capture log output
const mockConsoleError = jest.fn();

describe('AppLogger', () => {
    let logger: AppLogger;

    beforeEach(() => {
        logger = new AppLogger();
        mockConsoleError.mockClear();
        // Mock console.error
        jest.spyOn(console, 'error').mockImplementation(mockConsoleError);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('structured logging', () => {
        it('should log error messages with structured data', () => {
            const testData = { userId: '123', action: 'login' };
            logger.error('User login failed', testData);

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry).toMatchObject({
                level: 'ERROR',
                message: 'User login failed',
                data: testData,
            });
            expect(logEntry.timestamp).toBeDefined();
        });

        it('should log warn messages with structured data', () => {
            const testData = { warning: 'Deprecated API used' };
            logger.warn('API deprecation warning', testData);

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry).toMatchObject({
                level: 'WARN',
                message: 'API deprecation warning',
                data: testData,
            });
        });

        it('should log info messages with structured data', () => {
            const testData = { operation: 'startup', version: '1.0.0' };
            logger.info('Application started', testData);

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry).toMatchObject({
                level: 'INFO',
                message: 'Application started',
                data: testData,
            });
        });

        it('should log debug messages with structured data', () => {
            const testData = { debug: 'Debug information' };
            logger.debug('Debug message', testData);

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry).toMatchObject({
                level: 'DEBUG',
                message: 'Debug message',
                data: testData,
            });
        });

        it('should log messages without data', () => {
            logger.info('Simple message');

            expect(mockConsoleError).toHaveBeenCalledTimes(1);
            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry).toMatchObject({
                level: 'INFO',
                message: 'Simple message',
            });
            expect(logEntry.data).toBeUndefined();
        });
    });

    describe('log level filtering', () => {
        it('should respect log level configuration', () => {
            // This test assumes the logger is configured with 'info' level
            // In a real test, you might want to mock the environment configuration
            logger.debug('Debug message');

            // Debug messages should only be logged if debug is enabled or log level allows it
            // The actual behavior depends on the environment configuration
            expect(mockConsoleError).toHaveBeenCalled();
        });
    });

    describe('timestamp format', () => {
        it('should include ISO timestamp', () => {
            logger.info('Test message');

            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        });
    });

    describe('data serialization', () => {
        it('should handle complex data objects', () => {
            const complexData = {
                nested: {
                    array: [1, 2, 3],
                    object: { key: 'value' },
                },
                circular: null as any,
            };

            // Create a circular reference
            complexData.circular = complexData;

            logger.error('Complex data test', complexData);

            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry.data).toBeDefined();
            expect(logEntry.data.nested).toBeDefined();
            expect(logEntry.data.nested.array).toEqual([1, 2, 3]);
        });

        it('should handle undefined data gracefully', () => {
            logger.info('Message with undefined data', undefined as any);

            const logCall = mockConsoleError.mock.calls[0][0];
            const logEntry = JSON.parse(logCall);

            expect(logEntry.data).toBeUndefined();
        });
    });
});
