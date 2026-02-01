# Refractory Calculator Suite

**Version 1.1.0**

A comprehensive TypeScript-based calculator suite for refractory materials design, featuring phase equilibrium analysis, blend optimization, and custom mix library management.

## Quick Start

```bash
# From project root directory

# Start services (TypeScript is compiled automatically inside container)
make up        # Start all services
make test      # Run tests
make down      # Stop all services
```

**Note:** TypeScript compilation happens automatically when containers start. The compiled JavaScript is shared between containers via Docker volumes.

## Web Interface

Access at **http://localhost:18080**

- **Homepage** - Module overview and quick navigation
- **Phase Equilibrium Calculator** - `/phase-calculator.html`
- **Polyfractional Blend Optimizer** - `/blend-optimizer.html`

All pages feature unified navigation for seamless workflow.

## Features

### Phase Equilibrium & Thermal Analysis
- **Phase Equilibrium** - Full thermodynamic calculations at each temperature
- **Multi-Model Refractoriness** - EN ISO 1893, ASTM C24/C71, GOST 4069-69
- **Glass Viscosity** - ASTM C965 fixed points with multiple models
- **Mineral Phases** - Identifies mullite, corundum, quartz, etc.

### Blend Design & Optimization 🆕
- **Polyfractional Blend Optimizer** - Design optimal particle size distributions
- **PSD Models** - Andreasen and Funk-Dinger discrete methods
- **Packing Calculators** - CPM (de Larrard) and Furnas sequential filling
- **Shrinkage Prediction** - Chemical shrinkage and MSC sintering models
- **Custom Mix Library** - Save, load, and manage optimized blend presets
- **Seamless Integration** - Use saved blends in phase equilibrium calculations

### User Interface
- **Modular Homepage** - Clear module selection with feature overview
- **Unified Navigation** - Consistent menu across all pages
- **Mix Library Browser** - Save/load custom presets with metadata
- **Export/Import** - Share blend configurations via JSON
- **Responsive Design** - Works on desktop, tablet, and mobile

## Architecture

### Frontend Structure
```
public/
├── index.html                 # Homepage with module overview
├── phase-calculator.html      # Phase equilibrium calculator
├── blend-optimizer.html       # Blend optimizer
├── css/
│   ├── base.css              # Core styles and variables
│   ├── navigation.css        # Navigation menu
│   ├── forms.css             # Form components
│   ├── components.css        # Reusable components
│   ├── calculator.css        # Calculator-specific
│   ├── blend-optimizer.css   # Optimizer-specific
│   └── homepage.css          # Homepage-specific
└── js/
    ├── calculator.js          # Phase calculator logic
    ├── blend-optimizer.js     # Optimizer UI controller
    └── api.js                # API communication
```

### Technology Stack
- **Language:** TypeScript 5.x
- **Runtime:** Node.js 24 (Alpine Linux)
- **Build:** Native TypeScript compiler
- **Web Server:** Nginx (Alpine)
- **Deployment:** Docker Compose
- **Styling:** Modular CSS with design system

## Documentation

> 📁 **All documentation is located in the `docs/` directory.**
>
> ⚠️ **Policy:** Do NOT create summary/completion/status files. Update existing documentation only.

### 📚 Documentation Index

#### Core Documentation
- **[spec.md](docs/spec.md)** - Complete technical specification (v1.1.0)
- **[PROJECT_STATUS.md](docs/PROJECT_STATUS.md)** - Development history and current status
- **[PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)** - Project organization and architecture
- **[INSTALLATION.md](docs/INSTALLATION.md)** - Setup and installation guide
- **[CONTRIBUTING.md](docs/CONTRIBUTING.md)** - ⚠️ Guidelines for contributing (READ THIS FIRST)

#### User Guides & Testing
- **[UI_TESTING_GUIDE.md](docs/UI_TESTING_GUIDE.md)** - Comprehensive UI testing procedures

#### Additional Resources
- **[docs/README.md](docs/README.md)** - Documentation directory index

### 🎯 Quick Navigation

**New Users → Start Here:**
1. [INSTALLATION.md](docs/INSTALLATION.md) - Get set up
3. Open http://localhost:18080/ and explore

**Developers → Technical Docs:**
1. [spec.md](docs/spec.md) - Complete specification with algorithms
2. [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) - Code organization
3. [CONTRIBUTING.md](docs/CONTRIBUTING.md) - How to contribute
4. Source code in `src/` with inline documentation

**Testing:**
2. [UI_TESTING_GUIDE.md](docs/UI_TESTING_GUIDE.md) - UI testing procedures
3. Run `make test` for automated tests

## Project Status

**Version:** 1.1.0  
**Status:** Production Ready  
**Last Updated:** January 31, 2026

Features:
- ✅ Phase Equilibrium Calculator with multi-model refractoriness
- ✅ Polyfractional Blend Optimizer with PSD models
- ✅ Fixed Fractions feature (v1.1.0) - lock specific amounts while optimizing
- ✅ Custom Mix Library with save/load/export
- ✅ Unified navigation and modular CSS architecture

See `docs/spec.md` for complete technical details and implementation history.

## License

MIT

