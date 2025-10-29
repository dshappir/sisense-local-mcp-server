import { env, isDebugEnabled, LOG_LEVELS, type LogLevel } from '../config/environment.js';
import type { Logger } from '../types/index.js';
import { safeStringify } from './json';

const COLORS: Record<LogLevel, string> = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'green',
};

type DataType = Record<string, unknown>;
class AppLogger implements Logger {
    private readonly logLevel = env.LOG_LEVEL;

    error(message: string, data?: DataType): void {
        this.print('error', message, data);
    }

    warn(message: string, data?: DataType): void {
        this.print('warn', message, data);
    }

    info(message: string, data?: DataType): void {
        this.print('info', message, data);
    }

    debug(message: string, data?: DataType): void {
        if (this.shouldLog('debug') || isDebugEnabled()) {
            logWithColor('debug', message, data);
        }
    }

    private print(level: LogLevel, message: string, data?: DataType): void {
        if (this.shouldLog(level)) {
            logWithColor(level, message, data);
        }
    }

    private shouldLog(level: LogLevel): boolean {
        const currentLevelIndex = LOG_LEVELS.indexOf(this.logLevel);
        const messageLevelIndex = LOG_LEVELS.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
}

function logWithColor(level: LogLevel, message: string, data?: DataType): void {
    console.error(formatMessage(level, message, data), `color: ${COLORS[level]}`);
}

function formatMessage(level: LogLevel, message: string, data?: DataType): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(data && { data: safeStringify(data) }),
    };

    return `%c${JSON.stringify(logEntry)}`;
}

// Create and export a singleton logger instance
export const logger = new AppLogger();

// Export the logger class for testing
export { AppLogger };
