# OCR Language Selection and Verification

**Date:** February 10, 2026  
**Status:** ✅ COMPLETE - Manual and Auto-Detection Support

---

## 📋 Available Options

### 1. Auto-Detection (Default)
Automatically detects languages from the document:
```bash
make ocr-extract-interactive FILE="document.pdf"
# OR
docker-compose exec python python /app/src/scripts/interactive_extraction.py /app/shared/sources/document.pdf
```

**Process:**
1. Loads first page
2. Tests all available Tesseract languages
3. Measures OCR confidence for each
4. Selects top 3 languages (confidence > 30%)
5. Uses them for extraction

---

### 2. Manual Language Selection
Specify exact languages to use:
```bash
docker-compose exec python python /app/src/scripts/interactive_extraction.py \
  /app/shared/sources/document.pdf \
  --lang eng fra deu
```

**Benefits:**
- Faster (no auto-detection)
- Predictable results
- Better for known document language

---

### 3. List Available Languages
See which languages are installed:
```bash
docker-compose exec python python /app/src/scripts/interactive_extraction.py --list-langs
```

**Output:**
```
Available Tesseract languages:
  - chi_tra
  - deu
  - eng
  - fra
  - jpn
  - osd
  - pol
  - rus
  - ukr
```

---

### 4. Disable Auto-Detection
Use only English (or --lang):
```bash
docker-compose exec python python /app/src/scripts/interactive_extraction.py \
  /app/shared/sources/document.pdf \
  --no-auto-detect-lang
```

---

## 🔍 Currently Installed Languages

Based on the Tesseract installation in the Python container:

| Code | Language | Status |
|------|----------|--------|
| `eng` | English | ✅ Installed |
| `fra` | French | ✅ Installed |
| `deu` | German | ✅ Installed |
| `pol` | Polish | ✅ Installed |
| `ukr` | Ukrainian | ✅ Installed |
| `rus` | Russian | ✅ Installed |
| `jpn` | Japanese | ✅ Installed |
| `chi_tra` | Chinese Traditional | ✅ Installed |
| `ces` | Czech | ❌ NOT Installed |
| `chi_sim` | Chinese Simplified | ❌ NOT Installed |

**Note:** The script now auto-detects available languages at runtime, so it won't try to use missing ones.

---

## 📊 Language Detection Process

### Step 1: Query Installed Languages
```python
available_langs = pytesseract.get_languages(config='')
# Returns: ['chi_tra', 'deu', 'eng', 'fra', 'jpn', 'osd', 'pol', 'rus', 'ukr']
```

### Step 2: Test Each Language
For each language:
```python
data = pytesseract.image_to_data(image, lang=lang)
avg_confidence = calculate_average_confidence(data)
```

### Step 3: Rank by Confidence
```python
sorted_langs = sorted(confidences, key=confidence, reverse=True)
# Example: [('eng', 85.3), ('fra', 42.1), ('deu', 38.7), ...]
```

### Step 4: Select Top Languages
```python
detected = [lang for lang, conf in sorted_langs if conf >= 30.0][:3]
# Returns top 3 with confidence > 30%
```

### Step 5: Build Language String
```python
lang_string = '+'.join(detected)
# Example: "eng+fra+deu"
```

---

## 🎯 Usage Examples

### Example 1: English Document
```bash
# Let it auto-detect (will find 'eng')
make ocr-extract-interactive FILE="english_report.pdf"

# Or specify manually for speed
docker-compose exec python python /app/src/scripts/interactive_extraction.py \
  /app/shared/sources/english_report.pdf \
  --lang eng
```

**Log output:**
```
INFO: Available Tesseract languages: chi_tra, deu, eng, fra, jpn, pol, rus, ukr
INFO: Tesseract reports 8 languages installed
INFO: Auto-detecting languages...
INFO: Testing 8 languages for detection...
INFO: Language 'eng': 85.30% confidence
INFO: Detected languages: eng
INFO: Built language string: eng
INFO: Using detected languages: eng
```

---

### Example 2: Multi-Language Document (French + German)
```bash
# Auto-detect
docker-compose exec python python /app/src/scripts/interactive_extraction.py \
  /app/shared/sources/multilingual.pdf

# Or specify manually
docker-compose exec python python /app/src/scripts/interactive_extraction.py \
  /app/shared/sources/multilingual.pdf \
  --lang fra deu
```

**Log output (manual):**
```
INFO: Using manually specified languages: fra, deu
INFO: Using pre-configured languages: fra+deu
```

---

### Example 3: Scientific Document (English + Special Symbols)
```bash
# English with scientific notation processor
docker-compose exec python python /app/src/scripts/interactive_extraction.py \
  /app/shared/sources/scientific.pdf \
  --lang eng
```

