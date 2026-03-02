"""
Layout analysis for multi-column text detection
"""

import logging
from typing import List, Tuple, Dict, Any
import numpy as np
import cv2

logger = logging.getLogger(__name__)


class LayoutAnalyzer:
    """
    Analyze document layout to detect:
    - Multi-column text layouts
    - Column boundaries
    - Reading order
    """

    def __init__(self, min_column_gap: int = 30):
        """
        Initialize layout analyzer

        Args:
            min_column_gap: Minimum width of gap to consider as column separator (pixels)
        """
        self.min_column_gap = min_column_gap

    def detect_columns(self, image: np.ndarray) -> List[Tuple[int, int]]:
        """
        Detect column boundaries in the image

        Args:
            image: Grayscale or color image

        Returns:
            List of column boundaries as (start_x, end_x) tuples
        """
        logger.info("Detecting column layout...")

        # Convert to grayscale if needed
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        else:
            gray = image

        # Binarize image
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Calculate horizontal projection (sum of pixels in each column)
        h_projection = np.sum(binary, axis=0)

        # Smooth the projection to reduce noise
        kernel_size = 5
        h_projection_smooth = np.convolve(
            h_projection,
            np.ones(kernel_size) / kernel_size,
            mode='same'
        )

        # Find valleys (gaps between columns)
        columns = self._find_column_boundaries(h_projection_smooth, image.shape[1])

        logger.info(f"Detected {len(columns)} column(s)")
        return columns

    def _find_column_boundaries(
        self,
        projection: np.ndarray,
        width: int
    ) -> List[Tuple[int, int]]:
        """
        Find column boundaries from horizontal projection

        Args:
            projection: Horizontal projection array
            width: Image width

        Returns:
            List of (start_x, end_x) for each column
        """
        # Find threshold (mean - std)
        threshold = np.mean(projection) - np.std(projection)

        # Find gaps (regions below threshold)
        gaps = projection < threshold

        # Find gap regions
        gap_starts = []
        gap_ends = []
        in_gap = False

        for i, is_gap in enumerate(gaps):
            if is_gap and not in_gap:
                gap_starts.append(i)
                in_gap = True
            elif not is_gap and in_gap:
                gap_ends.append(i)
                in_gap = False

        # Close last gap if needed
        if in_gap:
            gap_ends.append(len(gaps))

        # Filter gaps by minimum width
        significant_gaps = []
        for start, end in zip(gap_starts, gap_ends):
            if end - start >= self.min_column_gap:
                significant_gaps.append((start, end))

        # Build column boundaries
        columns = []

        if not significant_gaps:
            # Single column
            columns.append((0, width))
        else:
            # Multiple columns separated by gaps
            current_start = 0

            for gap_start, gap_end in significant_gaps:
                # Add column before this gap
                if gap_start > current_start:
                    columns.append((current_start, gap_start))
                current_start = gap_end

            # Add final column
            if current_start < width:
                columns.append((current_start, width))

        return columns

    def split_content_by_columns(
        self,
        ocr_data: Dict,
        columns: List[Tuple[int, int]]
    ) -> List[Dict]:
        """
        Split OCR data by detected columns

        Args:
            ocr_data: pytesseract.image_to_data() output
            columns: Column boundaries from detect_columns()

        Returns:
            List of OCR data dictionaries, one per column
        """
        column_data = [{'text': [], 'left': [], 'top': [], 'width': [], 'height': [], 'conf': []}
                       for _ in columns]

        # Assign each word to a column
        for i in range(len(ocr_data['text'])):
            text = ocr_data['text'][i]
            if not text.strip():
                continue

            left = ocr_data['left'][i]
            word_center = left + ocr_data['width'][i] // 2

            # Find which column this word belongs to
            for col_idx, (col_start, col_end) in enumerate(columns):
                if col_start <= word_center < col_end:
                    column_data[col_idx]['text'].append(text)
                    column_data[col_idx]['left'].append(ocr_data['left'][i])
                    column_data[col_idx]['top'].append(ocr_data['top'][i])
                    column_data[col_idx]['width'].append(ocr_data['width'][i])
                    column_data[col_idx]['height'].append(ocr_data['height'][i])
                    column_data[col_idx]['conf'].append(ocr_data['conf'][i])
                    break

        return column_data

    def get_reading_order(
        self,
        columns: List[Tuple[int, int]]
    ) -> List[int]:
        """
        Determine reading order of columns (left-to-right for English)

        Args:
            columns: Column boundaries

        Returns:
            List of column indices in reading order
        """
        # Sort by x-position (left to right)
        indexed_cols = [(i, col) for i, col in enumerate(columns)]
        sorted_cols = sorted(indexed_cols, key=lambda x: x[1][0])

        return [i for i, _ in sorted_cols]

