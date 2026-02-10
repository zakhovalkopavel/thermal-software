#!/usr/bin/env python3
"""
Test chart detection with actual Lakatos images
"""

import sys
import cv2
import numpy as np
from pathlib import Path
from PIL import Image

sys.path.insert(0, '/app/src')

from ocr.graphics_extractor import GraphicsExtractor
from ocr.config import ExtractionConfig

def test_chart_detection():
    """Test if chart from page 2 is detected"""
    print("\n" + "="*80)
    print("Testing Chart Detection with Actual Image")
    print("="*80)

    chart_path = Path('/app/shared/sources/lakatos/chart_from_page_2.png')

    if not chart_path.exists():
        print(f"ERROR: Chart image not found: {chart_path}")
        return False

    # Load image
    pil_image = Image.open(chart_path)
    print(f"\nChart image: {chart_path.name}")
    print(f"Size: {pil_image.size}")

    # Create config with current settings
    config = ExtractionConfig(
        edge_density_threshold=0.03,
        min_graphic_size=50
    )

    # Create temporary graphics directory
    graphics_dir = Path('/tmp/test_graphics')
    graphics_dir.mkdir(exist_ok=True)

    # Create graphics extractor with correct parameters
    extractor = GraphicsExtractor(
        graphics_dir,
        min_size=config.min_graphic_size,
        edge_density_threshold=config.edge_density_threshold
    )

    # Try to extract
    try:
        graphics_paths, graphics_metadata = extractor.extract_graphics(
            pil_image,
            page_num=2,
            source_name="lakatos_test"
        )

        print(f"\nResults:")
        print(f"  Graphics detected: {len(graphics_paths)}")

        if graphics_paths:
            print(f"  ✓ CHART DETECTED!")
            for i, (path, meta) in enumerate(zip(graphics_paths, graphics_metadata)):
                print(f"\n  Graphic {i+1}:")
                print(f"    File: {path.name}")
                print(f"    Edge density: {meta['edge_density']:.4f}")
                print(f"    Position: ({meta['position']['x']}, {meta['position']['y']})")
                print(f"    Size: {meta['position']['width']} × {meta['position']['height']}")
            return True
        else:
            print(f"  ✗ NO GRAPHICS DETECTED")
            print(f"  Chart should have been detected!")

            # Debug info
            img_array = np.array(pil_image.convert('RGB'))
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / edges.size
            print(f"\n  Debug info:")
            print(f"    Edge density: {edge_density:.4f}")
            print(f"    Threshold: {config.edge_density_threshold}")
            print(f"    Min size: {config.min_graphic_size}")

            return False

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_table_headers_not_detected():
    """Test that table headers are NOT detected as graphics"""
    print("\n" + "="*80)
    print("Testing Table Header Filtering")
    print("="*80)

    header_paths = [
        Path('/app/shared/sources/lakatos/table_header_from_page_3.png'),
        Path('/app/shared/sources/lakatos/table_header_from_page_4.png'),
    ]

    config = ExtractionConfig(
        edge_density_threshold=0.03,
        min_graphic_size=50
    )

    graphics_dir = Path('/tmp/test_graphics')
    graphics_dir.mkdir(exist_ok=True)

    extractor = GraphicsExtractor(
        graphics_dir,
        min_size=config.min_graphic_size,
        edge_density_threshold=config.edge_density_threshold
    )

    all_passed = True

    for header_path in header_paths:
        if not header_path.exists():
            print(f"SKIP: {header_path.name} not found")
            continue

        pil_image = Image.open(header_path)
        print(f"\n{header_path.name}:")
        print(f"  Size: {pil_image.size}")

        graphics_paths, _ = extractor.extract_graphics(
            pil_image,
            page_num=3,
            source_name="lakatos_test"
        )

        if len(graphics_paths) == 0:
            print(f"  ✓ CORRECTLY FILTERED (not detected as graphic)")
        else:
            print(f"  ✗ WRONGLY DETECTED AS GRAPHIC ({len(graphics_paths)} graphics)")
            all_passed = False

    return all_passed

def main():
    """Run chart detection tests"""
    print("\n" + "="*80)
    print("CHART DETECTION TESTS")
    print("Testing with Actual Lakatos Images")
    print("="*80)

    results = []

    # Test 1: Chart should be detected
    results.append(("Chart Detection", test_chart_detection()))

    # Test 2: Table headers should NOT be detected
    results.append(("Table Header Filtering", test_table_headers_not_detected()))

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status:8} - {name}")
        if not passed:
            all_passed = False

    print("="*80)

    if all_passed:
        print("\n✅ ALL CHART DETECTION TESTS PASSED!\n")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())

