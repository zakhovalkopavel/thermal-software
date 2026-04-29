# Python Tests

Test files for all Python packages in this project.

## Directory structure

```
tests/
├── nasa_thermo/          ← NASA thermodynamic parser unit tests (pytest)
│   │                       (no __init__.py — would shadow src/nasa_thermo package)
│   ├── test_utils.py
│   ├── test_models.py
│   ├── test_nasa7_parser.py
│   ├── test_nasa9_parser.py
│   └── test_writers.py
└── ocr/                  ← OCR extraction module tests
    ├── __init__.py
    ├── create_simple_test_images.py
    ├── test_coordinate_parsing.py
    ├── test_ocr_direct.py
    ├── test_pipeline_exact.py
    ├── test_document_extraction.py
    ├── test_scientific_comprehensive.py
    ├── test_opencv.py
    └── ...
```

---

## NASA Thermo Parser Tests

Uses **pytest** with in-memory fixtures — no real NASA data files are read.

```bash
# Via Makefile (recommended)
make nasa-test
make nasa-test-all    # + coverage report

# Directly
docker compose run --rm python python -m pytest /app/tests/nasa_thermo/ -v
```

See also: [docs/scripts/NASA_THERMO_PARSER_SPEC.md](../../docs/scripts/NASA_THERMO_PARSER_SPEC.md)

---

## OCR Tests

### Test Data Generators

#### `ocr/create_simple_test_images.py`
Generates high-quality test table images optimized for OCR.

```bash
make ocr-test
# or directly:
docker-compose exec python python /app/tests/ocr/create_simple_test_images.py
```

### Unit Tests

#### `ocr/test_coordinate_parsing.py`
Tests coordinate-based column detection algorithm.

```bash
docker-compose exec python python /app/tests/ocr/test_coordinate_parsing.py
```

**Output**: `shared/processed/coordinate_test.txt`

#### `ocr/test_ocr_direct.py`
Compares different Tesseract PSM (Page Segmentation Mode) settings.

```bash
docker-compose exec python python /app/tests/ocr/test_ocr_direct.py
```

#### `ocr/test_pipeline_exact.py`
End-to-end integration test of the full extraction pipeline.

```bash
docker-compose exec python python /app/tests/ocr/test_pipeline_exact.py
```

### Running All OCR Tests

```bash
# Via Makefile
make ocr-test-all

# Directly
docker-compose exec python bash -c 'cd /app/tests/ocr && for t in test_*.py; do echo "=== $t ===" && python "$t"; done'
```

---

## Writing New Tests

Place test files in the appropriate subfolder:
- `nasa_thermo/` — pytest-based unit tests for the NASA thermo parser
- `ocr/` — script-style tests for the OCR extraction module

### Best Practices

1. **Save output to file** — terminal output from `docker-compose exec` may be lost
2. **Use absolute paths** — `/app/src`, `/app/tests`, `/app/shared`
3. **Add sys.path for OCR tests** — `sys.path.insert(0, '/app/src')` for imports
4. **Handle exceptions** — save error traces to an output file
5. **Use in-memory fixtures for pytest** — do not rely on external data files in unit tests

---

## Related Documentation

- [OCR Package README](../src/ocr/README.md)
- [Scripts README](../src/scripts/README.md)
- [NASA Parser Spec](../../docs/scripts/NASA_THERMO_PARSER_SPEC.md)
- [Python Main README](../README.md)
