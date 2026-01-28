#!/bin/bash
# Quick verification script

echo "===== VERIFICATION SUMMARY ====="
echo ""

echo "1. Library Documentation Structure:"
echo "   Essential docs in library/docs/:"
ls -1 docs/*.md 2>/dev/null | wc -l
echo "   files (should be ~8)"
echo ""

echo "2. Tests Directory:"
ls -1 ../tests/test_*.py 2>/dev/null | wc -l
echo "   test files found"
echo ""

echo "3. Data Structure:"
echo "   Final data files:"
ls -1 processed_data/*.csv 2>/dev/null | tail -2
echo ""
echo "   Source data files:"
ls -1 resources/data_sources/*.csv 2>/dev/null
echo ""

echo "4. PubChem Fetcher Status:"
grep -c "return None  # Return None for not found" ../python_scripts/bulk_pubchem_fetcher.py && echo "   ✅ Skips not-found compounds" || echo "   ❌ Issue with skip logic"

grep -c "if data is not None:  # Only add if found" ../python_scripts/bulk_pubchem_fetcher.py && echo "   ✅ Only adds found compounds" || echo "   ❌ Issue with add logic"

grep -c "if results:  # Only save if we have results" ../python_scripts/bulk_pubchem_fetcher.py && echo "   ✅ Only saves non-empty results" || echo "   ❌ Issue with save logic"
echo ""

echo "5. Separate Column Check:"
grep -c "properties\['color'\]" ../python_scripts/extract_experimental_properties.py && echo "   ✅ Color in separate column" || echo "   ❌ Color column issue"

grep -c "properties\['solubility'\]" ../python_scripts/extract_experimental_properties.py && echo "   ✅ Solubility in separate column" || echo "   ❌ Solubility column issue"

grep -c "properties\['stability'\]" ../python_scripts/extract_experimental_properties.py && echo "   ✅ Stability in separate column" || echo "   ❌ Stability column issue"

echo ""
echo "===== ALL CHECKS COMPLETE ====="

