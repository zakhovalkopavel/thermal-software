# Python Container - OCR & Data Processing

Run Python scripts and OCR extraction inside Docker → No Python installation on host required.

**Python container is ready!**

---

## Rules for Python Development

1. **NO Python on Host**
   - ✅ `docker-compose exec python python /app/src/scripts/script.py`
   - ❌ `python script.py` on host

2. **All Outputs to Reports/Shared**
   - ✅ Save OCR results to `shared/processed/`
   - ✅ Save reports to `tmp/reports/python/`
   - ❌ Save to random locations

3. **Use Environment Variables**
   - ✅ Use `os.getenv('DB_HOST')`
   - ❌ Hardcode database credentials

4. **Test Your Code**
   - Run tests in `python/tests/`
   - Test OCR extraction with sample data
   - Use `make ocr-test` to generate test images

---

## Python Container Configuration

### Service Details
- **Container Name:** `thermal-python`
- **Image:** `python:3.14.3-slim`
- **Working Directory:** `/app`
- **Package Manager:** Poetry
- **Command:** `tail -f /dev/null` (keeps container running)

### Volumes Mounted
```
./python/src         → /app/src              (Source code - OCR package & scripts)
./python/tests       → /app/tests            (Test files)
./shared             → /app/shared           (OCR input/output)
./tmp/reports/python → /app/reports          (Script reports)
python_packages      → /usr/local/lib/...    (Poetry packages)
```

### Environment Variables

The Python container has access to database credentials:

```bash
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=thermal
DB_PASSWORD=<from .env>
DB_DATABASE=thermal
```

Use in Python:

```python
import os
import psycopg2

conn = psycopg2.connect(
    host=os.getenv('DB_HOST', 'postgres'),
    port=os.getenv('DB_PORT', '5432'),
    user=os.getenv('DB_USERNAME', 'thermal-soft'),
    password=os.getenv('DB_PASSWORD'),
    dbname=os.getenv('DB_DATABASE', 'refractory')
)
```

---

## Directory Structure

```
python/
├── pyproject.toml               # Poetry dependencies
├── poetry.lock                  # Locked dependencies
├── README.md                    # Main documentation
├── src/                         # Source code
│   ├── ocr/                     # OCR extraction package
│   │   ├── config.py
│   │   ├── extractor.py
│   │   ├── ocr.py
│   │   ├── pdf.py
│   │   ├── file_manager.py
│   │   ├── image_processing.py
│   │   └── README.md
│   └── scripts/                 # Production scripts
│       ├── extract_tables.py    # Main OCR script
│       └── README.md
└── tests/                       # Test files
    ├── create_simple_test_images.py
    ├── test_coordinate_parsing.py
    ├── test_ocr_direct.py
    └── test_pipeline_exact.py

shared/
├── sources/                     # OCR input files
│   ├── .gitkeep
│   └── test_*.png              (test images)
└── processed/                   # OCR output files
    ├── .gitkeep
    └── *.csv                   (extracted tables)

tmp/reports/python/              # Script outputs
├── .gitkeep
└── *.log                       (gitignored)
```

---

## Usage

### Access Python Container

```bash
# Access shell
docker-compose exec python bash

# Inside container
python --version  # 3.14
poetry --version
```

### Run OCR Table Extraction

```bash
# Generate test data
make ocr-test

# Run extraction (interactive)
make ocr-extract

# Process specific file
docker-compose exec python python /app/src/scripts/extract_tables.py --file document.pdf

# Save output to log
docker-compose exec python python /app/src/scripts/extract_tables.py --file doc.pdf \
  > tmp/reports/python/extraction-$(date +%Y%m%d).log
```

### Install/Update Dependencies

**Note:** Use Poetry for dependency management.

```bash
# Access container
docker-compose exec python bash

# Install new package
poetry add requests

# Install dev dependencies
poetry add --group dev pytest

# Update all dependencies
poetry update

# Copy updated lock file to host
exit
docker cp thermal-python:/app/poetry.lock ./python/poetry.lock
```

---

## Common Tasks

### OCR Table Extraction

```bash
# Generate test images
make ocr-test

# Extract tables from image
docker-compose exec python python /app/src/scripts/extract_tables.py \
  --file test_sample_table.png

# Extract from PDF with OCR
docker-compose exec python python /app/src/scripts/extract_tables.py \
  --file scanned.pdf --method ocr

# Check results
ls -lh shared/processed/
cat shared/processed/test_sample_table_table_1_*.csv
```

