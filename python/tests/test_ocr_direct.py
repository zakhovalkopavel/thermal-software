#!/usr/bin/env python3
"""Direct OCR test - saves output to file"""

from pathlib import Path
from PIL import Image
import pytesseract
import sys

output_file = Path("/app/shared/processed/ocr_direct_test.txt")

try:
    # Load image
    img_path = Path("/app/shared/sources/test_composition_table.png")
    if not img_path.exists():
        output_file.write_text(f"ERROR: Image not found: {img_path}")
        sys.exit(1)

    img = Image.open(img_path)

    results = []
    results.append(f"Image: {img.size} {img.mode}")
    results.append(f"Path: {img_path}")
    results.append("")

    # Try different PSM modes
    for psm in [3, 4, 6, 11]:
        results.append(f"=== PSM {psm} ===")
        try:
            text = pytesseract.image_to_string(img, config=f'--psm {psm}')
            results.append(text if text.strip() else "(empty)")
        except Exception as e:
            results.append(f"ERROR: {e}")
        results.append("")

    output_file.write_text('\n'.join(results))
    print(f"Results saved to: {output_file}")

except Exception as e:
    output_file.write_text(f"FATAL ERROR: {e}")
    raise

