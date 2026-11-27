# OCR policy (mandatory)

**Status:** Mandatory for all PDF / scanned-source extraction.  
**Related:** [`page-ocr`](../SHARED_LIBRARIES_SUBMODULES.md), staging specs under `docs/scripts/`.

## Roles

| Tool | Role | Use for |
|------|------|---------|
| **pdftotext** (Poppler) | Fast orientation | Skim layout, find table/equation pages, draft regexes, debug |
| **Tesseract** | Fast orientation **or** deep segmentation | Same skim role as pdftotext; **also** complicated layouts that need region/line/box segmentation (same reason we use it on diagrams) |
| **AI OCR (Surya via `page-ocr`, Modal or local)** | **Final text for datasets** | Any numbers/strings that land in `shared/processed/`, compound-data, or staging parsers |

## Rules

1. **Final extract text comes from AI OCR** (Surya today, through `vendor/page-ocr`). Prefer Modal for batch pages; local when appropriate. Do not ship `pdftotext` / raw Tesseract text as the authoritative dump for calculable JSON.
2. **pdftotext and Tesseract are for understanding the document quickly** — page maps, “where is Table 2?”, rough formulas. Keep their dumps under `tmp/reports/` (e.g. `*.pdftotext.txt`) for analysis/debug only.
3. **Complicated layout → Tesseract for segmentation.** When the page needs deep region/line/cell structure (dense multipanel figures, diagram axes/labels, heavily nested tables), use Tesseract (or CV+Tesseract pipelines as for phase diagrams) to **segment**; still prefer Surya (or a zone re-OCR via page-ocr) for the **final recognition string** when feeding staging/processed parsers, unless the segmentation pipeline’s Tesseract output is the established product path for that domain (diagrams).
4. **Parsers that build datasets must read Surya `page-NNNN.txt`** (or the documented page-ocr product), not `*.pdftotext.txt`, unless the source has a trustworthy born-digital text layer **and** the domain spec explicitly allows it (rare).
5. When AI OCR is missing for a required job, extract should report `missing_ocr` (or equivalent) and point at the Modal make target — do not silently fall back to pdftotext for production datasets.

## Anti-patterns

- Building Robie / Koroleva / Jung / Mao / etc. phases from pdftotext because “it was faster”
- Treating Poppler text-layer gaps (empty pages, broken equations) as missing literature
- Mixing `*.pdftotext.txt` into the same parse path as `page-NNNN.txt` without an explicit, documented exception
