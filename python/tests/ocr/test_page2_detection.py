#!/usr/bin/env python3
"""
Extract page 2 from Lakatos PDF and test block detection
"""

import sys
from pathlib import Path
from pdf2image import convert_from_path
import cv2
import numpy as np
import pytesseract
from PIL import Image

sys.path.insert(0, '/app/src')

from ocr.enhanced_table_detector import EnhancedTableDetector
from ocr.layout_analyzer import LayoutAnalyzer
from ocr.graphics_extractor import GraphicsExtractor
from ocr.image_processing import TableDetector, ImagePreprocessor
from ocr.config import ExtractionConfig

def extract_page_2():
    """Extract page 2 from PDF as image"""
    pdf_path = Path('/app/shared/sources/Viscosity-temperature relations in glasses (Lakatos 1976).pdf')

    if not pdf_path.exists():
        print(f"ERROR: PDF not found: {pdf_path}")
        return None

    print("Extracting page 2 from PDF...")

    # Convert page 2 only
    images = convert_from_path(str(pdf_path), first_page=2, last_page=2, dpi=300)

    if not images:
        print("ERROR: Could not extract page 2")
        return None

    page_image = images[0]

    # Save for inspection
    output_path = Path('/app/shared/sources/lakatos/page_002_full.png')
    page_image.save(output_path)

    print(f"Saved page 2 to: {output_path}")
    print(f"Size: {page_image.size}")

    return page_image, output_path

def test_column_detection(pil_image):
    """Test column layout detection"""
    print("\n" + "="*80)
    print("COLUMN LAYOUT DETECTION")
    print("="*80)

    img_array = np.array(pil_image)

    analyzer = LayoutAnalyzer(min_column_gap=30)
    columns = analyzer.detect_columns(img_array)

    print(f"\nDetected {len(columns)} column(s):")
    for i, (start, end) in enumerate(columns, 1):
        width = end - start
        print(f"  Column {i}: x={start} to {end} (width={width}px)")

    return columns

def test_text_blocks(pil_image, columns):
    """Test text block detection with column awareness"""
    print("\n" + "="*80)
    print("TEXT BLOCK DETECTION")
    print("="*80)

    img_array = np.array(pil_image)

    # Get OCR data
    ocr_data = pytesseract.image_to_data(
        img_array,
        output_type=pytesseract.Output.DICT
    )

    # Analyze by column
    for col_num, (col_start, col_end) in enumerate(columns, 1):
        print(f"\nColumn {col_num}:")

        # Filter words in this column
        col_words = []
        for i, text in enumerate(ocr_data['text']):
            if not text.strip():
                continue

            x = ocr_data['left'][i]
            x_center = x + ocr_data['width'][i] // 2

            if col_start <= x_center < col_end:
                col_words.append({
                    'text': text,
                    'y': ocr_data['top'][i],
                    'height': ocr_data['height'][i]
                })

        print(f"  Words detected: {len(col_words)}")

        # Sort by Y position
        col_words.sort(key=lambda w: w['y'])

        # Show first 10 words
        if col_words:
            print("  First 10 words:")
            for word in col_words[:10]:
                print(f"    y={word['y']:4d}: {word['text']}")

def test_table_detection(pil_image):
    """Test table detection with enhanced detector"""
    print("\n" + "="*80)
    print("TABLE DETECTION")
    print("="*80)

    img_array = np.array(pil_image)

    # Get OCR data
    ocr_data = pytesseract.image_to_data(
        img_array,
        output_type=pytesseract.Output.DICT
    )

    # Preprocess image
    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array

    preprocessor = ImagePreprocessor()
    try:
        preprocessed = preprocessor.preprocess(gray)
    except:
        _, preprocessed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Create detectors
    config = ExtractionConfig()
    line_detector = TableDetector(min_area=1500)
    enhanced_detector = EnhancedTableDetector(line_detector, config)

    # Detect tables
    table_regions = enhanced_detector.detect_all_tables(preprocessed, ocr_data)

    print(f"\nDetected {len(table_regions)} table region(s):")
    for i, (x, y, w, h) in enumerate(table_regions, 1):
        print(f"  Table {i}: position=({x}, {y}), size={w}×{h}")

        # Show what's in this region
        roi_words = []
        for j, text in enumerate(ocr_data['text']):
            if not text.strip():
                continue

            word_x = ocr_data['left'][j]
            word_y = ocr_data['top'][j]

            if (x <= word_x < x + w) and (y <= word_y < y + h):
                roi_words.append(text)

        print(f"    Words in region: {len(roi_words)}")
        if roi_words:
            print(f"    Sample: {' '.join(roi_words[:10])}...")

def test_graphics_detection(pil_image):
    """Test graphics detection"""
    print("\n" + "="*80)
    print("GRAPHICS DETECTION")
    print("="*80)

    config = ExtractionConfig(
        edge_density_threshold=0.03,
        min_graphic_size=50
    )

    graphics_dir = Path('/tmp/test_graphics_page2')
    graphics_dir.mkdir(exist_ok=True)

    extractor = GraphicsExtractor(
        graphics_dir,
        min_size=config.min_graphic_size,
        edge_density_threshold=config.edge_density_threshold
    )

    graphics_paths, graphics_metadata = extractor.extract_graphics(
        pil_image,
        page_num=2,
        source_name="lakatos_page2_test"
    )

    print(f"\nDetected {len(graphics_paths)} graphic region(s):")

    if graphics_paths:
        for i, (path, meta) in enumerate(zip(graphics_paths, graphics_metadata)):
            print(f"\n  Graphic {i+1}:")
            print(f"    File: {path.name}")
            print(f"    Edge density: {meta['edge_density']:.4f}")
            print(f"    Position: ({meta['position']['x']}, {meta['position']['y']})")
            print(f"    Size: {meta['position']['width']} × {meta['position']['height']}")
    else:
        print("  No graphics detected!")
        print("\n  Checking chart image edge density...")

        img_array = np.array(pil_image.convert('RGB'))
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        print(f"  Overall page edge density: {edge_density:.4f}")
        print(f"  Threshold: {config.edge_density_threshold}")

def main():
    """Main test function"""
    print("\n" + "="*80)
    print("TESTING PAGE 2 DETECTION")
    print("="*80)

    # Extract page 2
    result = extract_page_2()
    if not result:
        return 1

    pil_image, image_path = result

    # Run tests
    columns = test_column_detection(pil_image)
    test_text_blocks(pil_image, columns)
    test_table_detection(pil_image)
    test_graphics_detection(pil_image)

    print("\n" + "="*80)
    print("Page 2 saved to:")
    print(f"  {image_path}")
    print("="*80)

    return 0

if __name__ == "__main__":
    sys.exit(main())

