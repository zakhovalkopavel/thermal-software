"""
Main OCR extraction orchestrator with multi-language and graphics support
"""

import logging
import json
from pathlib import Path
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import time
import pandas as pd
import cv2
import numpy as np
from PIL import Image
from pdf2image import convert_from_path

from .config import ExtractionConfig
from .file_manager import FileManager
from .image_processing import ImagePreprocessor, TableDetector
from .ocr import OCRExtractor
from .pdf import PDFExtractor
from .language_detector import LanguageDetector
from .graphics_extractor import GraphicsExtractor
from .document_builder import DocumentBuilder
from .enhanced_table_detector import EnhancedTableDetector
from .layout_analyzer import LayoutAnalyzer
from .scientific_ocr_processor import ScientificOCRProcessor

logger = logging.getLogger(__name__)


class TableExtractor:
    """Main orchestrator for OCR extraction from various file formats"""

    def __init__(self, config: ExtractionConfig = None):
        """
        Initialize table extractor

        Args:
            config: Extraction configuration
        """
        self.config = config or ExtractionConfig()

        # Initialize components
        self.file_manager = FileManager(
            self.config.sources_dir,
            self.config.processed_dir,
            self.config.supported_extensions
        )

        self.preprocessor = ImagePreprocessor()

        self.table_detector = TableDetector(
            min_area=self.config.min_table_area,
            h_kernel=self.config.line_kernel_horizontal,
            v_kernel=self.config.line_kernel_vertical
        )

        self.ocr_extractor = OCRExtractor(
            lang=self.config.ocr_lang,
            psm_mode=self.config.get_tesseract_config()
        )

        self.pdf_extractor = PDFExtractor()

        # Initialize language detector if auto-detection is enabled
        self.language_detector: Optional[LanguageDetector] = None
        if self.config.auto_detect_lang:
            self.language_detector = LanguageDetector(self.config.fallback_langs)
            logger.info("Language auto-detection enabled")

        # Initialize graphics extractor if enabled
        self.graphics_extractor: Optional[GraphicsExtractor] = None

        # Initialize document builder
        self.document_builder: Optional[DocumentBuilder] = None

        # Initialize enhanced table detector (wraps existing TableDetector)
        self.enhanced_table_detector = EnhancedTableDetector(self.table_detector, self.config)

        # Initialize layout analyzer for multi-column detection
        self.layout_analyzer = LayoutAnalyzer(min_column_gap=30)

        # Initialize scientific OCR processor for special symbols
        self.scientific_processor = ScientificOCRProcessor()

    def process_image(self, image_path: Path, page_num: int = 1) -> List[pd.DataFrame]:
        """
        Process an image file and extract tables

        Args:
            image_path: Path to image file
            page_num: Page number (for multi-page documents)

        Returns:
            List of extracted tables as DataFrames
        """
        logger.info(f"Processing image: {image_path.name}")

        # Load image with PIL
        try:
            pil_image = Image.open(str(image_path))
            image = np.array(pil_image)
            logger.info(f"Loaded image with PIL: shape={image.shape}")
        except Exception as e:
            logger.error(f"Failed to load image: {image_path} - {e}")
            return []

        # Detect language if auto-detection enabled
        if self.language_detector:
            detected_lang = self.language_detector.detect_and_build(pil_image)
            logger.info(f"Detected language(s): {detected_lang}")
            # Update OCR extractor with detected language
            self.ocr_extractor.lang = detected_lang

        # Extract graphics if enabled
        if self.graphics_extractor:
            source_name = image_path.stem
            graphics_paths, graphics_meta = self.graphics_extractor.extract_graphics(
                pil_image, page_num, source_name
            )
            self.all_graphics_metadata.extend(graphics_meta)
            if graphics_paths:
                logger.info(f"Extracted {len(graphics_paths)} graphics from {image_path.name}")

        return self._extract_from_image(image)

    def process_pdf(self, pdf_path: Path, method: str = 'auto') -> List[pd.DataFrame]:
        """
        Process a PDF file and extract tables

        Args:
            pdf_path: Path to PDF file
            method: Extraction method ('auto', 'direct', 'ocr')

        Returns:
            List of extracted tables as DataFrames
        """
        logger.info(f"Processing PDF: {pdf_path.name}")

        # Try direct extraction first (unless method is 'ocr')
        if method in ['auto', 'direct']:
            tables = self.pdf_extractor.extract(pdf_path)
            if tables:
                logger.info(f"Direct extraction: {len(tables)} table(s)")
                return tables

        # Fall back to OCR
        if method in ['auto', 'ocr']:
            return self._extract_pdf_via_ocr(pdf_path)

        return []

    def process_file(self, file_path: Path, method: str = 'auto') -> List[Path]:
        """
        Process a file and save extracted tables

        Args:
            file_path: Path to file
            method: Extraction method

        Returns:
            List of saved output file paths
        """
        print(f"\nProcessing: {file_path.name}")
        print("=" * 60)

        # Reset graphics metadata for this file
        self.all_graphics_metadata = []

        # Extract tables based on file type
        if file_path.suffix.lower() in self.config.pdf_extensions:
            tables = self.process_pdf(file_path, method)
        elif file_path.suffix.lower() in self.config.image_extensions:
            tables = self.process_image(file_path)
        else:
            logger.error(f"Unsupported file type: {file_path.suffix}")
            return []

        # Save graphics metadata if any were extracted
        if self.graphics_extractor and self.all_graphics_metadata:
            source_name = file_path.stem
            metadata_file = self.graphics_extractor.save_metadata(
                self.all_graphics_metadata, source_name
            )
            print(f"\nExtracted {len(self.all_graphics_metadata)} graphics")
            print(f"Graphics metadata: {metadata_file.relative_to(Path('/app'))}")

        # Save results
        if tables:
            print(f"\nFound {len(tables)} table(s)")
            saved_files = self.file_manager.save_tables(tables, file_path)

            if saved_files:
                print(f"\nResults saved:")
                for file in saved_files:
                    rel_path = file.relative_to(Path("/app"))
                    print(f"  - {rel_path}")
                return saved_files
            else:
                print("\nNo tables could be saved")
                return []
        else:
            print("\nNo tables found")
            return []

    def interactive_mode(self):
        """Run in interactive mode"""
        print("\n" + "=" * 60)
        print("  OCR Table Extractor")
        print("=" * 60)

        try:
            # Get search term
            search_term = input("\nEnter filename or search term: ").strip()

            if not search_term:
                print("No search term provided")
                return

            # Search for files
            matching_files = self.file_manager.search_files(search_term)

            # Let user select file
            selected_file = self.file_manager.select_file_interactive(matching_files)

            if not selected_file:
                return

            # Process the file
            saved_files = self.process_file(selected_file)

            if saved_files:
                print("\n" + "=" * 60)
                print("Extraction complete!")
                print("=" * 60)

        except KeyboardInterrupt:
            print("\n\nCancelled by user.")
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            print(f"\nError: {e}")

    def _extract_from_image(self, image: np.ndarray) -> List[pd.DataFrame]:
        """Extract tables from a single image"""
        tables = []

        # TEMPORARY: Skip preprocessing until opencv is installed
        # Use raw image directly with coordinate-based OCR
        logger.info("Processing image without preprocessing (opencv not available)")
        df = self.ocr_extractor.extract_table(image)
        if not df.empty:
            tables.append(df)

        return tables

    def _extract_pdf_via_ocr(self, pdf_path: Path) -> List[pd.DataFrame]:
        """Extract tables from PDF using OCR"""
        logger.info("Using OCR-based extraction...")
        tables = []

        try:
            # Convert PDF to images
            images = convert_from_path(str(pdf_path), dpi=self.config.dpi)
            logger.info(f"Converted PDF to {len(images)} image(s)")

            source_name = pdf_path.stem

            for page_num, pil_image in enumerate(images, 1):
                logger.info(f"Processing page {page_num}/{len(images)}...")

                # Detect language if auto-detection enabled (sample first few pages)
                if self.language_detector and page_num <= 3:
                    detected_lang = self.language_detector.detect_and_build(pil_image)
                    logger.info(f"Page {page_num} - Detected language(s): {detected_lang}")
                    # Update OCR extractor with detected language
                    self.ocr_extractor.lang = detected_lang

                # Extract graphics if enabled
                if self.graphics_extractor:
                    graphics_paths, graphics_meta = self.graphics_extractor.extract_graphics(
                        pil_image, page_num, source_name
                    )
                    self.all_graphics_metadata.extend(graphics_meta)
                    if graphics_paths:
                        logger.info(f"Page {page_num}: Extracted {len(graphics_paths)} graphics")

                # Convert PIL Image to numpy array
                image_np = np.array(pil_image)

                # Extract from image
                page_tables = self._extract_from_image(image_np)
                tables.extend(page_tables)

        except Exception as e:
            logger.error(f"OCR-based PDF extraction failed: {e}")

        return tables

    def process_file_with_structure(self, file_path: Path) -> Dict[str, Any]:
        """
        Process a file and create complete document.json structure

        Args:
            file_path: Path to PDF or image file

        Returns:
            Dict with processing results and file paths
        """
        logger.info(f"Processing file with full structure: {file_path.name}")
        start_time = time.time()

        # Create output directory for this document with timestamp (versioning)
        doc_name = file_path.stem
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_dir_name = f"{doc_name}_{timestamp}"
        output_dir = self.config.processed_dir / output_dir_name
        output_dir.mkdir(parents=True, exist_ok=True)

        logger.info(f"Output directory: {output_dir_name}")

        # Create subdirectories for tables and graphics
        tables_dir = output_dir / "tables"
        graphics_dir = output_dir / "graphics"
        tables_dir.mkdir(exist_ok=True)
        graphics_dir.mkdir(exist_ok=True)

        # Initialize extractors for this document
        if self.config.extract_graphics:
            self.graphics_extractor = GraphicsExtractor(
                graphics_dir=graphics_dir,
                min_size=self.config.min_graphic_size,
                edge_density_threshold=self.config.edge_density_threshold
            )

        self.document_builder = DocumentBuilder(output_dir)

        # Convert PDF to images or load single image
        if file_path.suffix.lower() in self.config.pdf_extensions:
            images = convert_from_path(str(file_path), dpi=self.config.dpi)
            logger.info(f"Converted PDF to {len(images)} image(s)")
        else:
            images = [Image.open(str(file_path))]
            logger.info(f"Loaded single image")

        # Detect language (sample first page)
        detected_languages = ['eng']
        if self.language_detector and images:
            detected_languages = self.language_detector.detect_languages(
                images[0],
                max_langs=self.config.max_languages
            )
            lang_string = self.language_detector.build_lang_string(detected_languages)
            self.ocr_extractor.lang = lang_string
            logger.info(f"Using languages: {lang_string}")

        # Process each page
        pages_data = []

        for page_num, pil_image in enumerate(images, 1):
            logger.info(f"Processing page {page_num}/{len(images)}")

            # Save page image for visual review tool
            page_image_path = output_dir / f"page_{page_num:03d}_full.png"
            pil_image.save(page_image_path)
            logger.info(f"Saved page image: {page_image_path.name}")

            page_data = self._process_page(
                pil_image,
                page_num,
                doc_name,
                tables_dir,
                graphics_dir
            )
            pages_data.append(page_data)

        # Build complete document.json
        extraction_duration = time.time() - start_time
        metadata = {
            'extraction_date': datetime.utcnow().isoformat() + 'Z',
            'extraction_duration_seconds': round(extraction_duration, 2),
            'languages_detected': detected_languages,
            'config': {
                'dpi': self.config.dpi,
                'psm': self.config.psm,
                'oem': self.config.oem,
                'scientific_mode': self.config.psm == 6,
                'extract_graphics': self.config.extract_graphics,
                'auto_detect_lang': self.config.auto_detect_lang
            }
        }

        document_json_path = self.document_builder.build_document_json(
            source_file=file_path.name,
            pages_data=pages_data,
            metadata=metadata
        )

        logger.info(f"Processing complete: {extraction_duration:.2f}s")

        return {
            'source_file': file_path.name,
            'total_pages': len(pages_data),
            'text_blocks': sum(len([i for i in p['content_sequence'] if i['type'] == 'text']) for p in pages_data),
            'tables': sum(len([i for i in p['content_sequence'] if i['type'] == 'table']) for p in pages_data),
            'graphics': sum(len([i for i in p['content_sequence'] if i['type'] == 'graphic']) for p in pages_data),
            'document_json': str(document_json_path),
            'output_dir': str(output_dir)
        }

    def _process_page(
        self,
        pil_image: Image.Image,
        page_num: int,
        doc_name: str,
        tables_dir: Path,
        graphics_dir: Path
    ) -> Dict[str, Any]:
        """
        Process a single page and extract all content

        Args:
            pil_image: PIL Image of the page
            page_num: Page number
            doc_name: Document name
            tables_dir: Directory to save table CSV files
            graphics_dir: Directory to save graphics

        Returns:
            Dict with page data including content_sequence
        """
        logger.info(f"Extracting content from page {page_num}")

        # Convert to numpy array for processing
        image_np = np.array(pil_image)

        # Extract text blocks with OCR
        text_blocks = self._extract_text_blocks(image_np, page_num)

        # Extract tables
        tables = self._extract_tables(image_np, page_num, doc_name, tables_dir)

        # Extract graphics
        graphics = []
        if self.graphics_extractor:
            graphics = self._extract_graphics_with_metadata(
                pil_image, page_num, doc_name
            )

        # Build content sequence maintaining document order
        content_sequence = self.document_builder.build_content_sequence(
            text_blocks, tables, graphics
        )

        # Generate summaries
        page_data = {
            'page_number': page_num,
            'content_sequence': content_sequence
        }

        summary_text = self.document_builder.generate_page_summary_text(page_data)
        summary_html = self.document_builder.generate_page_summary_html(page_data)

        page_data['summary_text'] = summary_text
        page_data['summary_html'] = summary_html

        return page_data

    def _extract_text_blocks(
        self,
        image: np.ndarray,
        page_num: int
    ) -> List[Dict[str, Any]]:
        """Extract text blocks from image using OCR, respecting column layout"""
        import pytesseract

        # Get detailed OCR data with bounding boxes
        ocr_data = pytesseract.image_to_data(
            image,
            lang=self.ocr_extractor.lang,
            output_type=pytesseract.Output.DICT
        )

        # Detect column layout
        columns = self.layout_analyzer.detect_columns(image)

        if len(columns) > 1:
            logger.info(f"Multi-column layout detected: {len(columns)} columns")
            # Split OCR data by columns
            column_data = self.layout_analyzer.split_content_by_columns(ocr_data, columns)

            # Extract text blocks from each column
            text_blocks = []
            for col_idx, col_ocr in enumerate(column_data):
                col_blocks = self._extract_blocks_from_ocr_data(col_ocr, col_idx + 1)
                text_blocks.extend(col_blocks)
        else:
            # Single column - process normally
            text_blocks = self._extract_blocks_from_ocr_data(ocr_data, 1)

        logger.info(f"Extracted {len(text_blocks)} text blocks from page {page_num}")
        return text_blocks

    def _extract_blocks_from_ocr_data(
        self,
        ocr_data: Dict,
        column_num: int
    ) -> List[Dict[str, Any]]:
        """Extract text blocks from OCR data for a single column"""
        # Collect all words with positions
        words = []
        for i, text in enumerate(ocr_data['text']):
            if not text.strip() or ocr_data['conf'][i] < 0:
                continue

            words.append({
                'text': text,
                'x': ocr_data['left'][i],
                'y': ocr_data['top'][i],
                'width': ocr_data['width'][i],
                'height': ocr_data['height'][i],
                'bottom': ocr_data['top'][i] + ocr_data['height'][i]
            })

        if not words:
            return []

        # Sort by vertical position
        words.sort(key=lambda w: w['y'])

        # Group into blocks based on vertical gaps
        text_blocks = []
        current_block_words = [words[0]]

        for word in words[1:]:
            # Calculate gap from previous word
            prev_word = current_block_words[-1]
            gap = word['y'] - prev_word['bottom']

            # If gap is large (more than 1.5x average line height), start new block
            avg_height = sum(w['height'] for w in current_block_words) / len(current_block_words)
            threshold = avg_height * 1.5

            if gap > threshold:
                # Finalize current block
                if current_block_words:
                    block = self._create_block_from_words(current_block_words, column_num)
                    if block:
                        text_blocks.append(block)

                # Start new block
                current_block_words = [word]
            else:
                current_block_words.append(word)

        # Add final block
        if current_block_words:
            block = self._create_block_from_words(current_block_words, column_num)
            if block:
                text_blocks.append(block)

        return text_blocks

    def _create_block_from_words(
        self,
        words: List[Dict],
        column_num: int
    ) -> Optional[Dict[str, Any]]:
        """Create a text block from a list of words"""
        if not words:
            return None

        # Combine text
        text = ' '.join(w['text'] for w in words)

        # Skip very short blocks
        if len(text.strip()) < self.config.min_text_block_length:
            return None

        # Calculate bounding box
        x_min = min(w['x'] for w in words)
        y_min = min(w['y'] for w in words)
        x_max = max(w['x'] + w['width'] for w in words)
        y_max = max(w['y'] + w['height'] for w in words)

        return {
            'text': text.strip(),
            'position': {
                'x': int(x_min),
                'y': int(y_min),
                'width': int(x_max - x_min),
                'height': int(y_max - y_min)
            },
            'column': column_num
        }

    def _extract_tables(
        self,
        image: np.ndarray,
        page_num: int,
        doc_name: str,
        tables_dir: Path
    ) -> List[Dict[str, Any]]:
        """Extract tables using enhanced detection (borderless + bordered)"""
        import pytesseract

        tables_list = []

        # Get OCR data for alignment-based detection
        try:
            ocr_data = pytesseract.image_to_data(
                image,
                lang=self.ocr_extractor.lang,
                output_type=pytesseract.Output.DICT
            )
        except Exception as e:
            logger.warning(f"Failed to get OCR data for table detection: {e}")
            ocr_data = None

        # Preprocess image for line-based detection
        try:
            preprocessed = self.preprocessor.preprocess(image)
        except Exception as e:
            logger.warning(f"Failed to preprocess image for table detection: {e}")
            # Fallback to grayscale
            if len(image.shape) == 3:
                preprocessed = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                preprocessed = image

        # Use enhanced multi-strategy detection
        try:
            table_regions = self.enhanced_table_detector.detect_all_tables(
                preprocessed,
                ocr_data
            )
        except Exception as e:
            logger.warning(f"Enhanced table detection failed: {e}")
            table_regions = []

        for table_idx, (x, y, w, h) in enumerate(table_regions, 1):
            # Extract table region
            table_image = image[y:y+h, x:x+w]

            # OCR the table
            df = self.ocr_extractor.extract_table(table_image)

            if not df.empty and len(df) > 0:
                # Apply scientific notation processing
                self.scientific_processor.process_table_data(df)

                # Save CSV file
                filename = f"page_{page_num:03d}_table_{table_idx:03d}.csv"
                csv_path = tables_dir / filename
                df.to_csv(csv_path, index=False, encoding='utf-8')

                # Convert column headers to strings (with scientific notation)
                column_headers = [str(col) for col in df.columns.tolist()]

                # Convert preview rows to strings
                preview_rows = []
                for row in df.head(3).values.tolist():
                    preview_rows.append([str(cell) if cell is not None else '' for cell in row])

                # Build metadata
                tables_list.append({
                    'file': f"tables/{filename}",
                    'description': f"Table {table_idx}",
                    'rows': len(df),
                    'columns': len(df.columns),
                    'column_headers': column_headers,
                    'preview_rows': preview_rows,
                    'position': {'x': int(x), 'y': int(y), 'width': int(w), 'height': int(h)},
                    'filename': filename,
                    'page': page_num,
                    'table_number': table_idx,
                    'has_headers': True,
                    'extracted_at': datetime.utcnow().isoformat() + 'Z'
                })

                logger.info(f"Saved table: {filename} ({len(df)} rows x {len(df.columns)} cols)")

        return tables_list

    def _extract_graphics_with_metadata(
        self,
        pil_image: Image.Image,
        page_num: int,
        doc_name: str
    ) -> List[Dict[str, Any]]:
        """Extract graphics and return metadata"""
        graphics_list = []

        # Extract graphics using GraphicsExtractor
        saved_paths, metadata_list = self.graphics_extractor.extract_graphics(
            pil_image, page_num, doc_name
        )

        # Transform metadata to include file reference
        for idx, meta in enumerate(metadata_list, 1):
            graphics_list.append({
                'file': f"graphics/{meta['filename']}",
                'description': f"Graphic {idx}",
                'graphic_type': 'unknown',  # Can be enhanced with ML classification
                'edge_density': meta['edge_density'],
                'file_size_bytes': saved_paths[idx-1].stat().st_size if idx-1 < len(saved_paths) else 0,
                'position': meta['position'],
                'filename': meta['filename'],
                'page': page_num,
                'graphic_number': idx,
                'extracted_at': meta['extracted_at']
            })

        return graphics_list
