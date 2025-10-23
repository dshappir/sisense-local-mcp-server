import type { Logger } from '../types/index.js';
import { env, isDebugEnabled, type LogLevel } from '../config/environment.js';

export const LOG_LEVELS = ['error', 'warn', 'info', 'debug'] as const;

class AppLogger implements Logger {
    private readonly logLevel = env.LOG_LEVEL;

    error(message: string, ...args: unknown[]): void {
        this.print('error', message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.print('warn', message, ...args);
    }

    info(message: string, ...args: unknown[]): void {
        this.print('info', message, ...args);
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.shouldLog('debug') || isDebugEnabled()) {
            console.error(formatMessage('debug', message, ...args));
        }
    }

    private print(level: LogLevel, message: string, ...args: unknown[]): void {
        if (this.shouldLog(level)) {
            console.error(formatMessage(level, message, ...args));
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const currentLevelIndex = LOG_LEVELS.indexOf(this.logLevel);
        const messageLevelIndex = LOG_LEVELS.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
}

function formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (args.length > 0) {
        return `${prefix} ${message} ${args
            .map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
            .join(' ')}`;
    }

    return `${prefix} ${message}`;
}

// Create and export a singleton logger instance
export const logger = new AppLogger();

// Export the logger class for testing
export { AppLogger };
