#!/usr/bin/env node

/**
 * Refractory Calculator API Server
 * Provides REST API endpoints for the web interface
 */

const http = require('http');
const { RefractoryCalculatorService } = require('./dist/services/RefractoryCalculatorService');
const { ComponentDictionary } = require('./dist/data/ComponentDictionary');

const PORT = process.env.PORT || 3000;

// Initialize calculator
let calculator;
let componentDict;

try {
    calculator = new RefractoryCalculatorService();
    componentDict = ComponentDictionary.getInstance();
    console.log('✅ Calculator initialized');
} catch (error) {
    console.error('❌ Failed to initialize calculator:', error);
    process.exit(1);
}

// Simple HTTP server
const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Health check
    if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy' }));
        return;
    }

    // Get component list
    if (req.url === '/api/components' && req.method === 'GET') {
        try {
            const categories = componentDict.listCategories();
            const components = {};

            categories.forEach(category => {
                components[category] = componentDict.listVariants(category);
            });

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ categories, components }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
        return;
    }

    // Calculate
    if (req.url === '/api/calculate' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { components, temperature } = JSON.parse(body);

                if (!components || !temperature) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Missing components or temperature' }));
                    return;
                }

                // Load full component objects from dictionary
                const fullComponents = components.map(c => {
                    const component = componentDict.getComponent(c.category, c.variant);
                    if (!component) {
                        throw new Error(`Component not found: ${c.category}/${c.variant}`);
                    }
                    component.amount = c.amount;

                    // Override fractions if provided
                    if (c.fractions && Array.isArray(c.fractions)) {
                        component.fractions = c.fractions;
                    }

                    return component.toObject();
                });

                const result = calculator.calculate(fullComponents, temperature);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('Calculation error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message, stack: error.stack }));
            }
        });
        return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
    console.log(`🚀 Refractory Calculator API server running on port ${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET  /health`);
    console.log(`   GET  /api/components`);
    console.log(`   POST /api/calculate`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

