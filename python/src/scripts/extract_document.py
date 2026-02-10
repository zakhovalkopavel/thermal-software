#!/usr/bin/env python3
"""
OCR Document Extraction - Command Line Interface
Extracts text, tables, and graphics from PDF/image files into document.json structure
"""

import sys
import argparse
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ocr.config import ExtractionConfig, LANG_CODES
from ocr.extractor import TableExtractor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)

logger = logging.getLogger(__name__)


def interactive_mode(args):
    """Interactive file selection mode"""
    print("\n" + "=" * 80)
    print("  OCR Document Extraction - Interactive Mode")
    print("=" * 80)
    print()

    sources_dir = Path(args.sources)

    # Check if sources directory exists
    if not sources_dir.exists():
        print(f"ERROR: Sources directory not found: {sources_dir}")
        print(f"Please create it and add files to extract.")
        return 1

    # Find all supported files
    supported_files = []
    for ext in ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
        supported_files.extend(sources_dir.glob(f'*{ext}'))
        supported_files.extend(sources_dir.glob(f'*{ext.upper()}'))

    if not supported_files:
        print(f"No supported files found in: {sources_dir}")
        print()
        print("Supported formats: PDF, PNG, JPG, JPEG, TIFF, BMP")
        print()
        print(f"Please add files to {sources_dir} and try again.")
        return 1

    # Sort files by name
    supported_files = sorted(set(supported_files), key=lambda x: x.name.lower())

    # Display available files
    print(f"Found {len(supported_files)} file(s) in {sources_dir}:")
    print()
    for i, f in enumerate(supported_files, 1):
        size = f.stat().st_size
        if size < 1024:
            size_str = f"{size}B"
        elif size < 1024 * 1024:
            size_str = f"{size/1024:.1f}KB"
        else:
            size_str = f"{size/(1024*1024):.1f}MB"
        print(f"  {i:2d}. {f.name:<40} ({size_str:>10})")

    print()
    print("-" * 80)

    # Get user selection
    try:
        selection = input("\nEnter file number (or filename, or 'q' to quit): ").strip()

        if selection.lower() in ['q', 'quit', 'exit']:
            print("\nCancelled.")
            return 0

        # Try as number first
        try:
            idx = int(selection)
            if 1 <= idx <= len(supported_files):
                selected_file = supported_files[idx - 1]
            else:
                print(f"\nERROR: Number must be between 1 and {len(supported_files)}")
                return 1
        except ValueError:
            # Try as filename
            matching = [f for f in supported_files if selection.lower() in f.name.lower()]
            if len(matching) == 0:
                print(f"\nERROR: No file matching '{selection}' found")
                return 1
            elif len(matching) > 1:
                print(f"\nERROR: Multiple files match '{selection}':")
                for f in matching:
                    print(f"  - {f.name}")
                return 1
            else:
                selected_file = matching[0]

        print()
        print("=" * 80)
        print(f"Selected: {selected_file.name}")
        print("=" * 80)

        # Update args with selected file
        args.file = str(selected_file)

        # Continue with extraction
        return process_file(args, selected_file)

    except KeyboardInterrupt:
        print("\n\nCancelled by user.")
        return 0
    except Exception as e:
        logger.error(f"Error in interactive mode: {e}", exc_info=args.verbose)
        print(f"\nERROR: {e}")
        return 1


def process_file(args, file_path):
    """Process a single file with the given arguments"""
    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        return 1

    # Build language list
    if args.auto_detect_lang:
        ocr_lang = 'auto'
    else:
        # Convert language names to codes
        lang_codes = []
        for lang in args.lang:
            code = LANG_CODES.get(lang.lower(), lang)
            lang_codes.append(code)
        ocr_lang = '+'.join(lang_codes)

    # Configure extraction
    config = ExtractionConfig(
        sources_dir=Path(args.sources),
        processed_dir=Path(args.output),
        ocr_lang=ocr_lang if not args.auto_detect_lang else 'eng',
        auto_detect_lang=args.auto_detect_lang,
        extract_graphics=args.extract_graphics,
        dpi=args.dpi,
        psm=6 if args.scientific else 3,
        preserve_interword_spaces=args.scientific,
        max_languages=3
    )

    # Print configuration
    print("=" * 80)
    print("OCR Document Extraction")
    print("=" * 80)
    print(f"File:               {file_path.name}")
    print(f"Auto-detect lang:   {args.auto_detect_lang}")
    if not args.auto_detect_lang:
        print(f"Languages:          {', '.join(args.lang)}")
    print(f"Extract graphics:   {args.extract_graphics}")
    print(f"Scientific mode:    {args.scientific}")
    print(f"DPI:                {args.dpi}")
    print(f"Output:             {args.output}")
    print("=" * 80)
    print()

    # Initialize extractor
    extractor = TableExtractor(config)

    # Process file
    try:
        result = extractor.process_file_with_structure(file_path)

        print("\n" + "=" * 80)
        print("EXTRACTION COMPLETE!")
        print("=" * 80)
        print(f"Source file:    {result['source_file']}")
        print(f"Total pages:    {result['total_pages']}")
        print(f"Text blocks:    {result['text_blocks']}")
        print(f"Tables:         {result['tables']}")
        print(f"Graphics:       {result['graphics']}")
        print()
        print(f"Output directory:")
        print(f"  {result['output_dir']}")
        print()
        print(f"Document JSON:")
        print(f"  {result['document_json']}")

        # Show structure
        output_dir = Path(result['output_dir'])
        print(f"\nGenerated files:")
        for file_path in sorted(output_dir.rglob('*')):
            if file_path.is_file():
                rel_path = str(file_path.relative_to(output_dir))  # Convert to string
                size = file_path.stat().st_size
                if size < 1024:
                    size_str = f"{size}B"
                elif size < 1024 * 1024:
                    size_str = f"{size/1024:.1f}KB"
                else:
                    size_str = f"{size/(1024*1024):.1f}MB"
                print(f"  {rel_path:<40} {size_str:>10}")

        print("\n" + "=" * 80)
        return 0

    except Exception as e:
        logger.error(f"Extraction failed: {e}", exc_info=args.verbose)
        print(f"\nERROR: {e}")
        if not args.verbose:
            print("Run with --verbose for more details")
        return 1


