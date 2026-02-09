"""
Main table extraction orchestrator
"""

import logging
from pathlib import Path
from typing import List
import pandas as pd
import cv2
import numpy as np
from pdf2image import convert_from_path

from .config import ExtractionConfig
from .file_manager import FileManager
from .image_processing import ImagePreprocessor, TableDetector
from .ocr import OCRExtractor
from .pdf import PDFExtractor

logger = logging.getLogger(__name__)


class TableExtractor:
    """Main orchestrator for table extraction from various file formats"""

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
            psm_mode=self.config.psm_mode
        )

        self.pdf_extractor = PDFExtractor()

    def process_image(self, image_path: Path) -> List[pd.DataFrame]:
        """
        Process an image file and extract tables

        Args:
            image_path: Path to image file

        Returns:
            List of extracted tables as DataFrames
        """
        logger.info(f"Processing image: {image_path.name}")

        # Use PIL to load (opencv not available until rebuild)
        try:
            from PIL import Image
            pil_image = Image.open(str(image_path))
            image = np.array(pil_image)
            logger.info(f"Loaded image with PIL: shape={image.shape}")
        except Exception as e:
            logger.error(f"Failed to load image: {image_path} - {e}")
            return []

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

        # Extract tables based on file type
        if file_path.suffix.lower() in self.config.pdf_extensions:
            tables = self.process_pdf(file_path, method)
        elif file_path.suffix.lower() in self.config.image_extensions:
            tables = self.process_image(file_path)
        else:
            logger.error(f"Unsupported file type: {file_path.suffix}")
            return []

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

            for page_num, image in enumerate(images, 1):
                logger.info(f"Processing page {page_num}/{len(images)}...")

                # Convert PIL Image to numpy array
                image_np = np.array(image)

                # Extract from image
                page_tables = self._extract_from_image(image_np)
                tables.extend(page_tables)

        except Exception as e:
            logger.error(f"OCR-based PDF extraction failed: {e}")

        return tables

