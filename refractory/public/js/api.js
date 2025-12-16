// Browser bundle for Refractory Calculator
// This file provides a global API for the calculator

(function() {
    'use strict';

    // Note: This is a placeholder. The actual implementation would need to:
    // 1. Bundle all TypeScript modules into a single browser-compatible file
    // 2. Expose the RefractoryCalculatorService globally
    // 3. Handle component dictionary initialization

    // For now, we'll create a simple API endpoint approach

    window.RefractoryCalculator = {
        calculate: async function(components, temperature) {
            try {
                const response = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ components, temperature })
                });

                if (!response.ok) {
                    throw new Error('Calculation failed');
                }

                return await response.json();
            } catch (error) {
                console.error('API call failed:', error);
                throw error;
            }
        },

        getComponentList: async function() {
            try {
                const response = await fetch('/api/components');
                if (!response.ok) {
                    throw new Error('Failed to load components');
                }
                return await response.json();
            } catch (error) {
                console.error('API call failed:', error);
                throw error;
            }
        }
    };

    console.log('✅ Refractory Calculator API initialized');
})();

