# Phase-Diagram Extraction — NSRDS-NBS 61

Part of the [phase-diagram extraction specification](README.md).

## NSRDS-NBS 61



### Text index

- Index source: Internet Archive scan in `sources.json` (`tablePages` pdf 11–119). The bw
  PDF’s Adobe text layer is **not** used.
- `make pd-nbs-index` renders each Table I page (`pdftoppm`) and OCRs page-by-page.
  Default **`--engine vlm`** (`nbs_vlm_ocr`): full-page VLM via page-ocr / llama-server with
  HTML `<sub>` digits (`BF<sub>3</sub>-N<sub>2</sub>O` → dump `BF3-N2O`).
  `--engine tesseract` is the legacy char-box path. The dump is a **continuous table**
  (newline-separated rows, no form-feeds); `pdfPage` / printed page (PDF − 8) live in
  `entries.json`. Progress is logged **per page**; each page is **merged** into the dump /
  `entries.json` / `unparsed.txt` (safe to interrupt / resume). Skip pages already in
  `entries.json` unless `FORCE=1`. Optional `--first` / `--last`. Local engine deps
  (`surya-ocr`) via pip in the Dockerfile; `LLAMA_CPP_BINARY` for `--engine vlm`. GGUFs
  live in `huggingface_cache`; after the first download, page-ocr sets local paths +
  `HF_HUB_OFFLINE=1`. Override with `SURYA_HF_ONLINE=1`.
- **Fallback / cleanup:** commas or periods left in a formula still go through
  `nbs_formula_ocr` (element walk; no compound whitelist).
- `nbs_text_normalizer` then cleans each component. Oxides keep dedicated patterns; other
  formulas walk `ELEMENTS` (no compound whitelist):

  | Raw                                                       | Normalized |
  | --------------------------------------------------------- | ---------- |
  | `Si0 2`, `Si0,`, `SiO,`, `SiO.`                           | `SiO2`     |
  | `YlgO`, `MgoO`                                            | `MgO`      |
  | `AI,O,`, `Al,O,`, `Al,0,`, `A1,0,`                        | `Al2O3`    |
  | `Ca0`                                                     | `CaO`      |
  | `K,0`, `K 2O`, `K,O`                                      | `K2O`      |
  | `Na,O`, `Na,0`                                            | `Na2O`     |
  | `BCI 3`, `KC1`, `NaN°3`, `TI2C03`                          | `BCl3`, `KCl`, `NaNO3`, `Tl2CO3` |
  | `GeCl.`, `VOCl,`, `SbCl s`, `WCl.`                         | `GeCl4`, `VOCl3`, `SbCl5`, `WCl6` |
  | `BF,-N,O`, `BCl,-PCl,` (page OCR)                          | `BF3-N2O`, `BCl3-PCl3` |
  | `:t`, `±o`, `=` before a number in the uncertainty column | `±`        |

- Entry line: entry number (1–4 digits), system (components joined by `-`), composition
(one value for binaries, `a-b-c` for ternaries, optional `APP`), temperature (may be
negative) with optional uncertainty or `APP`, reference numbers. Temperature may be `NA`
when the table has no melting point (trailing block ~6190–6271). Melting notes such as
`SER SOLID SOL` stay on the composition or temperature field, never as references. Lines
that look like entries but do not parse go to `nsrds-nbs-61-1.unparsed.txt`.
- `make pd-nbs-refs` repairs references in the dump then rebuilds `entries.json`: rule-based
  note/T/ref fixes + `pdftotext` overlay (fill empty refs; extend truncated multi-line wraps).
  Writes `nsrds-nbs-61-1.anomalies.txt` for T-order breaks and composition/T suspicions
  (no auto-fix of systems or mol%). Promote the finished indexes into
  `shared/processed/phase-diagrams/nbs/` (`*.entries.json`, `*.bibliography.json`); `extract` /
  `nbs-suggest` prefer that dataset copy over the working `reports/.../nbs/` dump.

### Bibliography

- Separate section from Table I: PDF `bibliographyPages` (165–251), refs `[1]` … ~`[3270]`.
- `make pd-nbs-bibliography` runs `pdftotext -layout` (no OCR), linearises each two-column
  page (left column then right), and writes
  `nbs/nsrds-nbs-61-1.bibliography.json` as `{ "1": "citation…", … }`. Raw dump:
  `.bibliography.txt`. Ids absent from the text layer go to `.bibliography.missing.txt`
  (~30 gaps on the Internet Archive scan). Re-runs merge by ref id (parsed keys update;
  prior-only keys kept unless `FORCE=1`). Optional Surya/gap-fill is out of scope for the
  first cut. The small hand `references` map in `sources.json` is unchanged.

### Conversion and comparison

- Composition basis: mol%. Binaries: the value is mol% of the first-named component of the
NBS system (which may differ from the order of `components`). Ternaries: values in the
order of the NBS system name.
- wt% via `formula_molar_mass`: the molar mass of any oxide formula from `ATOMIC_MASS`
(CaO 56.077, MgO 40.304, SiO2 60.084, Al2O3 101.961, Na2O 61.979, K2O 94.196,
TiO2 79.866 g/mol), so a new system needs no table entry. A formula without a fixed
composition (FeOx) has none: conversion raises, compound matching skips it.
- ΔT = T(NBS) − T(atlas); Δ = largest absolute difference over the oxides, in wt%.
- Each comparison is written as an NBS source of the invariant (`reported`,
`converted_wt`, `originalReference`, `comparison` text, as in `al2o3-mgo.json`).
- `nbs-suggest` lists every entry whose normalized system contains exactly the given
components, with converted wt% and temperature, for choosing entries in the config.



### Status


| Condition                                                                    | Status      |
| ---------------------------------------------------------------------------- | ----------- |
| No NBS entry chosen                                                          | `extracted` |
| At least one chosen entry within tolerance (abs(ΔT) ≤ 10 °C and Δ ≤ 1.5 wt%) | `confirmed` |
| Entries chosen, none within tolerance                                        | `conflict`  |


Approximate (`APP`) entries are compared like the others and marked "(approximate value)".
Liquidus branches are always `extracted`.
