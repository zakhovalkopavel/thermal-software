# Thermal Software - Project Manifest

**Version:** 1.2.0  
**Date:** January 28, 2026  
**Status:** Production Ready + Database Enrichment Active

---

## Project Structure

```
thermal-software/
├── docker/                      # Docker configuration
│   ├── Dockerfile               # Multi-project Node.js container
│   └── nginx.conf               # Web server configuration
│
├── refractory/                  # Refractory Calculator (Main Project)
│   ├── src/                     # TypeScript source code
│   ├── dist/                    # Compiled JavaScript
│   ├── public/                  # Web interface
│   │   ├── index.html
│   │   ├── css/calculator.css
│   │   └── js/
│   │       ├── particle-size-constants.js
│   │       ├── api.js
│   │       └── calculator.js
│   ├── docs/                    # Documentation
│   │   ├── concepts/
│   │   ├── algorithms/
│   │   └── issues-resolved/
│   ├── server.js                # REST API server
│   ├── test-docker.js           # Test script
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md
│   ├── spec.md                  # Technical specification
│   └── PROJECT_STATUS.md
│
├── furnaceCombustion/           # Furnace Combustion Model
├── scripts/                     # Utility scripts (TypeScript/JavaScript)
│   ├── app.ts                   # Thermal exchange application
│   └── recuperator.js
├── python_scripts/              # Python data processing scripts
│   ├── thermophysical_data_processor.py  # Main data processor
│   ├── bulk_pubchem_fetcher.py           # PubChem data fetcher
│   ├── extract_experimental_properties.py # Property extraction
│   ├── enrich_database.py                # Database enrichment
│   ├── data_enrichment/                  # Enrichment modules
│   └── README.md
├── tests/                       # Test suite
│   ├── test_pubchem_fetch_10.py          # PubChem fetch test
│   ├── test_anion_identification.py
│   ├── test_pubchem_api.py
│   ├── test_configuration.py
│   ├── test_results/            # Test outputs (not committed)
│   └── README.md
├── library/                     # Reference data libraries
│   ├── README.md                # Library documentation
│   ├── verify.sh                # System verification script
│   ├── docs/                    # Essential documentation
│   │   ├── THERMOPHYSICAL_DATA_SPEC.md
│   │   ├── COMPREHENSIVE_DATABASE_GUIDE.md
│   │   ├── QUICK_START.md
│   │   ├── QUICK_REFERENCE.md
│   │   ├── PUBCHEM_API_GUIDE.md
│   │   ├── BULK_FETCH_GUIDE.md
│   │   └── THERMOPHYSICAL_DATA_NOTES.md
│   ├── processed_data/          # Final database files
│   │   ├── thermophysical_comprehensive_anhydrous_*.csv
│   │   └── thermophysical_comprehensive_hydrates_*.csv
│   └── resources/
│       └── data_sources/        # Source data files
│           ├── manual_data_entry.csv
│           └── PubChem_bulk_fetch_*.csv
├── Makefile                     # Build automation
├── compose.yaml                 # Docker Compose config
├── MANIFEST.md                  # This file
└── README.md                    # Main readme

Hidden:
├── .logs/                       # Implementation logs (excluded from git)
└── .gitignore
```

---

## Technology Stack

### Backend
- **Runtime:** Node.js 24
- **Language:** TypeScript 5.x
- **API:** Native Node.js HTTP server
- **Architecture:** REST API with OOP design patterns

### Frontend
- **HTML5** with semantic markup
- **CSS3** with modern styling
- **Vanilla JavaScript** with modular architecture
- **Web Server:** Nginx (Alpine)

### DevOps
- **Containerization:** Docker & Docker Compose
- **Build Tool:** Make
- **Version Control:** Git

---

## Key Features

### Refractory Calculator

1. **Material Library**
   - 11 categories, 23 variants
   - Chamotte, Alumina, SiC, Magnesia, Talc, Quartz
   - Cements: CAC, Portland (3 types), High Alumina
   - Additives: Metakaolin, Microsilica

2. **Input Methods**
   - Parts-based input (auto-converts to percentages)
   - Custom particle size selection
   - 4 sizing methods: Range, Mesh, FEPA, Custom

3. **Particle Size Systems**
   - 6 basic classifications (>4 mesh to <400 mesh)
   - ASTM mesh standards (23 sizes)
   - FEPA F series (25 sizes)
   - FEPA P series (21 sizes)

4. **Calculations**
   - Phase equilibrium at temperature
   - Final microstructure after cooling
   - Liquid/solid compositions
   - Mineral phase identification
   - Glass viscosity (6 ASTM C965 fixed points)
   - Refractoriness standards (EN ISO 1893, ASTM C24/C71, GOST 4069-69)

