#!/usr/bin/env python3
"""
Test scientific notation processing
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ocr.scientific_ocr_processor import ScientificOCRProcessor

def test_chemical_formulas():
    """Test chemical formula processing"""
    processor = ScientificOCRProcessor()

    test_cases = [
        ("Al2O3", "Al₂O₃"),
        ("Na2O", "Na₂O"),
        ("K2O", "K₂O"),
        ("B2O3", "B₂O₃"),
        ("(B2O3)^2", "(B₂O₃)²"),
    ]

    print("Testing Chemical Formulas:")
    print("-" * 60)
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        print(f"{status} {input_text:15} → {result:15} (expected: {expected})")
    print()

def test_greek_letters():
    """Test Greek letter processing"""
    processor = ScientificOCRProcessor()

    test_cases = [
        ("log eta 2.0", "log η 2.0"),
        ("log n 4.0", "log η 4.0"),
        ("sigma = 4.63C", "σ = 4.63°C"),
        ("Delta T", "ΔT"),
    ]

    print("Testing Greek Letters:")
    print("-" * 60)
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        print(f"{status} {input_text:20} → {result:20} (expected: {expected})")
    print()

def test_subscripts_superscripts():
    """Test subscript and superscript processing"""
    processor = ScientificOCRProcessor()

    test_cases = [
        ("T0", "T₀"),
        ("To", "T₀"),  # Common OCR mistake
        ("eta i", "ηᵢ"),
        ("(B2O3)^2", "(B₂O₃)²"),
    ]

    print("Testing Subscripts/Superscripts:")
    print("-" * 60)
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        print(f"{status} {input_text:20} → {result:20} (expected: {expected})")
    print()

def test_table_headers():
    """Test table header enhancement"""
    processor = ScientificOCRProcessor()

    test_cases = [
        "log eta 2.0",
        "log eta 4.0",
        "DT",
        "deg C for log n 2",
    ]

    print("Testing Table Headers:")
    print("-" * 60)
    for input_text in test_cases:
        result = processor.process_text(input_text)
        print(f"  {input_text:25} → {result}")
    print()

def test_full_table_row():
    """Test processing a full table row"""
    processor = ScientificOCRProcessor()

    # Test with actual OCR-like output
    input_row = "Al2O3,+8.32,+5.23,+4.01"
    expected_row = "Al₂O₃,+8.32,+5.23,+4.01"

    result = processor.process_text(input_row)

    print("Testing Full Table Row:")
    print("-" * 60)
    print(f"Input:    {input_row}")
    print(f"Output:   {result}")
    print(f"Expected: {expected_row}")
    print(f"Status:   {'✓ PASS' if result == expected_row else '✗ FAIL'}")
    print()

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("Scientific Notation Processor Tests")
    print("=" * 60 + "\n")

    test_chemical_formulas()
    test_greek_letters()
    test_subscripts_superscripts()
    test_table_headers()
    test_full_table_row()

    print("=" * 60)
    print("Tests Complete")
    print("=" * 60)

    return 0

if __name__ == "__main__":
    sys.exit(main())

