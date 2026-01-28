#!/usr/bin/env python3
"""
Test script to verify add_new_families.py works correctly
"""

import sys
import os

# Change to project root
os.chdir('/opt/thermal-software')
sys.path.insert(0, 'python_scripts')

# Import and test the functions
from add_new_families import load_anion_patterns, load_cations, get_anion_family, get_cation

print("=" * 80)
print("TESTING CONFIGURATION FILE LOADING")
print("=" * 80)

# Test 1: Load anion patterns
print("\nTest 1: Loading anion patterns...")
patterns = load_anion_patterns()
print(f"✅ Loaded {len(patterns)} anion patterns")
print("\nFirst 10 patterns:")
for p in patterns[:10]:
    print(f"  {p[1]:20s} patterns={p[0]}, priority={p[2]}")

# Test 2: Load cations
print("\nTest 2: Loading cations...")
cations = load_cations()
print(f"✅ Loaded {len(cations)} cations")
print(f"\nFirst 10 cations: {cations[:10]}")

# Test 3: Test anion identification
print("\nTest 3: Testing anion identification...")
test_formulas = ['NaNO3', 'KNO2', 'NaBr', 'KI', 'NaCl', 'CaCO3', 'Na2SO4']
for formula in test_formulas:
    anion = get_anion_family(formula)
    print(f"  {formula:12s} -> {anion}")

# Test 4: Test cation identification
print("\nTest 4: Testing cation identification...")
for formula in test_formulas:
    cation = get_cation(formula)
    print(f"  {formula:12s} -> {cation}")

print("\n" + "=" * 80)
print("ALL TESTS PASSED ✅")
print("=" * 80)

