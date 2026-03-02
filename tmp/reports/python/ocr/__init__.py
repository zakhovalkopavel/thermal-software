"""
OCR Table Extractor Package
Extracts tables from PDF and image files using OCR and direct extraction methods.
"""

__version__ = "0.1.0"

from .config import ExtractionConfig, LANG_CODES, TESSERACT_CONFIGS
from .extractor import TableExtractor
from .language_detector import LanguageDetector
from .graphics_extractor import GraphicsExtractor
from .enhanced_table_detector import EnhancedTableDetector
from .layout_analyzer import LayoutAnalyzer
from .document_builder import DocumentBuilder
from .scientific_ocr_processor import ScientificOCRProcessor

__all__ = [
    'ExtractionConfig',
    'LANG_CODES',
    'TESSERACT_CONFIGS',
    'TableExtractor',
    'LanguageDetector',
    'GraphicsExtractor',
    'EnhancedTableDetector',
    'LayoutAnalyzer',
    'DocumentBuilder',
    'ScientificOCRProcessor',
]
