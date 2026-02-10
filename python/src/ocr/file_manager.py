"""
File handling utilities
"""

import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime
import pandas as pd
from PIL import Image
from pdf2image import convert_from_path

logger = logging.getLogger(__name__)


class FileManager:
    """Manages file operations for extraction"""

    def __init__(self, config=None):
        """Initialize file manager with optional config"""
        if config:
            self.sources_dir = Path(config.sources_dir)
            self.processed_dir = Path(config.processed_dir)
            self.supported_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff'}
        else:
            self.sources_dir = None
            self.processed_dir = None
            self.supported_extensions = {'.pdf', '.png', '.jpg', '.jpeg', '.tif', '.tiff'}

    def load_document(self, file_path: Path, dpi: int = 300) -> List[Image.Image]:
        """
        Load document and convert to PIL Images

        Args:
            file_path: Path to PDF or image file
            dpi: DPI for PDF conversion

        Returns:
            List of PIL Image objects (one per page)
        """
        file_path = Path(file_path)

        if file_path.suffix.lower() == '.pdf':
            logger.info(f"Converting PDF to images at {dpi} DPI...")
            return convert_from_path(str(file_path), dpi=dpi)
        elif file_path.suffix.lower() in {'.png', '.jpg', '.jpeg', '.tif', '.tiff'}:
            logger.info(f"Loading image: {file_path.name}")
            return [Image.open(str(file_path))]
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")

    def search_files(self, search_term: str) -> List[Path]:
        """
        Search for files matching the search term

        Args:
            search_term: Filename or partial filename

        Returns:
            List of matching file paths
        """
        search_pattern = f"*{search_term}*"
        matching_files = []

        # Search with extension patterns
        for ext in self.supported_extensions:
            pattern = f"{search_pattern}{ext}"
            matching_files.extend(self.sources_dir.glob(pattern))

        # Case-insensitive fallback
        if not matching_files:
            all_files = [f for f in self.sources_dir.iterdir() if f.is_file()]
            search_lower = search_term.lower()
            matching_files = [
                f for f in all_files
                if search_lower in f.name.lower()
                and f.suffix.lower() in self.supported_extensions
            ]

        return sorted(matching_files)

    def select_file_interactive(self, files: List[Path]) -> Optional[Path]:
        """
        Display files and prompt user to select one

        Args:
            files: List of file paths

        Returns:
            Selected file path or None
        """
        if not files:
            print("\nNo matching files found.")
            return None

        print(f"\nFound {len(files)} matching file(s):")
        for idx, file in enumerate(files, 1):
            file_size = file.stat().st_size / 1024  # KB
            print(f"  {idx}. {file.name} ({file_size:.1f} KB)")

        while True:
            try:
                choice = input(
                    f"\nSelect file number to process (1-{len(files)}, or 0 to cancel): "
                )
                choice_num = int(choice)

                if choice_num == 0:
                    print("Cancelled by user.")
                    return None

                if 1 <= choice_num <= len(files):
                    return files[choice_num - 1]
                else:
                    print(f"Please enter a number between 1 and {len(files)}")

            except ValueError:
                print("Please enter a valid number")
            except KeyboardInterrupt:
                print("\n\nCancelled by user.")
                return None

    def save_tables(self, tables: List[pd.DataFrame],
                   source_file: Path) -> List[Path]:
        """
        Save extracted tables to CSV files

        Args:
            tables: List of DataFrames to save
            source_file: Original source file path

        Returns:
            List of saved file paths
        """
        saved_files = []
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_name = source_file.stem

        for idx, df in enumerate(tables, 1):
            if df.empty:
                continue

            # Generate output filename
            output_name = f"{base_name}_table_{idx}_{timestamp}.csv"
            output_path = self.processed_dir / output_name

            # Create metadata header
            metadata = self._create_metadata(source_file, idx, len(tables), df)

            # Save CSV with metadata
            try:
                with open(output_path, 'w', encoding='utf-8') as f:
                    f.write(metadata)

                df.to_csv(output_path, mode='a', index=False, encoding='utf-8')
                saved_files.append(output_path)
                logger.info(f"Saved: {output_name}")

            except Exception as e:
                logger.error(f"Failed to save {output_name}: {e}")

        return saved_files

    def _create_metadata(self, source_file: Path, table_num: int,
                        total_tables: int, df: pd.DataFrame) -> str:
        """Create metadata header for CSV file"""
        metadata = f"# Source: {source_file.name}\n"
        metadata += f"# Extracted: {datetime.now().isoformat()}\n"
        metadata += f"# Table: {table_num}/{total_tables}\n"
        metadata += f"# Rows: {len(df)}, Columns: {len(df.columns)}\n"
        return metadata

