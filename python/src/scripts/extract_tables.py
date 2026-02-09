#!/usr/bin/env python3
"""
OCR Table Extractor - Main CLI
Extract tables from PDF and image files using OCR and direct extraction
"""

import sys
import argparse
import logging
from pathlib import Path

# Add package to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ocr.config import ExtractionConfig
from ocr.extractor import TableExtractor


def setup_logging(log_dir: Path):
    """Configure logging"""
    log_file = log_dir / "ocr_extraction.log"

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler(sys.stdout)
        ]
    )


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description='Extract tables from PDF and image files using OCR',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode
  %(prog)s

  # Process specific file
  %(prog)s --file document.pdf

  # Force OCR method
  %(prog)s --file scanned.pdf --method ocr

  # Custom DPI and language
  %(prog)s --file doc.pdf --dpi 600 --lang deu
        """
    )

    parser.add_argument(
        '--file', type=str,
        help='Specific file to process (in sources directory)'
    )
    parser.add_argument(
        '--method', choices=['auto', 'direct', 'ocr'], default='auto',
        help='Extraction method (default: auto)'
    )
    parser.add_argument(
        '--lang', type=str, default='eng',
        help='OCR language code (default: eng)'
    )
    parser.add_argument(
        '--dpi', type=int, default=300,
        help='DPI for PDF conversion (default: 300)'
    )
    parser.add_argument(
        '--sources', type=str, default='/app/shared/sources',
        help='Sources directory (default: /app/shared/sources)'
    )
    parser.add_argument(
        '--output', type=str, default='/app/shared/processed',
        help='Output directory (default: /app/shared/processed)'
    )

    args = parser.parse_args()

    # Create configuration
    config = ExtractionConfig(
        sources_dir=Path(args.sources),
        processed_dir=Path(args.output),
        ocr_lang=args.lang,
        dpi=args.dpi
    )

    # Setup logging
    setup_logging(config.processed_dir)

    # Create extractor
    extractor = TableExtractor(config)

    # Process file or run interactive mode
    if args.file:
        file_path = config.sources_dir / args.file
        if file_path.exists():
            extractor.process_file(file_path, args.method)
        else:
            print(f"File not found: {file_path}")
            sys.exit(1)
    else:
        extractor.interactive_mode()


if __name__ == "__main__":
    main()

