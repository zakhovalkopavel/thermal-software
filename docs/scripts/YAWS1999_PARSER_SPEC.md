# Yaws 1999 Chemical Properties Handbook Parser

Parse Carl L. Yaws, *Chemical Properties Handbook* (McGraw-Hill, 1999) from the local DjVu into **one JSON file per handbook table**, following the same dump → parse → write shape as the NSRDS-NBS 61 eutectic index.

## Source

- File: `shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu` (770 pages, 600 dpi; must live under `shared/` so the python container can see it)
- Reference key: `Yaws1999` ([6] in `docs/REFERENCES.md`)
- Printed page ≈ DjVu page − 9 (Table 1-1 starts on DjVu page 10 = printed page 1)

## Engine

Full-page OCR after `ddjvu` render. Backend and **full model id** are set only via env (see `.env.example`; never commit secrets):

| Variable | Notes |
| --- | --- |
| `YAWS_OCR_BACKEND` | `local` (llama-server in python image) or `modal` (remote GPU) |
| `YAWS_OCR_MODEL` | Complete model id — change to swap models later |
| `YAWS_OCR_QUANT` | `bf16` \| `q8` when the model supports it |
| `YAWS_MODAL_APP` / `YAWS_MODAL_CLASS` / `YAWS_MODAL_GPU` | Required when backend=`modal` |

**Local:** `surya-ocr` + `llama-server` (same stack as `nbs-index`).  
**Modal:** one PNG per call — setup/deploy: [YAWS1999_MODAL.md](YAWS1999_MODAL.md).

**CPU throughput (local):** `SURYA_INFERENCE_PARALLEL=1` and `LLAMA_CPP_EXTRA_ARGS=--threads <logical_cpus> --threads-batch <logical_cpus>` unless overridden.

## Flow

1. **Catalog** — scan pages for `Table X-Y …` headers; build contiguous DjVu page spans (~49 tables).
2. **Dump** — per page, Surya OCR → `reports/yaws1999/pages/page-NNNN.txt` (host: `tmp/reports/python/yaws1999/pages/`; resume unless `FORCE=1`). With `YAWS_OCR_BACKEND=modal`, also write the raw Modal response as `page-NNNN.modal.json`. Legacy `pages/surya/page-NNNN.txt` dumps are still resumed. PNG renders under `renders/`.
3. **Parse** — header / equation / numbered rows; name-gated OCR formula cleanup. Reference columns like `density @ 25 C` are kept as one column (OCR often splits them on `@`).
4. **Write** — slug-named **dataset** JSON under `shared/processed/yaws1999/`, **debug** JSON under `reports/yaws1999/debug/`, plus `index.json`.

```
DjVu page
    → ddjvu (grey PNG cache)
    → Surya full-page OCR
    → pages/page-NNNN.txt (+ page-NNNN.modal.json when Modal)
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
| `tmp/reports/python/yaws1999/pages/page-NNNN.modal.json` | Raw Modal `ocr_page` response (Modal backend only) |
| `tmp/reports/python/yaws1999/debug/<Slug>_(table_<id>).json` | Debug copy with OCR provenance |
| `tmp/reports/python/yaws1999/renders/` | rendered page PNG cache |

Example dataset filename:

`Critical_properties_and_acentric_factor_of_organic_compounds_(table_1-1).json`

### Dataset JSON shape

`columns` is the single schema for field order, printed header text, and units (no parallel `header` / `units` maps). Row objects use each column’s `key`.

```json
{
  "id": "8-1",
  "title": "DENSITY OF LIQUID - ORGANIC COMPOUNDS",
  "refKey": "Yaws1999",
  "equation": "density = A B-(1 - T/Tc)^n (density - g/ml, T - K)",
  "columns": [
    {"key": "id", "header": "NO", "unit": null},
    {"key": "formula", "header": "FORMULA", "unit": null},
    {"key": "name", "header": "NAME", "unit": null},
    {"key": "A", "header": "A", "unit": null},
    {"key": "B", "header": "B", "unit": null},
    {"key": "n", "header": "n", "unit": null},
    {"key": "Tc", "header": "Tc", "unit": "K"},
    {"key": "TMIN", "header": "TMIN", "unit": "K"},
    {"key": "TMAX", "header": "TMAX", "unit": "K"},
    {"key": "density_at_25_C", "header": "density @ 25 C", "unit": "g/ml"}
  ],
  "pages": { "first": 183, "last": 200 },
  "rows": [
    {
      "id": 1,
      "formula": "CBrClF2",
      "name": "BROMOCHLORODIFLUOROMETHANE",
      "A": 0.67201,
      "B": 0.25624,
      "n": 0.2644,
      "Tc": 426.15,
      "TMIN": 113.65,
      "TMAX": 426.15,
      "density_at_25_C": 1.81
    }
  ]
}
```

Units come from equation footnotes when present (e.g. `(density - g/ml, T - K)`), else from unit-like header labels (`g/mol`, `K`, …). Coefficients stay `unit: null`.

Debug JSON adds `engine`, `quant`, `dpi`, `djvuPages`, `headerRaw`, `unparsed`, and per-row `djvuPage` / `raw` / `formulaRaw`.

## CLI / Make

```bash
make yaws1999-parse
make yaws1999-parse TABLE=1-1
make yaws1999-parse TABLE=2-2 FORCE=1
make yaws1999-rebuild              # all tables from dumps
make yaws1999-rebuild TABLE=1-1    # one table from dumps
make yaws1999-modal-deploy         # deploy Surya app to Modal (T4)
YAWS_OCR_BACKEND=modal make yaws1999-parse TABLE=2-2 FORCE=1
make yaws1999-test
```

Modal install steps: [YAWS1999_MODAL.md](YAWS1999_MODAL.md).

## Package layout

```
python/src/yaws1999/
  constants.py       # source path, page offset, output dirs
  djvu_renderer.py   # ddjvu → grey PNG / ndarray
  surya_ocr.py       # Surya table HTML → lines
  surya_cpu.py       # logical-CPU thread defaults
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
