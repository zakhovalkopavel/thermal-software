# OCR Table Extraction

Extract tables from PDF and image files using OCR and direct extraction methods.

## Overview

The OCR table extractor is a modular Python package that can extract tabular data from:
- PDF files (using direct extraction or OCR)
- Image files (PNG, JPG, TIFF, etc.)

It uses multiple extraction methods and automatically selects the best approach for each file.

## Quick Start

### 1. Generate Test Data

```bash
make ocr-test
```

This creates sample table images in `shared/sources/` for testing.

### 2. Run Extraction (Interactive Mode)

```bash
make ocr-extract
```

Follow the prompts to:
1. Enter a filename or search term
2. Select a file from the results
3. View extracted tables saved to `shared/processed/`

### 3. Direct File Processing

```bash
# From inside the Python container
docker exec -it thermal-python python /app/src/scripts/extract_tables.py --file document.pdf

# Or enter the container shell
make python-bash
python /app/src/scripts/extract_tables.py --file document.pdf
```

## Command Line Options

```bash
python /app/src/scripts/extract_tables.py [OPTIONS]

Options:
  --file FILE          Specific file to process (in sources directory)
  --method METHOD      Extraction method: auto, direct, ocr (default: auto)
  --lang LANG          OCR language code (default: eng)
  --dpi DPI            DPI for PDF conversion (default: 300)
  --sources DIR        Sources directory (default: /app/shared/sources)
  --output DIR         Output directory (default: /app/shared/processed)
  -h, --help           Show help message
```

### Examples

```bash
# Interactive mode
python /app/src/scripts/extract_tables.py

# Process specific PDF with auto-detection
python /app/src/scripts/extract_tables.py --file thermal_data.pdf

# Force OCR method for scanned documents
python /app/src/scripts/extract_tables.py --file scanned.pdf --method ocr

# Force direct extraction (no OCR)
python /app/src/scripts/extract_tables.py --file digital.pdf --method direct

# Higher quality OCR
python /app/src/scripts/extract_tables.py --file document.pdf --dpi 600

# Different language
python /app/src/scripts/extract_tables.py --file german.pdf --lang deu
```

## Extraction Methods

### Auto (Default)
- Tries direct extraction first for PDFs
- Falls back to OCR if direct extraction fails or for images
- Best for general use

### Direct
- Uses Camelot and Tabula for PDF table extraction
- Fast and accurate for digital PDFs
- No OCR overhead
- Won't work for scanned PDFs or images

### OCR
- Converts PDFs to images and uses Tesseract OCR
- Works with scanned documents and photos
- Includes image preprocessing for better accuracy
- Slower but more versatile

## Output Format

Extracted tables are saved as CSV files with metadata:

```csv
# Source: thermal_properties.pdf
# Extracted: 2026-02-09T14:35:22.123456
# Table: 1/2
# Rows: 15, Columns: 4
Material,Density,Thermal Conductivity,Max Temperature
Alumina,3.9,30,1750
...
```

Filename format: `{original_name}_table_{number}_{timestamp}.csv`

## Directory Structure

```
shared/
├── sources/          # Input files (place PDFs/images here)
└── processed/        # Output CSV files and logs
    └── ocr_extraction.log
```

## Supported File Types

### Images
- PNG (.png)
- JPEG (.jpg, .jpeg)
- TIFF (.tiff)
- BMP (.bmp)
- GIF (.gif)

### Documents
- PDF (.pdf)

## Architecture

The package is organized into modular components:

```
python/
├── src/
│   ├── ocr/                    # OCR extraction package
│   │   ├── config.py          # Configuration
│   │   ├── file_manager.py    # File I/O
│   │   ├── image_processing.py # Preprocessing & detection
│   │   ├── ocr.py             # OCR extraction
│   │   ├── pdf.py             # Direct PDF extraction
│   │   └── extractor.py       # Main orchestrator
│   └── scripts/
│       └── extract_tables.py  # Main CLI
└── tests/
    ├── create_simple_test_images.py  # Test image generator
    ├── test_coordinate_parsing.py    # Column detection tests
    ├── test_ocr_direct.py            # OCR mode tests
    └── test_pipeline_exact.py        # Integration tests
```

