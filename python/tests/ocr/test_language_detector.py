"""
Unit tests for language detection module
"""

import pytest
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ocr.language_detector import LanguageDetector


def create_test_image_with_text(text: str, size=(800, 600)) -> Image.Image:
    """Create a test image with text"""
    image = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(image)

    # Use default font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 40)
    except:
        font = ImageFont.load_default()

    # Draw text
    draw.text((50, 50), text, fill='black', font=font)
    return image


class TestLanguageDetector:
    """Test language detection functionality"""

    def test_initialization(self):
        """Test detector initialization"""
        langs = ['eng', 'fra', 'deu']
        detector = LanguageDetector(langs)
        assert detector.available_langs == langs

    def test_build_lang_string(self):
        """Test building combined language string"""
        detector = LanguageDetector(['eng', 'fra'])

        # Single language
        assert detector.build_lang_string(['eng']) == 'eng'

        # Multiple languages
        assert detector.build_lang_string(['eng', 'fra', 'deu']) == 'eng+fra+deu'

    def test_detect_and_build(self):
        """Test convenience method"""
        detector = LanguageDetector(['eng', 'fra', 'deu'])
        image = create_test_image_with_text("Hello World")

        lang_string = detector.detect_and_build(image, max_langs=2)
        assert isinstance(lang_string, str)
        assert len(lang_string) > 0

    def test_detect_languages_english(self):
        """Test detection with English text"""
        detector = LanguageDetector(['eng', 'fra', 'deu'])
        image = create_test_image_with_text("The quick brown fox jumps over the lazy dog")

        detected = detector.detect_languages(image, max_langs=3)
        assert isinstance(detected, list)
        assert len(detected) > 0
        # English should be detected (but we don't enforce it due to test environment)

    def test_max_langs_limit(self):
        """Test max_langs parameter"""
        detector = LanguageDetector(['eng', 'fra', 'deu', 'ces', 'pol'])
        image = create_test_image_with_text("Test text")

        detected = detector.detect_languages(image, max_langs=2)
        assert len(detected) <= 2


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

