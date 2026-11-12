# Yaws 1999 Chemical Properties Handbook Parser

Parse Carl L. Yaws, *Chemical Properties Handbook* (McGraw-Hill, 1999) from the local DjVu into **one JSON file per handbook table**, following the same dump → parse → write shape as the NSRDS-NBS 61 eutectic index.

## Source

- File: `shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu` (770 pages, 600 dpi; must live under `shared/` so the python container can see it)
- Reference key: `Yaws1999` ([6] in `docs/REFERENCES.md`)
- Printed page ≈ DjVu page − 9 (Table 1-1 starts on DjVu page 10 = printed page 1)

## OCR

OCR is delegated entirely to the **`page-ocr`** submodule (`vendor/page-ocr`). Yaws only supplies the source path, page number, and cache dirs — it does not select an engine.

| Variable | Notes |
| --- | --- |
| `PAGE_OCR_BACKEND` | `local` (llama-server in python image) or `modal` (remote GPU) |
| `PAGE_OCR_ENGINE` | Engine id inside page-ocr (default `surya`) |
| `PAGE_OCR_MODEL` | Complete model id — change to swap models later |
| `PAGE_OCR_QUANT` | `bf16` \| `q8` (Modal: choose at call time after one dual-quant deploy) |
| `PAGE_OCR_MODAL_APP` / `PAGE_OCR_MODAL_CLASS` / `PAGE_OCR_MODAL_GPU` | Required when backend=`modal` |

Deploy Modal: `make page-ocr-deploy` (alias `make yaws1999-modal-deploy`). See [YAWS1999_MODAL.md](YAWS1999_MODAL.md) and `vendor/page-ocr/README.md`.

## Flow

1. **Catalog** — scan pages for `Table X-Y …` headers; build contiguous DjVu page spans (~49 tables).
2. **Dump** — per page, render + OCR via page-ocr → `reports/yaws1999/pages/page-NNNN.txt` (host: `tmp/reports/python/yaws1999/pages/`; resume unless `FORCE=1`). Also write the raw OCR payload as `page-NNNN.ocr.json` (local or Modal). PNG renders under `renders/`.
3. **Parse** — header / equation / numbered rows; name-gated OCR formula cleanup. Reference columns like `density @ 25 C` are kept as one column (OCR often splits them on `@`).
4. **Write** — slug-named **dataset** JSON under `shared/processed/yaws1999/`, **debug** JSON under `reports/yaws1999/debug/`, plus `index.json`.

```
source page (PDF / DjVu / image)
    → page-ocr render + OCR
    → pages/page-NNNN.txt (+ page-NNNN.ocr.json raw payload)
    → parse_page_lines
    → dataset JSON + debug JSON + index.json
```

**Rebuild without OCR:** `make yaws1999-rebuild` / `make yaws1999-rebuild TABLE=1-1` re-parses existing page dumps into the new JSON shape.

## Output

| Path | Content |
| --- | --- |
| `shared/processed/yaws1999/<Slug>_(table_<id>).json` | Public dataset table |
| `shared/processed/yaws1999/index.json` | Catalog of table files + source pointer |
| `tmp/reports/python/yaws1999/pages/page-NNNN.txt` | OCR lines (resume / rebuild) |
| `tmp/reports/python/yaws1999/pages/page-NNNN.ocr.json` | Raw OCR payload (`blocks`, `quant`, `dpi`, `elapsed_ms` / `elapsed_s`; Modal also `client_elapsed_*`) |
| `tmp/reports/python/yaws1999/debug/<Slug>_(table_<id>).json` | Debug copy with OCR provenance |
| `tmp/reports/python/yaws1999/renders/` | rendered page PNG cache |

Debug JSON may include opaque `engine` / `backend` / `model` / `quant` / `dpi` fields copied from page-ocr config.

## CLI / Make

```bash
make yaws1999-parse
make yaws1999-parse TABLE=1-1
make yaws1999-parse TABLE=1-1 PAGE=37 FORCE=1   # OCR one table page; other span pages resume dumps
make yaws1999-parse PAGE=650 FORCE=1            # freeform page (intro/appendix; no Table X-Y needed)
make yaws1999-parse TABLE=2-2 FORCE=1
make yaws1999-parse TABLE=1-1 BACKEND=local QUANT=q8 PAGE=37 FORCE=1
make yaws1999-rebuild              # all tables from dumps
make yaws1999-rebuild TABLE=1-1    # one table from dumps
make page-ocr-deploy               # deploy page-ocr Modal app
PAGE_OCR_BACKEND=modal make yaws1999-parse TABLE=2-2 FORCE=1
make yaws1999-test
```

`NO_REPLACE=1` keeps an existing dataset file and writes a `.<quant>.dpi<DPI>.json` variant
instead (so `QUANT=q8 DPI=200` and `QUANT=q8 DPI=400` can sit side by side). OCR dumps are
tagged the same way (`page-NNNN.q8.dpi200.txt` / `.ocr.json`).

## Package layout

```
python/src/yaws1999/
  constants.py       # source path, page offset, output dirs
  ocr.py             # thin adapter → page_ocr (no engine choice)
  table_catalog.py   # Table X-Y page spans
  row_parser.py      # lines → rows + unparsed
  dataset.py         # slug names, header columns, dataset/debug shape
  parse_tables.py    # catalog → dump → parse → write / rebuild
  writers.py         # dataset + debug JSON + index.json
python/src/scripts/parse_yaws1999.py
python/src/scripts/rebuild_yaws1999.py
python/tests/yaws1999/
```

## Relation to compound data

Hand-moved gas equations already live in `shared/sources/book-gas-equations.json` (`yaws1999Gas`). This parser extracts the full handbook tables as a separate processed source; wiring selected rows into the compound-data build is a later step.
