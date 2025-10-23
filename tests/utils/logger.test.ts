import { AppLogger } from '../../src/utils/logger';

describe('AppLogger', () => {
  let logger: AppLogger;
  let consoleSpy: {
    error: jest.SpyInstance;
    warn: jest.SpyInstance;
    info: jest.SpyInstance;
    debug: jest.SpyInstance;
  };

  beforeEach(() => {
    logger = new AppLogger();
    consoleSpy = {
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation(),
      debug: jest.spyOn(console, 'debug').mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('log levels', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test error message')
      );
    });

    it('should log warn messages', () => {
      logger.warn('Test warning message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning message')
      );
    });

    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message')
      );
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message')
      );
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in log messages', () => {
      logger.info('Test message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });

    it('should format messages with additional arguments', () => {
      logger.info('Test message', { key: 'value' }, 'extra');
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('Test message'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('"key": "value"'));
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('extra'));
    });
  });
});
