# Python Tests

Test scripts and utilities for the OCR table extraction package.

## Test Files

### Test Data Generators

#### `create_simple_test_images.py`
Generates high-quality test table images optimized for OCR.

**Usage**:
```bash
python /app/tests/create_simple_test_images.py
```

**Output**:
- `shared/sources/test_sample_table.png` - Materials properties table (4 columns)
- `shared/sources/test_composition_table.png` - Composition table (5 columns)

**Features**:
- Dynamic cell widths based on content length
- Readable font size (14pt) optimized for OCR
- Clean grid lines (1px)
- High contrast (black on white)


### Unit Tests

#### `test_coordinate_parsing.py`
Tests coordinate-based column detection algorithm.

**Usage**:
```bash
python /app/tests/test_coordinate_parsing.py
```

**Output**: `shared/processed/coordinate_test.txt`

**Tests**:
- Word position clustering
- Column center detection
- Multi-column table parsing
- Coordinate-to-DataFrame conversion

**Expected Result**:
```
DataFrame shape: (3, 5)
DataFrame columns: ['Component', 'Al203', 'Si02', 'CaO', 'MgO']
```

#### `test_ocr_direct.py`
Compares different Tesseract PSM (Page Segmentation Mode) settings.

**Usage**:
```bash
python /app/tests/test_ocr_direct.py
```

**Output**: `shared/processed/ocr_direct_test.txt`

**Tests**:
- PSM 3 (Fully automatic)
- PSM 4 (Single column)
- PSM 6 (Uniform block)
- PSM 11 (Sparse text)

**Use Case**: Determine best PSM mode for different document types

#### `test_pipeline_exact.py`
End-to-end integration test of the full extraction pipeline.

**Usage**:
```bash
python /app/tests/test_pipeline_exact.py
```

**Output**: `shared/processed/pipeline_test.txt`

**Tests**:
- PIL image loading
- OCR configuration
- Coordinate-based extraction
- Full pipeline flow

**Expected Result**: 5-column table with correct data


## Running Tests

### From Host

```bash
# Generate test data first
make ocr-test

# Run individual test
docker-compose exec python python /app/tests/test_coordinate_parsing.py

# Run all tests
docker-compose exec python bash -c 'cd /app/tests && for test in test_*.py; do echo "=== $test ===" && python "$test"; done'
```

### From Container

```bash
# Enter container
docker-compose exec python bash

# Run tests
cd /app/tests
python test_coordinate_parsing.py
python test_ocr_direct.py
python test_pipeline_exact.py

# Check outputs
ls -la /app/shared/processed/*.txt
cat /app/shared/processed/coordinate_test.txt
```

## Test Outputs

All test outputs are saved to `shared/processed/`:

| File | Description |
|------|-------------|
| `coordinate_test.txt` | Coordinate parsing test results and DataFrame output |
| `ocr_direct_test.txt` | PSM mode comparison with OCR text for each mode |
| `pipeline_test.txt` | Full pipeline integration test results |

## Writing New Tests

### Test Script Template

```python
#!/usr/bin/env python3
"""Test description"""

import sys
from pathlib import Path
sys.path.insert(0, '/app/src')

from PIL import Image
import numpy as np
from ocr.ocr import OCRExtractor

output_file = Path("/app/shared/processed/my_test.txt")
results = []

try:
    # Your test code here
    img = Image.open("/app/shared/sources/test_sample_table.png")
    extractor = OCRExtractor()
    
    # Test something
    df = extractor.extract_table(np.array(img))
    
    results.append(f"Shape: {df.shape}")
    results.append(df.to_string())
    
    output_file.write_text('\n'.join(results))
    print(f"Results saved to: {output_file}")
    
except Exception as e:
    import traceback
    output_file.write_text(f"ERROR: {e}\n\n{traceback.format_exc()}")
    raise
```

### Best Practices

1. **Save output to file** - Terminal output may be lost
2. **Use absolute paths** - `/app/src`, `/app/tests`, `/app/shared`
3. **Add sys.path** - `sys.path.insert(0, '/app/src')` for imports
4. **Handle exceptions** - Save error traces to output file
5. **Document expected output** - Add comments about what should happen
6. **Use test data** - Generate with `create_simple_test_images.py`

## Continuous Testing

### Run Tests After Changes

```bash
# 1. Make code changes in src/ocr/
# 2. Regenerate test data
make ocr-test

# 3. Run tests
docker-compose exec python bash -c 'cd /app/tests && for t in test_*.py; do python "$t"; done'

# 4. Check results
cat shared/processed/coordinate_test.txt
cat shared/processed/pipeline_test.txt
```

### Automated Test Runner

Create `run_all_tests.sh` in tests/:

```bash
#!/bin/bash
cd /app/tests
echo "Running all tests..."
for test in test_*.py; do
    echo "=== Running $test ==="
    python "$test" || echo "FAILED: $test"
done
echo "Check outputs in /app/shared/processed/"
```

## Test Coverage

Current test coverage:

- ✅ Coordinate-based column detection
- ✅ PSM mode comparison
- ✅ Full extraction pipeline
- ✅ PIL image loading
- ✅ OCR configuration
- ✅ DataFrame generation
- ⚠️ Missing: Image preprocessing tests (opencv not available)
- ⚠️ Missing: Table detection tests (opencv not available)
- ⚠️ Missing: PDF extraction tests

## Known Issues

1. **OpenCV Not Available**: Image preprocessing and table detection tests disabled until opencv-python-headless is installed
2. **Terminal Output**: docker-compose exec output sometimes broken, use file outputs instead
3. **Timing**: Some tests may timeout if container is under load

## Related Documentation

- [OCR Package README](../src/ocr/README.md)
- [Scripts README](../src/scripts/README.md)
- [Python Main README](../README.md)

