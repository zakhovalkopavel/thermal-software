# OCR Scripts Documentation

**Last Updated:** February 10, 2026

---

## 📁 Available Scripts

### 1. `interactive_extraction.py` - Interactive Review Mode (Recommended)

**Use when:** You need to review and approve regions before OCR

```bash
make ocr-extract-interactive
```

**Workflow:**
1. Converts PDF/image to pages
2. Auto-detects graphics (10%+ page size) and text blocks
3. Opens visual interface with buttons
4. You review, edit, approve regions
5. OCRs only approved regions
6. Saves results with scientific notation

**Features:**
- ✅ Multi-selection (Shift+Click, Ctrl+Click)
- ✅ Resize from any corner (TL, TR, BL, BR)
- ✅ Navigation (Prev/Next, jump to page)
- ✅ Type buttons (T=Table, G=Graphic, X=Text)
- ✅ Auto-detection (graphics + text)
- ✅ Multi-language auto-detection
- ✅ Scientific notation (Na₂O, Al₂O₃, etc.)

**Controls:**
- **Mouse:** Click+Drag=Draw, Drag corner=Resize, Shift+Click=Multi-select
- **Buttons:** < Prev, Next >, T, G, X, Delete, Quit
- **Keys:** P=Prev, N=Next, T=Table, G=Graphic, X=Text, D=Delete, Q=Quit

**Output:**
```
processed/document_YYYYMMDD_HHMMSS/
├── document.json
├── tables/page_001_table_001.csv
└── graphics/page_002_graphic_001.png
```

---

### 2. `extract_document.py` - Automatic Mode

**Use when:** Batch processing or when manual review isn't needed

```bash
make ocr-extract-auto FILE="document.pdf"
```

**Workflow:**
1. Converts PDF/image
2. Auto-detects all regions
3. OCRs everything automatically
4. Saves results

**Features:**
- ✅ Fully automatic
- ✅ Multi-language detection
- ✅ Graphics extraction
- ✅ Table detection
- ✅ Scientific notation
- ✅ No human intervention

**Options:**
```bash
# With specific options
docker-compose exec python python /app/src/scripts/extract_document.py \
  --auto-detect-lang \
  --extract-graphics \
  --scientific \
  "/app/shared/sources/document.pdf"
```

**Output:** Same format as interactive mode

---

## 🎯 Which Mode to Use?

| Scenario | Use |
|----------|-----|
| **Complex tables** | Interactive |
| **Need accuracy** | Interactive |
| **Mix of content types** | Interactive |
| **Want to verify detections** | Interactive |
| **Simple documents** | Auto |
| **Batch processing** | Auto |
| **Scripting/automation** | Auto |
| **Speed priority** | Auto |

---

## 📊 Output Format

Both scripts produce identical output structure:

### document.json
```json
{
  "metadata": {
    "source_file": "document.pdf",
    "total_pages": 4,
    "extraction_date": "2026-02-10T...",
    "summary": {
      "graphics": 3,
      "tables": 8,
      "text_blocks": 4
    }
  },
  "pages": [
    {
      "page_number": 1,
      "content_sequence": [
        {
          "type": "table",
          "index": 1,
          "position": {"x": 100, "y": 200, "width": 600, "height": 300},
          "file": "tables/page_001_table_001.csv",
          "text": "..."
        },
        {
          "type": "graphic",
          "index": 1,
          "position": {"x": 100, "y": 600, "width": 500, "height": 400},
          "file": "graphics/page_001_graphic_001.png"
        }
      ]
    }
  ]
}
```

### Table CSV Format
Tab-separated values with proper column alignment:
```csv
Nr	SiO₂	Al₂O₃	Na₂O	K₂O	calc	ΔT
1	77.02	0.19	12.03	0.13	1503.7	5.3
2	66.65	8.26	10.78	2.25	1535.0	2.4
```

---

## 🔧 Technical Details

### Language Detection
- Auto-detects from first page
- Tries: eng, fra, deu, ces, pol, ukr, rus, jpn, chi_sim
- Selects top 3 languages
- Builds combined string (e.g., "eng+ces+pol")

### Graphics Detection
- Minimum size: 10% page width × 10% page height
- Edge density analysis
- Saves as PNG in graphics/ folder

### Text Block Detection
- Uses Tesseract block_num for paragraphs
- Minimum size: 150×60 pixels
- Aspect ratio > 1.5 (horizontal text)
- Confidence > 50
- 20px margin from graphics

### Table Structure Preservation
- Vertical clustering: rows (15px threshold)
- Horizontal clustering: columns (30px threshold)
- Grid alignment
- Tab-separated output

### Scientific Notation
Automatically converts OCR errors:
- NazO → Na₂O
- AlzOs → Al₂O₃
- KzO → K₂O
- logy → log η

---

## 🧪 Testing

### Test Table Structure
```bash
docker-compose exec python python /app/tests/test_table_structure.py
```

### Test Display
```bash
docker-compose exec python python /app/tests/test_display.py
```

---

## 🐛 Troubleshooting

### Display doesn't work
```bash
# Check DISPLAY
echo $DISPLAY

# Allow X11
xhost +local:docker

# Restart container
docker-compose restart python
```

### Wrong table columns
- Adjust column threshold in code (default: 30px)
- Draw tighter box around table
- Try higher confidence threshold

### Missing text blocks
- Lower confidence threshold (default: 50)
- Check if blocks overlap graphics
- Adjust minimum size (default: 150×60)

---

## 📝 Quick Reference

**Interactive extraction:**
```bash
make ocr-extract-interactive
```

**Auto extraction:**
```bash
make ocr-extract-auto FILE="doc.pdf"
```

**Output location:**
```
shared/processed/document_YYYYMMDD_HHMMSS/
```

**See also:**
- `python/src/ocr/` - Core OCR modules
- `docs/algorithms/` - Algorithm details

