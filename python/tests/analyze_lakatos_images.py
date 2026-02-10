#!/usr/bin/env python3
"""
Diagnostic script to analyze cropped images and improve detection
"""

import sys
import cv2
import numpy as np
import pytesseract
from pathlib import Path
from PIL import Image

sys.path.insert(0, '/app/src')

from ocr.graphics_extractor import GraphicsExtractor
from ocr.enhanced_table_detector import EnhancedTableDetector
from ocr.image_processing import TableDetector
from ocr.config import ExtractionConfig

def analyze_image(image_path: Path):
    """Analyze a single image to understand its characteristics"""
    print(f"\n{'='*80}")
    print(f"Analyzing: {image_path.name}")
    print('='*80)

    # Load image
    pil_image = Image.open(image_path)
    img_array = np.array(pil_image)

    if len(img_array.shape) == 3:
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    else:
        gray = img_array

    print(f"Image size: {img_array.shape}")

    # 1. Check edge density (for chart detection)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / edges.size
    print(f"Edge density: {edge_density:.4f} (threshold: 0.05)")

    if edge_density >= 0.05:
        print("  ✓ Would be detected as graphic")
    else:
        print("  ✗ Below threshold - needs adjustment")

    # 2. OCR text detection
    try:
        ocr_data = pytesseract.image_to_data(img_array, output_type=pytesseract.Output.DICT)
        words = [text for text in ocr_data['text'] if text.strip()]
        print(f"OCR detected {len(words)} words")

        if words:
            print(f"  Sample: {' '.join(words[:10])}...")
    except Exception as e:
        print(f"  OCR failed: {e}")

    # 3. Line detection (for bordered tables)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Horizontal lines
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
    h_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, h_kernel, iterations=2)
    h_line_density = np.sum(h_lines > 0) / h_lines.size

    # Vertical lines
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
    v_lines = cv2.morphologyEx(binary, cv2.MORPH_OPEN, v_kernel, iterations=2)
    v_line_density = np.sum(v_lines > 0) / v_lines.size

    print(f"Horizontal line density: {h_line_density:.4f}")
    print(f"Vertical line density: {v_line_density:.4f}")

    if h_line_density > 0.001 or v_line_density > 0.001:
        print("  ✓ Has detectable lines")
    else:
        print("  ✗ No clear lines - borderless")

    # 4. Text alignment analysis (for borderless tables)
    if 'ocr_data' in locals() and words:
        # Group by horizontal position
        x_positions = {}
        for i, text in enumerate(ocr_data['text']):
            if not text.strip():
                continue
            x = ocr_data['left'][i]
            # Group into buckets of 10 pixels
            bucket = (x // 10) * 10
            if bucket not in x_positions:
                x_positions[bucket] = []
            x_positions[bucket].append(text)

        columns = [col for col in x_positions.values() if len(col) >= 2]
        print(f"Potential columns detected: {len(columns)}")

        if len(columns) >= 2:
            print("  ✓ Has column-like structure")
            for i, col in enumerate(columns[:5], 1):
                print(f"    Col {i}: {len(col)} items")
        else:
            print("  ✗ No clear column structure")

    # 5. Contour analysis
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    large_contours = [c for c in contours if cv2.contourArea(c) > 1000]
    print(f"Large contours (area > 1000): {len(large_contours)}")

    if large_contours:
        areas = [cv2.contourArea(c) for c in large_contours[:5]]
        print(f"  Top contour areas: {areas}")

def main():
    """Analyze all cropped images"""
    lakatos_dir = Path('/app/shared/sources/lakatos')

    if not lakatos_dir.exists():
        print("ERROR: lakatos directory not found")
        return 1

    images = sorted(lakatos_dir.glob('*.png'))

    if not images:
        print("No images found in lakatos directory")
        return 1

    print(f"Found {len(images)} images to analyze")

    for img_path in images:
        try:
            analyze_image(img_path)
        except Exception as e:
            print(f"\nERROR analyzing {img_path.name}: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)

    return 0

if __name__ == "__main__":
    sys.exit(main())

