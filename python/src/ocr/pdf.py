"""
Direct PDF table extraction (without OCR)
"""

import logging
from pathlib import Path
from typing import List
import pandas as pd

logger = logging.getLogger(__name__)

# Optional imports
try:
    import tabula
    TABULA_AVAILABLE = True
except ImportError:
    TABULA_AVAILABLE = False
    logger.warning("tabula-py not available")

try:
    import camelot
    CAMELOT_AVAILABLE = True
except ImportError:
    CAMELOT_AVAILABLE = False
    logger.warning("camelot-py not available")


class PDFExtractor:
    """Handles direct PDF table extraction without OCR"""

    def __init__(self, min_accuracy: float = 50.0):
        """
        Initialize PDF extractor

        Args:
            min_accuracy: Minimum accuracy threshold for Camelot tables
        """
        self.min_accuracy = min_accuracy

    def extract_with_camelot(self, pdf_path: Path, flavor: str = 'lattice') -> List[pd.DataFrame]:
        """
        Extract tables using Camelot

        Args:
            pdf_path: Path to PDF file
            flavor: 'lattice' or 'stream'

        Returns:
            List of extracted tables as DataFrames
        """
        if not CAMELOT_AVAILABLE:
            return []

        try:
            logger.info(f"Attempting Camelot extraction ({flavor})...")
            tables = camelot.read_pdf(str(pdf_path), pages='all', flavor=flavor)

            if len(tables) == 0:
                return []

            logger.info(f"Camelot ({flavor}) found {len(tables)} table(s)")

            # Filter by accuracy
            result = []
            for table in tables:
                if hasattr(table, 'accuracy') and table.accuracy >= self.min_accuracy:
                    result.append(table.df)
                elif not hasattr(table, 'accuracy'):
                    result.append(table.df)

            return result

        except Exception as e:
            logger.warning(f"Camelot ({flavor}) extraction failed: {e}")
            return []

    def extract_with_tabula(self, pdf_path: Path) -> List[pd.DataFrame]:
        """
        Extract tables using Tabula

        Args:
            pdf_path: Path to PDF file

        Returns:
            List of extracted tables as DataFrames
        """
        if not TABULA_AVAILABLE:
            return []

        try:
            logger.info("Attempting Tabula extraction...")
            tables = tabula.read_pdf(str(pdf_path), pages='all', multiple_tables=True)

            if tables and len(tables) > 0:
                logger.info(f"Tabula found {len(tables)} table(s)")
                return tables

            return []

        except Exception as e:
            logger.warning(f"Tabula extraction failed: {e}")
            return []

    def extract(self, pdf_path: Path) -> List[pd.DataFrame]:
        """
        Try all available direct extraction methods

        Args:
            pdf_path: Path to PDF file

        Returns:
            List of extracted tables as DataFrames
        """
        # Try Camelot lattice first (best for bordered tables)
        tables = self.extract_with_camelot(pdf_path, flavor='lattice')
        if tables:
            return tables

        # Try Camelot stream (for tables without borders)
        tables = self.extract_with_camelot(pdf_path, flavor='stream')
        if tables:
            return tables

        # Try Tabula
        tables = self.extract_with_tabula(pdf_path)
        if tables:
            return tables

        logger.info("No tables found via direct extraction")
        return []

