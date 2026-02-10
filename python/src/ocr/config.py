"""
Configuration management for OCR Table Extractor
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Set, List, Optional


# Language code mappings
LANG_CODES = {
    'english': 'eng',
    'french': 'fra',
    'german': 'deu',
    'czech': 'ces',
    'polish': 'pol',
    'ukrainian': 'ukr',
    'russian': 'rus',
    'japanese': 'jpn',
    'chinese': 'chi_sim',
    'chinese_traditional': 'chi_tra'
}

# Tesseract configuration presets
TESSERACT_CONFIGS = {
    'default': '--psm 3 --oem 3',
    'scientific': '--psm 6 --oem 3 -c preserve_interword_spaces=1 -c load_system_dawg=0 -c load_freq_dawg=0',
    'mixed': '--psm 4 --oem 3'
}


@dataclass
class ExtractionConfig:
    """Configuration for OCR extraction with multi-language and graphics support"""

    # Directories
    sources_dir: Path = Path("/app/shared/sources")
    processed_dir: Path = Path("/app/shared/processed")

    # Language settings
    ocr_lang: str = "eng"
    auto_detect_lang: bool = False
    fallback_langs: Optional[List[str]] = None
    max_languages: int = 3

    # OCR settings
    dpi: int = 300
    psm: int = 3  # Page segmentation mode
    oem: int = 3  # OCR Engine mode (LSTM)
    preserve_interword_spaces: bool = True

    # Content extraction
    extract_graphics: bool = False

    # Graphics extraction settings
    min_graphic_size: int = 50  # Lowered to detect smaller graphics
    edge_density_threshold: float = 0.03  # Lowered to 0.03 to detect borderless tables/formulas
    max_graphics_per_page: int = 20

    # Text extraction (always enabled, stored inline in JSON)
    min_text_block_length: int = 10
    text_block_separator: str = "\n\n"

    # Table detection settings
    min_table_area: int = 1500  # Lowered to detect smaller tables
    line_kernel_horizontal: tuple = (40, 1)
    line_kernel_vertical: tuple = (1, 40)

    # Summary generation (always enabled, embedded in document.json)
    html_template_path: Optional[Path] = None

    # File type settings
    image_extensions: Set[str] = None
    pdf_extensions: Set[str] = None

    # Legacy compatibility
    psm_mode: Optional[str] = None

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

        # Setup fallback languages for auto-detection
        if self.fallback_langs is None:
            self.fallback_langs = ['eng', 'fra', 'deu', 'ces', 'pol', 'ukr', 'rus', 'jpn', 'chi_sim']

        # Handle legacy psm_mode
        if self.psm_mode is not None:
            # Extract PSM number from legacy format "--psm 3"
            import re
            match = re.search(r'--psm\s+(\d+)', self.psm_mode)
            if match:
                self.psm = int(match.group(1))

    @property
    def supported_extensions(self) -> Set[str]:
        """Get all supported file extensions"""
        return self.image_extensions | self.pdf_extensions

    def get_tesseract_config(self, scientific: bool = False) -> str:
        """
        Get Tesseract configuration string

        Args:
            scientific: Whether to use scientific mode

        Returns:
            Tesseract config string
        """
        if scientific or self.preserve_interword_spaces:
            return TESSERACT_CONFIGS['scientific']
        return TESSERACT_CONFIGS['default']

