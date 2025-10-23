// Jest setup file
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'debug'; // Allow all log levels for testing
process.env.DEBUG = 'true';

// Set required environment variables for tests
process.env.SISENSE_URL = 'https://test-sisense.com';
process.env.SISENSE_API_KEY = 'test-token';

// Mock console methods to reduce test output noise
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.debug = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(10000);