**Result:** OCR'd as English, then scientific notation processor fixes:
- Na2O → Na₂O
- Al2O3 → Al₂O₃
- log n → log η

---

### Example 4: Check Available Languages First
```bash
# 1. List available
docker-compose exec python python /app/src/scripts/interactive_extraction.py --list-langs

# 2. Use specific ones
docker-compose exec python python /app/src/scripts/interactive_extraction.py \
  /app/shared/sources/document.pdf \
  --lang eng pol ukr
```

---

## 🔧 Command-Line Arguments

### Full Syntax
```bash
python interactive_extraction.py <file> [OPTIONS]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--lang LANG [LANG ...]` | Specify language(s) manually | `--lang eng fra deu` |
| `--list-langs` | List available languages and exit | `--list-langs` |
| `--auto-detect-lang` | Enable auto-detection (default) | `--auto-detect-lang` |
| `--no-auto-detect-lang` | Disable auto-detection | `--no-auto-detect-lang` |
| `--dpi DPI` | DPI for PDF conversion | `--dpi 300` |

---

## 📝 Logging Output

### With Auto-Detection
```
INFO: Available Tesseract languages: chi_tra, deu, eng, fra, jpn, pol, rus, ukr
INFO: Tesseract reports 8 languages installed
INFO: Language detector initialized with: chi_tra, deu, eng, fra, jpn, pol, rus, ukr
INFO: Auto-detecting languages...
INFO: Starting language detection (max_langs=3)
INFO: Testing 8 languages for detection...
DEBUG: Testing language: chi_tra
DEBUG: Language 'chi_tra': 12.45% confidence
DEBUG: Testing language: deu
DEBUG: Language 'deu': 38.72% confidence
DEBUG: Testing language: eng
DEBUG: Language 'eng': 85.30% confidence
DEBUG: Testing language: fra
DEBUG: Language 'fra': 42.18% confidence
...
INFO: Detected languages: eng, fra, deu
INFO: Built language string: eng+fra+deu
INFO: Using detected languages: eng+fra+deu
```

### With Manual Selection
```
INFO: Available Tesseract languages: chi_tra, deu, eng, fra, jpn, pol, rus, ukr
INFO: Tesseract reports 8 languages installed
INFO: Using manually specified languages: eng, fra
INFO: Using pre-configured languages: eng+fra
```

---

## 💡 Recommendations

### For Best Results

**1. Known Language → Manual Selection**
```bash
--lang eng  # Faster, no auto-detection overhead
```

**2. Unknown/Mixed Languages → Auto-Detection**
```bash
# Default behavior, no flags needed
```

**3. Bordered Tables with Noise → Limit Languages**
```bash
--lang eng fra deu  # Avoid jpn, chi_tra if not needed
```
Reason: Asian languages can misread table borders as characters (|, 一, ー, etc.)

**4. Scientific Documents → English + Processor**
```bash
--lang eng  # Scientific notation processor handles subscripts/superscripts
```

---

## 🐛 Troubleshooting

### Issue: "Language not found" Error
**Cause:** Trying to use language not installed

**Solution:**
```bash
# 1. List available languages
docker-compose exec python python /app/src/scripts/interactive_extraction.py --list-langs

# 2. Use only installed ones
--lang eng fra deu  # NOT --lang ces (not installed)
```

---

### Issue: Table Borders Detected as Characters (|, 一, パ)
**Cause:** Japanese/Chinese languages enabled

**Solutions:**

**Option 1:** Exclude Asian languages if not needed
```bash
--lang eng fra deu pol ukr rus  # No jpn, chi_tra
```

**Option 2:** Use border noise filtering (already implemented)
- Confidence threshold: 40 (filters low-quality border detections)
- Noise character set: filters |, 一, ー, パ, etc.

---

### Issue: Wrong Language Detected
**Cause:** Auto-detection picks wrong language

**Solution:** Specify manually
```bash
--lang eng fra  # Instead of letting it auto-detect
```

---

## 📊 Summary

**Language Selection Methods:**
1. ✅ **Auto-detection** (default) - Analyzes document, selects top 3 languages
2. ✅ **Manual selection** (`--lang`) - Specify exact languages to use
3. ✅ **List languages** (`--list-langs`) - See what's available
4. ✅ **Disable auto** (`--no-auto-detect-lang`) - Use only default or manual

**Installed Languages:**
- ✅ 8 languages available: eng, fra, deu, pol, ukr, rus, jpn, chi_tra
- ❌ 2 languages NOT available: ces, chi_sim

**Runtime Verification:**
- ✅ Script queries Tesseract for installed languages
- ✅ Logs show available languages
- ✅ Logs show selected/detected languages
- ✅ Logs show language detection confidence

**All working!** 🎉

