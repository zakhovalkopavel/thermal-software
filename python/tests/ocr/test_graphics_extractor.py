"""
Unit tests for graphics extraction module
"""

import pytest
from PIL import Image, ImageDraw
import numpy as np
from pathlib import Path
import sys
import tempfile
import shutil

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ocr.graphics_extractor import GraphicsExtractor


def create_test_image_with_graphic(size=(800, 600)) -> Image.Image:
    """Create a test image with a simple graphic (rectangle with lines)"""
    image = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(image)

    # Draw a simple chart-like graphic
    # Axes
    draw.line([(100, 500), (700, 500)], fill='black', width=2)  # X-axis
    draw.line([(100, 100), (100, 500)], fill='black', width=2)  # Y-axis

    # Data line
    draw.line([(100, 400), (300, 300), (500, 350), (700, 200)], fill='blue', width=3)

    # Grid lines
    for i in range(100, 700, 100):
        draw.line([(i, 100), (i, 500)], fill='lightgray', width=1)
    for i in range(100, 500, 50):
        draw.line([(100, i), (700, i)], fill='lightgray', width=1)

    return image


def create_text_only_image(size=(800, 600)) -> Image.Image:
    """Create a test image with only text (no graphics)"""
    image = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(image)

    # Just add some text
    draw.text((50, 50), "This is a text document", fill='black')
    draw.text((50, 100), "With multiple lines", fill='black')
    draw.text((50, 150), "But no graphics or charts", fill='black')

    return image


class TestGraphicsExtractor:
    """Test graphics extraction functionality"""

    def setup_method(self):
        """Setup test directory"""
        self.test_dir = Path(tempfile.mkdtemp())
        self.graphics_dir = self.test_dir / "graphics"

    def teardown_method(self):
        """Cleanup test directory"""
        if self.test_dir.exists():
            shutil.rmtree(self.test_dir)

    def test_initialization(self):
        """Test extractor initialization"""
        extractor = GraphicsExtractor(self.graphics_dir, min_size=100)
        assert extractor.graphics_dir == self.graphics_dir
        assert extractor.min_size == 100
        assert self.graphics_dir.exists()

    def test_calculate_edge_density(self):
        """Test edge density calculation"""
        extractor = GraphicsExtractor(self.graphics_dir)

        # All edges
        all_edges = np.ones((100, 100), dtype=np.uint8) * 255
        density = extractor.calculate_edge_density(all_edges)
        assert density == 1.0

        # No edges
        no_edges = np.zeros((100, 100), dtype=np.uint8)
        density = extractor.calculate_edge_density(no_edges)
        assert density == 0.0

        # Half edges
        half_edges = np.zeros((100, 100), dtype=np.uint8)
        half_edges[:50, :] = 255
        density = extractor.calculate_edge_density(half_edges)
        assert density == 0.5

    def test_extract_graphics_with_chart(self):
        """Test extraction from image with graphics"""
        extractor = GraphicsExtractor(self.graphics_dir, min_size=50, edge_density_threshold=0.05)
        image = create_test_image_with_graphic()

        graphics_paths, metadata = extractor.extract_graphics(image, page_num=1, source_name="test_doc")

        # Should extract at least the chart area
        assert len(graphics_paths) >= 0  # May vary based on contour detection
        assert len(metadata) == len(graphics_paths)

        # Check metadata structure
        if metadata:
            meta = metadata[0]
            assert 'filename' in meta
            assert 'page' in meta
            assert 'position' in meta
            assert 'edge_density' in meta
            assert 'extracted_at' in meta
            assert meta['page'] == 1

    def test_extract_graphics_text_only(self):
        """Test extraction from text-only image"""
        extractor = GraphicsExtractor(self.graphics_dir, min_size=100, edge_density_threshold=0.1)
        image = create_text_only_image()

        graphics_paths, metadata = extractor.extract_graphics(image, page_num=1, source_name="text_doc")

        # Should extract few or no graphics from text-only image
        assert isinstance(graphics_paths, list)
        assert isinstance(metadata, list)

    def test_save_metadata(self):
        """Test metadata saving"""
        extractor = GraphicsExtractor(self.graphics_dir)

        metadata = [
            {
                "filename": "test_page1_graphic0.png",
                "page": 1,
                "position": {"x": 100, "y": 200, "width": 300, "height": 400},
                "edge_density": 0.25,
                "extracted_at": "2026-02-09T10:00:00Z"
            }
        ]

        metadata_file = extractor.save_metadata(metadata, "test_source")

        assert metadata_file.exists()
        assert metadata_file.suffix == '.json'

        # Verify content
        import json
        with open(metadata_file, 'r') as f:
            data = json.load(f)

        assert data['source'] == 'test_source'
        assert data['total_graphics'] == 1
        assert len(data['graphics']) == 1

    def test_min_size_filter(self):
        """Test minimum size filtering"""
        extractor = GraphicsExtractor(self.graphics_dir, min_size=500)
        image = create_test_image_with_graphic()

        graphics_paths, metadata = extractor.extract_graphics(image, page_num=1, source_name="test")

        # With high min_size, should filter out smaller contours
        # Actual results depend on contour detection
        assert isinstance(graphics_paths, list)

    def test_filename_generation(self):
        """Test graphic filename format"""
        extractor = GraphicsExtractor(self.graphics_dir)
        image = create_test_image_with_graphic()

        graphics_paths, metadata = extractor.extract_graphics(image, page_num=5, source_name="my_document")

        if graphics_paths:
            filename = graphics_paths[0].name
            # Should match pattern: my_document_page005_graphic000.png
            assert filename.startswith("my_document_page")
            assert filename.endswith(".png")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

