# Phase-Diagram Extraction — CLI, make targets and tests

Part of the [phase-diagram extraction specification](README.md).

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
                   Caption OCR → figure-index/<source>.json (merged by page range)
  tile --page N --box X0 Y0 X1 Y1 [--scale S] [--overlay SYSTEM]
                   Zoom tile with pixel rulers → tiles/; --overlay draws overlays/<SYSTEM>.png
                   over the page (the overlay PNG stores its page origin)
  calibrate SYSTEM Detect frame and ticks; print tick pixels and residuals; overlay
  extract SYSTEM   Binary config → candidates/<system>.json, overlay, review list, comparison
  new SYSTEM [--figure 3.226] [--triangle N] [--corners TOP LEFT RIGHT]
                   New ternary: figure from the caption index, triangle corners, corner labels
                   → starts/<system>.json and configs/<system>.curves.config.json (if absent)
  trace-curves SYSTEM
                   Ternary curves config → candidate with polyline_wt filled, overlay, review list
  nodes SYSTEM [--origin X Y]
                   Node map of a ternary → nodes/<system>.{md,json}, tiles nodes/<system>-r*c*.png,
                   nodes/<system>-overview.png (whole diagram, legend), nodes/<system>-topology.md
                   (origin default: pixelOrigin of the curves config, else 0 0)
  auto-overlay SYSTEM [--step 100]
                   Overlay from automatic data only (detected isotherms, field approximation,
                   compound rings; boundaries from the trace) → auto/<system>.{png,json}
  detect-isotherms SYSTEM [--step 100]
                   Isotherms found on the page (after trace-curves) → isotherms/<system>.json
                   (draft config entries), .md (report vs the config isotherms), .png
  auto SYSTEM [--figure 3.196] [--triangle N] [--corners TOP LEFT RIGHT] [--step 100]
                   Fully automatic ternary from the page alone (triangle, boundaries, fields,
                   temperatures, isotherms, approximation) → auto-full/<system>.{png,json,md}
                   (report compared with the semi-manual candidate or dataset file)
  compare SYSTEM   Candidate vs dataset file (exit 1 on differences)
  promote SYSTEM   Candidate → dataset if the dataset still validates (exit 1 if not)
  nbs-index        Dump and parse NSRDS-NBS 61 → nbs/
  nbs-suggest COMPONENT [COMPONENT ...]
                   Candidate NBS entries for exactly these components
  validate [--candidate SYSTEM]
                   Validate the whole dataset (with the candidate in place, nothing written)
