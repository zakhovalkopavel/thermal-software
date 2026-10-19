# Phase-Diagram Extraction — Algorithms

Part of the [phase-diagram extraction specification](README.md).

## Algorithms



### Pixel scale

- The code holds no diagram data; its pixel tolerances (distances, dash and label sizes,
search radii, overlay fonts and line widths) are written for lines 4.25 px wide, the mean line
width of atlas pages rendered at 400 dpi, and scaled to the page.
- Line width = 2 × ink area / outline length of the plain ink mask (a stroke of width w and
length L has area w·L and an outline of about 2·L): the length-weighted mean width of lines,
dashes and letters. It follows the render resolution and the line weight of the source. Atlas
pages measure 3.8–4.5 px (400 dpi); the same pages measure about 3.2 px at 300 dpi and 6.2 px at 600 dpi.
- Factor = line width / 4.25, rounded to quarters (at least 0.25), so the pages of one source,
whose widths differ by a few per cent, share one factor (all atlas pages: 1). Distances scale
with the factor, areas with its square, whole-pixel sizes are rounded (at least 1).
- `trace-curves` and `nodes` measure the page (or take `lineWidth_px` from the curves config)
and log `line width … px (measured|config) → pixel tolerances × factor`. Config pixel values
(`strokeWidth_px`, `frameMask_px`, coordinates) are per diagram and taken as given.
- Binary extraction (`calibrate`, `extract`) and the display tiles (`tile`, node-map tiles)
still use the reference pixel values.



### Ink mask and stroke filter

- Grey < 128 → ink.
- Stroke width = 2 × distance transform at the skeleton. The filter keeps strokes inside
`strokeWidth_px`; text, thin arrows and dashed lines drop out. Binaries use the plain mask
restricted to the frame; ternaries use the filtered mask.
- A binary config with `strokeWidth_px` traces the liquidus (and snaps end-member and
compound-melting pixels) on the filtered mask; calibration, invariant lines and junctions
keep the plain mask. Used when a figure overlays thinner alternative versions (Fig. 3.35).



### Frame and ticks

- Frame: the largest connected ink component inside `frameSearchBox`; each edge is a robust
straight-line fit through the outermost ink of that component (horizontal edges
`y = a + s · x`, vertical edges `x = a + k · y`), so the scan rotation comes with the frame.
- Ticks: short perpendicular runs touching the inside of the bottom, left and right edges:
≥ 5 ink pixels in a 20 px band next to the edge, no ink in the 15 px beyond the band (that
would be a curve or a compound line), cluster width ≤ 9 px.
- y ticks: right-edge ticks are moved to the left edge along the frame rotation and merged
with the left-edge ticks (averaged when both exist), so a tick hidden by a curve on one side
is taken from the other (Fig. 3.125: 2800 °C under the periclase liquidus).
- Matching: every pair of candidates is tried as two consecutive values; pixels must increase
in list order; tolerance max(3 px, 5 % of the spacing). Frame lines count as candidates (the
frame stands in for an outer tick). Winner: most matched values, then most anchors agreeing
within half a spacing (anchors = invariant seed pixels at their printed values, which resolves
evenly spaced ticks shifted by one), then spacings ≥ 75 % of the widest (minor ticks are
skipped), then the smallest mean error.
Unmatched values are errors unless `tickPixels` overrides them.



### Horizontal invariant lines

Deskewed rows inside the frame with ink runs ≥ 80 px (2 px gaps bridged); runs in
consecutive rows with overlapping extents are merged; temperature from the centre row.
Pieces of one line broken by a label (levels within 4 px, extents not overlapping) are joined;
the level is the length-weighted mean. Each invariant is matched to the line nearest its seed
(within 15 px, seed inside the line extent ± 40 px). The measured temperature goes to
`digitization.check` and the review list; the output temperature is the printed label.

### Junctions

1. `junction_locator` follows the curve from the seed in the rows just above the line and
   extends it to the line centre; for a curve meeting the line at a shallow angle it follows
   the curve column by column from the curve pixel nearest the seed instead.
2. After all segments are traced, each junction is refined from the traced branches: the
   25 path pixels after leaving the line stroke are fitted with a straight line and extended
   to the line centre; the junction is the mean over the branches (both liquidus branches of a
   eutectic, liquidus and dome at a monotectic). The digitized composition is reported next to
   the printed label.
3. Compound melting: the seed is kept when it lies on ink (otherwise snapped to the nearest
   stroke in its column); the reported maximum is the highest traced pixel within 60 path
   pixels of the seed, and its composition the middle of the region within 0.5 °C of it.
