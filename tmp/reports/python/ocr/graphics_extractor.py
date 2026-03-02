"""
Graphics extraction from document images
"""

import json
import logging
from pathlib import Path
from typing import List, Tuple, Dict, Any
from datetime import datetime
import cv2
import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)


class GraphicsExtractor:
    """Extract graphics, charts, and diagrams from document images"""

    def __init__(self, graphics_dir: Path, min_size: int = 100, edge_density_threshold: float = 0.1):
        """
        Initialize graphics extractor

        Args:
            graphics_dir: Directory to save extracted graphics
            min_size: Minimum width/height for a region to be considered (default: 100)
            edge_density_threshold: Minimum edge density to classify as graphic (default: 0.1)
        """
        self.graphics_dir = Path(graphics_dir)
        self.min_size = min_size
        self.edge_density_threshold = edge_density_threshold
        self.graphics_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Graphics extractor initialized: {self.graphics_dir}")

    def extract_graphics(
        self,
        image: Image.Image,
        page_num: int,
        source_name: str
    ) -> Tuple[List[Path], List[Dict[str, Any]]]:
        """
        Extract graphics/charts from image and save separately

        Args:
            image: PIL Image to process
            page_num: Page number in source document
            source_name: Name of source document (without extension)

        Returns:
            Tuple of (list of saved file paths, list of metadata dicts)
        """
        logger.info(f"Extracting graphics from {source_name}, page {page_num}")

        # Convert PIL Image to OpenCV format
        img_array = np.array(image.convert('RGB'))
        img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # Detect edges using Canny
        edges = cv2.Canny(gray, 50, 150)

        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        saved_graphics = []
        graphics_metadata = []
        graphic_num = 0

        logger.debug(f"Found {len(contours)} contours")

        # Collect candidate regions
        candidate_regions = []

        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)

            # Filter by minimum size
            if w < self.min_size or h < self.min_size:
                continue

            # Extract region of interest
            roi_edges = edges[y:y+h, x:x+w]

            # Calculate edge density
            edge_density = np.sum(roi_edges > 0) / (w * h)

            # Check if region looks like a graphic
            if edge_density >= self.edge_density_threshold:
                candidate_regions.append({
                    'bbox': (x, y, w, h),
                    'edge_density': edge_density
                })

        logger.debug(f"Found {len(candidate_regions)} candidate graphic regions")

        # Merge nearby regions (like chart elements) - use larger distance for charts
        merged_regions = self._merge_nearby_regions(candidate_regions, merge_distance=200)

        logger.debug(f"After merging: {len(merged_regions)} graphic regions")

        # Process merged regions
        for region in merged_regions:
            x, y, w, h = region['bbox']
            edge_density = region['edge_density']

            # Additional check: avoid text-heavy regions (likely table headers)
            roi_gray = gray[y:y+h, x:x+w]

            # Check aspect ratio - charts are usually more square, headers are wide
            aspect_ratio = w / h if h > 0 else 0

            # Check if region is mostly text (using OCR)
            try:
                import pytesseract
                roi_rgb = img_array[y:y+h, x:x+w]
                text = pytesseract.image_to_string(roi_rgb).strip()
                word_count = len(text.split())

                # If region has lots of text relative to size, it's probably a table header
                text_density = word_count / ((w * h) / 1000)  # words per 1000 pixels

                # Skip if it looks like a table header:
                # - Wide and short (aspect_ratio > 5)
                # - Has many words (text_density > 0.3)
                # - Small height (h < 150)
                if aspect_ratio > 5 and text_density > 0.3 and h < 150:
                    logger.debug(f"Skipping text-heavy region at ({x},{y}) - likely table header")
                    continue

            except Exception as e:
                # If OCR fails, proceed with extraction
                logger.debug(f"OCR check failed: {e}")

            # Extract graphic region from original image
            graphic = img_array[y:y+h, x:x+w]

            # Generate filename matching spec: page_001_graphic_001.png
            filename = f"page_{page_num:03d}_graphic_{graphic_num:03d}.png"
            output_path = self.graphics_dir / filename

            # Save graphic
            Image.fromarray(graphic).save(output_path)

            # Store metadata
            metadata = {
                "filename": filename,
                "page": page_num,
                "position": {
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h)
                },
                "edge_density": float(edge_density),
                "extracted_at": datetime.utcnow().isoformat() + "Z"
            }

            saved_graphics.append(output_path)
            graphics_metadata.append(metadata)
            graphic_num += 1

            logger.info(f"Extracted graphic: {filename} (density={edge_density:.3f})")

        logger.info(f"Extracted {len(saved_graphics)} graphics from page {page_num}")
        return saved_graphics, graphics_metadata

    def _merge_nearby_regions(
        self,
        regions: List[Dict],
        merge_distance: int = 100
    ) -> List[Dict]:
        """
        Merge graphics regions that are close together (e.g., chart elements)

        Args:
            regions: List of region dicts with 'bbox' and 'edge_density'
            merge_distance: Maximum distance between regions to merge (pixels)

        Returns:
            List of merged region dicts
        """
        if not regions:
            return []

        merged = []
        used = set()

        for i, region1 in enumerate(regions):
            if i in used:
                continue

            x1, y1, w1, h1 = region1['bbox']
            merged_bbox = [x1, y1, w1, h1]
            edge_densities = [region1['edge_density']]

            # Try to merge with other regions
            for j, region2 in enumerate(regions[i+1:], i+1):
                if j in used:
                    continue

                x2, y2, w2, h2 = region2['bbox']

                # Check if regions are close enough to merge
                if self._regions_are_close(merged_bbox, (x2, y2, w2, h2), merge_distance):
                    # Merge bounding boxes
                    x_min = min(merged_bbox[0], x2)
                    y_min = min(merged_bbox[1], y2)
                    x_max = max(merged_bbox[0] + merged_bbox[2], x2 + w2)
                    y_max = max(merged_bbox[1] + merged_bbox[3], y2 + h2)

                    merged_bbox = [x_min, y_min, x_max - x_min, y_max - y_min]
                    edge_densities.append(region2['edge_density'])
                    used.add(j)

            # Calculate average edge density for merged region
            avg_density = sum(edge_densities) / len(edge_densities)

            merged.append({
                'bbox': tuple(merged_bbox),
                'edge_density': avg_density
            })
            used.add(i)

        logger.debug(f"Merged {len(regions)} regions into {len(merged)} graphics")
        return merged

    def _regions_are_close(
        self,
        box1: Tuple[int, int, int, int],
        box2: Tuple[int, int, int, int],
        distance: int
    ) -> bool:
        """
        Check if two regions are close enough to merge

        Args:
            box1, box2: Bounding boxes as (x, y, w, h)
            distance: Maximum distance to consider "close"

        Returns:
            True if regions should be merged
        """
        x1, y1, w1, h1 = box1
        x2, y2, w2, h2 = box2

        # Calculate center points
        cx1, cy1 = x1 + w1/2, y1 + h1/2
        cx2, cy2 = x2 + w2/2, y2 + h2/2

        # Calculate distance between centers
        dist = ((cx2 - cx1)**2 + (cy2 - cy1)**2)**0.5

        # Also check if boxes overlap or are very close
        horizontal_gap = min(abs(x1 + w1 - x2), abs(x2 + w2 - x1))
        vertical_gap = min(abs(y1 + h1 - y2), abs(y2 + h2 - y1))

        # Merge if close enough
        return dist < distance or (horizontal_gap < distance and vertical_gap < distance)

    def is_graphic(self, region: np.ndarray) -> bool:
        """
        Determine if a region is likely a graphic

        Args:
            region: Image region as numpy array

        Returns:
            True if region appears to be a graphic
        """
        # Convert to grayscale if needed
        if len(region.shape) == 3:
            gray = cv2.cvtColor(region, cv2.COLOR_RGB2GRAY)
        else:
            gray = region

        # Detect edges
        edges = cv2.Canny(gray, 50, 150)

        # Calculate edge density
        edge_density = self.calculate_edge_density(edges)

        return edge_density >= self.edge_density_threshold

    def calculate_edge_density(self, edges: np.ndarray) -> float:
        """
        Calculate edge density of an edge-detected image

        Args:
            edges: Binary edge image

        Returns:
            Edge density as float between 0 and 1
        """
        if edges.size == 0:
            return 0.0

        return np.sum(edges > 0) / edges.size

    def save_metadata(self, graphics_metadata: List[Dict[str, Any]], source_name: str) -> Path:
        """
        Save graphics metadata to JSON file

        Args:
            graphics_metadata: List of metadata dictionaries
            source_name: Name of source document

        Returns:
            Path to saved metadata file
        """
        metadata_file = self.graphics_dir / f"{source_name}_graphics_metadata.json"

        output_data = {
            "source": source_name,
            "total_graphics": len(graphics_metadata),
            "extracted_at": datetime.utcnow().isoformat() + "Z",
            "graphics": graphics_metadata
        }

        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        logger.info(f"Saved graphics metadata: {metadata_file}")
        return metadata_file

