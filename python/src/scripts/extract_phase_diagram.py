#!/usr/bin/env python3
"""
extract_phase_diagram.py — CLI entry point: phase-diagram data from the Slag Atlas and NSRDS-NBS 61.

Commands live in ``phase_diagrams.cli`` (one module group per workflow area). This file is the
thin ``make pd-*`` / ``docker compose run`` entry point.

Output
------
  reports/phase-diagrams/candidates/<system>.json   (extract / trace-curves; compared with the dataset file)
  reports/phase-diagrams/starts/<system>.json       (new: starting file of a ternary, read until it is promoted)
  shared/processed/phase-diagrams/configs/<system>.curves.config.json   (new: written only when absent)
  reports/phase-diagrams/{renders,tiles,nodes,overlays,review,isotherms,auto,auto-full,figure-index,nbs,replaced}/
  shared/processed/phase-diagrams/systems/<system>.json   (only via promote, after validation)
  shared/processed/phase-diagrams/overlays/<system>.png   (copied by promote with its system file)

Implementation
--------------
  phase_diagrams — calibration, detectors, tracing, NBS index, builders, validator
  phase_diagrams.cli — argparse + command handlers

Spec
----
  docs/scripts/phase-diagrams/README.md

Usage
-----
  docker compose run --rm python python src/scripts/extract_phase_diagram.py extract mgo-sio2
  make pd-extract SYSTEM=mgo-sio2   (all commands run in the python container)
"""

from __future__ import annotations

import sys

from phase_diagrams.cli.main import main

# Re-exports for unit tests that import dump helpers from this script path.
from phase_diagrams.cli.nbs import (  # noqa: F401
    _append_nbs_page,
    _nbs_page_already_done,
)

if __name__ == "__main__":
    sys.exit(main())
