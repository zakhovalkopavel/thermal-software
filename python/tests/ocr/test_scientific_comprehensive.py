#!/usr/bin/env python3
"""
Comprehensive test suite for scientific notation processing
Based on real examples from Lakatos PDF cropped images
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from ocr.scientific_ocr_processor import ScientificOCRProcessor

def test_all_greek_letters():
    """Test all Greek letter conversions"""
    processor = ScientificOCRProcessor()

    test_cases = [
        # Common in scientific documents
        ("alpha", "α"),
        ("beta", "β"),
        ("gamma", "γ"),
        ("delta", "δ"),
        ("epsilon", "ε"),
        ("eta", "η"),
        ("theta", "θ"),
        ("lambda", "λ"),
        ("mu", "μ"),
        ("nu", "ν"),
        ("pi", "π"),
        ("rho", "ρ"),
        ("sigma", "σ"),
        ("tau", "τ"),
        ("phi", "φ"),
        ("chi", "χ"),
        ("psi", "ψ"),
        ("omega", "ω"),
        # Uppercase
        ("Delta", "Δ"),
        ("Gamma", "Γ"),
        ("Sigma", "Σ"),
        ("Omega", "Ω"),
    ]

    print("\n" + "="*80)
    print("Testing All Greek Letters")
    print("="*80)

    passed = 0
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        print(f"{status} {input_text:15} → {result:5} (expected: {expected})")

    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def test_chemical_formulas_pattern_based():
    """Test pattern-based chemical formula conversion (any formula)"""
    processor = ScientificOCRProcessor()

    test_cases = [
        # From Lakatos images
        ("Al2O3", "Al₂O₃"),
        ("Na2O", "Na₂O"),
        ("K2O", "K₂O"),
        ("Li2O", "Li₂O"),
        ("B2O3", "B₂O₃"),
        ("SiO2", "SiO₂"),
        ("(B2O3)^2", "(B₂O₃)²"),

        # Complex formulas (not in original hardcoded list)
        ("Ca10(PO4)6(OH)2", "Ca₁₀(PO₄)₆(OH)₂"),
        ("Fe3O4", "Fe₃O₄"),
        ("H2SO4", "H₂SO₄"),
        ("CaCO3", "CaCO₃"),
        ("NaCl", "NaCl"),  # No subscripts
        ("Al2(SO4)3", "Al₂(SO₄)₃"),

        # With brackets
        ("(NH4)2SO4", "(NH₄)₂SO₄"),
        ("Ca(OH)2", "Ca(OH)₂"),
    ]

    print("\n" + "="*80)
    print("Testing Chemical Formulas (Pattern-Based)")
    print("="*80)

    passed = 0
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        print(f"{status} {input_text:25} → {result:25} (expected: {expected})")

    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def test_subscripts_and_superscripts():
    """Test general subscript/superscript conversion"""
    processor = ScientificOCRProcessor()

    test_cases = [
        # Subscripts
        ("T0", "T₀"),
        ("x2", "x₂"),
        ("B222", "B₂₂₂"),
        ("eta i", "ηᵢ"),
        ("Ca10", "Ca₁₀"),

        # Superscripts
        ("x^2", "x²"),
        ("x^3", "x³"),
        ("10^5", "10⁵"),
        ("(B2O3)^2", "(B₂O₃)²"),
        ("^2", "²"),
    ]

    print("\n" + "="*80)
    print("Testing Subscripts and Superscripts")
    print("="*80)

    passed = 0
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        print(f"{status} {input_text:25} → {result:25} (expected: {expected})")

    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def test_real_table_rows():
    """Test with actual table rows from Lakatos images"""
    processor = ScientificOCRProcessor()

    # From table_from_page_1.png
    test_cases = [
        {
            'name': 'Table from page 1 - Header row',
            'input': ',log eta 2.0,log eta 4.0,log eta 6.0',
            'expected': ',log η 2.0,log η 4.0,log η 6.0'
        },
        {
            'name': 'Table from page 1 - Al2O3 row',
            'input': 'Al2O3,+8.32,+5.23,+4.01',
            'expected': 'Al₂O₃,+8.32,+5.23,+4.01'
        },
        {
            'name': 'Table from page 1 - B2O3 row',
            'input': 'B2O3,-21.62,-11.97,-6.42',
            'expected': 'B₂O₃,−21.62,−11.97,−6.42'
        },
        {
            'name': 'Table from page 1 - (B2O3)^2 row',
            'input': '(B2O3)^2,+0.5122,+0.3182,+0.1900',
            'expected': '(B₂O₃)²,+0.5122,+0.3182,+0.1900'
        },

        # From table_from_page_2.png
        {
            'name': 'Table from page 2 - Header',
            'input': ',B,A,T0',
            'expected': ',B,A,T₀'
        },
        {
            'name': 'Table from page 2 - Al2O3 row',
            'input': 'Al2O3,+15.21,-0.0087,+1.40',
            'expected': 'Al₂O₃,+15.21,−0.0087,+1.40'
        },

        # From another_one_table_from_page_2.png
        {
            'name': 'Small table - sigma row',
            'input': 'at log n,2.0,sigma = 4.63C',
            'expected': 'at log η,2.0,σ = 4.63°C'
        },
    ]

    print("\n" + "="*80)
    print("Testing Real Table Rows from Lakatos Images")
    print("="*80)

    passed = 0
    for test_case in test_cases:
        result = processor.process_text(test_case['input'])
        status = "✓" if result == test_case['expected'] else "✗"
        if result == test_case['expected']:
            passed += 1

        print(f"\n{status} {test_case['name']}")
        print(f"  Input:    {test_case['input']}")
        print(f"  Output:   {result}")
        print(f"  Expected: {test_case['expected']}")

    print(f"\n\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def test_complex_formulas():
    """Test complex chemical formulas that might appear in other documents"""
    processor = ScientificOCRProcessor()

    test_cases = [
        # Phosphates
        ("Ca3(PO4)2", "Ca₃(PO₄)₂"),

        # Hydrates
        ("CuSO4·5H2O", "CuSO₄·5H₂O"),

        # Complex oxides
        ("BaTiO3", "BaTiO₃"),
        ("LaAlO3", "LaAlO₃"),

        # Silicates
        ("Mg2SiO4", "Mg₂SiO₄"),

        # Multiple oxidation states
        ("Fe2O3", "Fe₂O₃"),
        ("Fe3O4", "Fe₃O₄"),

        # Carbonates
        ("CaCO3", "CaCO₃"),
        ("Na2CO3", "Na₂CO₃"),
    ]

    print("\n" + "="*80)
    print("Testing Complex Chemical Formulas")
    print("="*80)

    passed = 0
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        print(f"{status} {input_text:25} → {result:25} (expected: {expected})")

    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def test_special_symbols():
    """Test special symbols and formatting"""
    processor = ScientificOCRProcessor()

    test_cases = [
        # Degree Celsius
        ("25C", "25°C"),
        ("100 C", "100°C"),
        ("deg C", "°C"),

        # Delta
        ("DT", "ΔT"),
        ("dT", "ΔT"),
        ("Delta T", "ΔT"),

        # Minus sign
        ("-12.5", "−12.5"),
        ("value: -0.0087", "value: −0.0087"),
    ]

    print("\n" + "="*80)
    print("Testing Special Symbols")
    print("="*80)

    passed = 0
    for input_text, expected in test_cases:
        result = processor.process_text(input_text)
        status = "✓" if result == expected else "✗"
        if result == expected:
            passed += 1
        print(f"{status} {input_text:25} → {result:25} (expected: {expected})")

    print(f"\nPassed: {passed}/{len(test_cases)}")
    return passed == len(test_cases)

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("COMPREHENSIVE SCIENTIFIC NOTATION TESTS")
    print("Based on Real Lakatos PDF Examples")
    print("="*80)

    results = []

    # Run all test suites
    results.append(("Greek Letters", test_all_greek_letters()))
    results.append(("Chemical Formulas (Pattern-Based)", test_chemical_formulas_pattern_based()))
    results.append(("Subscripts/Superscripts", test_subscripts_and_superscripts()))
    results.append(("Real Table Rows", test_real_table_rows()))
    results.append(("Complex Formulas", test_complex_formulas()))
    results.append(("Special Symbols", test_special_symbols()))

    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)

    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status:8} - {name}")
        if not passed:
            all_passed = False

    print("="*80)

    if all_passed:
        print("\n✅ ALL TESTS PASSED!\n")
        return 0
    else:
        print("\n❌ SOME TESTS FAILED\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())

