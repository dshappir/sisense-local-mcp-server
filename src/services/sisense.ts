import type { SisenseConfig } from '../types/index.js';
import {
    ConfigurationError,
    ExternalServiceError,
    NetworkError,
    NotFoundError,
    AuthenticationError,
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { safeParse } from '../utils/json.js';
import { env } from '../config/environment.js';
import {
    validateSisenseConfig,
    validateDashboardId,
    validateCubeId,
    validateQuery,
} from '../utils/validation.js';

// Type for fetch request options
interface RequestOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    signal?: AbortSignal;
}

export class SisenseService {
    private readonly config: SisenseConfig;
    private readonly baseUrl: string;

    constructor(config?: Partial<SisenseConfig>) {
        try {
            const rawConfig = {
                url: config?.url ?? env.SISENSE_URL ?? '',
                apiKey: config?.apiKey ?? env.SISENSE_API_KEY ?? '',
            };

            // Validate configuration if both URL and API key are provided
            if (rawConfig.url && rawConfig.apiKey) {
                this.config = validateSisenseConfig(rawConfig);
            } else {
                this.config = rawConfig as SisenseConfig;
            }

            this.baseUrl = this.config.url;

            if (!this.isConfigured()) {
                logger.warn(
                    'Sisense is not properly configured. Some features may not be available.',
                    {
                        hasUrl: Boolean(this.config.url),
                        hasApiKey: Boolean(this.config.apiKey),
                    }
                );
            }
        } catch (error) {
            logger.error('Failed to initialize SisenseService', { error });
            throw new ConfigurationError('Invalid Sisense configuration', {
                originalError: error instanceof Error ? error.message : String(error),
                providedConfig: config,
            });
        }
    }

    /**
     * Check if Sisense is properly configured
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
     * Make an authenticated request to Sisense API
     */
    private async makeRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        if (!this.isConfigured()) {
            throw new ConfigurationError('Sisense is not properly configured', {
                hasUrl: Boolean(this.config.url),
                hasApiKey: Boolean(this.config.apiKey),
            });
        }

        const url = `${this.baseUrl.replace(/\/$/, '')}${endpoint}`;
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers,
        };

        logger.debug('Making request to Sisense', {
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
     * Get Sisense server information
     */
    public async getServerInfo(): Promise<Record<string, unknown>> {
        return this.makeRequest('/api/v1/server/info');
    }

    /**
     * Get available data sources
     */
    public async getDataSources(): Promise<Record<string, unknown>[]> {
        return this.makeRequest('/api/v1/datasources');
    }

    /**
     * Get dashboards
     */
    public async getDashboards(): Promise<Record<string, unknown>[]> {
        return this.makeRequest('/api/v1/dashboards');
    }

    /**
     * Get specific dashboard by ID
     */
    public async getDashboard(dashboardId: string): Promise<Record<string, unknown>> {
        const validatedId = validateDashboardId(dashboardId);
        return this.makeRequest(`/api/v1/dashboards/${validatedId}`);
    }

    /**
     * Get widgets from a dashboard
     */
    public async getDashboardWidgets(dashboardId: string): Promise<Record<string, unknown>[]> {
        const validatedId = validateDashboardId(dashboardId);
        return this.makeRequest(`/api/v1/dashboards/${validatedId}/widgets`);
    }

    /**
     * Execute a query
     */
    public async executeQuery(query: unknown): Promise<Record<string, unknown>> {
        const validatedQuery = validateQuery(query);
        return this.makeRequest('/api/v1/query/execute', {
            method: 'POST',
            body: JSON.stringify(validatedQuery),
        });
    }

    /**
     * Get available cubes
     */
    public async getCubes(): Promise<Record<string, unknown>[]> {
        return this.makeRequest('/api/v1/cubes');
    }

    /**
     * Get cube metadata
     */
    public async getCubeMetadata(cubeId: string): Promise<Record<string, unknown>> {
        const validatedId = validateCubeId(cubeId);
        return this.makeRequest(`/api/v1/cubes/${validatedId}/metadata`);
    }
}
