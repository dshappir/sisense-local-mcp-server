import type { ToolDefinition } from '../types/index.js';
import { logger } from '../utils/logger.js';
import type {
    MethodType,
    Operation,
    Parameter,
    ReferenceObject,
    Schema,
    SwaggerClient,
    SwaggerSpec,
} from './swagger-client.js';

const SWAGGER_SPEC_ENDPOINT = '/swagger/api/docs/spec/v2';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const;
export type Method = (typeof METHODS)[number];
const METHOD_LABELS = METHODS.map(method => method.toLowerCase()) as MethodType[];

const METHOD_PREFIXES = {
    GET: '',
    POST: 'create',
    PUT: 'update',
    DELETE: 'delete',
    PATCH: 'patch',
    HEAD: 'head',
    OPTIONS: 'options',
} as const;

const EXCLUDED_PARAMETERS = ['authorization', 'x-device-id'];

export interface ToolGeneratorOptions {
    shouldExcludeOperation?: (path: string, method: Method) => boolean;
    excludeOutputSchema?: boolean;
}

export class ToolGenerator {
    private readonly swaggerClient: SwaggerClient;
    private readonly toolNames = new Set<string>();

    constructor(
        swaggerClient: SwaggerClient,
        private readonly options: ToolGeneratorOptions = { excludeOutputSchema: false }
    ) {
        this.swaggerClient = swaggerClient;
    }

