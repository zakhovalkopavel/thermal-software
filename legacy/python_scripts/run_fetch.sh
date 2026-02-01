#!/bin/bash
# Simple script to run PubChem bulk fetch safely

echo "================================================================================"
echo "PUBCHEM BULK DATA FETCHER"
echo "================================================================================"
echo ""
echo "This script will fetch comprehensive data from PubChem for all compounds"
echo "missing CAS numbers, melting points, boiling points, or density."
echo ""
echo "Configuration:"
echo "  - Rate limit: 2 requests/second (safe for PubChem API)"
echo "  - Timeout: 20 seconds per request"
echo "  - Incremental saves: Every 50 compounds"
echo "  - Resume capability: Yes"
echo ""
echo "Properties fetched:"
echo "  Numerical: CAS, Tm, Tb, Td, density, flash point, vapor pressure"
echo "  Text (separate columns): color, solubility, stability, odor, toxicity"
echo ""
echo "================================================================================"
echo ""

read -p "Press Enter to start fetching, or Ctrl+C to cancel..."

# Get script directory and navigate there
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "Starting fetch..."
echo ""

python3 bulk_pubchem_fetcher.py

echo ""
echo "================================================================================"
echo "FETCH COMPLETE!"
echo "================================================================================"
echo ""
echo "Next steps:"
echo "  1. Check the generated CSV file in library/resources/data_sources/"
echo "  2. Review the results"
echo "  3. Merge with database if satisfied"
echo ""

