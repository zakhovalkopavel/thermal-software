# API Reference
**Version:** 1.1.0  
**Last Updated:** January 31, 2026
---
## Overview
The Refractory Calculator Suite provides a REST API for programmatic access to all calculation functions.
**Base URL:** `http://localhost:3010`
---
## Endpoints
### Phase Equilibrium
#### POST /api/calculate
Calculate phase equilibrium and thermal properties.
**Request Body:**
```json
{
  "components": [
    {
      "name": "Chamotte",
      "variant": "Standard",
      "amount": 50
    }
  ],
  "temperature": 1450
}
```
**Response:**
```json
{
  "liquidPhase": {
    "percentage": 8.5,
    "composition": {...}
  },
  "solidPhase": {
    "percentage": 91.5,
    "composition": {...}
  },
  "refractoriness": {...},
  "viscosity": {...}
}
```
---
### Blend Optimizer
#### POST /api/optimize-blend
Optimize particle size distribution.
**Request Body:**
```json
{
  "fractions": [
    {
      "dMin_mm": 3.0,
      "dMax_mm": 6.0,
      "material": "Chamotte",
      "amount": 100
    }
  ],
  "method": "andreasen",
  "q": 0.25
}
```
**Response:**
```json
{
  "optimizedBlend": {
    "massFractions": [28, 38, 22, 12],
    "packingFraction": 0.74,
    "shrinkage": {...}
  }
}
```
---
## TypeScript/JavaScript SDK
### Installation
```typescript
import { RefractoryCalculatorService } from './services/RefractoryCalculatorService';
```
### Usage Example
```typescript
const service = RefractoryCalculatorService.getInstance();
const result = await service.calculate({
  components: [...],
  temperature: 1450
});
console.log(result.liquidPhase.percentage);
```
---
For complete API documentation, see the source code in `src/services/`.