5. **Phase Diagram Systems**
   - 9 ternary/binary systems
   - 15+ eutectics
   - CAS, MAS, CMS, SA, CS, MS systems

---

## Architecture Patterns

### Design Patterns Used
- **Singleton:** Configuration, Repositories
- **Repository:** Data access abstraction
- **Factory:** Component creation
- **Strategy:** Multiple calculation models
- **Facade:** Service layer
- **Template Method:** Base calculator

### SOLID Principles
All 5 principles applied throughout codebase

### Code Organization
- **Separation of Concerns:** Business logic ↔ Data ↔ Presentation
- **DRY Principle:** Constants centralized, no duplication
- **Type Safety:** Full TypeScript coverage
- **Modularity:** Each class has single responsibility

---

## API Endpoints

### Base URL
`http://localhost:3010`

### Endpoints

**GET /health**
- Health check
- Returns: `{"status": "healthy"}`

**GET /api/components**
- List all available materials
- Returns: Categories and variants

**POST /api/calculate**
- Perform refractory calculations
- Body: `{components: [...], temperature: number}`
- Returns: Complete analysis results

---

## Web Interface

### Access
`http://localhost:18080/`

### Features
- Interactive form with dropdowns
- Parts-based input (auto-calculates %)
- Particle size selection
- Real-time component list
- Comprehensive results display
- Scrollable results panel

---

## Commands

### Main Commands
```bash
make up          # Start all services
make down        # Stop all services
make restart     # Restart with rebuild
make build       # Build TypeScript
make test        # Run tests
make dev         # Development watch mode
make logs        # View logs
```

### Docker
```bash
docker-compose up -d --build    # Start with build
docker-compose logs -f          # Follow logs
docker-compose ps               # Status
```

---

## Configuration Files

### Docker
- `docker/Dockerfile` - Node.js 24 Alpine
- `docker/nginx.conf` - Web server config
- `compose.yaml` - Multi-service orchestration

### TypeScript
- `tsconfig.json` - Compiler options
- Target: ES2020, Module: CommonJS
- Strict mode enabled

### Build
- `Makefile` - Automation scripts
- `package.json` - Dependencies and scripts

---

## Data Files

### Component Dictionary
`src/data/ComponentDictionary.ts`
- 11 material categories
- Oxide compositions
- Default particle sizes

### Phase Diagrams
`src/repositories/PhaseDiagramRepository.ts`
- Ternary systems (CAS, MAS, CMS)
- Binary systems (SA, CS, MS)
- Eutectic points with temperatures

### Particle Sizes
`public/js/particle-size-constants.js`
- Size classifications
- Mesh/mm conversions
- FEPA standards

---

## Documentation

### Main Docs
- **README.md** - Quick start guide
- **spec.md** - Complete technical specification
- **PROJECT_STATUS.md** - Development history

