import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

// Define log levels array
const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;

// Create a Zod schema for LogLevel
const logLevelSchema = z.enum(LOG_LEVELS);

// Export LogLevel type
export type LogLevel = (typeof LOG_LEVELS)[number];

// Environment validation schema
const envSchema = z.object({
    // MCP Server Configuration
    MCP_SERVER_NAME: z.string().default('sisense-local-mcp-server'),
    MCP_SERVER_VERSION: z.string().default('1.0.0'),
    MCP_SERVER_DESCRIPTION: z.string().default('Local (STD) Sisense MCP server'),

    // Server Settings
    LOG_LEVEL: logLevelSchema.default('info'),

    // Sisense Configuration
    SISENSE_URL: z.string().url().optional(),
    SISENSE_API_KEY: z.string().optional(),

    // Development Settings
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DEBUG: z.coerce.boolean().default(false),
});

// Parse and validate environment variables
function parseEnvironment() {
    try {
        return envSchema.parse(process.env);
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error('❌ Environment validation failed:');
            error.errors.forEach(err => {
                console.error(`  - ${err.path.join('.')}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
}

export const env = parseEnvironment() as Environment & {
    LOG_LEVEL: LogLevel;
};

// Type-safe environment configuration
export type Environment = z.infer<typeof envSchema>;

// Helper function to check if running in development
export function isDevelopment(): boolean {
    return env.NODE_ENV === 'development';
}

// Helper function to check if running in production
export function isProduction(): boolean {
    return env.NODE_ENV === 'production';
}

// Helper function to check if running in test
export function isTest(): boolean {
    return env.NODE_ENV === 'test';
}

// Helper function to check if debug mode is enabled
export function isDebugEnabled(): boolean {
    return env.DEBUG;
}
