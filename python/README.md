# Python Components

Python-based utilities for thermal engineering data processing, OCR table extraction, and analysis.

## Structure

```
python/
├── pyproject.toml        # Poetry dependencies and project config
├── poetry.lock           # Locked dependencies (copied from container)
├── README.md             # This file
├── src/                  # Source code
│   ├── ocr/              # OCR table extraction package
│   │   ├── config.py
│   │   ├── extractor.py
│   │   ├── ocr.py
│   │   ├── pdf.py
│   │   ├── file_manager.py
│   │   ├── image_processing.py
│   │   └── README.md     # Package documentation
│   ├── nasa_thermo/      # NASA thermodynamic database parser package
│   │   ├── __init__.py       # Public API re-exports
│   │   ├── nasa7_coeffs.py   # Nasa7Coeffs dataclass
│   │   ├── nasa7_equation.py # Nasa7Equation dataclass
│   │   ├── nasa7_species.py  # Nasa7Species dataclass
│   │   ├── nasa9_coeffs.py   # Nasa9Coeffs dataclass
│   │   ├── nasa9_range.py    # Nasa9Range dataclass
│   │   ├── nasa9_equation.py # Nasa9Equation dataclass
│   │   ├── nasa9_species.py  # Nasa9Species dataclass
│   │   ├── utils.py          # parse_e / parse_d / slice_e15
│   │   ├── writers.py        # write_nasa7_json / write_nasa9_json
│   │   └── parsers/
│   │       ├── nasa7.py      # NASA-7 (SP-273/1971) parser
│   │       └── nasa9.py      # NASA-9 (RP-1311/1996 + Burcat) parser
│   ├── phase_diagrams/   # Slag Atlas / NSRDS-NBS 61 phase-diagram extraction (one export per file)
│   │   ├── __init__.py       # Public API re-exports
│   │   ├── constants/  models/  config/      # constants, dataclasses, configs + source registry
│   │   ├── rendering/  detection/  tracing/  # page images, frame/ticks/lines/junctions, curves
│   │   ├── figures/  nbs/                    # caption + label OCR, NSRDS-NBS 61 matching
│   │   └── builders/  output/  validation/   # system build, JSON + review writers, dataset rules
│   └── scripts/          # Production scripts
│       ├── parse_nasa_thermo.py  # NASA thermo CLI (thin wrapper)
│       ├── extract_phase_diagram.py  # Phase-diagram CLI (thin wrapper)
│       ├── extract_tables.py
│       └── README.md     # Scripts documentation
└── tests/                # Test files
    ├── nasa_thermo/      # NASA parser unit tests
    │   ├── test_utils.py
    │   ├── test_models.py
    │   ├── test_nasa7_parser.py
    │   ├── test_nasa9_parser.py
    │   └── test_writers.py
    ├── phase_diagrams/   # Phase-diagram extraction tests (synthetic images, golden files)
    └── ocr/              # OCR module tests
        ├── test_coordinate_parsing.py
        ├── test_document_extraction.py
        ├── test_scientific_comprehensive.py
        ├── test_opencv.py
        └── ...
```

## Quick Start

### From Host

```bash
# Start Python container
docker-compose up -d python

# Generate test data
make ocr-test

# Run extraction
make ocr-extract

# Enter container
make python-bash
```

### Inside Container

```bash
# Run extraction script
python /app/src/scripts/extract_tables.py --file test_sample_table.png

# Run tests
python /app/tests/test_coordinate_parsing.py

# View outputs
ls -la /app/shared/processed/
```

## Components

### NASA Thermodynamic Parser (`src/nasa_thermo/`)

Modular parser for NASA-7 (SP-273/1971) and NASA-9 (RP-1311/1996 + Burcat ANL-05/20) thermodynamic databases.

**Spec**: [docs/scripts/NASA_THERMO_PARSER_SPEC.md](../docs/scripts/NASA_THERMO_PARSER_SPEC.md)

**Source files**: `shared/sources/NASA/`

**Output**: `shared/processed/nasa7.json`, `shared/processed/nasa9.json`

**Make commands**:
```bash
make nasa-parse          # parse both databases
make nasa-parse-nasa7    # NASA-7 only
make nasa-parse-nasa9    # NASA-9 only
make nasa-test           # run unit tests
```

### Phase-Diagram Extraction (`src/phase_diagrams/`)

Turns Slag Atlas figures into the phase-diagram dataset: calibrates the axes, traces the
liquidus curves, checks invariants against NSRDS-NBS 61 and validates the dataset. Printed
labels stay authoritative; digitized values are only checks.

**Spec**: [docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md](../docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md)

**Source files**: `shared/sources/compound-data/` (atlas, NSRDS-NBS 61 and JANAF PDFs, listed in `sources.json`)

**Input / output**: `shared/processed/phase-diagrams/configs/*.config.json` → candidates,
renders, tiles, overlays and review lists in `tmp/reports/python/phase-diagrams/`; a
candidate reaches `shared/processed/phase-diagrams/systems/` only through `pd-promote`
after user validation. All commands run in the `python` container.

