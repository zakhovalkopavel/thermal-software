"""Extract Appendix B CALPHAD TDB text from Abdul (2023) thesis PDF.

Refs:
  [62] Abdul2023
"""

from __future__ import annotations

import re
import subprocess
from pathlib import Path


def extract_abdul_tdb(
    pdf: Path,
    *,
    first_page: int = 185,
    last_page: int | None = None,
) -> str:
    """Return cleaned TDB-ish text from Appendix B page range."""
    if last_page is None:
        info = subprocess.run(
            ["pdfinfo", str(pdf)],
            check=True,
            capture_output=True,
            text=True,
        ).stdout
        m = re.search(r"^Pages:\s+(\d+)", info, re.M)
        last_page = int(m.group(1)) if m else first_page
    raw = subprocess.run(
        [
            "pdftotext",
            "-layout",
            "-f",
            str(first_page),
            "-l",
            str(last_page),
            str(pdf),
            "-",
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout
    # Drop repeated running headers and form feeds.
    lines: list[str] = []
    for line in raw.splitlines():
        if re.search(r"APPENDIX B\. APPENDIX: TDB FILE", line, re.I):
            continue
        if re.fullmatch(r"\s*\f?\s*", line):
            continue
        lines.append(line.rstrip())
    text = "\n".join(lines).strip() + "\n"
    return text


def summarize_tdb(text: str) -> dict:
    """Count PHASE / FUNCTION / PARAMETER markers for the coverage index."""
    phases = sorted(set(re.findall(r"^PHASE\s+(\S+)", text, re.M)))
    functions = sorted(set(re.findall(r"^FUNCTION\s+(\S+)", text, re.M)))
    parameters = len(re.findall(r"^PARAMETER\s+", text, re.M))
    liquid = "PHASE LIQUID" in text or re.search(r"^PHASE\s+LIQUID\b", text, re.M)
    return {
        "nPhaseBlocks": len(phases),
        "phaseNames": phases[:80],
        "nFunctions": len(functions),
        "nParameters": parameters,
        "hasLiquidPhase": bool(liquid),
        "sampleFunctions": [f for f in functions if f.startswith("G")][:40],
    }
