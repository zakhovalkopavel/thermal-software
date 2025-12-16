# Refractory Calculator - Project Structure

**Version:** 1.0.0  
**Last Updated:** December 16, 2025  
**Language:** TypeScript

---

## 📁 Directory Structure

```
refractory/
├── src/                          # TypeScript source code
│   ├── calculators/              # Calculation engines
│   │   ├── ParticipationCalculator.ts
│   │   ├── PhaseEquilibriumCalculator.ts
│   │   ├── ViscosityCalculator.ts
│   │   ├── ThermalPerformanceCalculator.ts
│   │   ├── GlassViscosityCalculator.ts
│   │   ├── MineralPhaseIdentifier.ts
│   │   └── RefractorinessStandardsCalculator.ts
│   ├── core/                     # Core classes
│   │   ├── BaseCalculator.ts
│   │   └── ConfigurationManager.ts
│   ├── models/                   # Domain models
│   │   └── Component.ts
│   ├── repositories/             # Data repositories
│   │   ├── PhaseDiagramRepository.ts
│   │   └── (data in src/data/)
│   ├── services/                 # Service layer
│   │   └── RefractoryCalculatorService.ts
│   ├── validators/               # Input validation
│   │   └── InputValidator.ts
│   ├── data/                     # Data source files
│   │   └── ComponentDictionary.ts
│   ├── utils/                    # Utilities
│   │   └── ParticleSizeClassifier.ts
│   └── types/                    # TypeScript types
│       └── index.ts
│
├── dist/                         # Compiled JavaScript
│   └── [compiled files]
│
├── public/                       # Web interface
│   ├── index.html                # Main HTML page
│   ├── css/
│   │   └── calculator.css        # Styles
│   └── js/
│       ├── particle-size-constants.js   # Constants (mesh, FEPA)
│       ├── api.js                # API wrapper
│       └── calculator.js         # UI logic
│
├── docs/                         # 📚 Documentation
│   ├── README.md                 # Documentation index
│   ├── API.md                    # API reference
│   ├── INSTALLATION.md           # Installation guide
│   ├── PROJECT_STATUS.md         # Development history
│   ├── PROJECT_STRUCTURE.md      # This file
│   ├── concepts/                 # Conceptual explanations
│   │   ├── LIQUID_VS_GLASS_EXPLAINED.md
│   │   └── THERMAL_CYCLING_EXPLAINED.md
│   └── algorithms/               # Algorithm documentation
│       ├── FULL_PHASE_EQUILIBRIUM.md
│       └── MULTI_MODEL_COMPLETE.md
│
├── server.js                     # REST API server
├── test-docker.js                # Test script
├── package.json                  # NPM configuration
├── tsconfig.json                 # TypeScript config
├── README.md                     # Main readme
└── spec.md                       # Technical specification
```

**Note:** Implementation logs and issue reports are in `../.logs/` (excluded from git)

---

## 🎯 Key Components

### Calculators (src/calculators/)

**ParticipationCalculator.ts**
- Calculates participation factors for different particle sizes
- Accounts for kinetic limitations

**PhaseEquilibriumCalculator.ts**
- Full phase equilibrium at each temperature
- Selective melting (flux phases first)
- CaO-enriched liquid, Al₂O₃-enriched solid

**ViscosityCalculator.ts**
- Liquid viscosity calculations
- Multiple models based on composition

**ThermalPerformanceCalculator.ts**
- Refractoriness calculations
- RUL predictions

**GlassViscosityCalculator.ts**
- ASTM C965 fixed points (6 points)
- VFT model for aluminosilicates
- Arrhenius model for calcium aluminates

**MineralPhaseIdentifier.ts**
- Identifies mullite, corundum, quartz, etc.
- Calculates glass viscosity properties

**RefractorinessStandardsCalculator.ts**
- Multi-model refractoriness predictions
- EN ISO 1893, ASTM C24/C71, GOST 4069-69

### Core (src/core/)

**BaseCalculator.ts**
- Base class for all calculators
- Diagnostics collection

**ConfigurationManager.ts**
- Singleton pattern
- Configuration management

### Services (src/services/)

**RefractoryCalculatorService.ts**
- Facade pattern
- Main entry point
- Orchestrates all calculations

### Data (src/data/)

**components/** - Component definitions (12 materials)
**compositions/** - Chemical oxide compositions
**fractions/** - Particle size distributions
**phases/** - Phase diagram data (eutectics, liquidus)

---

## 📖 Documentation Organization

### `/docs/` - Documentation Root

**Core Documentation:**
- **README.md** - Documentation index and navigation
- **API.md** - API reference and endpoints
- **INSTALLATION.md** - Setup and installation guide
- **PROJECT_STATUS.md** - Development history and milestones
- **PROJECT_STRUCTURE.md** - This file - project organization

### `/docs/concepts/` - Conceptual Understanding

Key concepts that users often find confusing:

1. **LIQUID_VS_GLASS_EXPLAINED.md**
   - Why liquid% at temperature ≠ glass% in final product
   - Two different states, both correct

2. **THERMAL_CYCLING_EXPLAINED.md**
   - What happens on reheating
   - Microstructure evolution with cycles

### `/docs/algorithms/` - Implementation Details

How calculations are performed:

1. **FULL_PHASE_EQUILIBRIUM.md**
   - Full phase equilibrium vs simplified approximation
   - Why we calculate at every temperature step

2. **MULTI_MODEL_COMPLETE.md**
   - 4 physical models for refractoriness
   - Standards implementation (EN ISO, ASTM, GOST)

### Implementation Logs

Problem resolution and fix reports are in `../.logs/` (parent directory, excluded from git):
- Issue tracking and resolution
- Implementation completion reports
- Development notes

---

## 🏗️ Architecture

### Design Patterns

1. **Singleton** - ConfigurationManager, repositories
2. **Strategy** - Multiple viscosity models
3. **Template Method** - BaseCalculator
4. **Facade** - RefractoryCalculatorService
5. **Repository** - Data access
6. **Factory** - Component creation

### SOLID Principles

All 5 SOLID principles applied:
- Single Responsibility
- Open/Closed
- Liskov Substitution
- Interface Segregation
- Dependency Inversion

---

## 🔧 Development Workflow

### Build Process

```bash
npm run build     # Compile TypeScript → dist/
```

### Testing

```bash
npm test          # Run test suite
node refractory-test.js  # Docker test
```

### Docker Integration

```bash
make refractory-build    # Build in container
make refractory-test     # Test in container
```

---

## 📚 Further Reading

- **README.md** - Quick start and features
- **spec.md** - Complete technical specification
- **TYPESCRIPT_README.md** - TypeScript implementation details
- **docs/README.md** - Documentation index

---

**Last Updated:** December 16, 2025  
**Version:** 1.0.0  
**Status:** Production Ready

