#!/usr/bin/env python3
"""
Test if visual review can run - checks display availability
"""

import sys
import os

def check_display():
    """Check if display is available for OpenCV"""
    print("\n" + "="*80)
    print("VISUAL REVIEW TOOL - DISPLAY CHECK")
    print("="*80)

    # Check DISPLAY variable
    display = os.environ.get('DISPLAY')
    print(f"\nDISPLAY variable: {display if display else 'NOT SET'}")

    # Try to import cv2
    try:
        import cv2
        print("✓ OpenCV (cv2) is installed")
        print(f"  Version: {cv2.__version__}")
    except ImportError as e:
        print(f"✗ OpenCV not available: {e}")
        return False

    # Try to create a test window
    try:
        print("\nTrying to create test window...")
        cv2.namedWindow("Test", cv2.WINDOW_NORMAL)
        print("✓ Window created successfully!")
        cv2.destroyAllWindows()
        return True
    except Exception as e:
        print(f"✗ Cannot create window: {e}")
        print("\nThis means X11 display is not available.")
        print("\nSOLUTIONS:")
        print("="*80)
        print("\n1. ON YOUR LOCAL MACHINE (not in Docker):")
        print("   Run the tool directly on your host:")
        print("   cd /opt/thermal-software")
        print("   python3 python/src/scripts/visual_review.py \\")
        print("     'shared/processed/Viscosity*_*/document.json'")
        print("\n2. WITH X11 FORWARDING:")
        print("   Install X server on your host:")
        print("   - Linux: Already have it")
        print("   - Windows WSL2: Install VcXsrv or X410")
        print("   - Mac: Install XQuartz")
        print("   Then run:")
        print("   export DISPLAY=:0")
        print("   make ocr-review-visual")
        print("\n3. WEB-BASED ALTERNATIVE:")
        print("   I can create a web-based version that runs in your browser")
        print("   This will work without X11")
        print("="*80)
        return False

if __name__ == "__main__":
    success = check_display()
    sys.exit(0 if success else 1)

