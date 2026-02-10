#!/usr/bin/env python3
"""
Test script for OCR extraction with document.json structure
"""

import sys
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ocr.config import ExtractionConfig
from ocr.extractor import TableExtractor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """Test OCR extraction with document.json structure"""

    print("=" * 80)
    print("OCR Extraction Test - Document.json Structure")
    print("=" * 80)

    # Configuration
    config = ExtractionConfig(
        sources_dir=Path("/app/shared/sources"),
        processed_dir=Path("/app/shared/processed"),
        auto_detect_lang=True,
        extract_graphics=True,
        dpi=300,
        psm=6,  # Scientific mode
        max_languages=3
    )

    # Initialize extractor
    extractor = TableExtractor(config)

    # Find test files
    sources_dir = Path("/app/shared/sources")
    if not sources_dir.exists():
        print(f"ERROR: Sources directory not found: {sources_dir}")
        return 1

    # Look for PDF or image files
    test_files = list(sources_dir.glob("*.pdf")) + list(sources_dir.glob("*.png")) + list(sources_dir.glob("*.jpg"))

    if not test_files:
        print(f"\nNo test files found in {sources_dir}")
        print("Please add a PDF or image file to test.")
        return 1

    print(f"\nFound {len(test_files)} test file(s):")
    for i, f in enumerate(test_files, 1):
        print(f"  {i}. {f.name}")

    # Process first file
    test_file = test_files[0]
    print(f"\nProcessing: {test_file.name}")
    print("-" * 80)

    try:
        result = extractor.process_file_with_structure(test_file)

        print("\n" + "=" * 80)
        print("EXTRACTION COMPLETE!")
        print("=" * 80)
        print(f"Source file:    {result['source_file']}")
        print(f"Total pages:    {result['total_pages']}")
        print(f"Text blocks:    {result['text_blocks']}")
        print(f"Tables:         {result['tables']}")
        print(f"Graphics:       {result['graphics']}")
        print(f"\nOutput directory: {result['output_dir']}")
        print(f"Document JSON:    {result['document_json']}")

        # Show file structure
        output_dir = Path(result['output_dir'])
        print(f"\nGenerated files:")
        for file_path in sorted(output_dir.rglob('*')):
            if file_path.is_file():
                rel_path = file_path.relative_to(output_dir)
                size = file_path.stat().st_size
                print(f"  {rel_path} ({size} bytes)")

        return 0

    except Exception as e:
        logger.error(f"Extraction failed: {e}", exc_info=True)
        print(f"\nERROR: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