### Data Processing Scripts

```bash
# Run custom data processing script
docker-compose exec python python /app/src/scripts/your_script.py \
  > tmp/reports/python/processing-$(date +%Y%m%d).log

# With arguments
docker-compose exec python python /app/src/scripts/script.py \
  --input data.csv --output results.csv
```

### Database Operations

```bash
# Run database enrichment
docker-compose exec python python /app/src/scripts/enrich_database.py \
  > tmp/reports/python/enrichment-$(date +%Y%m%d).log

# Fetch external data
docker-compose exec python python /app/src/scripts/fetch_data.py \
  > tmp/reports/python/fetch-$(date +%Y%m%d).log
```

---

## Testing Python Scripts

### Run Tests

```bash
# From host
docker-compose exec python python /app/tests/test_coordinate_parsing.py
docker-compose exec python python /app/tests/test_ocr_direct.py

# Inside container
docker-compose exec python bash
cd /app/tests
python test_coordinate_parsing.py

# View test outputs
cat /app/shared/processed/coordinate_test.txt
```

### Generate Test Data

```bash
# Create test table images
docker-compose exec python python /app/tests/create_simple_test_images.py

# Verify test images created
ls -lh shared/sources/test_*.png
```

---

## Advantages of Docker Python

✅ **No Python on Host**
- Consistent Python 3.14 across team
- No virtual environment needed on host
- No pip install conflicts

✅ **Isolated Environment**
- Packages in Docker volume
- Clean separation from host system

✅ **Access to Database**
- Same network as backend/database
- Can connect to PostgreSQL directly

✅ **OCR Capabilities**
- Tesseract OCR pre-installed
- Image processing libraries (Pillow, opencv-python-headless)
- PDF processing (pdf2image, tabula-py)

✅ **Reports Management**
- All outputs go to `shared/processed/` or `tmp/reports/python/`
- Automatically gitignored
- Consistent with project structure

---

## Troubleshooting

### Python container not starting

```bash
# Check logs
docker-compose logs python

# Check status
docker-compose ps python

# Restart
docker-compose restart python
```

### Package installation fails

```bash
# Install build dependencies (if needed)
docker-compose exec python apt-get update
docker-compose exec python apt-get install -y build-essential

# Try poetry install again
docker-compose exec python poetry install
```

### Can't connect to database

```bash
# Check database is healthy
docker-compose ps postgres

# Test connection
docker-compose exec python python -c "
import psycopg2
import os
conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    user=os.getenv('DB_USERNAME'),
    password=os.getenv('DB_PASSWORD'),
    dbname=os.getenv('DB_DATABASE')
)
print('✅ Connected!')
conn.close()
"
```

### OCR not working

```bash
# Check Tesseract installation
docker-compose exec python tesseract --version

# Test OCR import
docker-compose exec python python -c "import pytesseract; print('OK')"

# Check test images exist
ls -lh shared/sources/test_*.png

# Regenerate test images
make ocr-test
```

### Import errors

```bash
# Verify PYTHONPATH
docker-compose exec python python -c "import sys; print(sys.path)"

# Test imports
docker-compose exec python python -c "from ocr.config import ExtractionConfig; print('OK')"
```

---

## Package Structure

The Python environment includes:

**OCR & Image Processing:**
- pytesseract (OCR)
- pdf2image (PDF to image)
- Pillow (image processing)
- opencv-python-headless (computer vision)
- tabula-py (PDF table extraction)

**Data & Scientific:**
- pandas (data manipulation)
- numpy (numerical operations)
- scipy (scientific computing)

**Database:**
- psycopg2-binary (PostgreSQL)
- sqlalchemy (ORM)

**Development:**
- poetry (dependency management)
- pytest (testing framework)
- black (code formatting)
- isort (import sorting)

See `python/pyproject.toml` for complete dependency list.

---

## Quick Reference

### Most Common Commands

```bash
# OCR extraction
make ocr-test                    # Generate test images
make ocr-extract                 # Run extraction (interactive)
make python-bash                 # Enter container

# Inside container
python /app/src/scripts/extract_tables.py --file image.png
python /app/tests/test_coordinate_parsing.py
poetry add package-name

# View outputs
ls -lh shared/processed/         # OCR results
cat shared/processed/*.csv       # View CSV
cat tmp/reports/python/*.log     # View logs
```

---

**Version:** Python 3.14.3-slim  
**Last Updated:** February 9, 2026  
**Package Manager:** Poetry 2.3.2  



```
