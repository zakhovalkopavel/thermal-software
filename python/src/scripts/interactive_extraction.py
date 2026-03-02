#!/usr/bin/env python3
"""
Interactive OCR Extraction with Visual Review
Uses ocr/ modules for all core functionality
"""

import sys
from pathlib import Path
import cv2
from datetime import datetime
import logging

sys.path.insert(0, '/app/src')

from ocr.config import ExtractionConfig
from ocr.extractor import TableExtractor
from ocr.graphics_extractor import GraphicsExtractor
from ocr.layout_analyzer import LayoutAnalyzer
from ocr.document_builder import DocumentBuilder
from ocr.language_detector import LanguageDetector
from ocr.file_manager import FileManager
from ocr.ui.interactive_ui import InteractiveUI

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InteractiveOCRExtractor:
    """Interactive extraction with visual review interface"""

    def __init__(self, file_path: Path, output_dir: Path, config: ExtractionConfig):
        self.file_path = Path(file_path)
        self.output_dir = Path(output_dir)
        self.config = config

        # Initialize ocr modules
        self.file_manager = FileManager(config)

        # Get available Tesseract languages
        available_langs = self._get_available_tesseract_langs()
        logger.info(f"Available Tesseract languages: {', '.join(available_langs)}")

        self.language_detector = LanguageDetector(available_langs)
        self.graphics_extractor = GraphicsExtractor(output_dir / 'graphics', min_size_percent=0.1)
        self.layout_analyzer = LayoutAnalyzer()
        self.table_extractor = TableExtractor(config)
        self.doc_builder = DocumentBuilder(output_dir)

        # UI handler
        self.ui = None
        self.page_images = []
        self.page_regions = {}

    def _get_available_tesseract_langs(self):
        """Get list of actually installed Tesseract language packs"""
        import pytesseract
        try:
            # Get installed languages from Tesseract
            langs_output = pytesseract.get_languages(config='')
            # Filter out 'osd' (orientation and script detection)
            langs = [lang for lang in langs_output if lang != 'osd']
            logger.info(f"Tesseract reports {len(langs)} languages installed")
            return langs if langs else ['eng']  # Fallback to English
        except Exception as e:
            logger.warning(f"Could not get Tesseract languages: {e}, using default set")
            # Fallback to known installed languages based on our Dockerfile
            return ['eng', 'fra', 'deu', 'pol', 'ukr', 'rus', 'jpn', 'chi_tra']

    def _confirm_languages(self, detected_langs):
        """
        Ask user to confirm or modify detected languages

        Args:
            detected_langs: List of auto-detected language codes

        Returns:
            List of confirmed/selected language codes
        """
        print("\n" + "="*80)
        print("LANGUAGE DETECTION")
        print("="*80)
        print(f"Auto-detected languages: {', '.join(detected_langs)}")
        print("="*80)

        while True:
            print("\nOptions:")
            print("  1. Use detected languages (press ENTER)")
            print("  2. Select languages manually")
            print("  3. List all available languages")

            choice = input("\nYour choice [1]: ").strip() or "1"

            if choice == "1":
                # Use detected languages
                print(f"✓ Using detected languages: {', '.join(detected_langs)}")
                return detected_langs

            elif choice == "2":
                # Manual selection
                print("\n" + "-"*80)
                print("Available languages:")
                available_langs = self._get_available_tesseract_langs()
                for i, lang in enumerate(available_langs, 1):
                    print(f"  {i}. {lang}")
                print("-"*80)

                print("\nEnter language codes separated by spaces (e.g., eng fra deu)")
                print("Or enter numbers separated by spaces (e.g., 1 2 3)")
                lang_input = input("Languages: ").strip()

                if not lang_input:
                    print("⚠️ No input, using detected languages")
                    return detected_langs

                # Parse input (could be codes or numbers)
                selected = []
                tokens = lang_input.split()

                for token in tokens:
                    if token.isdigit():
                        # Number input
                        idx = int(token) - 1
                        if 0 <= idx < len(available_langs):
                            selected.append(available_langs[idx])
                        else:
                            print(f"⚠️ Invalid number: {token}")
                    else:
                        # Language code input
                        if token in available_langs:
                            selected.append(token)
                        else:
                            print(f"⚠️ Language not available: {token}")

                if selected:
                    print(f"✓ Using selected languages: {', '.join(selected)}")
                    return selected
                else:
                    print("⚠️ No valid languages selected, using detected")
                    return detected_langs

            elif choice == "3":
                # List all available languages
                print("\n" + "-"*80)
                print("Available Tesseract languages:")
                available_langs = self._get_available_tesseract_langs()
                for i, lang in enumerate(available_langs, 1):
                    is_detected = "✓" if lang in detected_langs else " "
                    print(f"  {is_detected} {i}. {lang}")
                print("-"*80)
                print("(✓ = auto-detected)")
                # Loop back to show options again

            else:
                print("⚠️ Invalid choice, please enter 1, 2, or 3")
                # Loop back to show options again

    def extract_with_review(self):
        """Main workflow: Load → Auto-detect → Review → Extract → Save"""
        print("\n" + "="*80)
        print("INTERACTIVE OCR EXTRACTION")
        print("="*80)
        print(f"File: {self.file_path.name}")
        print("="*80)

        # Step 1: Load and convert
        logger.info("Loading file...")
        self.page_images = self.file_manager.load_document(self.file_path, self.config.dpi)
        total_pages = len(self.page_images)
        logger.info(f"Loaded {total_pages} page(s)")

        # Step 2: Auto-detect languages (unless manually specified)
        if self.config.ocr_lang == 'eng':  # Default not changed, so auto-detect
            logger.info("Auto-detecting languages...")
            detected_langs = self.language_detector.detect_languages(self.page_images[0], max_langs=3)

            # Ask user to confirm or modify detected languages
            final_langs = self._confirm_languages(detected_langs)

            self.config.ocr_lang = self.language_detector.build_lang_string(final_langs)
            logger.info(f"Using languages: {self.config.ocr_lang}")
        else:
            logger.info(f"Using pre-configured languages: {self.config.ocr_lang}")

        # Step 3: Auto-detect regions for all pages
        logger.info("Auto-detecting regions...")
        for page_num in range(1, total_pages + 1):
            self.page_regions[page_num] = self._auto_detect_page_regions(page_num)
            logger.info(f"Page {page_num}: {len(self.page_regions[page_num])} regions detected")

        # Step 4: Visual review with UI
        logger.info("Starting visual review...")
        self.ui = InteractiveUI(self.page_images, self.page_regions)
        self.page_regions = self.ui.review_all_pages()

        # Step 5: Extract approved regions
        logger.info("Processing approved regions...")
        results = self._extract_approved_regions()

        # Step 6: Build and save document
        logger.info("Building document...")
        self.doc_builder.build_document(results, self.file_path.name, total_pages)

        print("\n" + "="*80)
        print("EXTRACTION COMPLETE!")
        print(f"Output: {self.output_dir}")
        print("="*80)

    def _auto_detect_page_regions(self, page_num):
        """Auto-detect regions using layout analyzer and graphics extractor"""
        image = self.page_images[page_num - 1]

        # Analyze layout
        layout = self.layout_analyzer.analyze(image)

        # Extract graphics
        graphics_regions = self.graphics_extractor.detect_graphics(image, min_size_percent=0.1)

        # Merge detections
        regions = []

        # Add graphics
        for graphic in graphics_regions:
            regions.append({
                'bbox': graphic['bbox'],
                'type': 'graphic'
            })

        # Add text blocks (from layout, non-overlapping with graphics)
        for text_block in layout.get('text_blocks', []):
            if not self._overlaps_graphics(text_block['bbox'], graphics_regions):
                regions.append({
                    'bbox': text_block['bbox'],
                    'type': 'text'
                })

        return regions

    def _overlaps_graphics(self, bbox, graphics_regions):
        """Check if bbox overlaps with any graphic region"""
        x, y, w, h = bbox
        for graphic in graphics_regions:
            gx, gy, gw, gh = graphic['bbox']
            margin = 20
            if not (x + w < gx - margin or x > gx + gw + margin or
                   y + h < gy - margin or y > gy + gh + margin):
                return True
        return False

    def _extract_approved_regions(self):
        """Extract OCR from approved regions"""
        pages_data = []

        for page_num in range(1, len(self.page_images) + 1):
            regions = self.page_regions[page_num]
            image = self.page_images[page_num - 1]

            page_content = []

            for idx, region in enumerate(regions):
                if region['type'] == 'ignore':
                    continue

                x, y, w, h = region['bbox']
                cropped = image.crop((x, y, x+w, y+h))

                if region['type'] == 'graphic':
                    # Save graphic using graphics extractor
                    path = self.graphics_extractor.save_graphic(
                        cropped, page_num, idx + 1, self.file_path.stem
                    )
                    page_content.append({
                        'type': 'graphic',
                        'index': idx + 1,
                        'position': {'x': x, 'y': y, 'width': w, 'height': h},
                        'file': str(path.relative_to(self.output_dir))
                    })

                elif region['type'] == 'table':
                    # Extract table using table extractor
                    result = self.table_extractor.extract_table(
                        cropped, self.config.ocr_lang
                    )

                    # Save CSV
                    csv_path = self.output_dir / 'tables' / f"page_{page_num:03d}_table_{idx+1:03d}.csv"
                    csv_path.parent.mkdir(exist_ok=True)
                    with open(csv_path, 'w', encoding='utf-8') as f:
                        f.write(result['text'])

                    page_content.append({
                        'type': 'table',
                        'index': idx + 1,
                        'position': {'x': x, 'y': y, 'width': w, 'height': h},
                        'file': str(csv_path.relative_to(self.output_dir)),
                        'text': result['text']
                    })

                else:  # text
                    result = self.table_extractor.extract_text(
                        cropped, self.config.ocr_lang
                    )
                    page_content.append({
                        'type': 'text',
                        'index': idx + 1,
                        'position': {'x': x, 'y': y, 'width': w, 'height': h},
                        'text': result['text']
                    })

            pages_data.append({
                'page_number': page_num,
                'content_sequence': page_content
            })

        return pages_data