```

`SYSTEM` is the file stem (`mgo-sio2`); configs are read from `<dataset>/configs/`.
PDF paths come from `sources.json` → `sources.<ref>.file`. `extract` reads the NBS index from
`nbs/nsrds-nbs-61-1.entries.json` (run `nbs-index` first when invariants list NBS entries).
`-v` adds per-step detail: pages during `index-figures` and the captions found; every detected
invariant line (temperature, rows, x extent) during `extract`.
Exit codes: 0 ok, 1 validation errors / differences / promotion refused, 2 config / input error.
The CLI runs in the `python` container only (principle 6).



### Console output example

```
[calibrate] mgo-sio2: frame (1425.4, 2173.6)–(2921.1, 3297.4), rotation +1.4 px over 1495 px
[calibrate] mgo-sio2: x ticks 10/10 matched, max residual 1.6 px; y ticks 11/11 matched, max residual 0.9 px
[extract] lines: 1965.5, 1881.5, 1851.5, 1848, 1696.5, 1621.5, 1555, 1541, 1536.5, 1469.5, 1313
[extract] ms-1850: drawn 38.9 wt% vs label 38 → label used
[extract] ms-1695: drawn 68.9 wt% vs label 70 → label used
[extract] 5 invariants (5 extracted), 5 liquidus branches, 0 NBS comparisons
[extract] overlay → reports/phase-diagrams/overlays/mgo-sio2.png
[extract] review: 6 items → reports/phase-diagrams/review/mgo-sio2.md
[extract] candidate → reports/phase-diagrams/candidates/mgo-sio2.json
[extract] vs systems/mgo-sio2.json: ms-1850: atlas source text or pixel changed
...
```

---



## Make targets

`scripts/make.d/09-phase-diagrams.mk`, all running in the `python` container:


| Target                                              | Command                                                 |
| --------------------------------------------------- | ------------------------------------------------------- |
| `make pd-index [PD_PAGES=40-200]`                   | `index-figures --source slag-atlas-1995 --pages 40-200` |
| `make pd-tile PAGE=108 BOX="x0 y0 x1 y1" [SCALE=2] [OVERLAY=mgo-sio2]` | `tile` (`--overlay`: zoom on the review overlay) |
| `make pd-calibrate SYSTEM=mgo-sio2`                 | `calibrate`                                             |
| `make pd-extract SYSTEM=mgo-sio2`                   | `extract`                                               |
| `make pd-new SYSTEM=cao-feox-sio2 [FIGURE=3.226] [TRIANGLE=1] [CORNERS="SiO2 CaO FeOx"] [PUBCHEM=1]` | `new` (`--pubchem`: PubChem search of components compound-data lacks) |
| `make pd-curves SYSTEM=cao-mgo-sio2`                | `trace-curves`                                          |
| `make pd-nodes SYSTEM=cao-mgo-sio2 [ORIGIN="x y"]`  | `nodes [--origin x y]`                                  |
| `make pd-isotherms SYSTEM=na2o-al2o3-sio2 [STEP=100]` | `detect-isotherms [--step 100]`                       |
| `make pd-auto-overlay SYSTEM=na2o-al2o3-sio2 [STEP=100]` | `auto-overlay [--step 100]`                        |
| `make pd-auto SYSTEM=na2o-al2o3-sio2 [FIGURE=3.196] [TRIANGLE=1] [CORNERS="SiO2 Na2O Al2O3"] [STEP=100]` | `auto` (page alone; no config, start or candidate used) |
| `make pd-compare SYSTEM=mgo-sio2`                   | `compare`                                               |
| `make pd-promote SYSTEM=mgo-sio2`                   | `promote` (after user validation)                       |
| `make pd-nbs-index`                                 | `nbs-index`                                             |
| `make pd-nbs-suggest COMPONENTS="MgO SiO2"`         | `nbs-suggest`                                           |
| `make pd-validate [SYSTEM=mgo-sio2]`                | `validate [--candidate mgo-sio2]`                       |
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
- Figure index on real Tesseract output of atlas pages 80, 81, 134 and 154: single and
shared captions (`and`, ranges), bare labels, cross-references; merge of a re-indexed range.
- Status resolver on the `al2o3-mgo` cases (`am-1995` confirmed, `am-1975` conflict).
- Writer golden file; ternary filler on a small fixture (only `polyline_wt` changes,
rollback on mismatch).
- Validator: one passing fixture dataset and one fixture per error code.
- Candidates: comparison (identical, liquidus inside / outside the box, invariant and NBS
changes, pixel-only notes, filled ternary polylines); validation with a candidate (errors
reported, dataset untouched).
- Isotherms (`test_isotherm_detection.py`, `test_isotherm_order_and_labels.py`): skeleton
branches and chaining, the temperature solver with boundary stretches and field-order
sections, the detector on a synthetic page, field-order sections of parallel lines, side
labels (a leader crossing a nearer line, a line running into the word), the corner rule, the
long axis of a rotated label and the isotherm comparison with a semi-manual file.
- **Regression** (`test_regression_atlas.py`, skipped without the atlas PDF): regenerating
every promoted binary from its config reproduces the dataset file: `compare_systems`
finds no differences. The promoted binaries are found automatically (every binary config
whose `output` file exists in `systems/`), so promoting a figure needs no test change. "Within" means the regenerated polyline passes through the box
±0.2 wt% × ±3 °C around every current point (on steep branches a 0.1 wt% shift is several
°C). The test uses the render cache and NBS index of the working folder when present.

```bash
make pd-test
docker compose run --rm python python -m pytest /app/tests/phase_diagrams/ -v
```

---



## Acceptance

1. `make pd-test` passes.
2. `make pd-validate` reports no errors on the current dataset.
3. Configs for `al2o3-mgo` and `mgo-sio2` regenerate their files within the regression
  tolerance; the candidates replace the hand-made files (`promote`) after review of the comparison.
4. CaO-MgO (Fig. 3.66, PDF p. 81) is extracted with the tool and passes user validation.
