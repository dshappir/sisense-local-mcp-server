import type { SisenseConfig } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { safeParse } from '../utils/json.js';
import { env } from '../config/environment.js';

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
        this.config = {
            url: config?.url ?? env.SISENSE_URL ?? '',
            apiKey: config?.apiKey ?? env.SISENSE_API_KEY ?? '',
        };

        this.baseUrl = this.config.url;

        if (!this.isConfigured()) {
            logger.warn('Sisense is not properly configured. Some features may not be available.');
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
            throw new Error('Sisense is not properly configured');
        }

        const url = `${this.baseUrl.replace(/\/$/, '')}${endpoint}`;
        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers,
        };

        logger.debug(`Making request to Sisense: ${url}`);

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            if (!response.ok) {
                throw new Error(`Sisense API error: ${response.status} ${response.statusText}`);
            }

            const responseText = await response.text();
            logger.debug('Sisense API response received', {
                status: response.status,
                contentLength: responseText.length,
            });

            // Try to parse JSON safely
            const data = safeParse<T>(responseText);
            if (data === null) {
                throw new Error('Invalid JSON response from Sisense API');
            }

            return data;
        } catch (error) {
            logger.error('Sisense API request failed', { error, url });
            throw error;
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
        return this.makeRequest(`/api/v1/dashboards/${dashboardId}`);
    }

    /**
     * Get widgets from a dashboard
     */
    public async getDashboardWidgets(dashboardId: string): Promise<Record<string, unknown>[]> {
        return this.makeRequest(`/api/v1/dashboards/${dashboardId}/widgets`);
    }

    /**
     * Execute a query
     */
    public async executeQuery(query: Record<string, unknown>): Promise<Record<string, unknown>> {
        return this.makeRequest('/api/v1/query/execute', {
            method: 'POST',
            body: JSON.stringify(query),
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
        return this.makeRequest(`/api/v1/cubes/${cubeId}/metadata`);
    }
}