**Make commands**:
```bash
make pd-calibrate SYSTEM=mgo-sio2         # frame, ticks, residuals, calibration overlay
make pd-extract SYSTEM=mgo-sio2           # binary config → candidate + comparison with the dataset file
make pd-curves SYSTEM=cao-mgo-sio2        # ternary boundary curves → candidate with polyline_wt
make pd-compare SYSTEM=mgo-sio2           # candidate vs dataset file (exit 1 on differences)
make pd-promote SYSTEM=mgo-sio2           # candidate → dataset (after validation; refused on errors)
make pd-tile PAGE=108 BOX="x0 y0 x1 y1"   # zoom tile with pixel rulers
make pd-nbs-index                         # dump and parse NSRDS-NBS 61 (once)
make pd-nbs-suggest COMPONENTS="MgO SiO2" # candidate NBS entries
make pd-validate                          # dataset rules PD001–PD013
make pd-test                              # unit + regression tests
```

### OCR Package (`src/ocr/`)

Modular OCR table extraction library with support for:
- PDF direct extraction (Tabula)
- OCR-based extraction (Tesseract with coordinate-based column detection)
- Image preprocessing and table detection
- Multiple output formats (CSV with metadata)

**Documentation**: [src/ocr/README.md](src/ocr/README.md)

**Key Features**:
- Coordinate-based column detection (clusters words by x-position)
- Multiple PSM modes for different document types
- Automatic fallback between extraction methods
- Table validation and auto-repair

### Scripts (`src/scripts/`)

Production scripts for running extraction tasks.

**Main Script**: `extract_tables.py`
- Interactive file selection
- Batch processing support
- Configurable extraction methods

**Documentation**: [src/scripts/README.md](src/scripts/README.md)

### Tests (`tests/`)

Test scripts and utilities:
- **Test Data Generators**: Create sample table images
- **Unit Tests**: Test individual components (coordinate parsing, OCR modes)
- **Integration Tests**: Test full extraction pipeline

**Documentation**: [tests/README.md](tests/README.md)

## Installation

Dependencies are managed with Poetry:

```bash
# Inside container (already installed)
poetry install --no-root

# Add new dependency
poetry add package-name

# Copy updated poetry.lock back to host
docker cp thermal-python:/app/poetry.lock ./python/poetry.lock
```

## Development

### Container Setup

The Python service mounts source code for live editing:

```yaml
volumes:
  - ./python/src:/app/src      # Source code (live reload)
  - ./python/tests:/app/tests  # Test files (live reload)
  - ./shared:/app/shared        # Shared data
```

Changes to Python files take effect immediately without rebuilding.

### Running Commands

```bash
# From host (via docker-compose)
docker-compose exec python python /app/src/scripts/extract_tables.py

# From inside container
docker-compose exec python bash
python /app/src/scripts/extract_tables.py
```

### Testing

```bash
# NASA thermo parser tests
make nasa-test
docker compose run --rm python python -m pytest /app/tests/nasa_thermo/ -v

# Phase-diagram extraction tests
make pd-test
docker compose run --rm python python -m pytest /app/tests/phase_diagrams/ -v

# OCR tests
docker-compose exec python python /app/tests/ocr/test_coordinate_parsing.py
docker-compose exec python python /app/tests/ocr/test_opencv.py

# Run all tests in a folder
docker-compose exec python bash -c 'cd /app/tests/ocr && for t in test_*.py; do python "$t"; done'
```

## Documentation

- **Package Documentation**: [src/ocr/README.md](src/ocr/README.md) - OCR package architecture and API
- **Scripts Documentation**: [src/scripts/README.md](src/scripts/README.md) - Production scripts usage
- **User Guide**: [../docs/scripts/OCR_TABLE_EXTRACTION.md](../docs/scripts/OCR_TABLE_EXTRACTION.md) - End-user documentation

## Common Tasks

### Extract Tables from PDF/Image

```bash
# Interactive mode
make ocr-extract

# Specific file
docker-compose exec python python /app/src/scripts/extract_tables.py --file document.pdf
```

### Add New Feature

1. Edit source in `python/src/ocr/`
2. Add tests in `python/tests/`
3. Update relevant README
4. Test changes (no rebuild needed, code is mounted)

### Update Dependencies

```bash
# Add dependency
docker-compose exec python poetry add numpy

# Copy updated lock file
docker cp thermal-python:/app/poetry.lock ./python/poetry.lock

# Commit poetry.lock to git
git add python/poetry.lock
git commit -m "Update Python dependencies"
```

## Troubleshooting

### Import Errors

Ensure PYTHONPATH includes `/app/src`:
```bash
export PYTHONPATH=/app/src:$PYTHONPATH
```

This is set automatically in the Dockerfile.

### OCR Not Working

Check Tesseract installation:
```bash
docker-compose exec python tesseract --version
docker-compose exec python python -c "import pytesseract; print('OK')"
```

### Missing Dependencies

Rebuild container:
```bash
docker-compose build --no-cache python
docker-compose up -d python
```

## Environment Variables

Set in `compose.yml` or `.env`:

- `PYTHONUNBUFFERED=1` - Immediate output (no buffering)
- `PYTHONPATH=/app/src` - Python import path
- `TESSDATA_PREFIX` - Tesseract data directory

## Related Documentation

- [Docker Python Container](../docker/python/Dockerfile)
- [Makefile Commands](../Makefile)
- [OCR Extraction Guide](../docs/scripts/OCR_TABLE_EXTRACTION.md)

