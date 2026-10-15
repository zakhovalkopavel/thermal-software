# Phase-Diagram Extraction — Output, review and validation

Part of the [phase-diagram extraction specification](README.md).

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
rolled back. If `units` has no `polyline_wt` entry, the filler adds
`"polyline_wt": "[wt% A, wt% B, wt% C]"` (order of `components`) to the flat `units` object.
A matched `inversions[]` entry without `polyline_wt` gets the key appended before its closing
`}`; likewise `polylines_wt` in the `liquidImmiscibility` object. These keys are the only other
changes allowed.
Polyline format: `[[a, b, c], …]` in wt% in the order of `components`; `polylines_wt` is a list
of such polylines.

### Ternary structure edits

`ternary_structure_editor` runs in `trace-curves` before the filler and applies the config
`edits` and `new` entries to the file text, with the same rule: the result is parsed again and
must equal the old file with exactly the requested changes, otherwise nothing is written.

- An edit addresses one entry by a dotted `path`: object keys, list indexes, or the `id` of a
list element (`invariantPoints.cms-1373`); `""` is the root.
- `set` maps dotted keys below the entry (`sources.0.temperature`) to values. An existing value
is replaced in place; a missing last key is appended to its object (on a new line when the
object's members are one per line).
- Setting `id` of an invariant renames it in every `boundaryCurves[].path` (logged).
- `remove` (no `pixel` or `set`) maps keys to values: every element of the list at `path` that
has all of them is removed with its separator, after the other edits and before the `new`
entries. Nothing left to remove is logged ("already removed"), so a promoted file is unchanged.
- `pixel` (stored coordinates, or a node label) moves a point: an entry with `liquid_wt` gets the
calibrated composition at that pixel and its `slag-atlas-1995` source the pixel; an entry with
`wt` (an `otherAtlasData` point) gets `wt` and `pixel`. Pixels are stored as whole pixels and the
composition is computed from the stored pixel (0.1 wt%, third component = 100 − the others).
- `new: true` appends the entry, one per line like the previous element: a curve as
`{ fields, path, polyline_wt: null, notes? }`, an isotherm as
`{ field, temperature_C, polyline_wt: null, notes? }`, an inversion as
`{ phase, change, temperature_C, source, notes? }`. A `new` entry that already exists (the
system was promoted with it) is not appended again: its keys that differ from the config are
updated in place (`polyline_wt` is refilled by the tracing).
- A config `invariants` entry is appended to `invariantPoints` (before the new curves) as
`{ id, type, reaction, phases, temperature_C, liquid_wt, status: "extracted", sources: [atlas], notes? }`:
`liquid_wt` is the calibrated composition at its pixel (as for a moved point), the atlas source
takes `figure`, `printedPage` and `pdfPage` from the file's `source`, plus the reading texts and
the whole-pixel `pixel`. An id that already exists (promoted) is updated in place: keys that
differ from the config, and the atlas source's keys; `status` and other sources stay. Its pixel
counts for node-label resolution like the other invariants.
- Node labels (`X23`, `I2•`, `D101•`: kind letter V, I, X, E, D, F or C, number, optional •) are
working names of the node map and the config `nodes`; the node map renumbers them on every run.
In the written `set` values and `new` entries (notes, sources) each label is replaced by the
nearest invariant id within 2 px of its pixel (invariant pixels after all edits), else by its
stored pixel `[x, y]` (`resolve_node_labels`, logged). A label missing from `nodes` is an error.
The config notes may keep the labels; the system file never contains them.
- Every edit and appended entry is logged in the console and in the review file. The comparer
lists the structural changes (invariant ids and values, entry counts) as DIFF lines before
promotion.

---



## Review outputs

- **Overlay** (`overlays/<system>.png`): the diagram crop with detected ticks, invariant
lines, snapped junctions, traced paths and sampled points drawn in colour; legend with ids.
For a ternary (`trace-curves`, `render_ternary_overlay`) the crop covers the triangle; one
colour per curve kind (boundaries blue, isotherms red, inversions green, two-liquid boundary
magenta); the regions bounded by the frame, boundaries, inversions and immiscibility
branches are filled semi-transparently, one colour per config `fields` entry, named at the
seed (legend: the entry's `legend` text, default its name). A seed on a line, or in a region
already filled by another field (missing divider), is logged and not filled. Every isotherm
piece has its temperature written above it, along the curve (bottom to top along a piece
steeper than 75°): at its middle, or at the nearest place along it (40/60/30/70/20/80 % of
its length) where the label covers no field name and no earlier label. A field name that
would still cover a label moves to the nearest free point of its region (≤ 60 px from the seed).
A boundary segment with a stored config `arrow` gets an orange arrowhead (22 × 18 px at the
reference line width, white outline) at its middle in the stored direction (`<>`: two heads at
a quarter and three quarters of its length, pointing away from the middle), or an orange `?`
when the arrow is not readable, to compare with the printed arrow underneath; isotherm labels
keep clear of them, and the legend gets a row "Stored arrows (towards falling temperature)".
Without config `fields`, the regions of the [field temperature approximation](ALGORITHMS.md#field-temperature-approximation)
are filled, one colour per phase, named at the farthest interior point of its largest part.
The approximated isotherms are drawn in teal (2 px) under the boundaries; every printed point
with a temperature (invariants, inversion points) gets a dark dot and its label `T [a]` (the
printed °C, then in teal the value of each field surface it belongs to, `/`-separated), placed
at the free spot (of 8 around the dot) covering the fewest drawn pixels. Legend rows:
"Isotherms of the field approximation; [approximated °C]" and "Printed temperature points (°C)".
Compound points (`build_compound_points`): every ring of the node map ([§ Node map](ALGORITHMS.md#node-map)) gets a green
circle and a tag on the figure, and a row in a white legend strip added below the crop (the
`pageOrigin` is unchanged): `tag  formula, compound (temperature)`. The compound is the nearest
within 1.5 wt% among the compounds of the system (its `phases` and the compounds their
modifications belong to; `nearest_compound`), the tag its `notation`, else the node label. The
temperature is that of a system invariant whose atlas pixel is within 10 px of the ring (its id
added), else the compound's melting point ("incongruent" added), else "no temperature". A ring
without a compound shows its composition, or the invariant on it.
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
  | `track-point-off-curve` | an isotherm track point is > 3 px off its inflection-free curve                        |
  | `isotherm-temperature`  | `detect-isotherms`: a detected piece without a unique temperature (candidates listed)   |
  | `isotherm-conflict`     | `detect-isotherms`: two labels on one line, a label outside its boundary stretch, or a stretch whose crossing order contradicts the others |


The review list is copied into `OPEN_ITEMS.md` by hand after reading it.

---



## Validation

`dataset_validator` checks the whole dataset folder. Errors make the exit code 1;
warnings do not.


| Code  | Level   | Rule                                                                                                                                         |
| ----- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| PD001 | error   | Every JSON file parses                                                                                                                       |
| PD002 | error   | `liquid_wt` / `secondLiquid_wt` sum to 100 ± 0.1 (inclusive: rounded values summing to 100.1 pass)                                          |
| PD003 | error   | Invariant ids unique across all system files                                                                                                 |
| PD004 | error   | Every phase id (system `phases`, invariant phases, liquidus phases, boundary-curve fields, isotherm fields) exists in `compounds.json`; `null` = unlabelled field |
| PD005 | error   | Liquidus points sorted by composition; first/last point equal the referenced invariant or end-member (composition ± 0.05, temperature exact; a compound end member of a sub-system, e.g. K2O·SiO2 in Fig. 3.117, at its stoichiometric wt%) |
| PD006 | error   | `status` is one of the `statusLegend` keys                                                                                                   |
| PD007 | error   | `confirmed` has at least one NBS source within tolerance; `conflict` has NBS sources and none within tolerance, or — without NBS sources — at least two sources that disagree (atlas-internal conflict, e.g. `nas-1063`) |
| PD008 | error   | Every cited atlas figure is listed in `sources.json` → `figures` with the same pages                                                         |
| PD009 | warning | Atlas invariant source without `pixel`                                                                                                       |
| PD010 | warning | `recalled` value present                                                                                                                     |
| PD011 | error   | Boundary-curve `path` ids exist in some system file                                                                                          |
| PD012 | warning | `polyline_wt` still `null`                                                                                                                   |
| PD013 | error   | `printedPage` / `pdfPage` consistent with the page mapping of the source                                                                     |
| PD014 | error   | Boundary-curve `arrows`: one of `>` `<` `<>` `?` per path segment (plus one for an open end)                                                 |
| PD015 | warning | A `>` / `<` arrow between two points with temperatures points from the higher to the lower temperature                                     |
| PD016 | warning | Arrow pattern at a point (arrows of all its boundary segments in the system, `?` and missing arrows skipped): ternary eutectic none away; binary eutectic none into it; saddle none into it; ternary peritectic, when every segment has an arrow, at least one in and one away |
| PD017 | error   | Isotherm `inferred`: `from` one or two numbers, `step` > 0, temperature a whole non-zero number of steps from each anchor and between two anchors; or `between` [low, high], temperature a whole number of steps strictly between |
| PD018 | warning | Isotherm `inferred` anchor that is not a printed (non-inferred) isotherm of the same field |
| PD019 | error   | `compounds.json` `modificationOf`: the parent exists and is not itself a modification; equal `oxideMoles`; no `melting` entry |
| PD020 | error   | A system names a modification and also its compound ([§ Polymorph modifications](CONFIG.md#polymorph-modifications)) |
