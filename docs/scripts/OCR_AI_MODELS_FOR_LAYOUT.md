# AI Models for Document Layout Detection

**Date:** February 9, 2026  
**Status:** Options Available

## Free AI Models for Layout Analysis

### Option 1: LayoutLMv3 (Microsoft) ✅ RECOMMENDED

**Best for:** Document understanding, table detection, layout analysis

**Advantages:**
- Pre-trained on millions of documents
- Excellent for tables, forms, receipts
- Can detect: tables, figures, text blocks, headers
- Free and open source

**Installation:**
```bash
pip install transformers torch
pip install layoutlmv3
```

**Usage:**
```python
from transformers import LayoutLMv3ForTokenClassification, LayoutLMv3Processor
from PIL import Image

# Load model
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base")
model = LayoutLMv3ForTokenClassification.from_pretrained("microsoft/layoutlmv3-base")

# Process image
image = Image.open("page.png")
encoding = processor(image, return_tensors="pt")
outputs = model(**encoding)

# Get detected regions
predictions = outputs.logits.argmax(-1)
# Labels: 0=text, 1=title, 2=list, 3=table, 4=figure
```

**Performance:**
- Speed: ~2-3 seconds per page
- Accuracy: 90%+ for tables
- GPU recommended but works on CPU

### Option 2: Detectron2 (Facebook/Meta) ✅ GOOD

**Best for:** Object detection in documents

**Advantages:**
- Can be fine-tuned for specific documents
- Detects tables, figures, text regions
- Used in PubLayNet, TableBank datasets

**Installation:**
```bash
pip install detectron2 -f https://dl.fbaipublicfiles.com/detectron2/wheels/cu118/torch2.0/index.html
```

**Usage:**
```python
from detectron2.engine import DefaultPredictor
from detectron2.config import get_cfg
from detectron2 import model_zoo

# Setup
cfg = get_cfg()
cfg.merge_from_file(model_zoo.get_config_file("COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml"))
cfg.MODEL.WEIGHTS = "path/to/publaynet_model.pth"
predictor = DefaultPredictor(cfg)

# Detect
import cv2
img = cv2.imread("page.png")
outputs = predictor(img)

# Get boxes
boxes = outputs["instances"].pred_boxes
classes = outputs["instances"].pred_classes  # 0=text, 1=title, 2=list, 3=table, 4=figure
```

**Pre-trained Models:**
- PubLayNet: Scientific papers
- TableBank: Tables in documents
- DocBank: Financial documents

### Option 3: Table Transformer (Microsoft) ✅ SPECIALIZED

**Best for:** Table structure recognition

**Advantages:**
- Specifically designed for tables
- Detects rows, columns, cells
- Works with borderless tables

**Installation:**
```bash
pip install transformers torch
```

**Usage:**
```python
from transformers import TableTransformerForObjectDetection, DetrImageProcessor
from PIL import Image

processor = DetrImageProcessor.from_pretrained("microsoft/table-transformer-detection")
model = TableTransformerForObjectDetection.from_pretrained("microsoft/table-transformer-detection")

image = Image.open("table_region.png")
inputs = processor(images=image, return_tensors="pt")
outputs = model(**inputs)

# Get table structure
target_sizes = torch.tensor([image.size[::-1]])
results = processor.post_process_object_detection(outputs, target_sizes=target_sizes)[0]

# Results include bounding boxes for:
# - table regions
# - table rows  
# - table columns
```

### Option 4: EasyOCR + CRAFT ⚠️ TEXT-FOCUSED

**Best for:** Text detection, not layout

**Advantages:**
- Very easy to use
- Good for text regions
- Not ideal for tables/layout

**Installation:**
```bash
pip install easyocr
```

### Option 5: Paddle OCR 🇨🇳 CHINESE-FOCUSED

**Best for:** Documents with Chinese/Asian languages

**Advantages:**
- Excellent multi-language support
- Layout analysis included
- Table detection

**Installation:**
```bash
pip install paddlepaddle paddleocr
```

**Usage:**
```python
from paddleocr import PPStructure

table_engine = PPStructure(table=True, show_log=False)
result = table_engine('page.png')

for region in result:
    if region['type'] == 'table':
        # Process table
        bbox = region['bbox']
        html = region['res']  # HTML table structure
```

## Recommendation for Your Use Case

### Best Approach: LayoutLMv3 + Current System

**Why:**
1. LayoutLMv3 detects table regions accurately
2. Use detected bounding boxes with our OCR system
3. Apply scientific notation processing
4. Keep all other features (columns, graphics, text blocks)

