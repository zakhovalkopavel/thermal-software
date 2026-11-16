"""
yaws1999.constants — Source path and output layout for Yaws Chemical Properties Handbook (1999).

The DjVu lives under ``shared/sources/compound-data/`` (visible in the python
container). Final tables go to ``shared/processed/yaws1999/tables/`` (one
slug-named JSON per handbook table) plus root ``index.json``. Freeform finals
are flat under ``chapters/`` / ``front-matter/`` / ``appendix/`` (one version
each). Staging page JSON is retired from processed after consolidation into
``reports/yaws1999/intermediates/``; OCR quant/dpi variants go to
``reports/yaws1999/variants/`` only. Page dumps / debug JSON live under
``reports/yaws1999/``. OCR engine is chosen by page-ocr (``PAGE_OCR_*``);
see ``parse_tables.parse_yaws1999``.

Printed page ≈ DjVu page − ``PAGE_OFFSET`` (Table 1-1 starts on DjVu page 10 = printed 1).
"""
from __future__ import annotations

from pathlib import Path

SOURCE_DJVU = Path("shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu")
PROCESSED_DIR = Path("shared/processed/yaws1999")
# Container cwd is /app; compose mounts ./tmp/reports/python → /app/reports.
REPORT_DIR = Path("reports/yaws1999")
PAGES_DIR = REPORT_DIR / "pages"
DEBUG_DIR = REPORT_DIR / "debug"

PAGE_OFFSET = 9
"""DjVu page − printed page for the body tables (Table 1-1 on DjVu 10 = printed 1)."""

REF_KEY = "Yaws1999"
SOURCE_NAME = "Yaws — Chemical Properties Handbook"
SOURCE_YEAR = "1999"

# Known OCR / typographical CAS errors in the handbook tables (wrong → official).
# Applied when parsing rows and when compound-data reads processed JSON.
#
# How to extend (see ``scripts/fix_yaws1999_table_cas.py``):
#   1. Table CAS missing from the appendix → look up the same name in the CAS index.
#   2. Verify table CAS + appendix candidate(s) via PubChem/NIST/….
#   3. Auto-fix the table only when the table CAS is not found and one appendix
#      CAS is confirmed. If both are found (isomers/mixtures), review manually.
CAS_TYPO_FIXES: dict[str, str] = {
    "72-02-5": "75-02-5",       # vinyl fluoride (72-02-5 is unassigned)
    "75-05-08": "75-05-8",      # acetonitrile (extra OCR digit)
    # Appendix CAS index rows that failed the check digit (user-verified official CAS)
    "76-47-4": "77-47-4",       # hexachlorocyclopentadiene
    "92-54-4": "92-52-4",       # biphenyl
    "103-03-2": "108-03-2",     # 1-nitropropane
    "121-71-5": "121-17-5",     # 4-chloro-3-nitrobenzotrifluoride
    "156-43-3": "156-43-4",     # p-phenetidine
    "544-55-2": "544-25-2",     # 1,3,5-cycloheptatriene
    "606-95-7": "6812-39-1",    # 1-cyclopentylhexadecane
    "624-58-6": "624-48-6",     # dimethyl maleate
    "627-98-7": "627-98-5",     # 5-methyl-1-hexanol
    "2278-87-9": "20278-87-9",  # 3,3,4-trimethylheptane
    "2278-88-0": "20278-88-0",  # 3,4,4-trimethylheptane
    "2278-89-1": "20278-89-1",  # 3,4,5-trimethylheptane
    "6758-23-5": "6785-23-5",   # 1-cyclopentylundecane
    "6892-38-0": "6812-38-0",   # 1-cyclohexylhexadecane
    "7064-93-2": "764-93-2",    # 1-decyne
    "13436-39-3": "13463-39-3", # nickel carbonyl
}


def correct_cas(cas: str | None) -> str | None:
    """Return the official CAS when ``cas`` is a known handbook typo; else unchanged."""
    if cas is None:
        return None
    text = str(cas).strip()
    return CAS_TYPO_FIXES.get(text, text)


# Appendix formula fixes keyed by the **corrected** CAS (after ``correct_cas``).
APPENDIX_FORMULA_FIXES: dict[str, str] = {
    "92-52-4": "C12H10",  # biphenyl (OCR C12H1O)
}


def correct_appendix_formula(cas: str | None, formula: str | None) -> str | None:
    """Return a curated appendix formula for ``cas`` when known; else unchanged."""
    if formula is None:
        return None
    key = correct_cas(cas) or (str(cas).strip() if cas else "")
    return APPENDIX_FORMULA_FIXES.get(key, formula)