def main():
    """Entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Interactive OCR Extraction with Visual Review')
    parser.add_argument('file', type=str, help='Path to PDF or image file')
    parser.add_argument('--lang', type=str, nargs='+',
                       help='Specify language(s) manually (e.g., eng fra deu). Use --list-langs to see available.')
    parser.add_argument('--list-langs', action='store_true',
                       help='List available Tesseract languages and exit')
    parser.add_argument('--auto-detect-lang', action='store_true', default=True,
                       help='Auto-detect languages (default: True)')
    parser.add_argument('--no-auto-detect-lang', dest='auto_detect_lang', action='store_false',
                       help='Disable auto-detection, use only --lang or default to eng')
    parser.add_argument('--dpi', type=int, default=300,
                       help='DPI for PDF conversion (default: 300)')

    args = parser.parse_args()

    # List available languages and exit
    if args.list_langs:
        import pytesseract
        try:
            langs = pytesseract.get_languages(config='')
            print("Available Tesseract languages:")
            for lang in sorted(langs):
                print(f"  - {lang}")
            return 0
        except Exception as e:
            print(f"Error getting languages: {e}")
            return 1

    file_path = Path(args.file)
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return 1

    # Output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = Path(f"/app/shared/processed/{file_path.stem}_{timestamp}")

    # Config
    config = ExtractionConfig(
        sources_dir=file_path.parent,
        processed_dir=output_dir,
        ocr_lang='eng',  # Will be set below
        dpi=args.dpi
    )

    # Run
    extractor = InteractiveOCRExtractor(file_path, output_dir, config)

    # Handle language selection
    if args.lang:
        # Manual language selection
        manual_langs = args.lang
        logger.info(f"Using manually specified languages: {', '.join(manual_langs)}")
        config.ocr_lang = '+'.join(manual_langs)
        extractor.config.ocr_lang = config.ocr_lang
    elif args.auto_detect_lang:
        # Auto-detection will happen in extract_with_review()
        logger.info("Language auto-detection enabled")
    else:
        # No auto-detect, no manual - use default
        logger.info("Using default language: eng")
        config.ocr_lang = 'eng'

    extractor.extract_with_review()

    return 0


if __name__ == "__main__":
    sys.exit(main())

