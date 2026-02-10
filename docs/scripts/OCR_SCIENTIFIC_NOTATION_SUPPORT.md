# Scientific Notation Support - Implementation Complete

**Date:** February 9, 2026  
**Status:** ✅ IMPLEMENTED

## Overview

Added comprehensive support for scientific notation, special characters, and Unicode symbols commonly found in scientific documents (chemistry, physics, materials science).

## Problem

Tesseract OCR outputs plain ASCII text and doesn't preserve:
- Subscripts: Al₂O₃ → "Al2O3"
- Superscripts: (B₂O₃)² → "(B2O3)^2"
- Greek letters: η → "eta" or "n"
- Special symbols: σ → "sigma", ° → missing, − → "-"

This makes the CSV output less useful for scientific data.

## Solution: ScientificOCRProcessor

Created a post-processing module that converts ASCII OCR output to proper Unicode scientific notation.

### File Created

**`python/src/ocr/scientific_ocr_processor.py`** (200+ lines)

### Features Implemented

#### 1. Chemical Formula Processing ✅

**Handles:**
- Al₂O₃, Na₂O, K₂O, Li₂O, B₂O₃, SiO₂
- Automatic subscript conversion for common oxides
- Pattern matching for chemical compositions

**Example:**
```python
"Al2O3" → "Al₂O₃"
"B2O3" → "B₂O₃"
```

#### 2. Superscript Conversion ✅

**Handles:**
- Powers: ^2 → ²,  ^3 → ³
- Complex patterns: (B2O3)^2 → (B₂O₃)²

**Example:**
```python
"(B2O3)^2" → "(B₂O₃)²"
```

#### 3. Greek Letter Recognition ✅

**Handles:**
- η (eta) - viscosity symbol
- σ (sigma) - standard deviation
- Δ (Delta) - delta/difference

**Patterns:**
```python
"log eta" → "log η"
"log n" → "log η"  # Common OCR mistake
"sigma" → "σ"
"Delta T" → "ΔT"
```

#### 4. Subscript Numbers ✅

**Handles:**
- T₀, ηᵢ and other subscripted variables
- Common OCR mistakes: "T0" → "T₀", "To" → "T₀"

#### 5. Special Symbols ✅

**Handles:**
- Degree Celsius: °C
- Minus sign: − (proper Unicode, not hyphen)
- Plus/minus in tables

**Example:**
```python
"4.63C" → "4.63°C"
"-12.65" → "−12.65"  # Proper minus sign
```

## Integration

### Modified Files

1. ✅ **`extractor.py`**
   - Imports `ScientificOCRProcessor`
   - Initializes in `__init__`
   - Calls `process_table_data(df)` before saving CSV

2. ✅ **`__init__.py`**
   - Exports `ScientificOCRProcessor`

3. ✅ **`config.py`**
   - Updated Tesseract config for scientific mode
   - Added flags: `load_system_dawg=0`, `load_freq_dawg=0`

### Usage in Code

```python
# In extractor.py _extract_tables()
if not df.empty and len(df) > 0:
    # Apply scientific notation processing
    self.scientific_processor.process_table_data(df)
    
    # Save CSV with proper Unicode
    df.to_csv(csv_path, index=False, encoding='utf-8')
```

## Test Results

```
Testing Chemical Formulas:
✓ Al2O3           → Al₂O₃
✓ Na2O            → Na₂O
✓ K2O             → K₂O
✓ B2O3            → B₂O₃
✓ (B2O3)^2        → (B₂O₃)²

Testing Greek Letters:
✓ log eta 2.0     → log η 2.0
✓ log n 4.0       → log η 4.0
✓ sigma = 4.63C   → σ = 4.63°C
✓ DT              → ΔT

Testing Subscripts/Superscripts:
✓ T0              → T₀
✓ To              → T₀
✓ eta i           → ηᵢ

Testing Full Table Row:
Input:    Al2O3,+8.32,+5.23,+4.01
Output:   Al₂O₃,+8.32,+5.23,+4.01
✓ PASS
```

## Supported Conversions

### Complete List

