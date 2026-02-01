#!/usr/bin/env python3
"""
Test script to verify thermophysical data processor configuration
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

def test_configuration():
    """Test loading configuration files"""
    print("=" * 80)
    print("TESTING CONFIGURATION LOADING")
    print("=" * 80)

    try:
        from thermophysical_data_processor import ComprehensiveThermophysicalProcessor

        processor = ComprehensiveThermophysicalProcessor(
            input_file='../library/resources/NBS_Tables Library.xlsx'
        )

        print("\n✅ Configuration loaded successfully!\n")

        # Test cations
        print(f"Cations loaded: {len(processor.TARGET_CATIONS)}")
        print(f"  Expected: 21")
        print(f"  List: {', '.join(processor.TARGET_CATIONS[:10])}...")
        assert len(processor.TARGET_CATIONS) == 21, "Should have 21 cations"
        assert 'Cu' in processor.TARGET_CATIONS, "Should include Cu"
        print("  ✅ Cations OK\n")

        # Test anion families
        print(f"Anion families loaded: {len(processor.ANION_FAMILIES)}")
        print(f"  Expected: 16")
        families = list(processor.ANION_FAMILIES.keys())
        print(f"  Families: {', '.join(families)}")
        assert len(processor.ANION_FAMILIES) == 16, "Should have 16 anion families"
        assert 'sulfite' in processor.ANION_FAMILIES, "Should include sulfite"
        assert 'sulfide' in processor.ANION_FAMILIES, "Should include sulfide"
        assert 'pyrosulfate' in processor.ANION_FAMILIES, "Should include pyrosulfate"
        assert 'metaphosphate' in processor.ANION_FAMILIES, "Should include metaphosphate"
        assert 'pyrophosphate' in processor.ANION_FAMILIES, "Should include pyrophosphate"
        print("  ✅ Anion families OK\n")

        # Test compound names
        print(f"Compound names loaded: {len(processor.compound_names)}")
        print(f"  Expected: 230+")

        # Test specific compounds
        test_compounds = [
            ('H2O', 'Water'),
            ('Cu', 'Copper'),
            ('CuO', 'Copper(II) oxide'),
            ('Na2SO3', 'Sodium sulfite'),
            ('Na2S', 'Sodium sulfide'),
            ('NaPO3', 'Sodium metaphosphate'),
            ('Na4P2O7', 'Sodium pyrophosphate'),
        ]

        for formula, expected_name in test_compounds:
            if formula in processor.compound_names:
                actual = processor.compound_names[formula]
                print(f"  ✅ {formula}: {actual}")
                assert actual == expected_name, f"Expected {expected_name}, got {actual}"
            else:
                print(f"  ⚠️  {formula}: Not found")

        print(f"\n  ✅ Compound names OK\n")

        # Test allowed elements
        print(f"Allowed elements: {len(processor.ALLOWED_ELEMENTS)}")
        print(f"  Expected: 29 (21 cations + 8 anions)")
        print(f"  Elements: {', '.join(sorted(processor.ALLOWED_ELEMENTS))}")
        assert len(processor.ALLOWED_ELEMENTS) == 29, "Should have 29 allowed elements"
        assert 'Cu' in processor.ALLOWED_ELEMENTS, "Should include Cu"
        print("  ✅ Allowed elements OK\n")

        # Test excluded patterns
        print(f"Excluded patterns: {len(processor.EXCLUDED_PATTERNS)}")
        print(f"  Expected: 3")
        print(f"  Patterns: {', '.join(processor.EXCLUDED_PATTERNS.keys())}")
        assert len(processor.EXCLUDED_PATTERNS) == 3, "Should have 3 excluded patterns"
        print("  ✅ Excluded patterns OK\n")

        print("=" * 80)
        print("✅ ALL TESTS PASSED!")
        print("=" * 80)
        print("\nConfiguration is correct and ready to process NBS Tables.")
        print(f"\nSummary:")
        print(f"  - {len(processor.TARGET_CATIONS)} cations")
        print(f"  - {len(processor.ANION_FAMILIES)} anion families")
        print(f"  - {len(processor.compound_names)} compound names")
        print(f"  - {len(processor.ALLOWED_ELEMENTS)} allowed elements")
        print(f"  - {len(processor.EXCLUDED_PATTERNS)} exclusion patterns")

        return True

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_configuration()
    sys.exit(0 if success else 1)

