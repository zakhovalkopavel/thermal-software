#!/usr/bin/env python3
"""Extract thermochemical staging JSON/TDB from shared/sources/minerals-thermodynamic.

Refs:
  [60] RobieHemingway1995
  [61] HollandPowell2011
  [62] Abdul2023
  [63] Mao2005
  [64] Pankratz1982
  [65] Jung2009AlTiO
  [66] Malan2019
  [67] Watanabe2000
  [68] Koroleva2017
"""

from __future__ import annotations

import json
import sys

from thermodynamic_staging.extract_all import extract_all
from thermodynamic_staging.paths import repo_root


def main() -> int:
    coverage = extract_all(repo_root())
    print(json.dumps(
        {
            "datasetDir": coverage.get("datasetDir"),
            "textsDir": coverage.get("textsDir"),
            "nItems": len(coverage.get("items", [])),
            "statuses": {
                item["id"]: item["status"] for item in coverage.get("items", [])
            },
        },
        indent=2,
    ))
    return 0


if __name__ == "__main__":
    sys.exit(main())
