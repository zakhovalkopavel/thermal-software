# OCR Table Extractor Package

Modular Python package for extracting tables from PDF and image files.

> **📚 User Documentation**: See [docs/scripts/OCR_TABLE_EXTRACTION.md](../../docs/scripts/OCR_TABLE_EXTRACTION.md)

## Package Architecture

Modular components for maintainability:

```
python/
├── src/
│   ├── ocr/                  # OCR extraction package (main library)
│   │   ├── __init__.py       # Package initialization
│   │   ├── config.py         # Configuration management
│   │   ├── file_manager.py   # File operations and I/O
│   │   ├── image_processing.py # Image preprocessing and table detection
│   │   ├── ocr.py            # OCR-based extraction
│   │   ├── pdf.py            # Direct PDF extraction (Tabula)
│   │   └── extractor.py      # Main orchestrator
│   └── scripts/              # Production scripts
│       └── extract_tables.py # Main CLI application
└── tests/                    # Test files
    ├── create_simple_test_images.py  # Generate test table images
    ├── test_coordinate_parsing.py    # Test coordinate-based parsing
    ├── test_ocr_direct.py            # Direct OCR tests
    └── test_pipeline_exact.py        # Pipeline integration tests
```

## Design Principles

### Separation of Concerns
- **Config**: All configuration in one place
- **File Management**: File I/O isolated from extraction logic
- **Image Processing**: Preprocessing and detection logic separated
- **OCR**: OCR-specific functionality encapsulated
- **PDF**: PDF extraction isolated
- **Extractor**: Orchestrates all components

### Single Responsibility
Each class has one clear responsibility:
- `ExtractionConfig`: Holds configuration
- `FileManager`: Manages file operations
- `ImagePreprocessor`: Preprocesses images
- `TableDetector`: Detects table regions
- `OCRExtractor`: Performs OCR extraction
- `PDFExtractor`: Handles PDF direct extraction
- `TableExtractor`: Orchestrates the workflow

### Dependency Injection
Components receive dependencies through constructors, making testing easier:

```python
extractor = TableExtractor(config)
# Components are created internally but can be replaced for testing
```

### Error Handling
- Logging at appropriate levels
- Graceful degradation (e.g., if Camelot not available, try Tabula)
- Clear error messages

## Usage

### Basic Usage

```python
from ocr.config import ExtractionConfig
from ocr.extractor import TableExtractor

# Create configuration
config = ExtractionConfig(
    sources_dir="/path/to/sources",
    processed_dir="/path/to/output",
    ocr_lang="eng",
    dpi=300
)

# Create extractor
extractor = TableExtractor(config)

# Process a file
from pathlib import Path
file_path = Path("/path/to/document.pdf")
saved_files = extractor.process_file(file_path)
```

### CLI Usage

```bash
# Interactive mode
python /app/src/scripts/extract_tables.py

# Process specific file
python /app/src/scripts/extract_tables.py --file document.pdf

# Force OCR method
python /app/src/scripts/extract_tables.py --file scanned.pdf --method ocr

# Custom settings
python /app/src/scripts/extract_tables.py --file doc.pdf --dpi 600 --lang deu
```

### Generate Test Data

```bash
# From inside container
python /app/tests/create_simple_test_images.py

# Or from host using Makefile
make ocr-test
```

## Configuration

All configuration is managed through `ExtractionConfig`:

```python
@dataclass
class ExtractionConfig:
    sources_dir: Path = Path("/app/shared/sources")
    processed_dir: Path = Path("/app/shared/processed")
    ocr_lang: str = "eng"
    dpi: int = 300
    min_table_area: int = 10000
    # ... more settings
```

## Extension Points

### Adding a New Extraction Method

1. Create a new module (e.g., `new_method.py`)
2. Implement extractor class
3. Add to `TableExtractor` in `extractor.py`

### Custom Preprocessing

Extend `ImagePreprocessor` or inject your own:

```python
class CustomPreprocessor(ImagePreprocessor):
    @classmethod
    def preprocess(cls, image):
        # Custom preprocessing
        return processed_image
```

### Custom Table Detection

Extend `TableDetector` or create your own:

```python
class CustomDetector(TableDetector):
    def detect_tables(self, image):
        # Custom detection logic
        return table_regions
```

## Testing

The modular design makes unit testing straightforward:

```python
# Test image preprocessing
from ocr.image_processing import ImagePreprocessor
preprocessor = ImagePreprocessor()
processed = preprocessor.preprocess(test_image)
assert processed.shape == expected_shape

# Test table detection
from ocr.image_processing import TableDetector
detector = TableDetector(min_area=5000)
tables = detector.detect_tables(test_image)
assert len(tables) > 0

# Test coordinate-based parsing
from ocr.ocr import OCRExtractor
extractor = OCRExtractor(lang="eng", psm_mode="--psm 3")
data = extractor.extract_data(test_image)
df = extractor._parse_table_from_data(data)
assert df.shape[1] > 1  # Multiple columns detected
```

### Available Test Files

Located in `python/tests/`:

#### Test Data Generators
- **create_simple_test_images.py** - Generate high-quality test table images
  ```bash
  python /app/tests/create_simple_test_images.py
  # Creates test_sample_table.png and test_composition_table.png
  ```


#### Unit Tests
- **test_coordinate_parsing.py** - Test coordinate-based column detection
  ```bash
  python /app/tests/test_coordinate_parsing.py
  # Tests image_to_data parsing and column clustering
  # Output: shared/processed/coordinate_test.txt
  ```

- **test_ocr_direct.py** - Direct OCR tests with different PSM modes
  ```bash
  python /app/tests/test_ocr_direct.py
  # Tests PSM 3, 4, 6, 11 modes on sample images
  # Output: shared/processed/ocr_direct_test.txt
  ```

- **test_pipeline_exact.py** - End-to-end pipeline integration tests
  ```bash
  python /app/tests/test_pipeline_exact.py
  # Tests full extraction pipeline
  # Output: shared/processed/pipeline_test.txt
  ```


### Running Tests from Host

```bash
# Generate test data
make ocr-test

# Run extraction on test data
make ocr-extract

# Enter container for manual testing
make python-bash
cd /app/tests
python test_coordinate_parsing.py
```

### Running Tests from Container

```bash
# Enter container
docker-compose exec python bash

# Run individual tests
python /app/tests/test_coordinate_parsing.py
python /app/tests/test_ocr_direct.py
python /app/tests/test_pipeline_exact.py

# Run all tests
cd /app/tests
for test in test_*.py; do python "$test"; done

# Check test outputs
ls -la /app/shared/processed/*.txt
cat /app/shared/processed/coordinate_test.txt
```

### Test Output Files

Test results are saved to `shared/processed/`:
- `coordinate_test.txt` - Coordinate parsing test results
- `ocr_direct_test.txt` - OCR mode comparison results
- `pipeline_test.txt` - Pipeline integration results
````
