# Phase-Diagram Extraction — Coordinates and config

Part of the [phase-diagram extraction specification](README.md).

## Coordinate systems

All pixels are page coordinates of the PDF page rendered with `pdftoppm -r 400`
(3306 × 4673 px for the atlas), the same convention already used in the dataset.
A config may declare `pixelOrigin: [dx, dy]` when stored pixels come from a crop
(`cao-al2o3-sio2.json` was digitized on a 1620 × 1776 crop; its origin must be
determined once by matching the corners before its curves are traced).

### Binary calibration

- x: piecewise-linear interpolation between tick pairs (value, pixel) of the x component
in wt%. y: same for temperature in °C.
- Scan rotation: a linear term from the frame lines, `y_level = py − s · (px − px_ref)`,
where `s` is the slope of the bottom frame line (`y = a + s · x`); and
`x_level = px − k · (py − py_ref)` for the left frame tilt (`x = a + k · y`). The reference
is the bottom-left frame corner; x ticks are measured along the bottom edge, y ticks along
the left edge, so the tick pixels are already levels.
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
- Inverse (`to_page`, wt% → pixel): barycentric inverse to the ideal pixel, then 20
fixed-point steps `p ← p + (ideal target − warp(p))` when a warp is present.

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
  "frameSearchBox": [1300, 2050, 3050, 3400],
  "axes": {
    "x": { "component": "SiO2", "ticks": [0, 10, 20, 30, 40, 50, 70, 80, 90, 100] },
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
      "segments": [ { "kind": "trace", "seedPixel": [1798, 2522] } ],
      "grid": [0, 2, 5, 10, 15, 20, 25, 30, 32, 34, 36, 37, 38] },
    { "phase": "silica", "from": "ms-1543", "to": "end:silica",
      "segments": [
        { "kind": "trace", "to": "ms-1695", "seedPixel": [2443, 2918] },
        { "kind": "flat", "from": "ms-1695", "to": "ms-1695:second" },
        { "kind": "trace", "from": "ms-1695:second" }
      ],
      "grid": [64, 65, 66, 67, 68, 68.5, 69, 70, 100] }
  ],
  "liquidImmiscibility": {
    "monotectic": "ms-1695", "seedPixel": [2739, 2753], "waypoints": [[2862, 2798]],
    "grid": [72, 74, 76, 78, 80, 82, 84, 86, 90, 92, 94, 95, 96, 97, 98],
    "criticalPointNotes": "Critical temperature after Hageman, Oonk [5], adopted by the atlas.",
    "notes": "No crystals inside the dome; ..."
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
| `axes.*.ticks`           | yes      | Tick values from left to right / top to bottom; leave out a tick hidden on its edge (x: the 60 tick of Fig. 3.125 under the MgSiO3 line). y ticks hidden on the left edge are taken from the right edge |
| `axes.*.tickPixels`      | no       | Manual override when detection fails                                                 |
| `endMembers`             | yes      | Pure-oxide ends of the liquidus: x position and printed melting temperature          |
| `invariants[].label`     | yes      | Printed values; `null` composition = not printed, digitized value used and flagged. `null` temperature = not printed: the detected invariant line gives it; an unlabelled eutectic without a detected line (dashed, schematic) takes the lowest traced point of its two liquidus curves; flagged `unlabelled`. Not allowed for `compound-melting` |
| `invariants[].seedPixel` | yes      | Approximate junction pixel; snapped by `junction_locator`                            |
| `invariants[].nbs`       | yes      | Chosen NBS entry numbers (may be empty)                                              |
| `invariants[].secondSeedPixel` | monotectic | Junction of the second liquid (`<id>:second`)                                |
| `invariants[].labelBox`  | no       | `[x0, y0, x1, y1]` around the printed temperature; OCR guess goes to the review list |
| `liquidus[].segments`    | yes      | `trace` (followed along ink), `straight` (two points), `flat` (constant temperature) |
| `segments[].seedPixel`, `segments[].waypoints` | no | Points on the stroke, visited in that order (seed first) by the tracer       |
| `liquidus[].grid`        | yes      | wt% values to sample; endpoint values are replaced by the invariant labels           |
| `liquidImmiscibility`    | no       | Dome traced from the monotectic through `seedPixel` and `waypoints`; critical point = middle of the traced maximum (within 0.5 °C); `criticalPointNotes`, `notes` copied |
| `junctionTolerance_wt`   | no       | Default 1.5; see [Curve sampling](ALGORITHMS.md#curve-sampling)                                   |
| `strokeWidth_px`         | no       | `[min, max]`: trace the liquidus on strokes of that width only (figures that overlay thinner alternative versions); see [Ink mask and stroke filter](ALGORITHMS.md#ink-mask-and-stroke-filter) |
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
  "isothermStrokeWidth_px": [2, 5],
  "endpointPixels": { "cas-edge-silica-wollastonite": [612, 1180] },
  "curves": [
    { "fields": ["silica", "wollastonite"], "path": ["cas-edge-silica-wollastonite", "cms-1320"], "waypoints": [] },
    { "fields": ["kalsilite", "corundum"], "path": ["kas-1556", "kas-1687"], "endPixel": [2010, 2330], "strokeWidth_px": [5, 14] },
    { "fields": ["mullite", "corundum"], "path": ["kas-edge-mullite-corundum", "kas-1315"],
      "waypoints": [[2050, 1853], { "pixel": [1999, 1798], "straight": true }] }
  ],
  "isotherms": [
    { "field": "silica", "temperature_C": 1400, "startPixel": [1010, 900], "endPixel": [1120, 1010], "waypoints": [] }
  ],
  "inversions": [
    { "phase": "silica", "change": "cristobalite → tridymite", "startPixel": [1012, 640], "endPixel": [1180, 655] }
  ],
  "liquidImmiscibility": [
    { "startPixel": [1334, 1097], "endPixel": [1672, 502], "strokeWidth_px": [3, 16],
      "waypoints": [[1546, 915], { "pixel": [1571, 876], "straight": true }] }
  ]
}
```

- Curves are matched to `boundaryCurves[]` by `fields` and `path`; isotherms by `field`,
`temperature_C` and `part`; inversions to `inversions[]` by `phase` and `change`. Unmatched config
entries are errors. An isotherm drawn as several pieces in one field (e.g. a closed loop that
re-enters it) sets `"part": 2, 3, …` on every piece after the first (default 1); the system
file entry carries the same `part` (absent = 1).
- `inversions` (optional): a polymorph boundary inside the field of one phase, for systems not
yet split into modification fields (§ Polymorph modifications; listed in `OPEN_ITEMS.md`).
Traced like an isotherm from `startPixel` to `endPixel` with the curve stroke width. A drawn
boundary between modification fields is a boundary curve instead.
- `nodes` (optional): node-map labels → pixels (`{ "X12": [x, y] }`). Any pixel of the config
(`endpointPixels`, `startPixel`, `endPixel`, waypoints, also `{ "pixel": "X12", "straight": true }`)
may be a label; an unknown label is a config error.
- `liquidImmiscibility` (optional): branches of the two-liquid boundary on the liquidus surface,
each traced like an inversion. They are written in config order to
`liquidImmiscibility.polylines_wt` (one polyline per branch); the system file must already
have a `liquidImmiscibility` object (or an edit that adds it).
- `dashed` (optional, any entry): trace on the dashes only, see [§ Curve tracing](ALGORITHMS.md#curve-tracing).
- `arrows` (optional, curves): the printed arrow of each path segment, plus one for an open
end (`endPixel`): `>` points towards the next path point, `<` towards the previous one, `<>`
away from a maximum inside the segment (not a model point), `?` not readable. Arrows point
towards falling liquidus temperature. Written to `boundaryCurves[].arrows` of the candidate
(the filler may set only `polyline_wt` and `arrows` there); checked by PD014–PD016. Example:
`"path": ["nas-1050", "nas-1062", "nas-740"], "arrows": ["<", ">"]` (saddle 1062, arrows away from it).
- `frameMask_px` (optional, default 0 = off): a band of this width along the triangle edges
(straight lines between the calibration corners) is erased from the tracing mask, so that a
dashed isotherm ending on an edge is not traced along the solid frame.
- `lineWidth_px` (optional, > 0): the page's line width, replacing the measured one (§ Pixel
scale). Only for a page where the measurement is misled (e.g. mostly solid fills).
- `edits` (optional): structure edits applied before tracing, see [§ Ternary structure edits](OUTPUT.md#ternary-structure-edits):
`{ "path": "invariantPoints.cms-1373", "pixel": "I2•", "set": { "id": "cms-1379", "temperature_C": 1379 } }`,
`{ "path": "isotherms", "remove": { "field": "silica" } }` (every element with these keys).
- `new: true` on a curve, isotherm or inversion (with optional `notes`; an inversion also
`temperature_C` and `source`) appends it to the system file before it is traced.
- `invariants` (optional): new invariant points, each with `new: true`, `id`, `type`, `reaction`,
`phases`, `temperature_C` (null when not printed), `pixel` (stored coordinates or a node label),
the atlas reading texts `temperature` (default "not printed") and `composition` (default
"digitized"), and optional `notes`. They are appended before the curves, so a curve `path` or an
edit may use their ids. Existing points are changed with `edits`; an entry without `new` is a
config error. Example (a junction hidden by a label, placed where two line fits cross):
`{ "id": "nas-nepheline-corundum-beta-alumina", "type": "ternary", "reaction": "peritectic", "phases": [ … ], "temperature_C": null, "pixel": [2103, 1346], "composition": "intersection of line fits …", "new": true }`.
- `inferred` (optional, isotherms): an isotherm without a printed temperature,
`{ "from": [labelled °C, …], "step": °C }`. `from` holds one or two printed isotherm temperatures
of the same field, `step` the interval between neighbouring lines (n unlabelled lines between
T1 and T2: step = (T2 − T1)/(n + 1)); the temperature is a whole, non-zero number of steps from
each anchor and, with two anchors, strictly between them (`inferred_temperature_problem`, a
config error otherwise). One anchor (a line outside the printed ones) needs the step confirmed
for that field. A `new` entry carries `inferred` into the system file; the overlay writes the
temperature in parentheses, the topology report adds "(inferred from …, step …)". Example:
`{ "field": "nepheline", "temperature_C": 1500, "new": true, "inferred": { "from": [1400, 1600], "step": 100 }, … }`.
With no printed isotherm in the field, `{ "between": [low °C, high °C], "step": °C }` (written by
`detect-isotherms` from the order of the lines along a boundary, bounds usually invariant
temperatures): the temperature is a whole number of steps strictly between `low` and `high`;
the topology report adds "(inferred between …, step …)".
- An isotherm with an inflection (S-shaped) needs a `split` waypoint at the inflection: the
pieces between splits are fitted as one inflection-free curve each.
- End pixels come from the invariant sources (`pixel`) of the system file. Points defined in
another system file (edge points) need `endpointPixels`.
- All config pixels (`endpointPixels`, waypoints, isotherm ends) are in the stored coordinates
of the system file; `pixelOrigin` converts them to page pixels.
- A boundary curve is traced segment by segment along its `path`; each waypoint belongs to the
nearest segment. Every path invariant is an exact polyline vertex (its `liquid_wt`).
- A waypoint is `[x, y]` (traced to) or `{ "pixel": [x, y], "straight": true }`: joined to the
previous point (waypoint or segment start) by a straight line, for a stroke hidden by a label;
the tracer would otherwise follow the letters (ink costs 1, a gap 50 per pixel). Put the
previous point on the last visible pixel before the label. Each straight step is logged.
`{ "pixel": …, "split": true }` splits an isotherm there (a field edge the 5 px divider test
misses, e.g. a point on the far side of a bold boundary stroke), see [§ Curve tracing](ALGORITHMS.md#curve-tracing).
- `fields` (optional, review overlay only): `[{ "name": "C3S", "ring": ["E25", "I17", "I18", "E26"] }]`,
the field's corner points in order (labels or pixels), optional `seed` pixel. The overlay
fills the region around the seed (default: the interior point of the ring farthest from it).
Optional `legend`: the full text for the legend (e.g. `"C3S: tricalcium silicate (Ca3SiO5)"`);
the short `name` is written in the field.
- Polylines are rounded to 0.1 wt%. A component down to −0.3 wt% (stroke ending on an edge)
is set to 0 and taken from the largest component (logged); further outside is an error.
- `endPixel`: open end of a curve that leaves the figure; traced from the last path point,
the last vertex is the calibrated pixel (not an invariant). Required for a single-point path.
- Two consecutive path points drawn within 2 px (e.g. `kas-1140` / `kas-1150`, separated only
in an inset) are joined directly by their compositions, without tracing.
- Stroke widths: `strokeWidth_px` (default [3.5, 9]) for curves, inversions and immiscibility branches, `isothermStrokeWidth_px`
(default: `strokeWidth_px`) for isotherms; any entry may set its own `strokeWidth_px`. The
command passes the plain ink mask and each entry is traced on the mask filtered to its width
(figures draw isotherms thinner than boundary curves).

### Polymorph modifications

A compound with several solid modifications (silica: cristobalite, tridymite, quartz;
NaAlSiO4: carnegieite, nepheline) has one `compounds.json` entry for the compound (id not the
name of a modification, e.g. `silica`, `sodium-aluminosilicate`; it carries the melting point)
and one entry per modification with `"modificationOf": "<compound id>"`, the same
`oxideMoles` and no `melting` (PD019). The rule is the same for every system:

- Where the figure draws an inversion line (isotherm-like boundary with its temperature,
e.g. 1470 °C cristobalite/tridymite), each side is a primary field of its own: the
modifications are the phases (system `phases`, invariant phases, `boundaryCurves` fields,
`isotherms` fields), the inversion line is a boundary curve, its ends are invariant points
(a binary point on the edge, a ternary point where it meets a boundary; `reaction` null when
the figure gives none), and the third phase's boundary is split there.
- A system names either the compound or its modifications, never both (PD020).
- Sub-solidus `compatibilityTriangles` name the compound.
- Compound rings (topology report) and the new-system checklist's single-oxide count use the
compound, not the modifications.
