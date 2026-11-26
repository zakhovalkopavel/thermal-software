# USGS Bulletin 2131 staging (Robie & Hemingway 1995)

**Purpose:** OCR USGS Bulletin 2131 pages, build compact + complete staging
datasets, then overlay confident rows into compound-data.

**RefKey:** `RobieHemingway1995`  
**Refs:** [60] RobieHemingway1995

## Layout

| Role | Path |
|------|------|
| Source PDF | `shared/sources/compound-data/USGS Bulletin 2131 Thermodynamic properties of minerals (Robie Hemingway 1995).pdf` |
| Page selections | `tmp/reports/python/usgs-bulletin-2131/page-selections.json` |
| OCR dumps | `tmp/reports/python/usgs-bulletin-2131/ocr/page-NNNN.{txt,ocr.json,pdftotext.txt}` — **dataset parse uses `.txt` only** (`.pdftotext.txt` = Poppler text layer, kept for debug) |
| Staging (per-phase) | `shared/processed/minerals-thermodynamic/robie-hemingway-1995/<phaseId>.json` |
| Overlay summary | `tmp/reports/python/usgs-bulletin-2131/build/compound-data-overlay.json` |
| Scripts | `usgs2131_ocr.py`, `usgs2131_list_missing_ocr.py`, `usgs2131_build.py`, `usgs2131_to_compound_data.py` |
| Make | `usgs2131-ocr`, `usgs2131-ocr-missing`, `usgs2131-list-missing`, `usgs2131-build`, `usgs2131-test` |

Printed page → PDF page: **+6**.

## OCR (Modal Surya)

Policy: [`OCR_POLICY.md`](./OCR_POLICY.md) — pdftotext dumps (`*.pdftotext.txt`)
are for orientation/debug only; **dataset parse uses Surya `page-NNNN.txt`**.
Tesseract may be used when a page needs deep segmentation; not as the Robie
authoritative text layer.

Existing `page-NNNN.txt` dumps are **skipped** unless `FORCE=1`.

```bash
make sync-vendor-env && make page-ocr-deploy   # once

# list PDF pages not yet OCR'd (also refreshes page-selections.json)
make usgs2131-list-missing

# OCR only those missing pages (BACKEND=modal by default)
make usgs2131-ocr-missing BACKEND=modal

# or pass an explicit list
make usgs2131-ocr BACKEND=modal PAGE="$(make -s usgs2131-list-missing)"
```

Selections cover notes (PDF 7–9), 298/Cp tables (10–76), **all high-T tables
(77–458)**, and the mineral index (459–470).

## Parse → processed

```bash
make usgs2131-build
make usgs2131-verify
```

Writes:

1. **`<phaseId>.json`** at the staging root — `table298`, `cpRanges`, `highT.rows`, `ocrPages`  
   (no compact `phases.json`, no `compounds/` subfolder)

Parser modules: `parse_tables.py`, `parse_high_t.py`, `mineral_aliases.py`,
`write_compound_files.py`.

## Compound-data

Robie `status: ok` rows are overlaid as part of `make compound-data-build`
(together with the other minerals-thermodynamic datasets). There is no separate
USGS overlay target.

## Equation type

`robieHemingway`: Cp = A1 + A2·T + A3/T² + A4/T^0.5 + A5·T² (piecewise).

## Out of scope (later)

- GEM / cross-source confidence gates beyond `status: ok`
