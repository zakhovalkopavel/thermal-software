# Phase-Diagram Extraction — Fully automatic extraction

Part of the [phase-diagram extraction specification](README.md).

## Fully automatic extraction

`auto SYSTEM` (`make pd-auto`) builds a ternary from the page alone: no curves config, no
start file, no candidate. The semi-manual commands (`new`, `trace-curves`, `detect-isotherms`,
`auto-overlay`) are unchanged; the semi-manual candidate (else the dataset file) is only read
to compare with.

1. **Figure and triangle**: the first figure of the caption index for the components
   (`--figure`), rendered at 400 dpi; `detect_triangles`, triangles with a base of at least
   0.4 × the largest in reading order; the first whose corner labels
   (`read_corner_labels`, `corner_components`) name the three components (`--triangle`,
   `--corners` override). `build_ternary_start` gives the calibration (barycentric, no warp).
2. **Boundaries** (`detect_boundary_graph`): heavy strokes (ridge 1.3–10 line widths; boundaries
   are drawn about twice as wide as isotherms), their skeleton branches (median width ≥ 1.5 line
   widths, short pieces on labels dropped), joined into a graph across breaks, dashes, labels
   and labels printed over the curve; free ends meet other curves (junctions drawn with a gap) or
   the triangle edges (edge points). Nodes: `junction` (≥ 3 curves: invariant points), `edge`,
   `end` (open). Curves with ≥ 25 % dash gaps are `dashed`.
3. **Words** (`read_page_words`): Tesseract `--psm 11` on the triangle area with margins (300,
   150, 300, 100 px left, top, right, bottom), once as printed and once with glyph-sized ink only
   (labels crossed by lines); overlapping words merged, the more confident kept.
4. **Fields** (`name_fields`): regions of the triangle split by the curves; a phase name
   (`match_phase_name`: letters compared with the phase ids and their distinctive parts, ratio
   ≥ 0.8) inside a region, else a name outside the triangle whose leader line ends in it, else the
   composition of a congruent (then incongruent) compound of the system; unnamed regions
   `field-<n>`. Legend columns are ignored. A curve with one phase on both sides is dropped.
5. **Temperatures**: `read_node_temperatures` pairs printed temperatures (`printed_temperature`:
   3–4 digits, `~`, a stray `.` read as part of the number) with junctions and edge points within
   100 px, one to one with the least total distance (a node without a label costs 100 px), round
   multiples of the step costing 80 px more (isotherm labels) and a word going only to nodes at
   most 20 px farther than its nearest node. Labels left over, not round, within 45 px of a curve
   away from its ends become `saddle` points on it (`read_curve_temperatures`: maxima of a
   boundary).
6. **System** (`build_auto_ternary`): every kept curve (two curves through a node where only they
   end, with the same fields, are one), its nodes and saddles as points `auto-<°C>` (else
   `auto-j|e|o|s<n>`), types `ternary`, `binary`, `open end`, `saddle`; `polyline_wt` smoothed
   over 7 px and simplified to 0.1 wt%.
7. **Isotherms and overlay**: `detect_isotherms` on this system (line width 0.5–1.55 line
   widths; the page words that are not point temperatures as side labels, the boxes of the
   point-temperature words skipped as gap labels, see
   [Isotherm detection](ALGORITHMS.md#isotherm-detection)), `build_auto_system`, `build_field_approximation`, `build_compound_points` (node map
   of the system) and `render_ternary_overlay` with `auto_overlay_curves`, as `auto-overlay`.
8. **Outputs** (`auto-full/`): `<system>.png` (overlay), `<system>.json` (the system; not a
   candidate, never promoted) and `<system>.md` (`auto_extraction_report`: fields and how they
   were named, points with the word read, curves, isotherm counts, `compare_auto_system` — each
   semi-manual point and the nearest automatic one within 1.5 wt% with both temperatures, the
   share of each semi-manual curve within 8 px of an automatic one, automatic curves mostly off
   them, phases of both, each semi-manual isotherm with the detected pieces on it (≥ 60 % of a
   piece within 8 px), its covered share and state — `same °C`, `other °C`, `no °C`,
   `not found` — and the pieces on no semi-manual isotherm — and the log).

Limits: a heavy line that is no field boundary (e.g. a join drawn as heavy as the boundaries)
makes an extra region `field-<n>`; temperature labels misread by Tesseract (837 read `937`) or
printed for a point that is no node (a saddle next to a junction) can land on the wrong point;
fields whose name is printed nowhere near them (a sliver along an edge) stay `field-<n>`.