4. End members: the printed melting point moved 8 px inside the frame and snapped to the
   nearest stroke in its column.

### Node map

Numbered points of a ternary for topology hints (`pd-nodes`), inside the triangle (+8 px):

1. Ink components smaller than 60 px (text, isolated dashes) are dropped; holes ≤ 30 px filled.
2. Zhang–Suen skeleton. A branch ending freely within 10 px + 2.5 × local half width of a
   junction is a spur (arrowhead, letter touching a line) and is removed (3 rounds).
3. Junction = skeleton pixel with ≥ 3 transitions in its 8-neighbourhood; clusters merged
   within 10 px. Junctions within 10 px of a triangle edge are `edge` points, moved onto the
   edge line, kept only where a line leads inside (ruler ticks, alone or crossing the edge,
   give only the scale and are dropped). The ink inside the triangle, more than 6 px from
   the frame, is split into 8-connected strokes; a stroke starting within 14 px of the point
   leads inside when it is
   - a straight line of ≥ 100 px (ticks are ≤ 65 px), or a curve or line network of ≥ 60 px
     (sd across its principal axis > 2.5 px);
   - a straight stroke whose far end (≥ 60 px away) is back within 10 px of the frame;
   - continued at its far end: the end is in a label box, a label box lies 3–25 px ahead
     (±4 px sideways), or a dash lies there (12–59 px long, length ≥ 2 × √12 × its sd
     across, axis within cos 0.94 of the stroke, its own axis passing within 4 px of the
     end, so a first dash merged with a tick arm still finds its next dash).
4. Invariants of the system file (atlas `pixel`) are always nodes (`invariant`, with id);
   detected junctions within 12 px of one are dropped, as are junctions on a ring.
5. Rings: round holes (circularity ≥ 0.75, 6–30 px, aspect 0.8–1.25) with ink all round and
   mostly white 8 px further out; holes in letters (a similar small component close by in any
   direction) are skipped. Rings are searched before the ink is cut to the triangle, so a
   ring drawn on an edge (3Al2O3·2SiO2 of Na2O-Al2O3-SiO2) stays closed; a ring is kept when
   its centre lies within the triangle + 8 px. Ring compositions check the calibration
   against compound stoichiometry.
6. Label boxes (`detect_text_boxes`): groups of ≥ 3 glyphs (components 14–50 px, eigenvalue
   ratio < 9, sizes within 1.6×, box gap ≤ 0.8× size, each round or lying across the line to
   its neighbour, so dashes of one line do not group), and glued blobs (largest side ≤ 90 px)
   containing a small hole (12–400 px, side ≤ 25: 0, 4, 6, 8, 9, O) that is not a ring. A
   ring is not a glyph either (component centred within 4 px of it), so a compound ring
   printed next to its formula (Na2O·Al2O3·2SiO2) is not boxed with the label.
   Junctions and dash ends inside a box padded 6 px are dropped, rings inside a box too.
7. Dash ends (`dash-end`): a dash is a component of 12–59 px with eigenvalue ratio ≥ 4 and
   mean width ≤ 8 px, not touching a label box; each end, and each free skeleton end of a
   solid line (direction over the last 12 px; on ink joined to the frame only ends more than
   25 px from it, so tick marks are skipped but lines joined to the frame through other lines
   keep their ends), is extended up to 45 px.
   A frame pixel (triangle edges drawn 3 px) is the node; within 25 px of the frame other
   solid ink (tick strokes) is passed over. A solid line hit is the node. For a dash, a
   heavier stroke (ratio ≥ 9, ≥ 3× its area) or a non-dash shape ≥ 2.5× its area (dashes of
   two lines touching) gives the crossing of the ray with that shape's axis (sine ≥ 0.4).
   Other ink or a label box ends the ray. Dropped within 10 px of another node.
8. Free ends (`free-end`): a solid-line end whose 45 px ray meets no ink at all (an isotherm
   stopping in open paper, e.g. the carnegieite isotherms of Na2O-Al2O3-SiO2); the node is
   the end itself. Not free ends: ends in a label box, within 25 px of the frame, or whose
   stroke runs straight back (ink within 2 px of the reversed ray) to the frame within 90 px
   (label leaders and ticks crossing the edge). Dropped within 10 px of another node.
9. Corners: the three calibration corners are always nodes (`corner`, the component in the
   `invariant` column); other points within 12 px of a corner, except invariants, are dropped.