## Testing

### Generate Test Tables

```bash
make ocr-test
# or
python /app/tests/create_simple_test_images.py
```

Creates sample tables in `shared/sources/`:
- `test_sample_table.png` - Materials properties (4 columns)
- `test_composition_table.png` - Composition data (5 columns)

### Run Tests

```bash
# Process a test file
python /app/src/scripts/extract_tables.py --file test_sample_table.png

# Check the output
ls -lh shared/processed/
cat shared/processed/test_sample_table_table_1_*.csv

# Run unit tests
python /app/tests/test_coordinate_parsing.py
python /app/tests/test_ocr_direct.py
```

## Troubleshooting

### No Tables Detected

1. Check image quality (clear, readable text)
2. Try different extraction method: `--method ocr` or `--method direct`
3. Increase DPI for better OCR: `--dpi 600`
4. Check logs: `cat shared/processed/ocr_extraction.log`

### Poor OCR Accuracy

1. Use higher DPI: `--dpi 600`
2. Ensure correct language: `--lang deu` (for German, etc.)
3. Preprocess image manually to enhance contrast
4. Verify Tesseract installation: `tesseract --version`

### Container Issues

```bash
# Restart Python container
make restart

# Check logs
docker logs thermal-python

# Enter container for debugging
make ocr-shell
```

## Dependencies

### System Packages
- tesseract-ocr (OCR engine)
- poppler-utils (PDF conversion)
- ghostscript (PDF processing)
- default-jre-headless (for tabula-py)
- Various image libraries

### Python Packages
- pytesseract (OCR wrapper)
- pdf2image (PDF to image conversion)
- Pillow (image processing)
- opencv-python (computer vision)
- pandas (data manipulation)
- numpy (numerical operations)
- tabula-py (optional: direct PDF extraction)
- camelot-py (optional: advanced PDF extraction)

## Advanced Usage

### Programmatic Use

```python
from pathlib import Path
from ocr.config import ExtractionConfig
from ocr.extractor import TableExtractor

# Create configuration
config = ExtractionConfig(
    sources_dir=Path("/app/shared/sources"),
    processed_dir=Path("/app/shared/processed"),
    ocr_lang="eng",
    dpi=300
)

# Create extractor
extractor = TableExtractor(config)

# Process a file
file_path = Path("/app/shared/sources/document.pdf")
saved_files = extractor.process_file(file_path, method='auto')

# Check results
for file in saved_files:
    print(f"Saved: {file}")
```

### Custom Configuration

```python
from ocr.config import ExtractionConfig

config = ExtractionConfig(
    dpi=600,                    # Higher quality
    ocr_lang="deu",             # German language
    min_table_area=5000,        # Smaller minimum table size
    line_kernel_horizontal=(60, 1),  # Adjust line detection
    line_kernel_vertical=(1, 60)
)
```

## Logs

Extraction logs are written to: `shared/processed/ocr_extraction.log`

Log format:
```
2026-02-09 10:30:15 - ocr.extractor - INFO - Processing PDF: document.pdf
2026-02-09 10:30:16 - ocr.pdf - INFO - Tabula found 3 table(s)
2026-02-09 10:30:17 - ocr.file_manager - INFO - Saved: document_table_1.csv
```

## Performance Notes

- **Large PDFs**: Processing time increases with page count (each page → image)
- **Image Size**: Very large images may require more memory
- **OCR vs Direct**: Direct extraction is 10-100x faster for digital PDFs
- **Batch Processing**: For multiple files, use a shell loop or Python script

## Support

- Check logs: `shared/processed/ocr_extraction.log`
- Container shell: `make ocr-shell`
- Restart services: `make restart`
- Rebuild container: `docker-compose build python`

