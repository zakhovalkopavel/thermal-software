"""
Language detection for OCR processing
"""

import logging
from typing import List, Tuple, Optional
from PIL import Image
import pytesseract

logger = logging.getLogger(__name__)


class LanguageDetector:
    """Detect languages in document images for OCR"""

    def __init__(self, available_langs: List[str]):
        """
        Initialize language detector

        Args:
            available_langs: List of Tesseract language codes to consider
        """
        self.available_langs = available_langs
        logger.info(f"Language detector initialized with: {', '.join(available_langs)}")

    def detect_languages(self, image: Image.Image, max_langs: int = 3) -> List[str]:
        """
        Detect up to max_langs languages in the image

        Args:
            image: PIL Image to analyze
            max_langs: Maximum number of languages to detect (default: 3)

        Returns:
            List of detected language codes, ordered by confidence
        """
        logger.info(f"Starting language detection (max_langs={max_langs})")

        # Try orientation and script detection first
        try:
            osd = pytesseract.image_to_osd(image)
            logger.debug(f"OSD result: {osd}")
        except Exception as e:
            logger.warning(f"OSD detection failed: {e}")

        # Test each available language and measure confidence
        confidences = {}

        for lang in self.available_langs:
            try:
                # Run OCR with this language
                data = pytesseract.image_to_data(
                    image,
                    lang=lang,
                    output_type=pytesseract.Output.DICT
                )

                # Calculate average confidence for non-empty detections
                valid_confs = [c for c in data['conf'] if c != -1]
                if valid_confs:
                    avg_conf = sum(valid_confs) / len(valid_confs)
                    confidences[lang] = avg_conf
                    logger.debug(f"Language '{lang}': {avg_conf:.2f}% confidence")
                else:
                    confidences[lang] = 0.0

            except Exception as e:
                logger.warning(f"Failed to test language '{lang}': {e}")
                confidences[lang] = 0.0

        # Sort by confidence and return top languages
        sorted_langs = sorted(confidences.items(), key=lambda x: x[1], reverse=True)

        # Filter out very low confidence languages (< 30%)
        detected = [lang for lang, conf in sorted_langs if conf >= 30.0][:max_langs]

        if detected:
            logger.info(f"Detected languages: {', '.join(detected)}")
            return detected
        else:
            # Fallback to English if no good detections
            logger.warning("No high-confidence languages detected, defaulting to 'eng'")
            return ['eng']

    def build_lang_string(self, detected_langs: List[str]) -> str:
        """
        Build Tesseract language string for multi-language OCR

        Args:
            detected_langs: List of language codes

        Returns:
            Combined language string (e.g., 'eng+fra+deu')
        """
        lang_str = '+'.join(detected_langs)
        logger.debug(f"Built language string: {lang_str}")
        return lang_str

    def detect_and_build(self, image: Image.Image, max_langs: int = 3) -> str:
        """
        Convenience method to detect languages and build string in one call

        Args:
            image: PIL Image to analyze
            max_langs: Maximum number of languages to detect

        Returns:
            Combined language string for Tesseract
        """
        detected = self.detect_languages(image, max_langs)
        return self.build_lang_string(detected)

