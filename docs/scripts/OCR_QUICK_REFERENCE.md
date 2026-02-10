# OCR Document Extraction - Quick Reference

## Makefile Commands

### 🚀 Quick Start

```bash
# 1. Interactive mode (RECOMMENDED - easiest way)
make ocr-extract-doc-interactive

# 2. Extract specific document (all features)
make ocr-extract-doc FILE=your_document.pdf

# 3. Test the extraction system
make ocr-test-doc
```

### 📋 All Commands

| Command | Description | Example |
|---------|-------------|---------|
| **Extraction Commands** |||
| `make ocr-extract-doc-interactive` | **Interactive mode** - select file from list, all features enabled | `make ocr-extract-doc-interactive` |
| `make ocr-extract-doc FILE=<file>` | **Full extraction** with multi-language, graphics, scientific mode | `make ocr-extract-doc FILE=report.pdf` |
| `make ocr-extract-doc-simple FILE=<file>` | **Simple extraction** (English only, no graphics) | `make ocr-extract-doc-simple FILE=doc.pdf` |
| `make ocr-extract-doc-help` | Show all available options and help | `make ocr-extract-doc-help` |
| **Test Commands** |||
| `make ocr-test-all` | **Run ALL OCR tests** (comprehensive test suite) | `make ocr-test-all` |
| `make ocr-test-scientific` | Test scientific notation processing (71 tests) | `make ocr-test-scientific` |
| `make ocr-test-chart` | Test chart detection & table header filtering | `make ocr-test-chart` |
| `make ocr-test-opencv` | Verify OpenCV functions (10 tests) | `make ocr-test-opencv` |
| `make ocr-test-images` | Analyze Lakatos cropped images (diagnostic) | `make ocr-test-images` |
| `make ocr-test-doc` | Test document extraction system | `make ocr-test-doc` |
| **Utility Commands** |||
| `make python-bash` | Enter Python container shell | `make python-bash` |

### 📁 File Location

- **Input files**: Place in `/opt/thermal-software/shared/sources/`
- **Output files**: Generated in `/opt/thermal-software/shared/processed/<document_name>/`

### 🎯 Features Included

**`make ocr-extract-doc-interactive`** (RECOMMENDED):
- ✅ Interactive file selection from list
- ✅ Auto-detect up to 3 languages
- ✅ Extract graphics/charts to PNG files
- ✅ Scientific mode (better for formulas)
- ✅ Generate document.json with all content
- ✅ Export tables to CSV files

**`make ocr-extract-doc`** includes:
- ✅ Auto-detect up to 3 languages
- ✅ Extract graphics/charts to PNG files
- ✅ Scientific mode (better for formulas)
- ✅ Generate document.json with all content
- ✅ Export tables to CSV files
- ⚠️ Requires FILE= parameter

**`make ocr-extract-doc-simple`** includes:
- ✅ English OCR only
- ✅ Generate document.json
- ✅ Export tables to CSV files
- ❌ No graphics extraction
- ❌ No language detection
- ❌ Standard OCR mode

## Direct Python Command Usage

If you need more control, use the Python script directly:

```bash
# Enter container
make python-bash

# Then run with custom options
python /app/src/scripts/extract_document.py \
    --lang english german \
    --extract-graphics \
    --dpi 400 \
    document.pdf
```

### Available Options

| Option | Description | Default |
|--------|-------------|---------|
| `--lang LANG [LANG ...]` | Specify languages (english, french, german, etc.) | `english` |
| `--auto-detect-lang` | Auto-detect document languages | `False` |
| `--extract-graphics` | Extract graphics to PNG files | `False` |
| `--scientific` | Optimize for formulas and scientific notation | `False` |
| `--dpi N` | DPI for PDF conversion | `300` |
| `--verbose` | Show detailed logging | `False` |

### Language Codes

Supported languages:
- `english`, `french`, `german`, `czech`, `polish`
- `ukrainian`, `russian`, `japanese`, `chinese`

## Output Structure

After running extraction, you'll get:

```
shared/processed/document_name/
├── document.json              # Complete document with all content
├── tables/
│   ├── page_001_table_001.csv
│   └── page_002_table_001.csv
└── graphics/
    ├── page_001_graphic_001.png
    └── page_002_graphic_001.png
```

## Examples

### Example 1: Interactive Mode (Easiest)

```bash
make ocr-extract-doc-interactive
```

This will:
1. List all PDF and image files in `shared/sources/`
2. Let you select a file by number or name
3. Auto-detect languages (e.g., English + German)
4. Extract all graphics (charts, diagrams)
5. Use scientific mode for formulas
6. Create document.json with complete structure

**Output:**
```
Found 3 file(s) in /app/shared/sources:

   1. research_paper.pdf            (2.3MB)
   2. technical_spec.pdf            (1.8MB)
   3. report_2025.pdf               (945.2KB)

Enter file number (or filename, or 'q' to quit): 1
```

### Example 2: Scientific Paper

```bash
make ocr-extract-doc FILE=research_paper.pdf
```

This will:
1. Auto-detect languages (e.g., English + German)
2. Extract all graphics (charts, diagrams)
3. Use scientific mode for formulas
4. Create document.json with complete structure

### Example 3: Simple Text Document

```bash
make ocr-extract-doc-simple FILE=letter.pdf
```

This will:
1. Use English OCR only
2. Skip graphics extraction
3. Create document.json with text and tables

### Example 4: Custom Options

```bash
make python-bash

# Then inside container:
python /app/src/scripts/extract_document.py \
    --lang english french \
    --extract-graphics \
    --scientific \
    --dpi 600 \
    multilingual_technical_spec.pdf
```

## Troubleshooting

### File not found
```bash
# Check file exists
ls -la /opt/thermal-software/shared/sources/

# File must be in sources directory
cp your_file.pdf /opt/thermal-software/shared/sources/
make ocr-extract-doc FILE=your_file.pdf
```

### Container not running
```bash
# Start services
make up

# Then try extraction again
make ocr-extract-doc FILE=document.pdf
```

### Need more details
```bash
# Use help to see all options
make ocr-extract-doc-help

# Or run with verbose mode
make python-bash
python /app/src/scripts/extract_document.py --verbose document.pdf
```

## Legacy Commands

Old table extraction commands still work:

```bash
make ocr-test     # Create test data
make ocr-extract  # Interactive table extraction
```

But new commands are **recommended** for better results!

## Quick Comparison

| Feature | Legacy (`make ocr-extract`) | New (`make ocr-extract-doc`) |
|---------|---------------------------|------------------------------|
| Multi-language | ❌ English only | ✅ Auto-detect or manual |
| Graphics extraction | ❌ No | ✅ Yes |
| Scientific mode | ❌ No | ✅ Yes |
| Output format | Multiple files | ✅ Single document.json + data files |
| Page summaries | ❌ No | ✅ Text + HTML |
| Content sequencing | ❌ No | ✅ Yes (ordered by position) |

---

**💡 Tip**: Start with `make ocr-extract-doc-interactive` - it's the easiest way! Just select a file from the list and it will extract with all features enabled.

