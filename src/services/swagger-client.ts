import type { ApiCallMapping, SisenseConfig } from '../types';
import {
    AuthenticationError,
    ConfigurationError,
    ExternalServiceError,
    NetworkError,
    NotFoundError,
} from '../types/index.js';
import { safeParse } from '../utils/json.js';
import { logger } from '../utils/logger.js';

type InType = 'query' | 'header' | 'path' | 'cookie' | 'body';

// Type for fetch request options
interface RequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
}

export interface SwaggerSpec {
    basePath: string;
    consumes: string[];
    definitions?: Record<string, Schema>;
    parameters?: Record<string, Parameter>;
    swagger?: string;
    openapi?: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    paths: Record<string, PathItem>;
    components?: {
        schemas?: Record<string, Schema>;
    };
}

export interface PathItem {
    get?: Operation;
    post?: Operation;
    put?: Operation;
    delete?: Operation;
    patch?: Operation;
    head?: Operation;
    options?: Operation;
    parameters?: Parameter[];
}

export type MethodType = Exclude<keyof PathItem, 'parameters'>;

export interface Operation {
    operationId?: string;
    tags?: string[];
    summary?: string;
    description?: string;
    parameters?: Array<Parameter | ReferenceObject>;
    responses: Record<string, Response>;
    deprecated?: boolean;
}

export interface Parameter {
    name: string;
    in: InType;
    required?: boolean;
    description?: string;
    schema?: Schema | ReferenceObject;
    type?: string;
    format?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: boolean;
    exclusiveMaximum?: boolean;
    multipleOf?: number;
    enum?: string[];
}

export interface ReferenceObject {
    $ref: string;
}

export interface Response {
    description: string;
    schema?: Schema | ReferenceObject;
}

export interface Schema {
    type?: string;
    format?: string;
    description?: string;
    properties?: Record<string, Schema>;
    items?: Schema | ReferenceObject;
    required?: string[];
    enum?: string[];
    in?: InType;
}

// Re-export ApiCallMapping from types for convenience
export type { ApiCallMapping } from '../types/index.js';

export class SwaggerClient {
    private readonly config: SisenseConfig;
    private readonly baseUrl: string;
    private swaggerSpec: SwaggerSpec | null = null;
    private apiCallMap: Map<string, ApiCallMapping> = new Map();

    constructor(config: SisenseConfig) {
        this.config = config;
        this.baseUrl = config.url;
    }

    /**
     * Check if the client is properly configured
     */
    public isConfigured(): boolean {
        return Boolean(this.baseUrl && this.config.apiKey);
    }

    /**
     * Get authentication headers
     */
    private getAuthHeaders(): Record<string, string> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        };

        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        }

        return headers;
    }

    /**
     * Make an authenticated request to the Sisense API
     */
    private async makeRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        if (!this.isConfigured()) {
            throw new ConfigurationError('SwaggerClient is not properly configured', {
                hasUrl: Boolean(this.config.url),
                hasApiKey: Boolean(this.config.apiKey),
            });
        }

        const url = `${this.baseUrl.replace(/\/$/, '')}${endpoint}`;
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers,
        };

        logger.debug('Making request to Sisense API', {
            url,
            method: options.method || 'GET',
            endpoint,
        });

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                const errorContext = {
                    url,
                    status: response.status,
                    statusText: response.statusText,
                    method: options.method || 'GET',
                };

                if (response.status === 401) {
                    throw new AuthenticationError('Sisense authentication failed', errorContext);
                } else if (response.status === 404) {
                    throw new NotFoundError('Sisense resource not found', errorContext);
                } else if (response.status >= 500) {
                    throw new ExternalServiceError('Sisense server error', errorContext);
                } else {
                    throw new ExternalServiceError(
                        `Sisense API error: ${response.status} ${response.statusText}`,
                        errorContext
                    );
                }
            }

            const responseText = await response.text();
            logger.debug('Sisense API response received', {
                status: response.status,
                contentLength: responseText.length,
                endpoint,
            });

            // Try to parse JSON safely
            const data = safeParse<T>(responseText);
            if (data === null) {
                throw new ExternalServiceError('Invalid JSON response from Sisense API', {
                    url,
                    responseLength: responseText.length,
                    responsePreview: responseText.substring(0, 200),
                });
            }

            return data;
        } catch (error) {
            if (
                error instanceof Error &&
                error.name === 'TypeError' &&
                error.message.includes('fetch')
            ) {
                throw new NetworkError('Network error connecting to Sisense', {
                    url,
                    originalError: error.message,
                });
            }

            // Re-throw our custom errors as-is
            if (
                error instanceof ConfigurationError ||
                error instanceof AuthenticationError ||
                error instanceof NotFoundError ||
                error instanceof ExternalServiceError ||
                error instanceof NetworkError
            ) {
                throw error;
            }

            logger.error('Sisense API request failed', {
                error: error instanceof Error ? error.message : String(error),
                url,
                endpoint,
            });

            throw new ExternalServiceError('Sisense API request failed', {
                url,
                endpoint,
                originalError: error instanceof Error ? error.message : String(error),
            });
        }
    }

    /**
     * Fetch Swagger v2 specification from Sisense server
     */
    public async fetchSwaggerSpec(endpoint: string): Promise<SwaggerSpec> {
        if (this.swaggerSpec) {
            return this.swaggerSpec;
        }

        logger.info('Fetching Swagger v2 specification from Sisense server');

        try {
            this.swaggerSpec = await this.makeRequest<SwaggerSpec>(
                `${endpoint}?schemaType=swagger`
            );

            logger.info('Successfully fetched Swagger v2 specification', {
                title: this.swaggerSpec.info?.title,
                version: this.swaggerSpec.info?.version,
                pathCount: Object.keys(this.swaggerSpec.paths || {}).length,
            });

            return this.swaggerSpec;
        } catch (error) {
            logger.error('Failed to fetch Swagger v2 specification', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Get the API call mapping for a specific tool
     */
    public getApiCallMapping(toolName: string): ApiCallMapping | undefined {
        return this.apiCallMap.get(toolName);
    }

    /**
     * Set the API call mapping for a tool
     */
    public setApiCallMapping(toolName: string, mapping: ApiCallMapping): void {
        this.apiCallMap.set(toolName, mapping);
    }

    /**
     * Make an API request (public method for external use)
     */
    public async makeApiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        return this.makeRequest<T>(endpoint, options);
    }
}
