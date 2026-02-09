"""
Configuration management for OCR Table Extractor
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Set


@dataclass
class ExtractionConfig:
    """Configuration for table extraction"""

    # Directories
    sources_dir: Path = Path("/app/shared/sources")
    processed_dir: Path = Path("/app/shared/processed")

    # OCR settings
    ocr_lang: str = "eng"
    dpi: int = 300

    # File type settings
    image_extensions: Set[str] = None
    pdf_extensions: Set[str] = None

    # Table detection settings
    min_table_area: int = 10000
    line_kernel_horizontal: tuple = (40, 1)
    line_kernel_vertical: tuple = (1, 40)

    # OCR settings
    psm_mode: str = "--psm 3"  # PSM 3: fully automatic page segmentation (best for tables)

    def __post_init__(self):
        """Initialize default values"""
        if self.image_extensions is None:
            self.image_extensions = {'.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.gif'}
        if self.pdf_extensions is None:
            self.pdf_extensions = {'.pdf'}

        # Ensure directories are Path objects
        self.sources_dir = Path(self.sources_dir)
        self.processed_dir = Path(self.processed_dir)

        # Create directories if they don't exist
        self.sources_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)

    @property
    def supported_extensions(self) -> Set[str]:
        """Get all supported file extensions"""
        return self.image_extensions | self.pdf_extensions

