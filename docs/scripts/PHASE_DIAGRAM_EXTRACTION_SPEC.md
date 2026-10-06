# Phase-Diagram Extraction — Specification

## Purpose

Produce the phase-diagram dataset in `shared/processed/phase-diagrams/` from scanned
figures of the Slag Atlas, cross-checked against NSRDS-NBS 61, in a reproducible way.


| Output                                                                                       | Produced from                                                   | Mode                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `systems/<system>.json` (binary systems)                                                     | `configs/<system>.config.json` + measurements on the atlas page | Regenerated completely                            |
| `boundaryCurves[].polyline_wt`, `isotherms[].polyline_wt` in ternary `systems/<system>.json` | `configs/<system>.curves.config.json` + measurements            | Filled in place; nothing else in the file changes |
| Review overlay, review list, renders, indexes                                                | Same run                                                        | Working files, not committed                      |
| Validation report                                                                            | Whole dataset                                                   | Console, exit code                                |


The dataset is consumed by the phase-equilibrium implementation (step 3 of the
phase-diagram rework, see `docs/algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md`).

---



## Principles

1. **The config is the source of truth.** Everything a person decides or reads lives in
  the config: page and figure, axis tick values, printed labels, phases at each invariant,
   chosen NBS entries, notes and hand-written blocks. The tool measures the rest (pixels,
   line temperatures, curve points, digitized compositions, NBS comparisons, statuses) and
   writes the system JSON. Running it twice gives the same file.
2. **No data without proof.** Every value in the output carries its figure, printed page,
  PDF page and pixel (atlas) or entry number and page (NBS). A value that cannot be traced
   to a source is not written.
3. **OCR only suggests.** Tesseract readings of labels and captions appear in the review list
  and the figure index. They never go into the system JSON.
