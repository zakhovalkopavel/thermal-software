#!/usr/bin/env python3
"""Test coordinate-based table extraction and save results"""

import sys
from pathlib import Path
sys.path.insert(0, '/app/src')

from PIL import Image
import numpy as np
from ocr.ocr import OCRExtractor

output_file = Path("/app/shared/processed/coordinate_test.txt")

try:
    # Load image
    img = Image.open("/app/shared/sources/test_composition_table.png")
    img_array = np.array(img)

    # Create OCR extractor
    extractor = OCRExtractor(lang="eng", psm_mode="--psm 3")

    results = []
    results.append(f"Image shape: {img_array.shape}")
    results.append("")

    # Get coordinate data
    results.append("=== Getting image_to_data ===")
    data = extractor.extract_data(img_array)
    results.append(f"Data keys: {list(data.keys()) if data else 'None'}")
    results.append(f"Number of words: {len(data.get('text', [])) if data else 0}")
    results.append("")

    # Parse table from data
    results.append("=== Parsing table from coordinates ===")
    df = extractor._parse_table_from_data(data)
    results.append(f"DataFrame shape: {df.shape}")
    results.append(f"DataFrame columns: {list(df.columns)}")
    results.append("")
    results.append("DataFrame content:")
    results.append(df.to_string())
    results.append("")

    # Also try text-based
    results.append("=== Text-based parsing (fallback) ===")
    text = extractor.extract_text(img_array)
    results.append(f"Extracted text:\n{text}")
    results.append("")
    df_text = extractor.parse_table_from_text(text)
    results.append(f"Text-parsed shape: {df_text.shape}")
    results.append(df_text.to_string())

    output_file.write_text('\n'.join(results))
    print(f"Results saved to: {output_file}")

except Exception as e:
    import traceback
    output_file.write_text(f"ERROR: {e}\n\n{traceback.format_exc()}")
    raise

