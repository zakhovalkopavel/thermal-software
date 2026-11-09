# Yaws 1999 Chemical Properties Handbook Parser

Parse Carl L. Yaws, *Chemical Properties Handbook* (McGraw-Hill, 1999) from the local DjVu into **one JSON file per handbook table**, following the same dump → parse → write shape as the NSRDS-NBS 61 eutectic index.

## Source

- File: `shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu` (770 pages, 600 dpi; must live under `shared/` so the python container can see it)
- Reference key: `Yaws1999` ([6] in `docs/REFERENCES.md`)
- Printed page ≈ DjVu page − 9 (Table 1-1 starts on DjVu page 10 = printed page 1)

## Engine

**Surya only** — `ddjvu` render → full-page Surya OCR (`surya-ocr` + `llama-server`), same stack as `nbs-index`. No Indra, LightOnOCR, Tesseract, or row-strip splitting.

Surya GGUF weights (`QUANT`):

| Quant | File | Notes |
| --- | --- | --- |
| **`bf16`** (default) | `surya-2.5.gguf` | Full precision GGUF from `datalab-to/surya-ocr-2.5-gguf` |
| `q8` | `surya-2.5-Q8_0.gguf` | 8-bit; slightly smaller/faster, nearly same quality |

Both share `surya-2.5-mmproj.gguf`. First use of `q8` may need `SURYA_HF_ONLINE=1` so the Q8 file can download into the HF cache.

Catalog page spans still use a fast plain `djvutxt` header scan; row extraction is always full-page Surya.

Requires `djvulibre-bin` (`ddjvu`) in the image, plus Surya / `LLAMA_CPP_BINARY`.

**CPU throughput (optional on laptops):** Yaws applies `SURYA_INFERENCE_PARALLEL=1` and `LLAMA_CPP_EXTRA_ARGS=--threads <logical_cpus> --threads-batch <logical_cpus>` (all hardware threads, typically 2× physical cores) unless overridden via compose / `.env`. Defaults are quality-oriented: **`QUANT=bf16`**, **`DPI=400`**. For speed try `QUANT=q8 DPI=200`. Keep the performance CPU governor under load. Use `FORCE=1` after changing DPI so page dumps are re-OCR’d.

**`--no-replace` / `NO_REPLACE=1`:** keep an existing `table-<id>.json`; write `table-<id>.<quant>.json` instead (e.g. `table-2-2.q8.json`). Skips if that alternate already exists. Index merges so both variants stay listed.

## Flow

1. **Catalog** — scan pages for `Table X-Y …` headers; build contiguous DjVu page spans (~49 tables).
2. **Dump** — per page, Surya OCR → cache as `reports/yaws1999/pages/surya/page-NNNN.txt` (host: `tmp/reports/python/yaws1999/pages/surya/`; resume unless `FORCE=1`). Legacy flat `pages/page-NNNN.txt` dumps are still resumed. PNG renders under `renders/`.
3. **Parse** — header / equation / `NO FORMULA NAME …` rows; OCR cleanup with **name-gated halogen fixes** (`CHLOR` → `CI`/`Ci`→`Cl`, `BROM` → `br`→`Br`; iodide names keep `CI4`; spaces inside `1.23E-04`).
4. **Write** — **one file per table** under `shared/processed/yaws1999/`, plus `index.json`.

```
DjVu page
    → ddjvu (grey PNG cache)
    → Surya full-page OCR (table HTML)
    → flatten rows to lines
    → parse_page_lines
    → table-2-1.json, table-2-2.json, … + index.json
```

## Output

| Path | Content |
| --- | --- |
| `shared/processed/yaws1999/table-<id>.json` | One handbook table (`2-1`, `21-2`, …) |
| `shared/processed/yaws1999/index.json` | Catalog of table files + source pointer |
| `tmp/reports/python/yaws1999/pages/surya/page-NNNN.txt` | OCR lines (debug / resume) |
| `tmp/reports/python/yaws1999/renders/` | rendered page PNG cache for Surya |

Each `table-*.json`:

```json
{
  "id": "2-2",
  "title": "HEAT CAPACITY OF GAS - INORGANIC COMPOUNDS",
  "refKey": "Yaws1999",
  "engine": "surya",
  "quant": "bf16",
  "equation": "CP = A + BT + …",
  "header": "NO FORMULA NAME A B C D E TMIN TMAX",
  "columns": ["no", "formula", "name", "values"],
  "djvuPages": { "first": 54, "last": 58 },
  "printedPages": { "first": 45, "last": 49 },
  "rows": [
    {
      "no": 12,
      "formula": "Ar",
      "name": "ARGON",
      "values": [20.786, 0.0, 0.0, 0.0, 0.0, 100, 1500],
      "djvuPage": 54,
      "raw": "12 Ar ARGON 20.786 …"
    }
  ],
  "unparsed": ["p54: …"]
}
```

Trailing cells stay in `values` (list) for every chapter; column meaning differs by table. Table-specific mappers can be added later without changing the file-per-table layout.

## CLI / Make

Runs in the **`python`** helper image.

```bash
make yaws1999-parse
make yaws1999-parse TABLE=2-1
make yaws1999-parse TABLE=2-2 FORCE=1
make yaws1999-parse TABLE=2-2 QUANT=q8 DPI=200 FORCE=1
make yaws1999-parse QUANT=q8 NO_REPLACE=1
make yaws1999-test
```

```bash
docker compose run --rm python \
  python src/scripts/parse_yaws1999.py --table 2-2
```

## Package layout

```
python/src/yaws1999/
  constants.py       # source path, page offset, output dirs
  djvu_renderer.py   # ddjvu → grey PNG / ndarray
  surya_ocr.py       # Surya table HTML → lines
  word_box.py        # djvutxt word boxes (catalog helpers / tests)
  page_lines.py      # word boxes → reading-order lines (tests)
  table_catalog.py   # Table X-Y page spans
  row_parser.py      # lines → rows + unparsed
  parse_tables.py    # catalog → dump → parse → write
  writers.py         # table-<id>.json + index.json
python/src/scripts/parse_yaws1999.py
python/tests/yaws1999/
```

## Relation to compound data

Hand-moved gas equations already live in `shared/sources/book-gas-equations.json` (`yaws1999Gas`). This parser extracts the full handbook tables as a separate processed source; wiring selected rows into the compound-data build is a later step.
