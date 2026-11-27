#!/usr/bin/env python3
"""
extract_phase_diagram.py — thin shim to the source-extract CLI.

Prefer ``source-extract`` / ``python -m source_extract.cli`` (make ``pd-*`` targets).
This script keeps older ``docker compose run python … extract_phase_diagram.py``
invocations working by forwarding argv to the SE command layer, which delegates
into ``phase_diagrams.adapter``.

Spec
----
  docs/scripts/phase-diagrams/README.md
  docs/plans/SOURCE_EXTRACTOR_MIGRATION.md
"""

from __future__ import annotations

import sys


def main(argv: list[str] | None = None) -> int:
    args = list(sys.argv[1:] if argv is None else argv)
    try:
        from source_extract.cli.main import main as se_main
    except ImportError:
        from phase_diagrams.cli.main import main as pd_main

        return pd_main(args)
    return se_main(args)


# Re-exports for unit tests that import dump helpers from this script path.
from phase_diagrams.cli.nbs import (  # noqa: E402, F401
    _append_nbs_page,
    _nbs_page_already_done,
)

if __name__ == "__main__":
    sys.exit(main())