4. **Printed labels win over the drawing.** Temperatures and compositions of invariant points
  are the printed labels. Where the drawing differs from a label (for example Fig. 3.125
   draws the "38" eutectic at 39.3 wt%), the label is used, the difference is reported, and
   traced points near that junction are dropped (see [Curve sampling](#curve-sampling)).
   Values without a printed label are digitized and flagged as such.
5. **Statuses follow** `sources.json` **→** `statusLegend`**.** The tool computes `extracted`,
  `confirmed` and `conflict`; it never writes `recalled`.

---



## Folders


| Folder                                                                                 | Content                                                                | Git                                                      |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `shared/sources/`                                                                      | Slag Atlas and NSRDS-NBS 61 PDFs                                       | untracked (large files)                                  |
| `shared/processed/phase-diagrams/`                                                     | Dataset: `compounds.json`, `sources.json`, `OPEN_ITEMS.md`, `systems/` | ignored by `shared/.gitignore`; commit with `git add -f` |
| `shared/processed/phase-diagrams/configs/`                                             | Per-diagram configs                                                    | same as above                                            |
| `tmp/reports/python/phase-diagrams/` (`/app/reports/phase-diagrams/` in the container) | Working files                                                          | ignored (`tmp/*`)                                        |


The working folder is the only `tmp/` path mounted into the `python` container
(`./tmp/reports/python:/app/reports` in `compose.yml`), so no compose change is needed.

Working folder layout:

```
tmp/reports/python/phase-diagrams/
  renders/        slag-atlas-1995-p108-400dpi.png        ← page renders (cache)
  tiles/          p108-2280-2650-2930-3060-x1.png        ← zoom tiles with pixel rulers
  overlays/       mgo-sio2.png                           ← traced curves, invariants, ticks on the scan
  review/         mgo-sio2.md                            ← items to check before validation
  figure-index/   slag-atlas-1995.json                   ← caption OCR: figure → PDF page
  nbs/            nsrds-nbs-61-1.txt                     ← pdftotext -layout dump (page breaks kept)
                  nsrds-nbs-61-1.entries.json            ← parsed entries
                  nsrds-nbs-61-1.unparsed.txt            ← lines that did not parse
  scratch/        sa/, ph/                               ← former /tmp/sa and /tmp/ph working scripts (porting reference)
```

---



## Implementation layout

One export per file, dataclasses for models, public API re-exported from `__init__.py`
(same conventions as `python/src/nasa_thermo/`). No dependencies beyond
`python/pyproject.toml` (numpy, scipy, Pillow, opencv-python, pytesseract) and the
container's `poppler-utils` and `tesseract-ocr`.

```
python/
  src/
    phase_diagrams/
      __init__.py                    ← public API re-exports
      # constants
      oxide_molar_mass.py            ← OXIDE_MOLAR_MASS
      status_tolerance.py            ← STATUS_TOLERANCE (ΔT 10 °C, Δ 1.5 wt%)
      # models (dataclasses)
      axis_calibration.py            ← AxisCalibration: tick pixels ↔ values, piecewise linear
      binary_calibration.py          ← BinaryCalibration: x + y AxisCalibration + rotation
      ternary_calibration.py         ← TernaryCalibration: corners + optional quadratic warp
      diagram_config.py              ← DiagramConfig (binary config)
      curves_config.py               ← CurvesConfig (ternary curves config)
      invariant_spec.py              ← InvariantSpec (config entry)
      liquidus_branch_spec.py        ← LiquidusBranchSpec (config entry)
      trace_segment_spec.py          ← TraceSegmentSpec: trace | straight | flat
      measured_line.py               ← MeasuredLine: y, temperature, x-extent
      traced_curve.py                ← TracedCurve: pixel path + data points
      nbs_entry.py                   ← NbsEntry
      nbs_comparison.py              ← NbsComparison: converted wt%, ΔT, Δ, within tolerance
      review_item.py                 ← ReviewItem
      validation_issue.py            ← ValidationIssue
      # functions / services
      config_loader.py               ← load_diagram_config / load_curves_config (+ schema checks)
      source_registry.py             ← reads sources.json: PDF paths, page mappings, figures
      composition_converter.py       ← mol% ↔ wt%
      pdf_renderer.py                ← render_page(pdf, page, dpi) with cache
      tile_renderer.py               ← render_tile(page image, box, scale) with pixel rulers
      ink_mask.py                    ← ink_mask(image, threshold)
      stroke_width_filter.py         ← keep strokes in a width range (drops text and arrows)
      frame_detector.py              ← detect_frame(mask, search_box)
      tick_detector.py               ← detect_ticks(mask, frame) → pixel positions per edge
      tick_matcher.py                ← pair detected ticks with config tick values
      horizontal_line_detector.py    ← detect_horizontal_lines(mask, frame) → MeasuredLine[]
      junction_locator.py            ← snap a seed pixel to a curve × line junction
      curve_tracer.py                ← trace_path(mask, start, end, waypoints) (heapq Dijkstra)
      curve_sampler.py               ← sample a TracedCurve on a wt% grid with endpoint rules
      polyline_simplifier.py         ← Douglas–Peucker in wt% space (ternary polylines)
      label_reader.py                ← Tesseract on a crop → guess + confidence
      figure_indexer.py              ← caption OCR over a page range → figure index
      nbs_text_normalizer.py         ← fixes OCR noise in the NBS text layer
      nbs_entry_index.py             ← parse the NBS dump into NbsEntry[]
      nbs_matcher.py                 ← compare an invariant with NBS entries → NbsComparison[]
      status_resolver.py             ← extracted / confirmed / conflict
      binary_system_builder.py       ← config + measurements → system dict
      ternary_curve_filler.py        ← fills polyline_wt in an existing ternary file
      system_json_writer.py          ← compact layout writer (binary files)
      overlay_renderer.py            ← review PNG
      review_report.py               ← review markdown
      dataset_validator.py           ← validate the whole dataset → ValidationIssue[]
    scripts/
      extract_phase_diagram.py       ← CLI entry point (thin wrapper)
  tests/
    phase_diagrams/
      __init__.py
      fixtures/                      ← synthetic images, NBS text snippets, small dataset
      test_calibration.py
      test_detectors.py
      test_curve_tracer.py
      test_curve_sampler.py
      test_composition_converter.py
      test_nbs.py
      test_status_resolver.py
      test_system_json_writer.py
      test_ternary_curve_filler.py
      test_dataset_validator.py
      test_regression_atlas.py       ← needs the atlas PDF; skipped when absent
```

---



## Per-diagram workflow



### Binary system

1. **Locate** the figure in `figure-index/slag-atlas-1995.json` (`make pd-index` once).
2. **Render and look**: `make pd-tile PAGE=108 BOX="1050 1700 2950 4000"`. Read the
  printed labels from the tiles.
3. **Write the config** `configs/<system>.config.json`: source, axis tick values, phases,
  invariants with printed labels and seed pixels, liquidus branches, verbatim blocks.
4. **Calibrate**: `make pd-calibrate SYSTEM=mgo-sio2` detects the frame and ticks, prints
  the tick pixels and residuals, and writes an overlay. Fix the config if a tick is wrong
   (optional `tickPixels` override).
5. **Find NBS candidates**: `make pd-nbs-suggest COMPONENTS="MgO SiO2"`; add the chosen
  entry numbers to the invariants.
6. **Extract**: `make pd-extract SYSTEM=mgo-sio2` writes `systems/mgo-sio2.json`, the
  overlay and the review list.
7. **Review** the overlay and `review/mgo-sio2.md`; carry open items into `OPEN_ITEMS.md`.
8. **Validate**: `make pd-validate`.
9. Update `compounds.json` and `sources.json` by hand where the new figure adds sources,
  then stop for user validation and commit.



### Ternary curves

1. Write `configs/<system>.curves.config.json` (waypoints, isotherm seeds, pixel origin).
2. `make pd-curves SYSTEM=cao-mgo-sio2` fills `polyline_wt`, writes overlay and review.
3. Review, validate, commit.

---



## Coordinate systems

All pixels are page coordinates of the PDF page rendered with `pdftoppm -r 400`
(3306 × 4673 px for the atlas), the same convention already used in the dataset.
A config may declare `pixelOrigin: [dx, dy]` when stored pixels come from a crop
(`cao-al2o3-sio2.json` was digitized on a 1620 × 1776 crop; its origin must be
determined once by matching the corners before its curves are traced).

### Binary calibration

- x: piecewise-linear interpolation between tick pairs (value, pixel) of the x component
in wt%. y: same for temperature in °C.
- Scan rotation: a linear term from the frame lines, `y_level = py + s · (px − px_ref)`,
where `s` is the slope of the bottom frame line; and `x_level = px + k · (py_ref − py)`
for the left frame tilt.
- Linear extrapolation beyond the outer ticks (needed for liquidus ends above the top tick).
- Calibration check: tick residual ≤ 2 px against a straight-line fit; compound lines
(vertical strokes) must fall within 0.3 wt% of stoichiometry.



### Ternary calibration

- Barycentric from the three corner pixels: solve
`[[xA, xB, xC], [yA, yB, yC], [1, 1, 1]] · [a, b, c] = [px, py, 1]`, then × 100.
- Optional quadratic warp (stored in the system file `digitization.warpCorrection`):
features `f = [1, x, y, x², xy, y²]` with `x = (px − 1100)/1000`, `y = (py − 1100)/1000`;
ideal pixel = `f · C`; then barycentric. Read from the system file, never refitted by the
curve filler.

---



## Config schema



### Binary config — `configs/<system>.config.json`

```json
{
  "system": "MgO-SiO2",
  "components": ["MgO", "SiO2"],
  "output": "systems/mgo-sio2.json",
  "idPrefix": "ms",
  "source": {
    "ref": "slag-atlas-1995", "figure": "Fig. 3.125", "printedPage": 88, "pdfPage": 108,
    "diagram": "MgO-SiO2 phase diagram based mainly on ...", "caption": "Atlas text (printed p. 88): ..."
  },
  "frameSearchBox": [1300, 2100, 3000, 3400],
  "axes": {
    "x": { "component": "SiO2", "ticks": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] },
    "y": { "ticks": [3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400, 1200, 1000] }
  },
  "phases": ["periclase", "forsterite", "enstatite", "silica"],
  "endMembers": {
    "periclase": { "x": 0, "labelTemperature": 2822 },
    "silica": { "x": 100, "labelTemperature": 1725 }
  },
  "invariants": [
    { "id": "ms-1850", "type": "binary", "reaction": "eutectic", "phases": ["periclase", "forsterite"],
      "label": { "temperature": 1850, "composition": 38 },
      "seedPixel": [2013, 2819],
      "nbs": [],
      "notes": "Fig. 3.187 edge prints ~1860 °C at 36.2 wt% SiO2 (mas-edge-periclase-forsterite)." },
    { "id": "ms-1695", "type": "monotectic", "reaction": "monotectic", "phases": ["silica"],
      "label": { "temperature": 1695, "composition": 70, "secondComposition": null },
      "seedPixel": [2457, 2905], "secondSeedPixel": [2904, 2904], "nbs": [] }
  ],
  "liquidus": [
    { "phase": "periclase", "from": "end:periclase", "to": "ms-1850",
      "segments": [ { "kind": "trace", "seedPixel": [1700, 2432] } ],
      "grid": [0, 2, 5, 10, 15, 20, 25, 30, 32, 34, 36, 37, 38] },
    { "phase": "silica", "from": "ms-1543", "to": "end:silica",
      "segments": [
        { "kind": "trace", "to": "ms-1695", "seedPixel": [2420, 2942] },
        { "kind": "flat", "from": "ms-1695", "to": "ms-1695:second" },
        { "kind": "trace", "from": "ms-1695:second", "seedPixel": [2912, 2896] }
      ],
      "grid": [64, 65, 66, 67, 68, 68.5, 69, 70, 100] }
  ],
  "liquidImmiscibility": {
    "monotectic": "ms-1695", "seedPixel": [2600, 2798],
    "grid": [72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 95, 96, 97, 98],
    "notes": "Critical temperature after Hageman, Oonk [5], adopted by the atlas."
  },
  "junctionTolerance_wt": 1.5,
  "verbatim": {
    "nbsCrossCheck": { "ref": "nsrds-nbs-61-1", "result": "No MgO-SiO2 binary entry ..." },
    "solidSolutions": [],
    "inversions": []
  }
}
```


| Field                    | Required | Meaning                                                                              |
| ------------------------ | -------- | ------------------------------------------------------------------------------------ |
| `system`, `components`   | yes      | Output `system` and `components` (order of `liquid_wt` keys)                         |
| `output`                 | yes      | Path relative to the dataset folder                                                  |
| `idPrefix`               | yes      | Prefix of generated ids (`as`, `am`, `ms`, …)                                        |
| `source`                 | yes      | Copied to the output `source` block                                                  |
| `frameSearchBox`         | yes      | Page region containing the diagram (atlas pages hold two diagrams)                   |
| `axes.x.component`       | yes      | Oxide plotted on x, in wt%                                                           |
| `axes.*.ticks`           | yes      | Tick values from left to right / top to bottom                                       |
| `axes.*.tickPixels`      | no       | Manual override when detection fails                                                 |
| `endMembers`             | yes      | Pure-oxide ends of the liquidus: x position and printed melting temperature          |
| `invariants[].label`     | yes      | Printed values; `null` composition = not printed, digitized value used and flagged   |
| `invariants[].seedPixel` | yes      | Approximate junction pixel; snapped by `junction_locator`                            |
| `invariants[].nbs`       | yes      | Chosen NBS entry numbers (may be empty)                                              |
| `liquidus[].segments`    | yes      | `trace` (followed along ink), `straight` (two points), `flat` (constant temperature) |
| `liquidus[].grid`        | yes      | wt% values to sample; endpoint values are replaced by the invariant labels           |
| `liquidImmiscibility`    | no       | Dome traced from the monotectic; critical point = traced maximum                     |
| `junctionTolerance_wt`   | no       | Default 1.5; see [Curve sampling](#curve-sampling)                                   |
| `verbatim`               | no       | Blocks copied unchanged into the output (hand-written knowledge)                     |


References: `end:<phase>` = end-member melting point, `<id>` = invariant liquid,
`<id>:second` = second liquid of a monotectic.

### Ternary curves config — `configs/<system>.curves.config.json`

```json
{
  "systemFile": "systems/cao-mgo-sio2.json",
  "pdfPage": 154,
  "pixelOrigin": [0, 0],
  "strokeWidth_px": [3.5, 9],
  "endpointPixels": { "cas-edge-silica-wollastonite": [612, 1180] },
  "curves": [
    { "fields": ["silica", "wollastonite"], "path": ["cas-edge-silica-wollastonite", "cms-1320"], "waypoints": [] }
  ],
  "isotherms": [
    { "field": "silica", "temperature_C": 1400, "startPixel": [1010, 900], "endPixel": [1120, 1010], "waypoints": [] }
  ]
}
```

- Curves are matched to `boundaryCurves[]` by `fields` and `path`; isotherms by `field` and
`temperature_C`. Unmatched config entries are errors.
- End pixels come from the invariant sources (`pixel`) of the system file. Points defined in
another system file (edge points) need `endpointPixels`.

---



## Algorithms



### Ink mask and stroke filter

- Grey < 128 → ink.
- Stroke width = 2 × distance transform at the skeleton. The filter keeps strokes inside
`strokeWidth_px`; text, thin arrows and dashed lines drop out. Binaries use the plain mask
restricted to the frame; ternaries use the filtered mask.



### Frame and ticks

- Frame lines: rows/columns inside `frameSearchBox` with the longest ink runs (≥ 70 % of
the box side). Line position = centre of the run.
- Ticks: short perpendicular runs (3–15 px) touching the inside of each frame edge,
detected with a low threshold (≥ 5 ink pixels in a 20 px band).
- Matching: detected ticks are paired with the config values by spacing (median spacing,
then nearest expected position). Frame corners stand in for the outer ticks when they
coincide. Unmatched values are errors unless `tickPixels` overrides them.



### Horizontal invariant lines

Rows inside the frame with an ink run ≥ 80 px; consecutive rows merged; temperature from
the centre row. Each invariant is matched to the line nearest its seed. The measured
temperature goes to `digitization.check` and the review list; the output temperature is the
printed label.

### Junctions

`junction_locator` searches a 30 px box around the seed for the end of the horizontal line
where a traced curve meets it (the last curve pixel before the line row). The digitized
composition is reported next to the printed label.

### Curve tracing

- Shortest path (heapq Dijkstra, 8-connected) on a cost image: 1 on ink, 50 off ink, so
small gaps are bridged but labels are not followed. Optional waypoints split the path.
- Restricted to the bounding box of the endpoints and waypoints plus a 40 px margin.
- For a binary `trace` segment the endpoints are the snapped junctions or the end-member
axis crossing; the seed pixel chooses the correct stroke when several are near.
- A path that crosses more than 15 px of non-ink in total is reported as a trace gap.



### Curve sampling

- Pixel path → (wt%, °C) with the calibration; sorted by wt%; linear interpolation on the
grid.
- The first and last points of a branch are replaced by the printed invariant or end-member
values, so every branch starts and ends exactly at its invariant.
- If the drawn junction differs from its printed composition by more than 0.5 wt%, grid
points within `junctionTolerance_wt` of the printed composition are dropped (on the side
of the branch) and the omission is recorded in `liquidusSource.read`.
- Temperatures are rounded to 1 °C, compositions to 0.1 wt%.
- Ternary polylines: path → wt% triples (calibration + warp), simplified with
Douglas–Peucker at 0.1 wt%, first and last points equal to the endpoint invariants.



### Labels and figures (OCR)

- `label_reader`: crop around the label, ×4 upscale, Tesseract `--psm 7` with a digit
whitelist. The guess and confidence are compared with the config label; differences are
review items.
- `figure_indexer`: each page at 150 dpi in grey, Tesseract on the full page, regex
`Fig\.\s?3\.\d+` for captions and the following text; output `{figure, pdfPage, printedPage, captionStart}`.

---



## NSRDS-NBS 61



### Text index

- `pdftotext -layout` of the whole PDF into `nbs/nsrds-nbs-61-1.txt`; page breaks (`\f`)
give the PDF page; printed page = PDF page − 8 (`sources.json` page mapping).
- `nbs_text_normalizer` fixes recurrent OCR noise of the text layer before parsing:

  | Raw                                                       | Normalized |
  | --------------------------------------------------------- | ---------- |
  | `Si0 2`, `Si0,`, `SiO,`, `SiO.`                           | `SiO2`     |
  | `YlgO`, `MgoO`                                            | `MgO`      |
  | `AI,O,`, `Al,O,`, `Al,0,`, `A1,0,`                        | `Al2O3`    |
  | `Ca0`                                                     | `CaO`      |
  | `K,0`, `K 2O`, `K,O`                                      | `K2O`      |
  | `Na,O`, `Na,0`                                            | `Na2O`     |
  | `:t`, `±o`, `=` before a number in the uncertainty column | `±`        |

- Entry line: entry number (4 digits), system (components joined by `-`), composition
(one value for binaries, `a-b-c` for ternaries, optional `APP`), temperature with optional
uncertainty or `APP`, reference numbers. Lines that look like entries but do not parse go
to `nsrds-nbs-61-1.unparsed.txt`.



### Conversion and comparison

- Composition basis: mol%. Binaries: the value is mol% of the first-named component of the
NBS system (which may differ from the order of `components`). Ternaries: values in the
order of the NBS system name.
- wt% via `OXIDE_MOLAR_MASS`: CaO 56.077, MgO 40.304, SiO2 60.084, Al2O3 101.961,
Na2O 61.979, K2O 94.196 g/mol.
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

---



## Output: binary system JSON

Same schema and key order as the existing binary files (`al2o3-mgo.json`, `mgo-sio2.json`).


| Key                              | From                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `system`, `components`, `phases` | config                                                                                                                                           |
| `units`                          | fixed: `temperature_C` °C, `liquid_wt` wt%, `liquidus` `[wt% <x component>, °C]`                                                                 |
| `source`                         | config                                                                                                                                           |
| `nbsCrossCheck`                  | config `verbatim` (when present)                                                                                                                 |
| `digitization.render`            | generated (page, dpi, size, "full page coordinates")                                                                                             |
| `digitization.calibration`       | generated (tick pixels, rotation)                                                                                                                |
| `digitization.method`            | fixed text                                                                                                                                       |
| `digitization.check`             | generated: compound-line positions, line temperatures vs labels, digitized vs printed compositions                                               |
| `invariantPoints[]`              | config (id, type, reaction, phases, label values, notes) + generated (`liquid_wt`, `status`, atlas source reading text and `pixel`, NBS sources) |
| `liquidImmiscibility`            | generated from the config block (boundary points, critical point)                                                                                |
| `solidSolutions`, `inversions`   | config `verbatim`                                                                                                                                |
| `liquidus[]`                     | generated points; `from`/`to` from config; `status` `extracted`                                                                                  |
| `liquidusSource`                 | generated text: label end points, dropped points                                                                                                 |


Id convention: `<prefix>-<temperature>` for binary and monotectic invariants,
`<prefix>-<phase>-melting` for congruent compound melting.

Layout: 2-space indent; each invariant, liquidus branch and source on its own line or short
block, as in `mgo-sio2.json`. The layout is fixed by a golden-file test.

### Ternary files

`ternary_curve_filler` replaces the `null` of each matched `"polyline_wt": null` in the file
text, keeping the hand-written formatting. After writing, the file is parsed again and every
key other than the filled `polyline_wt` values must be unchanged; otherwise the write is
rolled back. If `units` has no `polyline_wt` entry, it is reported (added by hand).
Polyline format: `[[a, b, c], …]` in wt% in the order of `components`.

---



## Review outputs

- **Overlay** (`overlays/<system>.png`): the diagram crop with detected ticks, invariant
lines, snapped junctions, traced paths and sampled points drawn in colour; legend with ids.
- **Review list** (`review/<system>.md`): one line per item, grouped by kind:

  | Kind              | Raised when                                                                                  |
  | ----------------- | -------------------------------------------------------------------------------------------- |
  | `label-drawing`   | drawn composition differs from the printed label by > 0.5 wt%, or line temperature by > 3 °C |
  | `unlabelled`      | value digitized without a printed label                                                      |
  | `nbs-conflict`    | an invariant ends as `conflict`                                                              |
  | `nbs-approximate` | an `APP` entry was used                                                                      |
  | `trace-gap`       | traced path crosses > 15 px of non-ink                                                       |
  | `tick-residual`   | tick residual > 2 px                                                                         |
  | `ocr-differs`     | OCR label guess differs from the config label                                                |
  | `dropped-points`  | grid points dropped near a junction                                                          |


The review list is copied into `OPEN_ITEMS.md` by hand after reading it.

---



## Validation

`dataset_validator` checks the whole dataset folder. Errors make the exit code 1;
warnings do not.


| Code  | Level   | Rule                                                                                                                                         |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PD001 | error   | Every JSON file parses                                                                                                                       |
| PD002 | error   | `liquid_wt` / `secondLiquid_wt` sum to 100 ± 0.1                                                                                             |
| PD003 | error   | Invariant ids unique across all system files                                                                                                 |
| PD004 | error   | Every phase id exists in `compounds.json`                                                                                                    |
| PD005 | error   | Liquidus points sorted by composition; first/last point equal the referenced invariant or end-member (composition ± 0.05, temperature exact) |
| PD006 | error   | `status` is one of the `statusLegend` keys                                                                                                   |
| PD007 | error   | `confirmed` has at least one NBS source within tolerance; `conflict` has NBS sources and none within tolerance                               |
| PD008 | error   | Every cited atlas figure is listed in `sources.json` → `figures` with the same pages                                                         |
| PD009 | warning | Atlas invariant source without `pixel`                                                                                                       |
| PD010 | warning | `recalled` value present                                                                                                                     |
| PD011 | error   | Boundary-curve `path` ids exist in some system file                                                                                          |
| PD012 | warning | `polyline_wt` still `null`                                                                                                                   |
| PD013 | error   | `printedPage` / `pdfPage` consistent with the page mapping of the source                                                                     |


---



## CLI interface

```
usage: extract_phase_diagram.py [-h] [--dataset DIR] [--work-dir DIR] [-v] COMMAND ...

Extract phase-diagram data from the Slag Atlas and NSRDS-NBS 61.

global options:
  --dataset DIR    Dataset folder (default: shared/processed/phase-diagrams)
  --work-dir DIR   Working folder (default: reports/phase-diagrams, i.e. the container mount)
  -v, --verbose    Per-step log

commands:
  index-figures --source slag-atlas-1995 --pages 40-200
                   Caption OCR → figure-index/<source>.json
  tile --page N --box X0 Y0 X1 Y1 [--scale S]
                   Zoom tile with pixel rulers → tiles/
  calibrate SYSTEM Detect frame and ticks; print tick pixels and residuals; overlay
  extract SYSTEM [--dry-run]
                   Binary config → systems/<system>.json, overlay, review list
  trace-curves SYSTEM [--dry-run]
                   Ternary curves config → polyline_wt in place, overlay, review list
  nbs-index        Dump and parse NSRDS-NBS 61 → nbs/
  nbs-suggest COMPONENT [COMPONENT ...]
                   Candidate NBS entries for exactly these components
  validate         Validate the whole dataset
```

`SYSTEM` is the file stem (`mgo-sio2`); configs are read from `<dataset>/configs/`.
PDF paths come from `sources.json` → `sources.<ref>.file`. `--dry-run` writes overlay and
review list but not the system file.

Host use (optional, outside the container):

```bash
PYTHONPATH=python/src python3 python/src/scripts/extract_phase_diagram.py \
  --work-dir tmp/reports/python/phase-diagrams validate
```



### Console output example

```
[calibrate] mgo-sio2: frame (1425.5, 2174.5)–(2920.0, 3296.5), rotation +1.5 px / 1450 px
[calibrate] x ticks 11/11 matched, max residual 1.6 px; y ticks 11/11 matched, max residual 1.2 px
[extract]   lines: 1849 (1850), 1556 (1557), 1541 (1543), 1695 (1695), 1468.5 (1470)
[extract]   ms-1850: drawn 39.3 wt% vs label 38 → label used, 1 grid point dropped
[extract]   5 invariants (5 extracted), 5 liquidus branches, 0 NBS comparisons
[extract]   written → shared/processed/phase-diagrams/systems/mgo-sio2.json
[extract]   review: 6 items → reports/phase-diagrams/review/mgo-sio2.md
```

---



## Make targets

`scripts/make.d/09-phase-diagrams.mk`, all running in the `python` container:


| Target                                              | Command                                                 |
| --------------------------------------------------- | ------------------------------------------------------- |
| `make pd-index`                                     | `index-figures --source slag-atlas-1995 --pages 40-200` |
| `make pd-tile PAGE=108 BOX="x0 y0 x1 y1" [SCALE=2]` | `tile`                                                  |
| `make pd-calibrate SYSTEM=mgo-sio2`                 | `calibrate`                                             |
| `make pd-extract SYSTEM=mgo-sio2`                   | `extract`                                               |
| `make pd-curves SYSTEM=cao-mgo-sio2`                | `trace-curves`                                          |
| `make pd-nbs-index`                                 | `nbs-index`                                             |
| `make pd-nbs-suggest COMPONENTS="MgO SiO2"`         | `nbs-suggest`                                           |
| `make pd-validate`                                  | `validate`                                              |
| `make pd-test`                                      | `pytest /app/tests/phase_diagrams/ -v`                  |


---



## Tests

- **Unit tests** on synthetic images drawn with Pillow (frame, ticks, horizontal lines,
curves, a fake label, a gap): calibration and rotation, tick detection and matching, line
detection, junction snapping, tracing (including gap bridging and not following a label),
sampling and endpoint rules, dropped points.
- Composition conversion (round trip, the NBS entries already in the dataset: 6095 →
55.0 / 45.0 wt%, 6077 → 95.0 / 5.0 wt%).
- NBS parsing on real text snippets with OCR noise; normalizer table; suggest filter.
- Status resolver on the `al2o3-mgo` cases (`am-1995` confirmed, `am-1975` conflict).
- Writer golden file; ternary filler on a small fixture (only `polyline_wt` changes,
rollback on mismatch).
- Validator: one passing fixture dataset and one fixture per error code.
- **Regression** (`test_regression_atlas.py`, skipped without the atlas PDF): regenerating
`al2o3-mgo` and `mgo-sio2` from their configs reproduces the current files — invariant
values identical, liquidus within ±3 °C and ±0.2 wt%, same ids, statuses and NBS sources.

```bash
make pd-test
docker compose run --rm python python -m pytest /app/tests/phase_diagrams/ -v
```

---



## Acceptance

1. `make pd-test` passes.
2. `make pd-validate` reports no errors on the current dataset.
3. Configs for `al2o3-mgo` and `mgo-sio2` regenerate their files within the regression
  tolerance; the regenerated files replace the hand-made ones after review of the diff.
4. CaO-MgO (Fig. 3.66, PDF p. 81) is extracted with the tool and passes user validation.

---



## Porting from the working scripts

The first extraction sessions used ad-hoc scripts in `/tmp/sa` and `/tmp/ph`. They are
kept in `scratch/` of the working folder as the reference for porting:


| Scratch script                                            | Module                                                    |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `m64.py`, `m108.py` (calibration, `wt`, `T`)              | `axis_calibration`, `binary_calibration`, `tick_detector` |
| `m64_liq.py`, `m108_liq.py` (`trace`, `traceh`, `sample`) | `curve_tracer`, `curve_sampler`                           |
| `tile.py`                                                 | `tile_renderer`                                           |
| `thick.py`, `*_thick.npy`                                 | `stroke_width_filter`                                     |
| `cfit.py` (quadratic warp fit)                            | `ternary_calibration` (applies stored coefficients)       |
| `corners.py`, `junc.py`, `cms_fix.py`                     | `junction_locator`                                        |
| `labels.py`, `labels2.py`                                 | `label_reader`                                            |
| `/tmp/ph/all.txt`, `nbs_main.json`, `nbs_wt.json`         | `nbs_entry_index`, `nbs_matcher`                          |
| caption OCR loop (session of Fig. 3.125)                  | `figure_indexer`                                          |


---



## References


| Source                                                       | Page mapping                 | Notes                                                                       |
| ------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------- |
| Slag Atlas, 2nd ed., VDEh, Verlag Stahleisen 1995, chapter 3 | PDF page = printed page + 20 | Scanned, no text layer; binaries Figs. 3.1–3.147, ternaries from Fig. 3.148 |
| NSRDS-NBS 61 Part I, Janz et al., NBS 1978                   | PDF page = printed page + 8  | Text layer with OCR noise; compositions in mol%                             |


Dataset conventions: `shared/processed/phase-diagrams/sources.json` (status legend,
figures, NBS references) and `OPEN_ITEMS.md` (open decisions and checks).