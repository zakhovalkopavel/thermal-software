# API Documentation

**Refractory Calculator v2.0**  
**Last Updated:** December 15, 2025

---

## 📚 Table of Contents

1. [Main Calculator API](#main-calculator-api)
2. [Data Module APIs](#data-module-apis)
3. [Helper Functions](#helper-functions)
4. [Type Definitions](#type-definitions)
5. [Examples](#examples)

---

## Main Calculator API

### RefractoryCalculatorV2

**Import:**
```javascript
const RefractoryCalculator = require('./RefractoryCalculatorV2.js');
```

#### Constructor

```javascript
new RefractoryCalculator(userConfig?)
```

**Parameters:**
- `userConfig` (Object, optional) - Custom configuration to override defaults

**Returns:** RefractoryCalculator instance

**Example:**
```javascript
const calc = new RefractoryCalculator();

// With custom config
const customCalc = new RefractoryCalculator({
  participation: {
    T50_fine: 1300
  }
});
```

---

#### calculate()

```javascript
calculate(components, temperature, settings?)
```

**Parameters:**
- `components` (Array<Component>) - Array of component objects
- `temperature` (number) - Temperature in °C
- `settings` (Object, optional) - Additional calculation settings

**Returns:** Object with calculation results

**Component Structure:**
```javascript
{
  name: string,
  composition: {
    Al2O3: number,  // % by mass
    SiO2: number,
    CaO: number,
    Fe2O3: number,
    // ... other oxides
  },
  fractions: [
    {
      lowerSize: number,  // mm
      upperSize: number,   // mm
      amount: number       // % of total mixture
    }
  ]
}
```

**Returns Structure:**
```javascript
{
  solid: {
    percent: number,
    composition: {
      Al2O3: number,
      SiO2: number,
      CaO: number,
      Fe2O3: number
    },
    compositionByComponent: Object
  },
  liquid: {
    percent: number,
    composition: Object,
    viscosity: number  // Pa·s
  },
  thermalPerformance: {
    refractoriness: number,  // °C
    deformationTemperature_0_2MPa: number  // °C
  },
  diagnostics: {
    massBalanceError: number,
    warnings: Array<string>,
    assumptions: Array<string>
  }
}
```

**Example:**
```javascript
const components = [
  {
    name: "Chamotte",
    composition: { Al2O3: 45.0, SiO2: 48.0, CaO: 1.5, Fe2O3: 3.5 },
    fractions: [
      { lowerSize: 0.6, upperSize: 3.0, amount: 70.0 }
    ]
  },
  {
    name: "Ciment Fondu",
    composition: { Al2O3: 40.0, CaO: 38.0, SiO2: 5.0, Fe2O3: 15.0 },
    fractions: [
      { lowerSize: 0.001, upperSize: 0.045, amount: 30.0 }
    ]
  }
];

const result = calc.calculate(components, 1450);
console.log(`Liquid: ${result.liquid.percent}%`);
console.log(`Refractoriness: ${result.thermalPerformance.refractoriness}°C`);
```

---

#### getPhaseData()

```javascript
getPhaseData(system, eutecticName)
```

**Parameters:**
- `system` (string) - Phase system name (e.g., 'CAS')
- `eutecticName` (string) - Eutectic name

**Returns:** Eutectic data object

**Example:**
```javascript
const eutectic = calc.getPhaseData('CAS', 'anorthite_gehlenite');
// { temperature: 1265, composition: {...}, phases: [...] }
```

---

#### listEutectics()

```javascript
listEutectics(system?)
```

**Parameters:**
- `system` (string, optional) - Phase system name (default: 'CAS')

**Returns:** Array of eutectic names

**Example:**
```javascript
const eutectics = calc.listEutectics('CAS');
// ['anorthite_gehlenite', 'anorthite_mullite_silica', ...]
```

---

#### getConfig()

```javascript
getConfig()
```

**Returns:** Current configuration object (deep clone)

**Example:**
```javascript
const config = calc.getConfig();
console.log(config.participation.T50_fine);  // 1325
```

---

## Data Module APIs

### ComponentsDictionary

**Import:**
```javascript
const Components = require('./data/components/ComponentsDictionary.js');
```

#### getComponent()

```javascript
Components.getComponent(componentName, variant?)
```

**Parameters:**
- `componentName` (string) - Component name (e.g., 'chamotte', 'alumina')
- `variant` (string, optional) - Variant name (e.g., 'coarse', 'fine')

**Returns:** Component object with composition and fractions

**Example:**
```javascript
const chamotte = Components.getComponent('chamotte', 'medium');
// { name, composition, fractions }
```

#### getVariants()

```javascript
Components.getVariants(componentName)
```

**Returns:** Array of available variant names

#### listComponents()

```javascript
Components.listComponents()
```

**Returns:** Array of component info objects

---

### ChemicalCompositions

**Import:**
```javascript
const Compositions = require('./data/compositions/ChemicalCompositions.js');
```

#### getComposition()

```javascript
Compositions.getComposition(category, material)
```

**Parameters:**
- `category` (string) - 'aggregates', 'binders', or 'additives'
- `material` (string) - Material name

**Returns:** Composition object (oxide percentages)

**Example:**
```javascript
const comp = Compositions.getComposition('aggregates', 'chamotte');
// { Al2O3: 45.0, SiO2: 48.0, ... }
```

#### validateComposition()

```javascript
Compositions.validateComposition(composition)
```

**Returns:** Validation result object

#### normalizeComposition()

```javascript
Compositions.normalizeComposition(composition)
```

**Returns:** Normalized composition (sum = 100%)

---

### ParticleSizeFractions

**Import:**
```javascript
const Fractions = require('./data/fractions/ParticleSizeFractions.js');
```

#### getDistribution()

```javascript
Fractions.getDistribution(category, name)
```

**Returns:** Array of fraction objects

**Example:**
```javascript
const dist = Fractions.getDistribution('coarse', 'single_size_6_3');
// [{ lowerSize: 3.0, upperSize: 6.0, amount: 100.0 }]
```

#### getSieveSize()

```javascript
Fractions.getSieveSize(standard, designation)
```

**Parameters:**
- `standard` (string) - 'ASTM', 'ISO', 'FEPA', or 'Tyler'
- `designation` (string) - Sieve designation

**Returns:** Size in millimeters

**Example:**
```javascript
const size = Fractions.getSieveSize('ASTM', 'mesh_100');
// 0.15
```

#### convertSieveStandard()

```javascript
Fractions.convertSieveStandard(fromStandard, designation, toStandard)
```

**Returns:** Closest equivalent in target standard

**Example:**
```javascript
const equiv = Fractions.convertSieveStandard('ASTM', 'mesh_100', 'ISO');
// { designation: 'iso_0_16', size: 0.16, difference: 0.01 }
```

#### fromSieveAnalysis()

```javascript
Fractions.fromSieveAnalysis(sieveData, standard?)
```

**Parameters:**
- `sieveData` (Array) - Array of `{sieve, retained}` objects
- `standard` (string, optional) - Sieve standard (default: 'ASTM')

**Returns:** Fraction distribution array

**Example:**
```javascript
const data = [
  { sieve: 'mesh_4', retained: 15.0 },
  { sieve: 'mesh_8', retained: 25.0 }
];
const dist = Fractions.fromSieveAnalysis(data, 'ASTM');
```

---

### PhaseDiagramData

**Import:**
```javascript
const PhaseDiagram = require('./data/phases/PhaseDiagramData.js');
```

#### getEutectic()

```javascript
PhaseDiagram.getEutectic(system, eutecticName)
```

**Returns:** Eutectic data object

**Example:**
```javascript
const eutectic = PhaseDiagram.getEutectic('CAS', 'anorthite_gehlenite');
// { temperature: 1265, composition: {...}, phases: [...] }
```

#### getPhase()

```javascript
PhaseDiagram.getPhase(system, phaseName)
```

**Returns:** Phase data object

**Example:**
```javascript
const phase = PhaseDiagram.getPhase('CAS', 'anorthite');
// { formula: "CaO·Al2O3·2SiO2", composition: {...}, meltingPoint: 1553 }
```

#### estimateLiquidFraction()

```javascript
PhaseDiagram.estimateLiquidFraction(system, composition, temperature)
```

**Returns:** Estimated liquid fraction (0-100%)

---

## Helper Functions

### From RefractoryCalculatorV2

#### calculateViscosity()

```javascript
calculateViscosity(liquidComposition, temperature, settings?)
```

**Returns:** Viscosity in Pa·s

#### calculateThermalPerformance()

```javascript
calculateThermalPerformance(liquid, solid, temperature)
```

**Returns:** Thermal performance object

---

## Type Definitions

### Component

```typescript
interface Component {
  name: string;
  composition: {
    [oxide: string]: number;  // % by mass
  };
  fractions: Fraction[];
}
```

### Fraction

```typescript
interface Fraction {
  lowerSize: number;  // mm
  upperSize: number;  // mm
  amount: number;     // % of total mixture
}
```

### CalculationResult

```typescript
interface CalculationResult {
  solid: {
    percent: number;
    composition: { [oxide: string]: number };
    compositionByComponent: Object;
  };
  liquid: {
    percent: number;
    composition: { [oxide: string]: number };
    viscosity: number | null;
  };
  thermalPerformance: {
    refractoriness: number;
    deformationTemperature_0_2MPa: number;
  };
  diagnostics: {
    massBalanceError: number;
    warnings: string[];
    assumptions: string[];
  };
}
```

---

## Examples

### Basic Calculation

```javascript
const RefractoryCalculator = require('./RefractoryCalculatorV2.js');
const Components = require('./data/components/ComponentsDictionary.js');

const calc = new RefractoryCalculator();
const components = [
  Components.getComponent('chamotte', 'medium'),
  Components.getComponent('cimentFondu', 'fine')
];

const result = calc.calculate(components, 1450);
console.log(result);
```

### Custom Component

```javascript
const customComponent = {
  name: "My Custom Mix",
  composition: {
    Al2O3: 50.0,
    SiO2: 40.0,
    CaO: 5.0,
    Fe2O3: 5.0
  },
  fractions: [
    { lowerSize: 1.0, upperSize: 3.0, amount: 60.0 },
    { lowerSize: 0.1, upperSize: 1.0, amount: 40.0 }
  ]
};

const result = calc.calculate([customComponent], 1500);
```

### Using Sieve Standards

```javascript
const Fractions = require('./data/fractions/ParticleSizeFractions.js');

// Get FEPA grit size for SiC
const sicSize = Fractions.getSieveSize('FEPA', 'F36');

// Create SiC component with FEPA sizing
const sicComponent = {
  name: "Silicon Carbide F36",
  composition: { SiC: 98.0, SiO2: 0.5, Al2O3: 0.3, Fe2O3: 0.5, C_free: 0.7 },
  fractions: [
    { lowerSize: sicSize * 0.7, upperSize: sicSize * 1.3, amount: 100.0 }
  ]
};
```

### Batch Processing

```javascript
const temperatures = [1300, 1400, 1500, 1600];
const results = {};

temperatures.forEach(temp => {
  const result = calc.calculate(components, temp);
  results[temp] = {
    liquid: result.liquid.percent,
    refractoriness: result.thermalPerformance.refractoriness
  };
});

console.table(results);
```

---

## Error Handling

```javascript
try {
  const result = calc.calculate(components, temperature);
  
  // Check for warnings
  if (result.diagnostics.warnings.length > 0) {
    console.warn('Warnings:', result.diagnostics.warnings);
  }
  
  // Check mass balance
  if (result.diagnostics.massBalanceError > 0.1) {
    console.error('Mass balance error exceeds tolerance');
  }
  
} catch (error) {
  console.error('Calculation failed:', error.message);
}
```

---

## Performance Tips

1. **Reuse calculator instance**
2. **Pre-load components from dictionary**
3. **Batch similar calculations**
4. **Avoid unnecessary deep cloning**

---

**For more examples, see:**
- `examples/examples_with_dictionary.js`
- `examples/sieve_standards_examples.js`

**For calculation details, see:**
- `spec.md` - Complete technical specification
- `QUICK_REFERENCE.md` - Equations and constants

---

**Version:** 2.0  
**Date:** December 15, 2025  
**License:** MIT

