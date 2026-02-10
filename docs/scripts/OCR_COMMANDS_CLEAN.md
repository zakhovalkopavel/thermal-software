# OCR Commands - Final Clean Version

**Date:** February 10, 2026  
**Status:** ✅ CLEANED AND ORGANIZED

---

## 🎯 Main Commands (Only 2!)

### 1. Interactive Mode (Recommended) ⭐
```bash
make ocr-extract-interactive
```

**What it does:**
- Shows clean file list (only PDF, PNG, JPG, JPEG, TIF, TIFF)
- Auto-detects graphics (10%+ page size) and text blocks
- Opens visual review interface with buttons
- You approve/edit/delete regions
- OCRs only approved regions
- Saves in standard format

**When to use:**
- Documents needing review
- Complex layouts
- When accuracy matters

---

### 2. Automatic Mode
```bash
make ocr-extract-auto FILE="document.pdf"
```

**What it does:**
- Full automatic extraction
- Multi-language auto-detection
- Graphics extraction
- Scientific notation processing
- Table detection
- No human review

**When to use:**
- Batch processing
- Scripts/automation
- Simple documents
- When speed matters

---

## 🧪 Test Commands

```bash
make ocr-test-all          # Run all OCR tests
make ocr-test-scientific   # Test scientific notation
make ocr-test-chart        # Test chart detection
make ocr-test-opencv       # Test OpenCV functions
make ocr-test-images       # Analyze test images
```

---

## 📋 What Was Cleaned

### File Selection Fixed
**Before:**
```
Select file:
1. .gitignore
2. .gitkeep
3. document.pdf
4. README.md
```

**After:**
```
Select file:
1. chart_from_page_2.png
2. document.pdf
3. table_from_page_1.png
```

**Only shows:** PDF, PNG, JPG, JPEG, TIF, TIFF

---

### Command Structure Simplified

**Before (messy):**
- ocr-extract-doc
- ocr-extract-doc-simple
- ocr-extract-doc-interactive
- ocr-extract-doc-help
- ocr-review-interactive
- ocr-review-visual
- ocr-extract-interactive

**After (clean):**
- `ocr-extract-interactive` - Main interactive mode
- `ocr-extract-auto` - Main automatic mode
- Test commands (ocr-test-*)

**Old commands kept for compatibility:**
- ocr-review-interactive (for old extractions)
- ocr-review-visual (for old extractions)
- ocr-extract, ocr-test (legacy)

---

## 🎯 Comparison

| Feature | Interactive | Automatic |
|---------|-------------|-----------|
| **Review** | Yes (before OCR) | No |
| **Auto-detect** | Yes (10% graphics, text blocks) | Yes |
| **Buttons** | Yes | N/A |
| **File select** | Interactive list | Command line FILE= |
| **Graphics saved** | Yes ✅ | Yes ✅ |
| **Output format** | Standard | Standard |
| **Scientific notation** | Yes | Yes |
| **Multi-language** | Yes | Yes |
| **Speed** | Slower (human review) | Fast |
| **Accuracy** | Highest | Good |

---

## 📁 Output Format (Both Modes)

```
shared/processed/document_YYYYMMDD_HHMMSS/
├── document.json
├── tables/
│   ├── page_001_table_001.csv
│   └── page_002_table_001.csv
└── graphics/
    └── page_002_graphic_001.png
```

**Same format for both modes!**

---

## 🚀 Quick Start

### For Most Documents (Interactive)
```bash
make ocr-extract-interactive
# Select file from clean list
# Review and approve regions
# Done!
```

### For Automation (Automatic)
```bash
make ocr-extract-auto FILE="document.pdf"
# Fully automatic
# No interaction needed
```

---

## 💡 Which Mode Should I Use?

### Use Interactive If:
- ✅ Document has complex layout
- ✅ Accuracy is critical
- ✅ You want to verify detections
- ✅ Mixed content (tables, charts, text)
- ✅ Scientific/technical documents

### Use Automatic If:
- ✅ Simple document layout
- ✅ Batch processing many files
- ✅ Need for automation/scripts
- ✅ Speed is priority
- ✅ Good enough accuracy acceptable

---

## 📝 Summary

**Main Commands:**
- `make ocr-extract-interactive` ⭐ Interactive with review
- `make ocr-extract-auto FILE="..."` - Fully automatic

**File Selection:**
- Only images and PDFs (no .gitignore, .gitkeep)
- Formats: PDF, PNG, JPG, JPEG, TIF, TIFF

**Output:**
- Standard format (both modes)
- Graphics saved separately
- Scientific notation applied
- Multi-language support

**Clean and simple - just 2 main commands!** 🎉