def main():
    parser = argparse.ArgumentParser(
        description='Extract text, tables, and graphics from documents',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Basic extraction
  %(prog)s document.pdf

  # With graphics extraction
  %(prog)s --extract-graphics document.pdf

  # Auto-detect languages
  %(prog)s --auto-detect-lang document.pdf

  # Specify languages
  %(prog)s --lang english german french document.pdf

  # Scientific mode (better for formulas)
  %(prog)s --scientific document.pdf

  # Full extraction with all features
  %(prog)s --auto-detect-lang --extract-graphics --scientific document.pdf

Supported languages:
  english, french, german, czech, polish, ukrainian, russian, japanese, chinese
        '''
    )

    parser.add_argument(
        'file',
        type=str,
        nargs='?',  # Make file argument optional
        help='PDF or image file to process (optional - will prompt if not provided)'
    )

    parser.add_argument(
        '--sources',
        type=str,
        default='/app/shared/sources',
        help='Sources directory (default: /app/shared/sources)'
    )

    parser.add_argument(
        '--output',
        type=str,
        default='/app/shared/processed',
        help='Output directory (default: /app/shared/processed)'
    )

    parser.add_argument(
        '--lang',
        type=str,
        nargs='+',
        default=['english'],
        help='OCR language codes (e.g., english french german)'
    )

    parser.add_argument(
        '--auto-detect-lang',
        action='store_true',
        help='Auto-detect document languages'
    )

    parser.add_argument(
        '--extract-graphics',
        action='store_true',
        help='Extract and save graphics separately'
    )

    parser.add_argument(
        '--scientific',
        action='store_true',
        help='Optimize for scientific notation and formulas'
    )

    parser.add_argument(
        '--dpi',
        type=int,
        default=300,
        help='DPI for PDF conversion (default: 300)'
    )

    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed logging'
    )

    args = parser.parse_args()

    # Set logging level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    # Interactive mode if no file specified
    if not args.file:
        return interactive_mode(args)

    # Resolve file path
    file_path = Path(args.file)
    if not file_path.is_absolute():
        file_path = Path(args.sources) / file_path

    if not file_path.exists():
        print(f"ERROR: File not found: {file_path}")
        return 1

    # Build language list
    if args.auto_detect_lang:
        ocr_lang = 'auto'
    else:
        # Convert language names to codes
        lang_codes = []
        for lang in args.lang:
            code = LANG_CODES.get(lang.lower(), lang)
            lang_codes.append(code)
        ocr_lang = '+'.join(lang_codes)

    # Configure extraction
    config = ExtractionConfig(
        sources_dir=Path(args.sources),
        processed_dir=Path(args.output),
        ocr_lang=ocr_lang if not args.auto_detect_lang else 'eng',
        auto_detect_lang=args.auto_detect_lang,
        extract_graphics=args.extract_graphics,
        dpi=args.dpi,
        psm=6 if args.scientific else 3,
        preserve_interword_spaces=args.scientific,
        max_languages=3
    )

    # Print configuration
    print("=" * 80)
    print("OCR Document Extraction")
    print("=" * 80)
    print(f"File:               {file_path.name}")
    print(f"Auto-detect lang:   {args.auto_detect_lang}")
    if not args.auto_detect_lang:
        print(f"Languages:          {', '.join(args.lang)}")
    print(f"Extract graphics:   {args.extract_graphics}")
    print(f"Scientific mode:    {args.scientific}")
    print(f"DPI:                {args.dpi}")
    print(f"Output:             {args.output}")
    print("=" * 80)
    print()

    # Initialize extractor
    extractor = TableExtractor(config)

    # Process file
    try:
        result = extractor.process_file_with_structure(file_path)

        print("\n" + "=" * 80)
        print("EXTRACTION COMPLETE!")
        print("=" * 80)
        print(f"Source file:    {result['source_file']}")
        print(f"Total pages:    {result['total_pages']}")
        print(f"Text blocks:    {result['text_blocks']}")
        print(f"Tables:         {result['tables']}")
        print(f"Graphics:       {result['graphics']}")
        print()
        print(f"Output directory:")
        print(f"  {result['output_dir']}")
        print()
        print(f"Document JSON:")
        print(f"  {result['document_json']}")

        # Show structure
        output_dir = Path(result['output_dir'])
        print(f"\nGenerated files:")
        for file_path in sorted(output_dir.rglob('*')):
            if file_path.is_file():
                rel_path = str(file_path.relative_to(output_dir))  # Convert to string
                size = file_path.stat().st_size
                if size < 1024:
                    size_str = f"{size}B"
                elif size < 1024 * 1024:
                    size_str = f"{size/1024:.1f}KB"
                else:
                    size_str = f"{size/(1024*1024):.1f}MB"
                print(f"  {rel_path:<40} {size_str:>10}")

        print("\n" + "=" * 80)
        return 0

    except Exception as e:
        logger.error(f"Extraction failed: {e}", exc_info=args.verbose)
        print(f"\nERROR: {e}")
        if not args.verbose:
            print("Run with --verbose for more details")
        return 1


if __name__ == "__main__":
    sys.exit(main())