| OCR Output | Converted To | Description |
|------------|--------------|-------------|
| Al2O3 | Al₂O₃ | Aluminum oxide |
| Na2O | Na₂O | Sodium oxide |
| K2O | K₂O | Potassium oxide |
| Li2O | Li₂O | Lithium oxide |
| B2O3 | B₂O₃ | Boron oxide |
| SiO2 | SiO₂ | Silicon oxide |
| (B2O3)^2 | (B₂O₃)² | Squared term |
| ^2, ^3 | ², ³ | Superscripts |
| eta, log n | η | Greek eta |
| sigma | σ | Greek sigma |
| Delta T, DT, dT | ΔT | Delta T |
| T0, To | T₀ | T subscript zero |
| eta i | ηᵢ | eta subscript i |
| [number]C | [number]°C | Degrees Celsius |
| deg C | °C | Degrees |
| - (hyphen) | − (minus) | Proper minus sign |

## Expected Output Examples

### Table from Page 1
**Before:**
```csv
,log eta 2.0,log eta 4.0,log eta 6.0
Constant,1847.8,1249.7,962.9
Al2O3,+8.32,+5.23,+4.01
B2O3,-21.62,-11.97,-6.42
(B2O3)^2,+0.5122,+0.3182,+0.1900
```

**After:**
```csv
,log η 2.0,log η 4.0,log η 6.0
Constant,1847.8,1249.7,962.9
Al₂O₃,+8.32,+5.23,+4.01
B₂O₃,−21.62,−11.97,−6.42
(B₂O₃)²,+0.5122,+0.3182,+0.1900
```

### Table from Page 2
**Before:**
```csv
,B,A,T0
Constant,6237.013,1.713,149.4
Al2O3,+15.21,-0.0087,+1.40
Na2O,-66.01,-0.0162,+0.50
```

**After:**
```csv
,B,A,T₀
Constant,6237.013,1.713,149.4
Al₂O₃,+15.21,−0.0087,+1.40
Na₂O,−66.01,−0.0162,+0.50
```

### Small Table from Page 2
**Before:**
```csv
at log n,2.0,sigma = 4.63C
at log n,4.0,sigma = 3.34C
at log n,6.0,sigma = 3.14C
```

**After:**
```csv
at log η,2.0,σ = 4.63°C
at log η,4.0,σ = 3.34°C
at log η,6.0,σ = 3.14°C
```

## Configuration

### Tesseract Scientific Mode

```python
TESSERACT_CONFIGS = {
    'scientific': '--psm 6 --oem 3 -c preserve_interword_spaces=1 -c load_system_dawg=0 -c load_freq_dawg=0'
}
```

**Flags explained:**
- `--psm 6` - Uniform block of text (good for tables)
- `--oem 3` - LSTM neural net mode (best accuracy)
- `preserve_interword_spaces=1` - Keep spacing in formulas
- `load_system_dawg=0` - Disable dictionary (allows non-words)
- `load_freq_dawg=0` - Disable frequency dictionary

## Limitations

1. **OCR Quality** - Still depends on input image quality
2. **Unknown Formulas** - Only processes known chemical formulas
3. **Context-Dependent** - Some conversions may be overly aggressive
4. **Language-Specific** - Optimized for chemistry/materials science

## Future Enhancements

Potential improvements:
1. Add more chemical formulas
2. Support for more Greek letters (α, β, γ, etc.)
3. Detect formula patterns automatically
4. Machine learning for special character recognition
5. User-configurable formula dictionary

## Testing

### Test Script
```bash
docker-compose exec python python /app/tests/test_scientific_processor.py
```

### Integration Test
```bash
# Run extraction on scientific PDF
make ocr-extract-doc FILE="Viscosity-temperature relations in glasses (Lakatos 1976).pdf"

# Check CSV output
cat "shared/processed/.../tables/page_001_table_001.csv"
```

## Files Modified

1. ✅ `python/src/ocr/scientific_ocr_processor.py` - NEW (200 lines)
2. ✅ `python/src/ocr/extractor.py` - Integration
3. ✅ `python/src/ocr/__init__.py` - Exports
4. ✅ `python/src/ocr/config.py` - Tesseract config
5. ✅ `python/tests/test_scientific_processor.py` - NEW (130 lines)

---

## ✅ COMPLETE AND TESTED

**The CSV files will now contain proper scientific notation with Unicode subscripts, superscripts, and special characters!**

**Test it:**
```bash
make ocr-extract-doc-interactive
```

Check the CSV files in `shared/processed/<document>/tables/` - they should now have proper Unicode characters.

