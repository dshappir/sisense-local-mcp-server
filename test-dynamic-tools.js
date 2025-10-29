#!/usr/bin/env node

/**
 * Test script for dynamic tool generation
 * This script tests the SwaggerClient and ToolGenerator with the specified Sisense server
 */

import { SwaggerClient, ToolGenerator } from './dist/services/index.js';

const SISENSE_URL = 'http://10.220.73.124:30845/';
const SISENSE_API_KEY = process.env.SISENSE_API_KEY || '';

async function testDynamicTools() {
    console.log('🚀 Testing dynamic tool generation...\n');

    try {
        // Create SwaggerClient
        const swaggerClient = new SwaggerClient({
            url: SISENSE_URL,
            apiKey: SISENSE_API_KEY,
        });

        console.log('📡 SwaggerClient configured:', {
            url: SISENSE_URL,
            hasApiKey: Boolean(SISENSE_API_KEY),
            isConfigured: swaggerClient.isConfigured(),
        });

        if (!swaggerClient.isConfigured()) {
            console.log(
                '⚠️  SwaggerClient not configured. Please set SISENSE_API_KEY environment variable.'
            );
            console.log('   Example: SISENSE_API_KEY=your_api_key node test-dynamic-tools.js');
            return;
        }

        // Test fetching Swagger spec
        console.log('\n📋 Fetching Swagger v2 specification...');
        const swaggerSpec = await swaggerClient.fetchSwaggerSpec();
        console.log('✅ Swagger spec fetched:', {
            title: swaggerSpec.info?.title,
            version: swaggerSpec.info?.version,
            pathCount: Object.keys(swaggerSpec.paths || {}).length,
        });

        // Note: Only using Swagger specification now

        // Test tool generation
        console.log('\n🔧 Generating MCP tools...');
        const toolGenerator = new ToolGenerator(swaggerClient);
        const tools = await toolGenerator.generateTools();

        console.log('✅ Tools generated:', {
            toolCount: tools.length,
            apiCallMappings: swaggerClient.getAllApiCallMappings().size,
        });

        // Display first few tools
        console.log('\n📝 Sample tools:');
        tools.slice(0, 5).forEach((tool, index) => {
            console.log(`  ${index + 1}. ${tool.name}`);
            console.log(`     Description: ${tool.description}`);
            console.log(
                `     Parameters: ${Object.keys(tool.inputSchema.properties || {}).length}`
            );
        });

        if (tools.length > 5) {
            console.log(`  ... and ${tools.length - 5} more tools`);
        }

        // Display API call mappings
        console.log('\n🔗 Sample API call mappings:');
        const mappings = swaggerClient.getAllApiCallMappings();
        let count = 0;
        for (const [toolName, mapping] of mappings) {
            if (count >= 3) break;
            console.log(`  ${toolName}: ${mapping.method} ${mapping.path}`);
            count++;
        }

        console.log('\n🎉 Dynamic tool generation test completed successfully!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testDynamicTools().catch(console.error);