10. Labels, one letter per kind, in reading order (bands of 50 px, then x): `V` corner,
   `I` invariant, `X` crossing, `E` edge point, `D` dash end, `F` free end, `C` ring. Crossings hidden under labels are
   not found; text glued to a line without a closed loop can still give extra points.

The overview and tiles also show the stored boundary arrows (magenta, 20 × 16 page px; `?` as a
magenta `?`) from the same file as the topology report (the `pd-curves` candidate when one
exists). `boundary_arrow_segments` cuts each `polyline_wt` at the vertex nearest (wt%) to each
inner path point; each piece gets its arrow at its middle (`rendering/arrowheads.py`, shared with
the overlay).

### Topology report

`pd-nodes` also writes `nodes/<system>-topology.md` (`build_topology_report`): the system
file written in node-map labels, for the user to check against the figure. It reads the
`pd-curves` candidate when one exists (so config `arrows` show before promotion), otherwise
the dataset file; the header and the log name the file. The node map always uses the dataset
file, so its labels stay stable.

- A pixel takes the label of the nearest node, or of a config point whose name ends in `•`,
  within 10 px (rings excluded); otherwise `[x, y]` (stored pixel). Invariants of the system
  file use their atlas pixel; curve ends that are invariants of other system files (binary
  edge points) are placed by their wt%, a missing oxide counting as 0.
- **Field circuits**: per phase, its boundary curves (path invariants, plus the polyline end
  for a one-point path) chained by shared ends. Two edge ends of the phase are joined along
  the triangle edge, through the corners, when no other boundary end lies on the edge between
  them. A gap is written `?`; a field with `null` phase is listed as `(no phase)`. Between
  two labels of a boundary segment the stored arrow is written `→` / `←` (towards falling
  temperature, in the reading order of the circuit), `←→` (away from a maximum inside it),
  or `-` (no arrow or `?`, and along the triangle edge), e.g. `p: I1 → I2 ← I3 - V1 - I1`.
- **Field rings of the config** (overlay), if the config has `fields`.
- **Points with a temperature**: invariants (`—` when not printed), inversion points with a
  temperature and pixel, `otherAtlasData` items with a pixel and a numeric `label` or `temperature_C`.
- **Compound rings**: the compound of `compounds.json` within 1.5 wt% (max oxide difference)
  and the invariant on the ring (10 px), if any.
- **Isotherms, inversions, two-liquid branches**: start label, every labelled point within
  5 px of the polyline in order along it, end label; `not traced` without a polyline.

Pixel sizes are for the reference line width, scaled like the node map.

### Curve tracing

- Shortest path (heapq Dijkstra, 8-connected) on a cost image: 1 on ink, 50 off ink, so
small gaps are bridged but labels are not followed. Optional waypoints split the path.
- Restricted to the bounding box of the endpoints and waypoints plus a 40 px margin.
- For a binary `trace` segment the endpoints are the snapped junctions or the end-member
axis crossing; the seed pixel chooses the correct stroke when several are near.
- A path that crosses more than 15 px of non-ink in total is reported as a trace gap.
- Ternary entries with `dashed: true` are traced on `dash_mask(mask)`: only components with a
largest box side of 8–59 px, axis ratio ≥ 1.5 and mean width ≤ 12 px (bold dashes) are ink, so the path
cannot run along a solid boundary, a compound join or the frame next to the dashes. The gaps
between dashes are counted as trace gaps (expected for a dashed line).
- Ternary curve shape. The traced path only supplies stroke pixels; the written curve is
smooth. A label lying on a curve is typography: the curve continues under it. Text boxes
(`detect_text_boxes`, grown by 2 px) are erased from the tracing mask, and only traced pixels
on ink are stroke data, so letters and the gaps of dashed or dotted lines never enter a fit.
For inversions, immiscibility branches and isotherms the field dividers already traced are
erased as well (an 11 px band along each polyline), so their trace and stroke never use the ink
of a boundary they start on or run next to, e.g. a boundary drawn with gaps whose pieces pass
the dash test. The copy decision below still uses a trace on the mask without that band.
  - Same curve as the boundary: a stretch of an inversion, immiscibility branch or isotherm
  between two consecutive track points that both lie within 5 px of one divider, or both
  within 10 px and running along it (median stroke distance ≤ 3 px; without a stroke the
  chord midpoint within 5 px), is copied from that divider (`follow_divider`); both track
  points move onto it. (An isotherm drawn along a bold boundary cannot be traced on the
  thin-stroke mask, so on-divider points need no stroke check.)
  Inversions and branches follow boundaries; isotherms follow boundaries, inversions and
  branches. Each copy is logged.
  - Boundaries, inversions, immiscibility branches: between two consecutive track points
  (path points, waypoints, ends) one quadratic Bézier through both (`fit_quadratic_segment`):
  the control point is fitted to the stroke by least squares (outliers beyond max(4 px,
  2.5 × median) dropped) and kept within the chord's extent, so there is no inflection and no
  turning back. A straight step is a straight line.
  - Isotherms are traced after those curves. The track is split at every track point within
  5 px of a boundary, inversion or immiscibility branch (field dividers), or marked
  `"split": true`, and at both ends of every copied stretch; each piece lies inside one
  field. A piece of two points is one Bézier of degree ≤ 4 without inflection: the lowest
  degree with 75 % of the stroke within 2 px, else the one closest to the stroke (degree > 2
  is logged); a piece of three or more points is one Bézier of degree ≤ 4 without inflection
  (`fit_convex_curve`): the inner track points pull with weight 1000, the stroke pixels with
  weight 1 (outliers dropped); degrees 2, 3, 4 are tried and the lowest one passing within
  2.5 px of every inner point, with 75 % of the stroke within 2 px, is kept (a curve with an
  inflection or turning back along the chord is rejected). Straight steps add no stroke data
  inside such a piece. A track point left > 3 px off the curve is a `track-point-off-curve`
  review item. Equal ends give a closed loop.
  - Curves are sampled every 3 px before conversion to wt% and simplification.



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