    /**
     * Generate MCP tools from Swagger specifications
     */
    public async generateTools(): Promise<ToolDefinition[]> {
        logger.info('Generating MCP tools from Swagger specifications');

        try {
            this.toolNames.clear();

            const swaggerSpec = await this.swaggerClient.fetchSwaggerSpec(SWAGGER_SPEC_ENDPOINT);

            if (!swaggerSpec?.paths) {
                logger.warn('No API paths found in Swagger specification');
                return [];
            }

            const tools: ToolDefinition[] = [];

            // Process each path and operation
            for (const [path, pathItem] of Object.entries(swaggerSpec.paths)) {
                if (!pathItem) {
                    continue;
                }

                const { parameters = [] } = pathItem;

                for (const method of METHOD_LABELS) {
                    const operation = pathItem[method];
                    if (!operation) {
                        continue;
                    }

                    const tool = this.createToolFromOperation(
                        path,
                        method.toUpperCase() as Method,
                        operation,
                        swaggerSpec,
                        parameters
                    );

                    if (!tool) {
                        continue;
                    }
                    tools.push(tool);
                }
            }

            logger.info('Successfully generated MCP tools', {
                toolCount: tools.length,
            });

            return tools;
        } catch (error) {
            logger.error('Failed to generate MCP tools', {
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }

    /**
     * Create a tool definition from an API operation
     */
    private createToolFromOperation(
        path: string,
        method: Method,
        operation: Operation,
        spec: SwaggerSpec,
        parameters: Parameter[]
    ): ToolDefinition | null {
        // Skip operations with deprecated flag
        if (operation.deprecated) {
            return null;
        }

        if (this.options.shouldExcludeOperation?.(path, method)) {
            logger.debug('Skipping operation not in included categories', {
                path,
                method,
            });
            return null;
        }

        const outputSchema = this.generateOutputSchema(operation, spec);
        return {
            name: this.generateToolName(operation.operationId, path, method),
            description: this.generateDescription(operation, path, method),
            inputSchema: this.generateInputSchema(operation, parameters, spec),
            ...(outputSchema ? { outputSchema } : {}),
            method: method.toUpperCase() as Method,
            path: `${spec.basePath}${path}`,
        };
    }

    /**
     * Generate tool name from API path and HTTP method
     */
    private generateToolName(
        operationId: string | undefined,
        path: string,
        method: Method
    ): string {
        if (operationId) {
            // Convert camel case to snake case
            const name = operationId
                .replace(/([A-Z])/g, '_$1')
                .toLowerCase()
                .replace(/^_/, '');

            const sanitizedName = this.sanitizeToolName(name);

            // Ensqure name is unique
            if (!this.toolNames.has(sanitizedName)) {
                this.toolNames.add(sanitizedName);
                return sanitizedName;
            }
        }

        let baseName = path.replace(/^\//, '').replaceAll('/', '_');

        const methodPrefix = METHOD_PREFIXES[method];
        if (methodPrefix) {
            baseName = `${methodPrefix}_${baseName}`;
        }

        return this.sanitizeToolName(baseName);
    }

    /**
     * Sanitize string to create a valid tool name
     */
    private sanitizeToolName(name: string): string {
        return name
            .replace(/{[^}]+}/g, 'id')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Generate tool description from operation details
     */
    private generateDescription(operation: Operation, path: string, method: string): string {
        const parts: string[] = [];

        if (operation.summary) {
            parts.push(operation.summary);
        }
        if (operation.description && operation.description !== operation.summary) {
            parts.push(operation.description);
        }
        if (parts.length === 0) {
            parts.push(`${method.toUpperCase()} ${path}`);
        }

        return parts.join(' - ');
    }

    /**
     * Generate input schema for the tool
     */
    private generateInputSchema(
        operation: Operation,
        parameters: Parameter[],
        spec: SwaggerSpec
    ): Schema {
        const properties: Record<string, Schema> = {};
        const requiredParams: string[] = [];

        const params = [...(operation.parameters || []), ...parameters];

        for (const param of params) {
            const resolvedParam = this.resolveParameter(param, spec);
            if (resolvedParam && !this.shouldExcludeParameter(resolvedParam.name)) {
                const { required, ...rest } = resolvedParam;
                const schema = this.convertSchemaToJsonSchema(rest, spec);
                if (schema) {
                    properties[resolvedParam.name] = schema;
                    if (required) {
                        requiredParams.push(resolvedParam.name);
                    }
                }
            }
        }

        return {
            type: 'object',
            properties,
            ...(requiredParams.length > 0 && { required: requiredParams }),
        };
    }

    /**
     * Generate output schema for the tool
     */
    private generateOutputSchema(operation: Operation, spec: SwaggerSpec): Schema | undefined {
        if (this.options.excludeOutputSchema) {
            return undefined;
        }

        // Look for success responses (2xx status codes)
        const successResponses = Object.keys(operation.responses)
            .filter(code => code.startsWith('2'))
            .sort();

        // Get the first success response
        const firstSuccessCode = successResponses[0];
        if (!firstSuccessCode) {
            return undefined;
        }
        const response = operation.responses[firstSuccessCode];
        const schema = this.convertSchemaToJsonSchema(response?.schema, spec);

        if (!schema) {
            return undefined;
        }

        if (schema.type !== 'array') {
            return schema;
        }

        return {
            type: 'object',
            properties: {
                content: {
                    type: 'array',
                    items: schema.items || schema,
                },
            },
        };
    }

    private convertSchemaToJsonSchema(
        schema: Schema | ReferenceObject | undefined,
        spec: SwaggerSpec
    ): Schema | undefined {
        if (!schema) {
            return undefined;
        }

        if ('$ref' in schema) {
            const refSchema = this.resolveReference<Schema>(schema.$ref, spec);
            if (refSchema) {
                return this.convertSchemaToJsonSchema(refSchema as unknown as Schema, spec);
            }
            return undefined;
        }

        if (hasOneOfProperties(schema, ['oneOf', 'allOf', 'anyOf', 'not'])) {
            // TODO: handle complex schemas
            return undefined;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { title, ...jsonSchema } = schema;

        if (schema.type === 'array' && schema.items) {
            const itemsSchema = this.convertSchemaToJsonSchema(schema.items, spec);
            if (!itemsSchema) {
                return undefined;
            }
            jsonSchema.items = itemsSchema;
        }

        if (schema.type === 'object' && schema.properties) {
            jsonSchema.properties = {};
            const properties = schema.properties;
            for (const [propName, propSchema] of Object.entries(properties)) {
                const convertedProp = this.convertSchemaToJsonSchema(propSchema, spec);
                if (!convertedProp) {
                    return undefined;
                }
                jsonSchema.properties[propName] = convertedProp;
            }

            // Add required fields if present
            if (Array.isArray(schema.required)) {
                jsonSchema.required = schema.required;
            }
        }

        return Object.keys(jsonSchema).length > 0 ? jsonSchema : { type: 'string' };
    }

    /**
     * Convert a parameter to JSON schema
     */
    private resolveParameter(
        param: Parameter | ReferenceObject,
        spec: SwaggerSpec
    ): Parameter | undefined {
        if ('$ref' in param) {
            return this.resolveReference<Parameter>(param.$ref, spec);
        }
        if (param.schema) {
            const { schema, ...rest } = param;
            return {
                ...rest,
                ...('$ref' in schema
                    ? this.resolveReference<Schema>(schema.$ref, spec)
                    : param.schema),
            } as Parameter;
        }
        return param;
    }

    /**
     * Resolve a $ref reference
     */
    private resolveReference<T extends Schema | Parameter>(
        ref: string,
        spec: SwaggerSpec
    ): T | undefined {
        if (!ref.startsWith('#/')) {
            return undefined;
        }

        const path = ref.substring(2).split('/');
        let current: any = spec;

        for (const segment of path) {
            if (current && typeof current === 'object' && segment in current) {
                current = current[segment];
            } else {
                return undefined;
            }
        }

        return current;
    }

    private shouldExcludeParameter(name: string): boolean {
        return EXCLUDED_PARAMETERS.some(excluded => excluded.toLowerCase() === name.toLowerCase());
    }
}

function hasOneOfProperties(schema: Schema, properties: string[]): boolean {
    return properties.some(property => Object.prototype.hasOwnProperty.call(schema, property));
}
