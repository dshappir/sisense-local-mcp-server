import { z } from 'zod';
import { ValidationError } from '../types/index.js';

// Common validation schemas
export const dashboardIdSchema = z.string().min(1, 'Dashboard ID cannot be empty');
export const cubeIdSchema = z.string().min(1, 'Cube ID cannot be empty');
export const querySchema = z.object({
    query: z.string().min(1, 'Query cannot be empty'),
    parameters: z.record(z.unknown()).optional(),
    limit: z.number().positive().optional(),
    offset: z.number().nonnegative().optional(),
});

// Tool input validation schemas
export const getDashboardInputSchema = z.object({
    dashboardId: dashboardIdSchema,
});

export const getDashboardWidgetsInputSchema = z.object({
    dashboardId: dashboardIdSchema,
});

export const executeQueryInputSchema = z.object({
    query: querySchema,
});

export const getCubeMetadataInputSchema = z.object({
    cubeId: cubeIdSchema,
});

// Resource URI validation
export const resourceUriSchema = z
    .string()
    .regex(/^sisense:\/\/(dashboard|cube)\/[a-zA-Z0-9_-]+$/, 'Invalid resource URI format');

// Sisense configuration validation
export const sisenseConfigSchema = z.object({
    url: z.string().url('Invalid Sisense URL'),
    apiKey: z.string().min(1, 'API key cannot be empty'),
});

// Validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
    try {
        return schema.parse(input);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const context = {
                errors: error.errors.map(err => ({
                    path: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                })),
                input: typeof input === 'object' ? input : { value: input },
            };
            throw new ValidationError('Input validation failed', context);
        }
        throw error;
    }
}

export function validateResourceUri(uri: string): string {
    return validateInput(resourceUriSchema, uri);
}

export function validateDashboardId(dashboardId: string): string {
    return validateInput(dashboardIdSchema, dashboardId);
}

export function validateCubeId(cubeId: string): string {
    return validateInput(cubeIdSchema, cubeId);
}

export function validateQuery(query: unknown): z.infer<typeof querySchema> {
    return validateInput(querySchema, query);
}

export function validateSisenseConfig(config: unknown): z.infer<typeof sisenseConfigSchema> {
    return validateInput(sisenseConfigSchema, config);
}
