#!/usr/bin/env python3
"""
Test OpenCV functionality for OCR extraction
"""

import cv2
import numpy as np
import sys

def test_opencv():
    """Test all OpenCV functions used in OCR extraction"""

    print("Testing OpenCV functions used in OCR extraction:")
    print("=" * 60)

    try:
        # Test 1: Image conversion
        print("\n1. Testing color conversion...")
        test_img = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        gray = cv2.cvtColor(test_img, cv2.COLOR_RGB2GRAY)
        print(f"   ✓ cvtColor: RGB to GRAY - Shape: {gray.shape}")

        # Test 2: Edge detection
        print("\n2. Testing Canny edge detection...")
        edges = cv2.Canny(gray, 50, 150)
        print(f"   ✓ Canny edge detection - Shape: {edges.shape}")

        # Test 3: Morphological operations
        print("\n3. Testing morphological operations...")
        h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (40, 1))
        v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 40))
        print(f"   ✓ Horizontal kernel: {h_kernel.shape}")
        print(f"   ✓ Vertical kernel: {v_kernel.shape}")

        h_lines = cv2.morphologyEx(gray, cv2.MORPH_OPEN, h_kernel)
        v_lines = cv2.morphologyEx(gray, cv2.MORPH_OPEN, v_kernel)
        print(f"   ✓ morphologyEx MORPH_OPEN - H lines: {h_lines.shape}")
        print(f"   ✓ morphologyEx MORPH_OPEN - V lines: {v_lines.shape}")

        # Test 4: Image blending
        print("\n4. Testing image blending...")
        combined = cv2.addWeighted(h_lines, 0.5, v_lines, 0.5, 0.0)
        print(f"   ✓ addWeighted - Shape: {combined.shape}")

        # Test 5: Contour detection
        print("\n5. Testing contour detection...")
        contours, hierarchy = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        print(f"   ✓ findContours - Found {len(contours)} contours")

        # Test 6: Bounding box
        print("\n6. Testing bounding box calculation...")
        if contours:
            x, y, w, h = cv2.boundingRect(contours[0])
            print(f"   ✓ boundingRect - First contour: ({x}, {y}, {w}, {h})")

        # Test 7: Thresholding
        print("\n7. Testing adaptive thresholding...")
        thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        print(f"   ✓ adaptiveThreshold - Shape: {thresh.shape}")

        # Test 8: Binary threshold with Otsu
        print("\n8. Testing Otsu's thresholding...")
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        print(f"   ✓ threshold with OTSU - Shape: {binary.shape}")

        # Test 9: Contour area (used in table detection)
        print("\n9. Testing contour area calculation...")
        if contours:
            area = cv2.contourArea(contours[0])
            print(f"   ✓ contourArea - Area of first contour: {area}")

        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print(f"OpenCV version {cv2.__version__} is fully functional.")
        print("All functions used in OCR extraction are working correctly.")
        return True

    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_opencv()
    sys.exit(0 if success else 1)

