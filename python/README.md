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
│   └── scripts/          # Production scripts
│       ├── extract_tables.py
│       └── README.md     # Scripts documentation
└── tests/                # Test files
    ├── create_simple_test_images.py
    ├── test_coordinate_parsing.py
    ├── test_ocr_direct.py
    └── test_pipeline_exact.py
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
# Generate test images
make ocr-test

# Run individual test
docker-compose exec python python /app/tests/test_coordinate_parsing.py

# Run all tests
docker-compose exec python bash -c 'cd /app/tests && for t in test_*.py; do python "$t"; done'

# View test outputs
ls -la shared/processed/*.txt
cat shared/processed/coordinate_test.txt
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

