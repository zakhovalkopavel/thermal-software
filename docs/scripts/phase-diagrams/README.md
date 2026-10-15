# Phase-Diagram Extraction — Overview

Overview of the phase-diagram extraction tool: purpose, principles and folders. The
specification is split into the documents listed below.

| Document | Content |
| --- | --- |
| [LAYOUT.md](LAYOUT.md) | Implementation layout |
| [WORKFLOW.md](WORKFLOW.md) | Per-diagram workflow |
| [CONFIG.md](CONFIG.md) | Coordinate systems, Config schema |
| [ALGORITHMS.md](ALGORITHMS.md) | Algorithms |
| [AUTOMATIC.md](AUTOMATIC.md) | Fully automatic extraction |
| [NBS.md](NBS.md) | NSRDS-NBS 61 |
| [OUTPUT.md](OUTPUT.md) | Output: binary system JSON, Review outputs, Validation |
| [CLI.md](CLI.md) | CLI interface, Make targets, Tests, Acceptance |

## Purpose

Produce the phase-diagram dataset in `shared/processed/phase-diagrams/` from scanned
figures of the Slag Atlas, cross-checked against NSRDS-NBS 61, in a reproducible way.


| Output                                                                                       | Produced from                                                   | Mode                                              |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `candidates/<system>.json` (binary systems)                                                  | `configs/<system>.config.json` + measurements on the atlas page | Regenerated completely, in the working folder     |
| `candidates/<system>.json` (ternary: `polyline_wt` of boundary curves, isotherms and inversion curves, `liquidImmiscibility.polylines_wt` filled) | `configs/<system>.curves.config.json` + measurements            | Copy of the dataset file; nothing else changes    |
| `systems/<system>.json` in the dataset                                                       | A candidate, after user validation (`promote`)                  | Copied only if the dataset still validates        |
| `overlays/<system>.png` in the dataset                                                       | The review overlay of the promoted candidate (`promote`)        | Copied with the system file                       |
| Review overlay, review list, comparison, renders, indexes                                    | Same run                                                        | Working files, not committed                      |
| Validation report                                                                            | Whole dataset                                                   | Console, exit code                                |


### Data layers

1. **Working folder** `tmp/reports/python/phase-diagrams/`: renders, tiles, overlays, review
   lists, NBS dumps, the figure index and candidates. Regenerable, not committed.
2. **Proof dataset** `shared/processed/phase-diagrams/`: organised files in which every value
   keeps its source, page, pixel or NBS entry and notes, so that it can be checked against the
   original. Written only by `promote` after user validation (and by hand for `sources.json`,
   `compounds.json`, `OPEN_ITEMS.md`). Committed.
3. **Backend dataset** (later): a clean, functional dataset generated from the proof dataset
   for the backend, without the technical layers (pixels, digitization notes, comparisons).
   Not part of this tool yet.

The backend dataset feeds the phase-equilibrium implementation (step 3 of the
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
   traced points near that junction are dropped (see [Curve sampling](ALGORITHMS.md#curve-sampling)).
   Values without a printed label are digitized and flagged as such.
5. **Statuses follow** `sources.json` **→** `statusLegend`**.** The tool computes `extracted`,
  `confirmed` and `conflict`; it never writes `recalled`.
6. **Container only.** Every step is a command of this tool running in the `python`
  container (`make pd-*` or `docker compose run --rm python …`). No scripts on the host and
  no ad-hoc scripts outside the project; an analysis needed more than once becomes a command
  or a `-v` output. Artifacts go to the working folder only.
7. **The dataset changes only through promotion.** `extract` and `trace-curves` write
  candidates; `promote` copies a candidate after user validation.

---



## Folders


| Folder                                                                                 | Content                                                                | Git                                                      |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------- |
| `shared/sources/compound-data/`                                                        | Slag Atlas, NSRDS-NBS 61 (Parts I, II, IV) and JANAF PDFs; paths in `sources.json` | ignored by `shared/sources/.gitignore` (large files) |
| `shared/processed/phase-diagrams/`                                                     | Dataset: `compounds.json`, `sources.json`, `OPEN_ITEMS.md`, `systems/` | ignored by `shared/.gitignore`; commit with `git add -f` |
| `shared/processed/phase-diagrams/configs/`                                             | Per-diagram configs                                                    | same as above                                            |
| `shared/processed/phase-diagrams/overlays/`                                            | Review overlay of each promoted system (written by `promote`)          | same as above                                            |
| `tmp/reports/python/phase-diagrams/` (`/app/reports/phase-diagrams/` in the container) | Working files                                                          | ignored (`tmp/*`)                                        |


The working folder is the only `tmp/` path mounted into the `python` container
(`./tmp/reports/python:/app/reports` in `compose.yml`), so no compose change is needed.

Working folder layout:

```
tmp/reports/python/phase-diagrams/
  renders/        slag-atlas-1995-p108-400dpi.png        ← page renders (cache)
  tiles/          p108-2280-2650-2930-3060-x1.png        ← zoom tiles with pixel rulers
  nodes/          cao-mgo-sio2.{md,json}, -r1c1.png …     ← node map: numbered points for topology hints
                  cao-mgo-sio2-topology.md                ← topology report in node labels
  isotherms/      na2o-al2o3-sio2.{json,md,png}          ← detect-isotherms: draft config entries, report vs the config, image
  auto/           na2o-al2o3-sio2.{png,json}             ← auto-overlay: overlay and system from the detected isotherms only
  auto-full/      na2o-al2o3-sio2.{png,json,md}          ← auto: system read from the page alone, overlay, report vs the semi-manual file
  overlays/       mgo-sio2.png                           ← traced curves, invariants, ticks on the scan
  review/         mgo-sio2.md                            ← items to check + comparison with the dataset file
  candidates/     mgo-sio2.json                          ← extract / trace-curves output, waiting for validation
  replaced/       mgo-sio2.20261006-211200.json          ← dataset file replaced by promote (backup)
  figure-index/   slag-atlas-1995.json                   ← caption OCR: figure → PDF page
  nbs/            nsrds-nbs-61-1.txt                     ← pdftotext -layout dump (page breaks kept)
                  nsrds-nbs-61-1.entries.json            ← parsed entries
                  nsrds-nbs-61-1.unparsed.txt            ← lines that did not parse
```

---



## Porting from the working scripts

The first extraction sessions used ad-hoc host scripts in `/tmp/sa` and `/tmp/ph` (no longer
available). Their logic now lives in these modules:


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
| caption OCR loop (session of Fig. 3.125)                  | `figure_indexer`, `caption_parser`                        |
| regenerate-and-diff checks (sessions of this tool)        | `extract` candidates, `system_comparer`, `compare`        |


---



## References


| Source                                                       | Page mapping                 | Notes                                                                       |
| ------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------- |
| Slag Atlas, 2nd ed., VDEh, Verlag Stahleisen 1995, chapter 3 | PDF page = printed page + 20 | Scanned, no text layer; binaries Figs. 3.1–3.147, ternaries from Fig. 3.148 |
| NSRDS-NBS 61 Part I, Janz et al., NBS 1978                   | PDF page = printed page + 8  | Text layer with OCR noise; compositions in mol%                             |


Dataset conventions: `shared/processed/phase-diagrams/sources.json` (status legend,
figures, NBS references) and `OPEN_ITEMS.md` (open decisions and checks).
