export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests', '<rootDir>/src'],
    testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.spec.ts'],
    collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 55,
            functions: 55,
            lines: 60,
            statements: 60,
        },
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 10000,
    verbose: true,
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@modelcontextprotocol/sdk/(.*)$':
            '<rootDir>/tests/__mocks__/@modelcontextprotocol/sdk/$1',
    },
    transformIgnorePatterns: ['node_modules/(?!(@modelcontextprotocol)/)'],
    // VS Code Test Explorer compatibility
    displayName: 'Sisense MCP Server Tests',
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
