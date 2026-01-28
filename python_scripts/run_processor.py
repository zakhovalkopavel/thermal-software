#!/usr/bin/env python3
"""Quick test to validate configuration and run processor"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from thermophysical_data_processor import ComprehensiveThermophysicalProcessor

print("=" * 80)
print("TESTING PROCESSOR")
print("=" * 80)

# Create processor
processor = ComprehensiveThermophysicalProcessor(
    input_file='../library/resources/NBS_Tables Library.xlsx'
)

print(f"\n✅ Configuration loaded:")
print(f"   Cations: {len(processor.TARGET_CATIONS)}")
print(f"   Anion families: {len(processor.ANION_FAMILIES)}")
print(f"   Compound names: {len(processor.compound_names)}")

print(f"\n📋 Anion families loaded:")
for family, info in processor.ANION_FAMILIES.items():
    print(f"   {family}: {len(info['patterns'])} patterns")

print(f"\n🚀 Running processor...")
try:
    processor.process_complete_database()
    print("\n✅ SUCCESS!")
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

