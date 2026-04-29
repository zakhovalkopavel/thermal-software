#!/usr/bin/env python3
"""
Use reference images to locate and extract tables properly
"""

import sys
import cv2
import numpy as np
from pathlib import Path
from PIL import Image
import pytesseract

sys.path.insert(0, '/app/src')

def find_table_in_page(page_image_path, table_reference_path):
    """
    Find where a reference table image appears in the full page

    Args:
        page_image_path: Path to full page image
        table_reference_path: Path to cropped table image

    Returns:
        Bounding box (x, y, w, h) or None
    """
    # Load images
    page = cv2.imread(str(page_image_path))
    template = cv2.imread(str(table_reference_path))

    if page is None or template is None:
        return None

    # Convert to grayscale
    page_gray = cv2.cvtColor(page, cv2.COLOR_BGR2GRAY)
    template_gray = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)

    # Template matching
    result = cv2.matchTemplate(page_gray, template_gray, cv2.TM_CCOEFF_NORMED)

    # Find best match
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)

    print(f"  Match confidence: {max_val:.3f}")

    if max_val > 0.5:  # Good match
        x, y = max_loc
        h, w = template_gray.shape
        return (x, y, w, h)

    return None

def extract_table_at_location(page_image_path, bbox):
    """Extract table region and OCR it properly"""
    page = cv2.imread(str(page_image_path))
    x, y, w, h = bbox

    # Extract region with padding
    padding = 10
    x1 = max(0, x - padding)
    y1 = max(0, y - padding)
    x2 = min(page.shape[1], x + w + padding)
    y2 = min(page.shape[0], y + h + padding)

    table_region = page[y1:y2, x1:x2]

    # Convert to PIL for OCR
    pil_image = Image.fromarray(cv2.cvtColor(table_region, cv2.COLOR_BGR2RGB))

    # OCR with table-specific settings
    custom_config = r'--psm 6'  # Uniform block of text
    text = pytesseract.image_to_string(pil_image, config=custom_config)

    return text, table_region

def main():
    """Find tables using reference images"""
    print("\n" + "="*80)
    print("FINDING TABLES USING REFERENCE IMAGES")
    print("="*80)

    page2_path = Path('/app/shared/sources/lakatos/page_002_full.png')

    # Reference tables from page 2
    references = [
        ('table_from_page_2.png', 'Main table from page 2'),
        ('another_one_table_from_page_2.png', 'Small table from page 2'),
    ]

    for ref_file, description in references:
        ref_path = Path(f'/app/shared/sources/lakatos/{ref_file}')

        print(f"\n{description}:")
        print(f"  Reference: {ref_file}")

        if not ref_path.exists():
            print(f"  ✗ Reference image not found")
            continue

        # Find table in page
        bbox = find_table_in_page(page2_path, ref_path)

        if bbox:
            x, y, w, h = bbox
            print(f"  ✓ Found at: ({x}, {y}), size: {w}×{h}")

            # Extract and OCR
            text, region = extract_table_at_location(page2_path, bbox)

            print(f"\n  OCR Text (first 200 chars):")
            print(f"  {text[:200]}...")

            # Save extracted region
            output_path = Path(f'/tmp/found_{ref_file}')
            cv2.imwrite(str(output_path), region)
            print(f"  Saved to: {output_path}")
        else:
            print(f"  ✗ Not found in page")

    print("\n" + "="*80)

    return 0

if __name__ == "__main__":
    sys.exit(main())

