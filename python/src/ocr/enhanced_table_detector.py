"""
Enhanced table detection for borderless tables and complex layouts
"""

import logging
from typing import List, Tuple, Dict, Any, Optional
import numpy as np
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


class EnhancedTableDetector:
    """
    Multi-strategy table detector that can find:
    - Bordered tables (line-based)
    - Borderless tables (alignment-based)
    - Tables with partial borders (hybrid)
    """

    def __init__(self, line_detector, config):
        """
        Initialize enhanced table detector

        Args:
            line_detector: Existing TableDetector for line-based detection
            config: ExtractionConfig with detection parameters
        """
        self.line_detector = line_detector
        self.config = config
        self.min_rows = 2  # Lowered from 3 to catch smaller tables
        self.min_cols = 2
        self.alignment_threshold = 15  # Increased tolerance for alignment
        self.min_confidence = 20  # Lowered minimum OCR confidence

        # Smart size limits based on aspect ratio and page proportion
        self.min_table_width = 100    # Minimum table width
        self.min_table_height = 50    # Minimum table height
        # Max sizes are percentage of typical page size (2480x3508 at 300 DPI)
        self.max_table_width_ratio = 0.9   # 90% of page width
        self.max_table_height_ratio = 0.85  # 85% of page height

    def detect_all_tables(
        self,
        image: np.ndarray,
        ocr_data: Optional[Dict] = None
    ) -> List[Tuple[int, int, int, int]]:
        """
        Combine multiple detection strategies to find all tables

        Args:
            image: Preprocessed image
            ocr_data: Optional pre-computed OCR data

        Returns:
            List of bounding boxes (x, y, w, h) for detected tables
        """
        logger.info("Running enhanced table detection (multi-strategy)")

        tables = []

        # Strategy 1: Line-based detection (bordered tables)
        try:
            line_tables = self.line_detector.detect_tables(image)
            tables.extend(line_tables)
            logger.info(f"Line-based detection found {len(line_tables)} tables")
        except Exception as e:
            logger.warning(f"Line-based detection failed: {e}")

        # Strategy 2: Alignment-based detection (borderless tables)
        try:
            if ocr_data is None:
                import pytesseract
                ocr_data = pytesseract.image_to_data(
                    image,
                    output_type=pytesseract.Output.DICT
                )

            alignment_tables = self.detect_by_alignment(ocr_data)
            tables.extend(alignment_tables)
            logger.info(f"Alignment-based detection found {len(alignment_tables)} tables")
        except Exception as e:
            logger.warning(f"Alignment-based detection failed: {e}")

        # Filter by size limits BEFORE merging
        tables = self._filter_by_size(tables, image_shape=image.shape if hasattr(image, 'shape') else None)

        # Remove duplicates and overlapping regions
        tables = self._merge_overlapping_regions(tables)

        logger.info(f"Total unique tables detected: {len(tables)}")
        return tables

    def detect_by_alignment(self, ocr_data: Dict) -> List[Tuple[int, int, int, int]]:
        """
        Detect tables by analyzing text alignment patterns

        Args:
            ocr_data: pytesseract.image_to_data() output dictionary

        Returns:
            List of table bounding boxes
        """
        # Filter out low-confidence and empty words
        words = []
        for i in range(len(ocr_data['text'])):
            conf = int(ocr_data['conf'][i])
            text = ocr_data['text'][i].strip()

            if conf >= self.min_confidence and text:
                words.append({
                    'text': text,
                    'left': ocr_data['left'][i],
                    'top': ocr_data['top'][i],
                    'width': ocr_data['width'][i],
                    'height': ocr_data['height'][i],
                    'right': ocr_data['left'][i] + ocr_data['width'][i],
                    'bottom': ocr_data['top'][i] + ocr_data['height'][i]
                })

        if len(words) < self.min_rows * self.min_cols:
            logger.debug("Not enough words for alignment-based detection")
            return []

        # Find columns by grouping words with similar x-coordinates
        columns = self._group_into_columns(words)

        if len(columns) < self.min_cols:
            logger.debug(f"Only {len(columns)} columns found, need at least {self.min_cols}")
            return []

        # Find tables by looking for grid-like patterns
        tables = self._find_grid_patterns(columns, words)

        return tables

    def _group_into_columns(self, words: List[Dict]) -> List[List[Dict]]:
        """
        Group words into columns based on horizontal alignment

        Args:
            words: List of word dictionaries

        Returns:
            List of columns, where each column is a list of aligned words
        """
        if not words:
            return []

        # Sort words by left position
        sorted_words = sorted(words, key=lambda w: w['left'])

        columns = []
        current_column = [sorted_words[0]]

        for word in sorted_words[1:]:
            # Check if this word aligns with current column
            if any(abs(word['left'] - w['left']) <= self.alignment_threshold
                   for w in current_column):
                current_column.append(word)
            else:
                # Start new column
                if len(current_column) >= self.min_rows:
                    columns.append(current_column)
                current_column = [word]

        # Add last column
        if len(current_column) >= self.min_rows:
            columns.append(current_column)

        return columns

    def _find_grid_patterns(
        self,
        columns: List[List[Dict]],
        all_words: List[Dict]
    ) -> List[Tuple[int, int, int, int]]:
        """
        Find grid-like patterns in aligned columns

        Args:
            columns: List of word columns
            all_words: All words in the document

        Returns:
            List of table bounding boxes
        """
        tables = []

        if len(columns) < self.min_cols:
            return tables

        # For each group of adjacent columns, check if they form a table
        for i in range(len(columns) - self.min_cols + 1):
            # Get a subset of columns
            col_group = columns[i:i + self.min_cols]

            # Find common rows (words at similar y-positions across columns)
            common_rows = self._find_common_rows(col_group)

            if len(common_rows) >= self.min_rows:
                # This looks like a table - calculate bounding box
                all_col_words = [w for col in col_group for w in col]

                if all_col_words:
                    x_min = min(w['left'] for w in all_col_words)
                    y_min = min(w['top'] for w in all_col_words)
                    x_max = max(w['right'] for w in all_col_words)
                    y_max = max(w['bottom'] for w in all_col_words)

                    # Add some padding
                    padding = 5
                    bbox = (
                        max(0, x_min - padding),
                        max(0, y_min - padding),
                        x_max - x_min + 2 * padding,
                        y_max - y_min + 2 * padding
                    )

                    tables.append(bbox)
                    logger.debug(f"Found table pattern: {len(col_group)} cols × {len(common_rows)} rows")

        return tables

    def _find_common_rows(self, columns: List[List[Dict]]) -> List[int]:
        """
        Find y-positions that appear across multiple columns (indicating rows)

        Args:
            columns: List of word columns

        Returns:
            List of y-positions that form table rows
        """
        # Collect all y-positions from first column
        if not columns or not columns[0]:
            return []

        y_positions = [w['top'] for w in columns[0]]
        common_rows = []

        for y in y_positions:
            # Check if this y-position has matches in other columns
            matches = 1
            for col in columns[1:]:
                if any(abs(w['top'] - y) <= self.alignment_threshold for w in col):
                    matches += 1

            # If majority of columns have words at this y-position, it's a row
            if matches >= len(columns) * 0.6:  # 60% threshold
                common_rows.append(y)

        return common_rows

    def _merge_overlapping_regions(
        self,
        regions: List[Tuple[int, int, int, int]]
    ) -> List[Tuple[int, int, int, int]]:
        """
        Merge overlapping bounding boxes

        Args:
            regions: List of bounding boxes (x, y, w, h)

        Returns:
            List of merged bounding boxes
        """
        if not regions:
            return []

        # Sort by x position
        sorted_regions = sorted(regions, key=lambda r: r[0])
        merged = [sorted_regions[0]]

        for current in sorted_regions[1:]:
            last = merged[-1]

            # Check if regions overlap
            if self._boxes_overlap(last, current):
                # Merge them
                x_min = min(last[0], current[0])
                y_min = min(last[1], current[1])
                x_max = max(last[0] + last[2], current[0] + current[2])
                y_max = max(last[1] + last[3], current[1] + current[3])

                merged[-1] = (x_min, y_min, x_max - x_min, y_max - y_min)
            else:
                merged.append(current)

        return merged

    def _boxes_overlap(
        self,
        box1: Tuple[int, int, int, int],
        box2: Tuple[int, int, int, int]
    ) -> bool:
        """
        Check if two bounding boxes overlap

        Args:
            box1, box2: Bounding boxes (x, y, w, h)

        Returns:
            True if boxes overlap
        """
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2

        # Check for no overlap
        if x1 + w1 < x2 or x2 + w2 < x1:
            return False
        if y1 + h1 < y2 or y2 + h2 < y1:
            return False

        return True

    def _filter_by_size(
        self,
        regions: List[Tuple[int, int, int, int]],
        image_shape: Optional[Tuple[int, int]] = None
    ) -> List[Tuple[int, int, int, int]]:
        """
        Filter table regions by size to reject obviously wrong detections
        Uses smart filtering based on aspect ratio and page proportion

        Args:
            regions: List of bounding boxes (x, y, w, h)
            image_shape: Optional (height, width) of the page image

        Returns:
            Filtered list of bounding boxes
        """
        filtered = []

        # Estimate page size if not provided (typical 300 DPI A4)
        page_width = image_shape[1] if image_shape else 2480
        page_height = image_shape[0] if image_shape else 3508

        max_table_width = page_width * self.max_table_width_ratio
        max_table_height = page_height * self.max_table_height_ratio

        for x, y, w, h in regions:
            # Reject if too small
            if w < self.min_table_width or h < self.min_table_height:
                logger.debug(f"Rejecting undersized table region: {w}×{h}px")
                continue

            # Reject if covers almost entire page (likely false positive)
            # But allow large tables that are clearly tables (good aspect ratio)
            width_ratio = w / page_width
            height_ratio = h / page_height
            aspect_ratio = w / h if h > 0 else 0

            # Whole page detection: very large AND bad aspect ratio
            if (width_ratio > self.max_table_width_ratio and
                height_ratio > self.max_table_height_ratio):
                logger.debug(f"Rejecting whole-page region: {w}×{h}px ({width_ratio:.1%}×{height_ratio:.1%} of page)")
                continue

            # Allow tall tables (full page height is OK if narrow enough)
            # Allow wide tables (full page width is OK if short enough)
            # This allows pages 3-4 tables to pass

            filtered.append((x, y, w, h))

        logger.info(f"Size filtering: {len(regions)} → {len(filtered)} regions")
        return filtered

