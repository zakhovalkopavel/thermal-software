"""
Image preprocessing utilities for OCR
"""

import cv2
import numpy as np
from typing import Tuple, List
import logging

logger = logging.getLogger(__name__)


class ImagePreprocessor:
    """Handles image preprocessing for OCR"""

    @staticmethod
    def to_grayscale(image: np.ndarray) -> np.ndarray:
        """Convert image to grayscale if needed"""
        if len(image.shape) == 3:
            return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        return image

    @staticmethod
    def denoise(image: np.ndarray) -> np.ndarray:
        """Remove noise from image"""
        return cv2.fastNlMeansDenoising(image)

    @staticmethod
    def threshold(image: np.ndarray) -> np.ndarray:
        """Apply adaptive thresholding"""
        return cv2.adaptiveThreshold(
            image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

    @staticmethod
    def deskew(image: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        """Correct image skew/rotation"""
        coords = np.column_stack(np.where(image > 0))
        if len(coords) == 0:
            return image

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        if abs(angle) <= threshold:
            return image

        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        return cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE
        )

    @classmethod
    def preprocess(cls, image: np.ndarray) -> np.ndarray:
        """
        Complete preprocessing pipeline

        Args:
            image: Input image as numpy array

        Returns:
            Preprocessed image
        """
        gray = cls.to_grayscale(image)
        denoised = cls.denoise(gray)
        thresh = cls.threshold(denoised)
        deskewed = cls.deskew(thresh)
        return deskewed


class TableDetector:
    """Detects table regions in images"""

    def __init__(self, min_area: int = 10000,
                 h_kernel: Tuple[int, int] = (40, 1),
                 v_kernel: Tuple[int, int] = (1, 40)):
        """
        Initialize table detector

        Args:
            min_area: Minimum area to consider as a table
            h_kernel: Kernel size for horizontal line detection
            v_kernel: Kernel size for vertical line detection
        """
        self.min_area = min_area
        self.h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, h_kernel)
        self.v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, v_kernel)

    def detect_lines(self, image: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Detect horizontal and vertical lines"""
        h_lines = cv2.morphologyEx(image, cv2.MORPH_OPEN, self.h_kernel, iterations=2)
        v_lines = cv2.morphologyEx(image, cv2.MORPH_OPEN, self.v_kernel, iterations=2)
        return h_lines, v_lines

    def detect_tables(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect table regions using line detection

        Args:
            image: Preprocessed binary image

        Returns:
            List of bounding boxes (x, y, w, h) for detected tables
        """
        h_lines, v_lines = self.detect_lines(image)

        # Combine lines
        table_mask = cv2.addWeighted(h_lines, 0.5, v_lines, 0.5, 0.0)

        # Find contours
        contours, _ = cv2.findContours(
            table_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        # Filter by area and get bounding boxes
        tables = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > self.min_area:
                x, y, w, h = cv2.boundingRect(contour)
                tables.append((x, y, w, h))

        logger.info(f"Detected {len(tables)} table region(s)")
        return tables

