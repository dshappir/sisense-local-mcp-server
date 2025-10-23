import { logger } from './logger.js';

/**
 * Safely stringify JSON data, handling circular references and other issues
 */
export function safeStringify(data: unknown, space?: number): string {
    try {
        // Handle null/undefined
        if (data === null || data === undefined) {
            return String(data);
        }

        // Handle primitive types
        if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
            return JSON.stringify(data, null, space);
        }

        // Handle functions and symbols
        if (typeof data === 'function' || typeof data === 'symbol') {
            return `[${typeof data}]`;
        }

        // Handle objects and arrays with circular reference detection
        const seen = new WeakSet();
        return JSON.stringify(
            data,
            (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular Reference]';
                    }
                    seen.add(value);
                }
                return value;
            },
            space
        );
    } catch (error) {
        // If JSON.stringify fails, return a safe representation
        return `[Error stringifying data: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
}

/**
 * Safely parse JSON data with error handling
 */
export function safeParse<T = unknown>(jsonString: string): T | null {
    try {
        return JSON.parse(jsonString) as T;
    } catch (error) {
        logger.error('Failed to parse JSON', {
            error: error instanceof Error ? error.message : 'Unknown error',
            jsonString: jsonString.substring(0, 100) + (jsonString.length > 100 ? '...' : ''),
        });
        return null;
    }
}
