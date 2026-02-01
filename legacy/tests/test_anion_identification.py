#!/usr/bin/env python3
"""
Test anion family identification logic
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from thermophysical_data_processor import ComprehensiveThermophysicalProcessor

print("=" * 80)
print("TESTING ANION FAMILY IDENTIFICATION")
print("=" * 80)

# Create processor
processor = ComprehensiveThermophysicalProcessor(
    input_file='../library/resources/NBS_Tables Library.xlsx'
)

print(f"\n✅ Configuration loaded")

# Test cases - (formula, name, expected_anion_family)
test_cases = [
    # Pure elements - should be None
    ('Si', 'Silicon', None, 'Pure element'),
    ('Fe', 'Iron', None, 'Pure element'),
    ('Al', 'Aluminum', None, 'Pure element'),
    ('O2', 'Oxygen', None, 'Pure element'),
    ('Cl2', 'Chlorine', None, 'Pure element'),

    # Oxides
    ('Al2O3', 'Aluminum oxide', 'oxide', 'Oxide'),
    ('SiO2', 'Silicon dioxide', 'oxide', 'Oxide'),
    ('Fe2O3', 'Iron(III) oxide', 'oxide', 'Oxide'),
    ('TiO2', 'Titanium dioxide', 'oxide', 'Oxide'),

    # Chlorides
    ('NaCl', 'Sodium chloride', 'chloride', 'Chloride'),
    ('AlCl3', 'Aluminum chloride', 'chloride', 'Chloride'),
    ('MgCl2', 'Magnesium chloride', 'chloride', 'Chloride'),

    # Sulfates vs Sulfites vs Sulfides
    ('Na2SO4', 'Sodium sulfate', 'sulfate', 'Sulfate (SO4)'),
    ('Na2SO3', 'Sodium sulfite', 'sulfite', 'Sulfite (SO3)'),
    ('Na2S', 'Sodium sulfide', 'sulfide', 'Sulfide (S only)'),
    ('CaSO4', 'Calcium sulfate', 'sulfate', 'Sulfate'),
    ('CaSO3', 'Calcium sulfite', 'sulfite', 'Sulfite'),
    ('CaS', 'Calcium sulfide', 'sulfide', 'Sulfide'),

    # Phosphates
    ('Na3PO4', 'Sodium phosphate', 'phosphate', 'Phosphate (PO4)'),
    ('NaPO3', 'Sodium metaphosphate', 'metaphosphate', 'Metaphosphate (PO3)'),
    ('Na4P2O7', 'Sodium pyrophosphate', 'pyrophosphate', 'Pyrophosphate (P2O7)'),

    # Carbonates
    ('CaCO3', 'Calcium carbonate', 'carbonate', 'Carbonate'),
    ('Na2CO3', 'Sodium carbonate', 'carbonate', 'Carbonate'),

    # Fluorides
    ('NaF', 'Sodium fluoride', 'fluoride', 'Fluoride'),
    ('CaF2', 'Calcium fluoride', 'fluoride', 'Fluoride'),

    # Carbides, Nitrides, Borides
    ('SiC', 'Silicon carbide', 'carbide', 'Carbide'),
    ('Si3N4', 'Silicon nitride', 'nitride', 'Nitride'),
    ('TiB2', 'Titanium diboride', 'boride', 'Boride'),
]

print(f"\n📋 Testing {len(test_cases)} cases:\n")

passed = 0
failed = 0
errors = []

for formula, name, expected, description in test_cases:
    try:
        result = processor.identify_anion_family(formula, name)

        if result == expected:
            status = "✅ PASS"
            passed += 1
        else:
            status = "❌ FAIL"
            failed += 1
            errors.append(f"{formula:15s} Expected: {expected:15s} Got: {result}")

        print(f"{status} {formula:15s} → {result if result else 'None':15s} ({description})")
    except Exception as e:
        status = "💥 ERROR"
        failed += 1
        errors.append(f"{formula:15s} Error: {e}")
        print(f"{status} {formula:15s} → Error: {e}")

print("\n" + "=" * 80)
print(f"RESULTS: {passed} passed, {failed} failed out of {len(test_cases)} tests")
print("=" * 80)

if errors:
    print("\n❌ FAILURES:")
    for error in errors:
        print(f"  {error}")
    sys.exit(1)
else:
    print("\n✅ ALL TESTS PASSED!")
    sys.exit(0)