**Integration Plan:**

```python
# 1. Detect layout with AI
from transformers import LayoutLMv3Processor, LayoutLMv3ForTokenClassification

model = LayoutLMv3ForTokenClassification.from_pretrained("microsoft/layoutlmv3-base")
processor = LayoutLMv3Processor.from_pretrained("microsoft/layoutlmv3-base")

# 2. Get table regions
image = Image.open("page.png")
encoding = processor(image, return_tensors="pt")
outputs = model(**encoding)

# 3. Extract bounding boxes for tables
table_boxes = get_table_bounding_boxes(outputs)

# 4. Use our OCR system on each table region
for bbox in table_boxes:
    table_region = image.crop(bbox)
    df = extract_table_from_region(table_region)
    scientific_processor.process_table_data(df)
    df.to_csv(f"table_{i}.csv")
```

## Implementation Complexity

| Model | Setup Time | Accuracy | Speed | Complexity |
|-------|------------|----------|-------|------------|
| LayoutLMv3 | 30 min | 90%+ | Medium | Medium |
| Detectron2 | 1 hour | 85%+ | Fast | High |
| Table Transformer | 20 min | 95%+ (tables) | Medium | Low |
| PaddleOCR | 15 min | 85%+ | Fast | Low |

## Quick Start: LayoutLMv3 Integration

**1. Install Dependencies:**
```bash
pip install transformers torch pillow
```

**2. Create Detection Script:**
```python
#!/usr/bin/env python3
"""AI-powered table detection using LayoutLMv3"""

from transformers import AutoProcessor, AutoModelForTokenClassification
from PIL import Image
import torch

def detect_tables_ai(image_path):
    """Detect tables using LayoutLMv3"""
    
    # Load model (do this once, cache it)
    processor = AutoProcessor.from_pretrained("microsoft/layoutlmv3-base", apply_ocr=False)
    model = AutoModelForTokenClassification.from_pretrained("microsoft/layoutlmv3-base")
    
    # Process image
    image = Image.open(image_path)
    encoding = processor(image, return_tensors="pt")
    
    # Get predictions
    with torch.no_grad():
        outputs = model(**encoding)
    
    # Extract table regions
    predictions = outputs.logits.argmax(-1).squeeze().tolist()
    
    # Convert to bounding boxes
    table_boxes = []
    # ... post-processing logic ...
    
    return table_boxes

# Use in extraction
table_boxes = detect_tables_ai("page.png")
for bbox in table_boxes:
    extract_table(bbox)
```

**3. Integrate with Current System:**
- Replace `enhanced_table_detector.detect_all_tables()` call
- Use AI-detected boxes instead
- Keep all other processing (OCR, scientific notation, etc.)

## Pros and Cons

### Using AI Models

**Pros:**
- ✅ Much better accuracy for borderless tables
- ✅ Pre-trained on millions of documents
- ✅ Handles complex layouts
- ✅ Less parameter tuning needed

**Cons:**
- ❌ Requires PyTorch/TensorFlow (larger dependencies)
- ❌ Slower than rule-based (2-3 sec vs 0.5 sec per page)
- ❌ Needs more RAM/CPU (or GPU for speed)
- ❌ Initial setup complexity

### Current Rule-Based System

**Pros:**
- ✅ Fast (< 1 second per page)
- ✅ No heavy dependencies
- ✅ Works offline immediately
- ✅ Transparent/debuggable

**Cons:**
- ❌ Struggles with borderless tables
- ❌ Needs parameter tuning
- ❌ Limited to patterns we code

## Recommendation

**For Production:**

**Phase 1 (Immediate):**
1. Use interactive review tool (just created)
2. Human approves/rejects detections
3. Works with current system

**Phase 2 (Short term - 1 week):**
1. Integrate Table Transformer for table detection only
2. Keep current system for everything else
3. Best of both worlds

**Phase 3 (Long term - 1 month):**
1. Full LayoutLMv3 integration
2. Train on your specific document types
3. Automated with confidence scores

## Next Steps

**Try it now:**
```bash
# Install
pip install transformers torch

# Test detection
python test_layoutlm_detection.py page_002_full.png
```

Would you like me to:
1. ✅ Create the LayoutLMv3 integration script
2. ✅ Set up Table Transformer detection
3. ✅ Make hybrid system (AI + current rules)

The AI models are **free, open source, and will significantly improve table detection** for complex documents like yours.

