#!/usr/bin/env python3
"""Test extraction EXACTLY as the pipeline does it"""

import sys
from pathlib import Path
sys.path.insert(0, '/app/src')

from PIL import Image
import numpy as np
from ocr.ocr import OCRExtractor
from ocr.config import ExtractionConfig

output_file = Path("/app/shared/processed/pipeline_test.txt")
results = []

try:
    # Load image EXACTLY as process_image does
    image_path = Path("/app/shared/sources/test_composition_table.png")
    pil_image = Image.open(str(image_path))
    image = np.array(pil_image)
    results.append(f"Image shape: {image.shape}")
    results.append("")

    # Create OCRExtractor EXACTLY as TableExtractor does
    config = ExtractionConfig(
        sources_dir=Path("/app/shared/sources"),
        processed_dir=Path("/app/shared/processed")
    )

    extractor = OCRExtractor(
        lang=config.ocr_lang,
        psm_mode=config.psm_mode
    )

    results.append(f"OCR config: lang={config.ocr_lang}, psm={config.psm_mode}")
    results.append("")

    # Call extract_table EXACTLY as _extract_from_image does
    results.append("=== Calling extract_table (no bbox) ===")
    df = extractor.extract_table(image, bbox=None)

    results.append(f"Result shape: {df.shape}")
    results.append(f"Result columns: {list(df.columns)}")
    results.append("")
    results.append("Result content:")
    results.append(df.to_string())

    output_file.write_text('\n'.join(results))
    print(f"Pipeline test results saved to: {output_file}")

except Exception as e:
    import traceback
    output_file.write_text(f"ERROR: {e}\n\n{traceback.format_exc()}")
    raise

