"""
OCR-based table extraction
"""

import re
import logging
import numpy as np
import pandas as pd
import pytesseract
from typing import Optional, Tuple, List, Dict

logger = logging.getLogger(__name__)


class OCRExtractor:
    """Handles OCR-based table extraction from images"""

    def __init__(self, lang: str = "eng", psm_mode: str = "--psm 3"):
        """
        Initialize OCR extractor

        Args:
            lang: Tesseract language code
            psm_mode: Page segmentation mode (PSM 3 = fully automatic page segmentation, best for tables)
        """
        self.lang = lang
        self.psm_mode = psm_mode

    def extract_text(self, image: np.ndarray) -> str:
        """Extract text from image using OCR"""
        try:
            return pytesseract.image_to_string(
                image, lang=self.lang, config=self.psm_mode
            )
        except Exception as e:
            logger.error(f"OCR text extraction failed: {e}")
            return ""

    def extract_data(self, image: np.ndarray) -> Dict:
        """Extract structured data from image using OCR"""
        try:
            return pytesseract.image_to_data(
                image, lang=self.lang, output_type=pytesseract.Output.DICT
            )
        except Exception as e:
            logger.error(f"OCR data extraction failed: {e}")
            return {}

    def _parse_table_from_data(self, data: Dict) -> pd.DataFrame:
        """
        Parse table using coordinate-based detection from image_to_data
        Clusters words by x-coordinate to detect columns
        """
        if not data or 'text' not in data:
            return pd.DataFrame()

        # Build lines dict: line_num -> list of (left, text)
        lines = {}
        n = len(data.get('text', []))
        for i in range(n):
            text = (data['text'][i] or '').strip()
            if not text:
                continue
            line_num = data.get('line_num', [0]*n)[i]
            left = int(data.get('left', [0]*n)[i])
            lines.setdefault(line_num, []).append((left, text))

        if not lines:
            return pd.DataFrame()

        # Collect unique left positions across all lines
        all_lefts = sorted({left for cells in lines.values() for left, _ in cells})
        if not all_lefts:
            return pd.DataFrame()

        # Compute gaps between consecutive left positions
        gaps = [j - i for i, j in zip(all_lefts[:-1], all_lefts[1:])]
        median_gap = float(np.median(gaps)) if gaps else 0.0

        # Threshold for column separation: median_gap * 2.5
        threshold = max(median_gap * 2.5, 40.0)

        # Create column bins by grouping nearby x positions
        bins: List[List[int]] = []
        current_bin: List[int] = [all_lefts[0]]
        for prev, curr in zip(all_lefts[:-1], all_lefts[1:]):
            if (curr - prev) > threshold:
                bins.append(current_bin)
                current_bin = [curr]
            else:
                current_bin.append(curr)
        bins.append(current_bin)

        # Column centers
        col_centers = [int(np.mean(b)) for b in bins]

        # Build rows by assigning words to nearest column
        rows = []
        for line_idx in sorted(lines.keys()):
            cells = lines[line_idx]
            row = [''] * len(col_centers)
            for left, text in cells:
                # Find nearest column center
                distances = [abs(left - c) for c in col_centers]
                col_idx = int(np.argmin(distances))
                if row[col_idx]:
                    row[col_idx] = row[col_idx] + ' ' + text
                else:
                    row[col_idx] = text
            rows.append(row)

        if not rows:
            return pd.DataFrame()

        # Use first row as header if we have multiple rows
        if len(rows) > 1:
            header = rows[0]
            data_rows = rows[1:]
            df = pd.DataFrame(data_rows, columns=header)
        else:
            df = pd.DataFrame(rows)

        # Clean whitespace
        df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
        return df

    def parse_table_from_text(self, text: str) -> pd.DataFrame:
        """
        Parse table structure from OCR text

        Args:
            text: OCR extracted text

        Returns:
            DataFrame containing parsed table
        """
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        if not lines:
            return pd.DataFrame()

        # Split by common delimiters: pipes, multiple spaces, or tabs
        rows = []
        for line in lines:
            # Try splitting by pipe first (common in OCR output)
            if '|' in line:
                cells = [cell.strip() for cell in line.split('|') if cell.strip()]
            else:
                # Fall back to multiple spaces or tabs
                cells = re.split(r'\s{2,}|\t', line)
                cells = [cell.strip() for cell in cells if cell.strip()]

            if cells:
                rows.append(cells)

        if not rows:
            return pd.DataFrame()

        # Normalize row lengths
        max_cols = max(len(row) for row in rows)
        for row in rows:
            while len(row) < max_cols:
                row.append('')

        # Create DataFrame (use first row as header if appropriate)
        if len(rows) > 1:
            return pd.DataFrame(rows[1:], columns=rows[0])
        else:
            return pd.DataFrame(rows)

    def extract_table(self, image: np.ndarray,
                     bbox: Optional[Tuple[int, int, int, int]] = None) -> pd.DataFrame:
        """
        Extract table from image region

        Args:
            image: Input image
            bbox: Bounding box (x, y, w, h) for table region

        Returns:
            DataFrame containing extracted table
        """
        # Crop to region if bbox provided
        if bbox:
            x, y, w, h = bbox
            table_image = image[y:y+h, x:x+w]
        else:
            table_image = image

        # Use coordinate-based extraction (more reliable for tables)
        data = self.extract_data(table_image)
        df = self._parse_table_from_data(data)

        if not df.empty and df.shape[1] > 1:
            return df

        # Fallback: try text-based parsing
        text = self.extract_text(table_image)
        if not text:
            logger.warning("No text extracted from image")
            return pd.DataFrame()

        df_text = self.parse_table_from_text(text)
        if not df_text.empty and df_text.shape[1] > 1:
            return df_text

        # Return best available result (prefer coordinate if it has data, even if 1 column)
        if not df.empty:
            logger.warning(f"Only single-column extraction possible, returning coordinate-based result with {len(df)} rows")
            return df
        elif not df_text.empty:
            return df_text
        else:
            return pd.DataFrame()