### Detailed Docs (`docs/`)
- **concepts/** - Physics explanations
- **algorithms/** - Implementation details
- **issues-resolved/** - Problem solutions

### API Docs
- **docs/API.md** - API reference
- **docs/INSTALLATION.md** - Setup guide
- **docs/PROJECT_STRUCTURE.md** - Architecture

---

## Testing

### Test Script
`test-docker.js` - Comprehensive test

### Run Tests
```bash
make test
```

### Test Output
- Phase composition at temperature
- Final microstructure
- Mineral phases with properties
- Refractoriness standards
- Model attribution

---

## Deployment

### Requirements
- Docker
- Docker Compose
- Make (optional)

### Quick Start
```bash
cd thermal-software
make up
```

### Ports
- **18080** - Web interface
- **3010** - API server

### Auto-Configuration
- All dependencies installed on build
- TypeScript compiled automatically
- No manual steps required

---

## Maintenance

### Adding Materials
1. Edit `src/data/ComponentDictionary.ts`
2. Add to category map
3. Rebuild: `make build`

### Updating Particle Sizes
1. Edit `public/js/particle-size-constants.js`
2. Restart: `make restart`

### Adding Eutectics
1. Edit `src/repositories/PhaseDiagramRepository.ts`
2. Add to system eutectics
3. Rebuild: `make build`

---

## Best Practices

### Code Style
- TypeScript strict mode
- JSDoc comments for documentation
- Meaningful variable names
- Single responsibility per file

### Git Workflow
- `.logs/` excluded from version control
- Development logs in `.logs/`
- Only essential files committed

### Documentation
- Update docs after implementation works
- Spec file kept current
- README reflects actual functionality

---

## Version History

### v1.0.0 (December 16, 2025)
- Initial production release
- 11 material categories, 23 variants
- Multi-model refractoriness predictions
- Parts-based input system
- 4 particle size selection methods
- Complete phase diagram coverage
- REST API with web interface
- Docker containerization
- Comprehensive documentation

---

## License

MIT License

---

## Support

- **Documentation:** See `docs/` folder
- **Technical Spec:** See `spec.md`
- **Issues:** Documented in `docs/issues-resolved/`

---

## Projects

### 1. Refractory Calculator

**Status:** ✅ Production Ready  
**Technology:** TypeScript, Node.js, REST API  
**Location:** `/refractory/`

- Comprehensive material library with 11 categories and 23 variants
- Advanced particle size distribution modeling
- Multi-method refractory calculations
- Detailed phase diagram analysis
- RESTful API with secure, versioned endpoints
- Interactive web interface for calculator access
- Dockerized deployment for consistency and scalability
- Extensive documentation and testing

---

### 2. Thermophysical Data Processing

**Status:** 🔄 Active Development - Database Enrichment Phase  
**Technology:** Python 3, Pandas, PubChem API  
**Location:** `/library/` + `/python_scripts/` + `/tests/`  
**Start Date:** January 27, 2026  
**Updated:** January 28, 2026

#### Objective
Build comprehensive thermophysical property database for ionic compounds covering 12 cations and 7 anion families with data from NBS Tables, PubChem, and literature sources.

#### Current Status
- **Base Database:** ✅ Complete (1110 compounds from NBS Tables)
- **Manual Enrichment:** ✅ Complete (literature data added)
- **PubChem Integration:** ✅ Ready (fetcher with proxy/timeout support)
- **Data Validation:** ✅ All systems operational

#### Database Files

**Final Data** (`library/processed_data/`)
- `thermophysical_comprehensive_anhydrous_YYYYMMDD.csv` - Anhydrous compounds
- `thermophysical_comprehensive_hydrates_YYYYMMDD.csv` - Hydrated compounds

**Source Data** (`library/resources/data_sources/`)
- `manual_data_entry.csv` - Literature data
- `PubChem_bulk_fetch_*.csv` - PubChem API fetched data

#### Data Columns

**Numerical Properties:**
- Identity: formula, compound_type, anion_family, cation, CAS
- Thermal: Tm_C, Tm_K, Tb_C, Tb_K, Td_C
- Physical: density_g_per_cm3, Hfus_kJ_per_mol, Hvap_kJ_per_mol
- Material: thermal_conductivity_W_per_mK, hardness_Mohs
- Safety: flash_point_C, vapor_pressure_mmHg

**Text Properties (Separate Columns):**
- `color` - Physical appearance/color description
- `solubility` - Solubility in various solvents
- `stability` - Stability conditions and information
- `odor` - Odor/smell description
- `toxicity_hazard` - Safety and toxicity information

#### Key Features
- Separate text columns for qualitative properties (no mixing)
- PubChem fetcher skips not-found compounds (no empty entries)
- Proxy and timeout support for API access
- Rate limiting (2 req/sec) to prevent bans
- Incremental saves every 50 compounds
- Resume capability for interrupted fetches
- Full source tracking and provenance

#### Documentation
**Library Docs** (`library/docs/`)
- `THERMOPHYSICAL_DATA_SPEC.md` - Data structure specification
- `COMPREHENSIVE_DATABASE_GUIDE.md` - Usage guide
- `QUICK_START.md` - Quick start guide
- `PUBCHEM_API_GUIDE.md` - PubChem API usage
- `BULK_FETCH_GUIDE.md` - Bulk fetch operations

#### Scripts
**Processing** (`python_scripts/`)
- `thermophysical_data_processor.py` - Main database builder
- `bulk_pubchem_fetcher.py` - PubChem data fetcher
- `extract_experimental_properties.py` - Property extraction
- `enrich_database.py` - Database enrichment

**Testing** (`tests/`)
- `test_pubchem_fetch_10.py` - Test fetch with 10 compounds
- `test_anion_identification.py` - Anion family tests
- `test_pubchem_api.py` - API connectivity tests

#### Verification
Run system check:
```bash
cd library
./verify.sh
```

---

### 3. Furnace Combustion Model

**Status:** ⚠️ Development  
**Location:** `/furnaceCombustion/`

- Advanced combustion modeling for industrial furnaces
- Detailed reaction mechanisms and kinetics
- Multi-phase and multi-component simulations
- Integration with refractory calculator for coupled simulations
- REST API for model access and control
- Dockerized environment for easy deployment
- Comprehensive testing and validation against experimental data

---

**Last Updated:** January 28, 2026  
**Maintained By:** Thermal Software Team  
**Status:** ✅ Production Ready + Database Enrichment Active
