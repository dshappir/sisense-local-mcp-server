import type { Logger } from '../types/index.js';
import { env, isDebugEnabled, type LogLevel } from '../config/environment.js';

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;

class AppLogger implements Logger {
    private readonly logLevel = env.LOG_LEVEL;

    error(message: string, data?: Record<string, unknown>): void {
        this.print('error', message, data);
    }

    warn(message: string, data?: Record<string, unknown>): void {
        this.print('warn', message, data);
    }

    info(message: string, data?: Record<string, unknown>): void {
        this.print('info', message, data);
    }

    debug(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('debug') || isDebugEnabled()) {
            console.error(formatMessage('debug', message, data));
        }
    }

    private print(level: LogLevel, message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog(level)) {
            console.error(formatMessage(level, message, data));
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const currentLevelIndex = LOG_LEVELS.indexOf(this.logLevel);
        const messageLevelIndex = LOG_LEVELS.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
}

function formatMessage(level: LogLevel, message: string, data?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(data && { data: safeStringifyData(data) }),
    };

    return JSON.stringify(logEntry);
}

function safeStringifyData(data: Record<string, unknown>): unknown {
    try {
        // Handle circular references by using a WeakSet to track seen objects
        const seen = new WeakSet();
        return JSON.parse(
            JSON.stringify(data, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular Reference]';
                    }
                    seen.add(value);
                }
                return value;
            })
        );
    } catch (error) {
        return `[Error serializing data: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
}

// Create and export a singleton logger instance
export const logger = new AppLogger();

// Export the logger class for testing
export { AppLogger };