### Field temperature approximation

`trace-curves` builds, from the filled candidate, one liquidus temperature surface per
primary field (`build_field_approximation`, SciPy), shown on the overlay to check the
isotherms and printed temperatures against each other:

1. **Regions**: the triangle divided by the boundary curves (`polyline_wt`, drawn 3 px wide);
   inversions and two-liquid branches do not divide a field (modification fields are divided by
   their boundary curves, [§ Polymorph modifications](CONFIG.md#polymorph-modifications)). A region takes the field of an isotherm whose middle lies in it, otherwise the
   phase that the boundaries along ≥ 80 % of its outline share (contact pixels in a 9 px band,
   so curves meeting at a corner barely count). Regions under 400 px² or without such a phase
   stay unassigned (logged).
2. **Control points** of a phase: its isotherms every 0.5 wt%; its invariants and inversion
   points with a temperature; along its boundary and inversion curves every 1 wt%, the
   temperature interpolated by arc length between the known temperatures on the curve (path
   invariants, inversion points, isotherm ends within 0.7 wt%). Fewer than 4 points: no surface.
3. **Fit**: `scipy.interpolate.RBFInterpolator`, thin-plate spline with a linear term, in page
   pixels / 1000, smoothing 1e-4 on printed values and 1e-2 on interpolated boundary points.
   The log gives the residual RMS and maximum on the printed values per phase.
4. **Sampling**: every 3 px inside the (dilated) region and inside the convex hull of the
   control points (`scipy.spatial.Delaunay.find_simplex`), so undrawn corners are not
   extrapolated. The approximated isotherms are the levels of the field's isotherm
   temperatures (`contour_segments`, marching squares; a saddle cell is resolved by its centre
   value). Each printed point gets the value of every surface of its phases (`approx`).

A field without isotherms (only boundary temperatures) has a surface but no approximated
isotherms; its points still get bracket values.

### Labels and figures (OCR)

- `label_reader`: crop around the label, ×4 upscale, Tesseract `--psm 7` with a digit
whitelist. The guess and confidence are compared with the config label; differences are
review items.
- `figure_indexer`: each page at 150 dpi in grey, Tesseract on the full page; output
`{figure, pdfPage, printedPage, captionStart}` per figure.
- `caption_parser`: a caption starts a line with `Fig.`, `Figs.` or `Figure(s)`, one or more
figure numbers and `.` or `,` (OCR reads some full stops as commas). Shared captions name
several figures: `Figs. 3.64 and 3.65.`, `Figures 3.188 to 3.190.` (ranges are expanded).
Text after the number on the same line makes it a caption (`captionStart` = the next 160
characters); without text it is the label under a drawing, which records the figure on that
page with an empty `captionStart` unless a caption on the page names the same figure.
Cross-references wrapped to a line start (`Fig. 3.251) are not included ...`) do not match.
- `figure_index_merger`: re-indexing a page range replaces only the entries of those pages;
the index stays sorted by PDF page and figure number.

### Isotherm detection

`detect-isotherms SYSTEM` (`make pd-isotherms`) finds the isotherms on the page without a
config, as a draft of the config `isotherms` entries (`detect_isotherms`). It needs the traced
boundary curves (candidate after `pd-curves`, else the dataset file).

1. **Thin lines.** The ink inside the triangle, without the frame (14 px band), the boundary
   curves (17 px band along their polylines), strokes wider than `isothermStrokeWidth_px` (+ 1.5 px;
   ink within 6 px of their cores), label boxes (`detect_text_boxes`, + 3 px) and rings (+ 6 px).
   With page words (`text_words`, `auto` and `auto-overlay`): the boxes of the words that are
   text (`_real_words`: confidence ≥ 60, at least 2 letters or digits, at most 1.4 × the median
   height of the words read with confidence ≥ 80 — lines read as text such as `\` or `AWN.` are
   taller) are masked too (+ 3 px), with every ink component lying wholly within the box grown by
   0.6 × its height across and 0.15 × along, at most 1.3 × its height (glyphs the reader lost,
   such as a thin `1` next to the word), so letters and digits never become part of a line.
2. **Branches.** Zhang–Suen skeleton split at junctions (three or more 0 → 1 changes around a
   pixel; the junction pixel and its skeleton neighbours form a cluster), spurs ≤ 8 px pruned
   (`skeleton_branches`).
3. **Lines** (`chain_branches`). At a junction the two branch ends pointing most nearly in
   opposite directions (within 40°) continue each other. Free ends join across a gap when each
   lies ahead of the other and the gap does not touch the frame or a boundary: ≤ 14 px (break),
   ≤ 30 px next to a dash (≤ 70 px), ≤ 130 px when ≥ 30 % of the gap lies on label boxes (a
   label printed in the line; the gap is drawn straight, a `straight` waypoint in the draft).
   A hook at a line end — its last 8, 14 or 20 px turning more than 40° from the 30 px before
   (a crossing line or a leader tick taken at a junction) — is cut, up to three times per end
   (`_without_hooks`).
4. **Not isotherms.** Lines with < 30 px of ink or < 45 px across (digits the label detector
   missed); straight lines whose ink runs straight on beyond an end, over at least 30 px and up
   to 600 px (direction of its last 40 px, following the ink ±2 px across, drifting ≤ 3 px + 8 %,
   gaps ≤ 5 px), to within 12 px of a page word with letters (leaders of words such as a phase
   name); straight or ≤ 150 px lines running on outside the triangle (leaders of outside
   labels; a long curved line ending at an edge marker is kept); straight lines up to 150 px
   from a label to a free end or a printed point (leaders); straight lines ≥ 100 px ending at a
   ring (compatibility joins); two straight parts (each ≥ 40 px, ≤ 2.5 px off its chord) meeting
   at a turn ≥ 25° without a label gap (joins or kinked leaders); lines outside every field region
   (`build_field_regions`: the triangle split by the boundaries, a region takes the phase of
   the boundaries along ≥ 80 % of its outline).
5. **Ends.** Each end moves onto the boundary or edge it points at (≤ 25 px ahead along its
   last 8 px, else along its last 40 px — the stroke bends along a boundary where it merges into
   it — else ≤ 16 px away); otherwise it is a label end (label box within 10 px) or a free end.
   A boundary end whose line (last 40 px) meets the boundary at under 12° runs `along` it: the
   line merges into the boundary stroke, so where it really reaches the boundary is unknown; it
   is no crossing (no grouping, no boundary order; the order across the field still places it).
   Lines interrupted by text or crossing lines are rebuilt by prolongation:
   - two pieces of one field whose label or free ends face each other are one line when each end
     lies ahead of the other's last 40 px (≤ 150 px apart, ≤ 8 px off its direction, directions
     opposite within 25°), the gap crosses no boundary and their labels agree; closest pairs
     first (`_join_prolongations`; the gap is drawn straight);
   - a label end is carried on along its last 40 px to the first boundary within 80 px when a
     piece of the next field has a crossing end within 35 px of the hit and runs on away from it
     (within 60°): line and boundary are hidden under the text; the end becomes that crossing
     and the piece is drawn on to it (`_prolong_through_text`).
6. **Temperatures**, by source:
   - `label`: a label in a line gap or ahead of a label end (≤ 80 px) is read by
     `read_rotated_number` (its glyph boxes plus the ink components lying wholly within them
     grown by 0.8 glyph size, since a thin `1` is no glyph box; Tesseract `--psm 7`, digits,
     upright, along the line and along the long axis of the label ink, each both ways, best
     confidence). Accepted when it is a multiple of the step between 100 and 3000 °C with
     confidence ≥ 25, not below the lowest invariant temperature of the system. Glyphs inside
     the boxes of words read as point temperatures (`skip_boxes`: invariant and saddle labels in
     `auto`) are not read.
   - `label` beside a line (`side_label_pieces`; `auto` passes the other page words that are
     isotherm temperatures): the piece running into the word box; else the farthest piece
     (≤ 80 px, over 15 px away) joined to the box by a leader — ink within ±1 px all along the
     segment, no gap over 3 px except gaps ≤ 6 px starting within 15 px of the box (a leader
     stopping short of the word, a lost glyph) — which may cross nearer lines; else the nearest
     joined piece; else the nearest piece touching the box (≤ 6 px) with no other within 15 px.
     A 3-digit side label below the lowest invariant temperature is taken with a leading 1 lost
     in its leader ("400" → 1400). A piece with another label keeps it (review item).
   - Before grouping, an end of a labelled piece on a boundary stretch whose temperatures
     exclude the label moves to the triangle edge when it is within 25 px (a narrow field
     between a boundary and an edge, where the end snapped to the wrong line).
   - `continuation`: pieces ending on one boundary within 35 px are one line (the liquidus has
     one temperature there; pieces with the same label first, up to 52 px apart since a shallow
     crossing shifts the ends; then closest ends first; never two pieces of one field or with
     different labels); a label on one piece gives the others their temperature.
   - `boundary order`: along each boundary stretch between path points of known, different
     temperatures (not a stretch with a maximum, arrows `<>`) the crossing lines rise strictly
     from the lower to the higher temperature by whole steps (`solve_isotherm_temperatures`:
     stretches longest first, propagated; a stretch that empties a domain is not used and goes
     to the review list). A label outside the temperatures of a stretch its piece ends on is not
     used; a crossing of another piece of a labelled line outside them is not used.
   - `field order` (`field_order_chains`): from 30, 50 and 70 % along each piece a section runs
     both ways along its normal to the next boundary or the frame (≤ 400 px), listing the lines
     it meets. The run around the piece without a repeated line, cut where a spacing exceeds
     1.8 × the median spacing (a line missed in between), gives neighbouring lines one step
     apart, all rising or all falling. Sections are used after the boundary stretches, longest
     first; a section that empties a domain is not used (counted in the log). A piece fixed
     only through sections has source `field order`.
   A piece with one possible value gets it; the draft entry carries `inferred`: `from` the
   labelled lines of the field when the arithmetic holds, else `between` the stretch bounds.
   Others keep their candidates (review kind `isotherm-temperature`).
7. **Outputs** (`isotherms/`): `<system>.json` (draft config entries: `startPixel`, `endPixel`,
   waypoints every ~60 px and at both sides of label gaps, `new`, `inferred`, `dashed`, `notes`
   with the evidence), `<system>.md` (`isotherm_draft_report`: the config isotherms with the
   detected pieces on them — ≥ 60 % of a piece within 8 px of the entry — their coverage and
   whether the temperature agrees; pieces on no config isotherm; per piece its evidence; review
   items; log) and `<system>.png` (`render_isotherm_draft`: pieces coloured by temperature
   source, label gaps magenta, dropped lines grey, `D<n> <°C>` labels).

The draft is not merged into the config: entries are copied by hand after checking the image.

`auto-overlay SYSTEM` (`make pd-auto-overlay`) shows the diagram as the automatic data alone give
it: the same detection, then `build_auto_system` (the traced system file with its isotherms
replaced by the detected pieces that have a temperature, `polyline_wt` every ~10 px) and the
usual `render_ternary_overlay` with `auto_overlay_curves`: the traced boundaries without arrows,
the detected isotherms (inferred temperatures in parentheses, pieces without a temperature grey,
kind `isotherm-open`), field regions and the field approximation built from them (no config
`fields` or isotherms) and the compound points of the rings. Output `auto/<system>.png` and
`auto/<system>.json` (the system it was drawn from; not a candidate, never promoted). Boundaries
and invariants are still those of the config-guided trace.
Limits: labels whose glyphs touch the line are not bridged (the glyph joins the skeleton; a
lost `1` glyph may continue a line through the next label); close parallel lines meeting a
boundary at a shallow angle (a narrow field) may still be grouped wrongly; a short straight
line from a boundary to a printed point temperature reads as that label's leader.
