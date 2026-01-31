# Refractory Calculator Suite - Project Structure

**Version:** 1.0.0  
**Last Updated:** January 31, 2026  
**Language:** TypeScript

---

## 📁 Directory Structure

```
refractory/
├── README.md                     # Project overview (ROOT - only .md file here)
│
├── docs/                         # All documentation
│   ├── spec.md                   # Technical specification
│   ├── API.md                    # API reference
│   ├── INSTALLATION.md           # Installation and setup guide
│   ├── PROJECT_STATUS.md         # Development history and status
│   ├── PROJECT_STRUCTURE.md      # This file - project organization
│   ├── BLEND_OPTIMIZER_GUIDE.md  # User guide for blend optimizer
│   ├── QUICK_START_TEST.md       # Quick start testing guide
│   ├── UI_TESTING_GUIDE.md       # UI testing procedures
│   ├── NEW_DOCS_SUMMARY.md       # Summary of new documentation
│   ├── algorithms/               # Detailed algorithm implementations
│   │   ├── PSD_ALGORITHMS.md              # Andreasen, Funk-Dinger
│   │   ├── PACKING_MODELS.md              # CPM, Furnas
│   │   ├── FULL_PHASE_EQUILIBRIUM.md      # Phase calculations
│   │   └── MULTI_MODEL_COMPLETE.md        # Refractoriness models
│   └── concepts/                 # Explanations for understanding
│       ├── BLEND_OPTIMIZATION_EXPLAINED.md # Complete workflow
│       ├── SHRINKAGE_EXPLAINED.md         # Shrinkage mechanisms
│       ├── LIQUID_VS_GLASS_EXPLAINED.md   # Phase behavior
│       ├── SIEVE_STANDARDS_GUIDE.md       # Particle size standards
│       └── THERMAL_CYCLING_EXPLAINED.md   # Thermal behavior
│
├── src/                          # TypeScript source code
│   ├── calculators/              # Calculation engines
│   │   ├── PhaseEquilibriumCalculator.ts
│   │   ├── ParticipationCalculator.ts
│   │   ├── ViscosityCalculator.ts
│   │   ├── ThermalPerformanceCalculator.ts
│   │   ├── GlassViscosityCalculator.ts
│   │   ├── MineralPhaseIdentifier.ts
│   │   ├── RefractorinessStandardsCalculator.ts
│   │   ├── PSDCalculator.ts              # PSD optimization
│   │   ├── PackingCalculator.ts          # Packing models
│   │   ├── ShrinkageCalculator.ts        # Shrinkage prediction
│   │   └── BlendOptimizer.ts             # Blend optimization
│   ├── services/                 # Service layer
│   │   ├── RefractoryCalculatorService.ts
│   │   └── MixLibraryService.ts          # Mix library CRUD
│   ├── data/                     # Data source files
│   │   ├── ComponentDictionary.ts
│   │   └── MaterialLibrary.ts            # Material properties
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts
│   │   └── blend-types.ts                # Blend optimizer types
│   ├── core/                     # Core classes
│   │   ├── BaseCalculator.ts
│   │   └── ConfigurationManager.ts
│   ├── models/                   # Domain models
│   │   └── Component.ts
│   ├── repositories/             # Data repositories
│   │   └── PhaseDiagramRepository.ts
│   ├── validators/               # Input validation
│   │   └── InputValidator.ts
│   └── utils/                    # Utilities
│       └── ParticleSizeClassifier.ts
│
├── public/                       # Web interface
│   ├── index.html                # Homepage with module overview
│   ├── phase-calculator.html     # Phase equilibrium calculator
│   ├── blend-optimizer.html      # Blend optimizer
│   ├── about.html                # About page
│   ├── index-old.html            # Backup of original calculator
│   ├── css/                      # Modular stylesheets
│   │   ├── base.css              # Core styles, variables, utilities
│   │   ├── navigation.css        # Navigation menu
│   │   ├── forms.css             # Form components
│   │   ├── components.css        # Reusable components
│   │   ├── calculator.css        # Calculator-specific styles
│   │   ├── blend-optimizer.css   # Optimizer-specific styles
│   │   └── homepage.css          # Homepage-specific styles
│   └── js/                       # JavaScript/UI controllers
│       ├── particle-size-constants.js
│       ├── api.js                # API communication
│       ├── calculator.js         # Phase calculator UI
│       └── blend-optimizer.js    # Blend optimizer UI
│
├── dist/                         # Compiled JavaScript output
│   └── [compiled TypeScript files]
│
├── docker/                       # Docker configuration
│   ├── Dockerfile
│   └── nginx.conf
│
├── compose.yaml                  # Docker Compose configuration
├── Makefile                      # Build and deployment commands
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript configuration
└── refractory-test.js            # Test runner
```
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

**Last Updated:** January 31, 2026  
**Version:** 1.1.0  
**Status:** Production Ready

---
## 🔄 Development Workflow
### Building
```bash
make build    # Compile TypeScript in Docker
```
### Testing
```bash
make test     # Run test suite
```
### Running
```bash
make up       # Start all services
make down     # Stop services
make restart  # Restart services
make logs     # View logs
```
### Web Access
- Homepage: http://localhost:18080/
- Phase Calculator: http://localhost:18080/phase-calculator.html
- Blend Optimizer: http://localhost:18080/blend-optimizer.html
---
**Last Updated:** January 31, 2026  
**Version:** 1.0.0  
**Status:** Production Ready
---
## 🔒 Security & Access Control
### Web Accessibility (Nginx)
**PUBLICLY ACCESSIBLE via http://localhost:18080:**
- ✅ `public/` - All HTML, CSS, JS files
- ✅ `dist/` - Compiled JavaScript (needed by browser)
**NOT ACCESSIBLE via web:**
- ❌ `src/` - TypeScript source code (private)
- ❌ `docs/` - Documentation (for developers only)
- ❌ `node_modules/` - Dependencies
- ❌ Root directory files (package.json, tsconfig.json, etc.)
**Configuration:** See `compose.yaml` for volume mounts
### API Access (Node.js)
**API Server:** http://localhost:3010 (internal only, not exposed directly)
The Node.js application has access to:
- `src/` - TypeScript source (compiles and runs)
- All project files for build and compilation
### Deployment Notes
**For production:**
1. Only `public/` and `dist/` should be web-accessible
2. `src/` and `docs/` should never be served by web server
3. API server should be behind proxy/firewall
4. Consider adding authentication for sensitive endpoints
