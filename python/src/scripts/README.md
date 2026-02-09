# Python Scripts

Production scripts for thermal engineering data processing and analysis.

> **📚 Complete Documentation**: See [../../docs/scripts/](../../docs/scripts/)

## Available Scripts

### OCR Table Extraction

Extract tables from PDF and image files using the `ocr` package.

**Main Script**: `extract_tables.py`

```bash
# Interactive mode (prompts for file selection)
python /app/src/scripts/extract_tables.py

# Process specific file
python /app/src/scripts/extract_tables.py --file document.pdf

# Force OCR method (for scanned documents)
python /app/src/scripts/extract_tables.py --file scanned.pdf --method ocr

# Custom settings
python /app/src/scripts/extract_tables.py --file doc.pdf --dpi 600 --lang deu
```

**Full Documentation**: [../../docs/scripts/OCR_TABLE_EXTRACTION.md](../../docs/scripts/OCR_TABLE_EXTRACTION.md)

## Quick Reference

### From Host (via Makefile)

```bash
# Generate test data
make ocr-test

# Run extraction (interactive)
make ocr-extract

# Enter Python container
make python-bash
```

### Inside Container

```bash
# Enter container
docker-compose exec python bash

# Run extraction script
python /app/src/scripts/extract_tables.py --help
python /app/src/scripts/extract_tables.py --file test_sample_table.png

# Check outputs
ls -la /app/shared/processed/
cat /app/shared/processed/test_sample_table_table_1_*.csv
```

## Test Scripts

Test scripts are located in `python/tests/` (separate from production code).

### Generate Test Data

```bash
# High-quality test images (recommended)
python /app/tests/create_simple_test_images.py

# Legacy test generator
python /app/tests/create_test_tables.py
```

### Run Tests

```bash
# Coordinate-based parsing test
python /app/tests/test_coordinate_parsing.py

# OCR mode comparison
python /app/tests/test_ocr_direct.py

# Full pipeline test
python /app/tests/test_pipeline_exact.py

# Debug extraction
python /app/tests/debug_extraction.py
```

See [../ocr/README.md](../ocr/README.md#testing) for detailed test documentation.

## Directory Structure

```
python/
├── src/
│   ├── ocr/              # OCR extraction package (library)
│   │   └── README.md     # Package documentation
│   └── scripts/          # Production scripts (this folder)
│       ├── README.md     # This file
│       └── extract_tables.py  # Main extraction script
└── tests/                # Test scripts (separate)
    ├── create_simple_test_images.py
    ├── test_coordinate_parsing.py
    └── ...
```

## Adding New Scripts

1. Create your script in `python/src/scripts/`
2. Add any dependencies to `pyproject.toml`
3. Import from the `ocr` package:
   ```python
   from ocr.config import ExtractionConfig
   from ocr.extractor import TableExtractor
   ```
4. Update this README with usage examples
5. Add tests in `python/tests/`

