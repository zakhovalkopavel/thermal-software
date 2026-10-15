# Phase-Diagram Extraction — Implementation layout

Part of the [phase-diagram extraction specification](README.md).

## Implementation layout

One export per file, dataclasses for models, files grouped in subpackages by
responsibility (empty `__init__.py` in each), public API re-exported from the top-level
`__init__.py` (same conventions as `python/src/nasa_thermo/`). No dependencies beyond
`python/pyproject.toml` (numpy, scipy, Pillow, opencv-python, pytesseract) and the
container's `poppler-utils` and `tesseract-ocr`.

```
python/
  src/
    phase_diagrams/
      __init__.py                    ← public API re-exports
      constants/
        atomic_mass.py               ← ATOMIC_MASS (standard atomic weights; molar masses via formula_molar_mass)
        oxide_formulas.py            ← OXIDE_FORMULAS (caption display)
        oxide_notation.py            ← OXIDE_NOTATION (CaO → C, TiO2 → T: notation of new single-oxide entries)
        status_tolerance.py          ← STATUS_TOLERANCE (ΔT 10 °C, Δ 1.5 wt%)
        comparison_tolerance.py      ← COMPARISON_TOLERANCE (±3 °C, ±0.2 wt% box)
        boundary_arrows.py           ← BOUNDARY_ARROWS (> < <> ?)
      models/                        ← dataclasses
        frame.py                     ← Frame: four fitted edge lines, corners
        measured_line.py             ← MeasuredLine: y, temperature, x-extent
        traced_curve.py              ← TracedCurve: pixel path + data points
        curve_sample.py              ← CurveSample: sampled points, dropped and uncovered grid values
        axis_calibration.py          ← AxisCalibration: tick pixels ↔ values, piecewise linear
        binary_calibration.py        ← BinaryCalibration: x + y AxisCalibration + rotation
        ternary_calibration.py       ← TernaryCalibration: corners + optional quadratic warp
        calibration_result.py        ← CalibrationResult: frame, calibration, tick pixels, residuals
        binary_extraction.py         ← BinaryExtraction: system dict + measurements (overlay, review, log)
        ternary_fill.py              ← TernaryFill: new file text + traces, review, log
        nbs_entry.py                 ← NbsEntry
        nbs_comparison.py            ← NbsComparison: converted wt%, ΔT, Δ, within tolerance
        review_item.py               ← ReviewItem
        validation_issue.py          ← ValidationIssue
        system_comparison.py         ← SystemComparison: differences + notes (candidate vs dataset)
        diagram_node.py              ← DiagramNode: labelled node-map point (junction, edge, invariant, ring)
        line_scale.py                ← LineScale: page line width → factor for the pixel tolerances
        melting_candidate.py         ← MeltingCandidate: one compound-data melting point (°C, variant, CAS, ref)
        temperature_point.py         ← TemperaturePoint: printed point (°C) + its value on each field surface
        field_approximation.py       ← FieldApproximation: field regions, surface fits, approximated isotherms, points
        compound_point.py            ← CompoundPoint: ring of the figure, its compound and temperature; legend text
        branch_chain.py              ← BranchChain: skeleton branches joined into one drawn line, with its gaps (ink, dash, text)
        detected_isotherm.py         ← DetectedIsotherm: isotherm piece found on the page, temperature source, evidence, config entry
        isotherm_detection.py        ← IsothermDetection: detected pieces, dropped lines, log, review items
        boundary_graph.py            ← BoundaryNode, BoundaryEdge, BoundaryGraph: boundary curves found on the page and their nodes
        page_word.py                 ← PageWord: a word read on the page (text, confidence, box)
      config/
        diagram_config.py            ← DiagramConfig (binary config)
        curves_config.py             ← CurvesConfig (ternary curves config)
        invariant_spec.py            ← InvariantSpec (config entry)
        liquidus_branch_spec.py      ← LiquidusBranchSpec (config entry)
        trace_segment_spec.py        ← TraceSegmentSpec: trace | straight | flat
        config_loader.py             ← load_config: DiagramConfig or CurvesConfig by file name (+ schema checks)
        source_registry.py           ← reads sources.json: PDF paths, page mappings, figures
      rendering/
        pdf_renderer.py              ← render_page(pdf, page, dpi) with cache
        tile_renderer.py             ← render_tile(page image, box, scale) with pixel rulers
        overlay_renderer.py          ← review PNG
        ternary_overlay_renderer.py  ← ternary review PNG: field fills, one colour per curve kind
        node_map_renderer.py         ← tile with the numbered node-map points (+ stored arrows)
        arrowheads.py                ← arrowheads(points, arrow, …): triangles of a stored boundary arrow
        isotherm_draft_renderer.py   ← render_isotherm_draft(image, detection, box): detected pieces coloured by temperature source
      detection/
        ink_mask.py                  ← ink_mask(image, threshold)
        line_width_meter.py          ← measure_line_scale(mask): mean stroke width of the page
        stroke_width_filter.py       ← keep strokes in a width range (drops text and arrows)
        frame_detector.py            ← detect_frame(mask, search_box)
        tick_detector.py             ← detect_ticks(mask, frame) → pixel positions per edge
        tick_matcher.py              ← pair detected ticks with config tick values
        horizontal_line_detector.py  ← detect_horizontal_lines(mask, frame) → MeasuredLine[]
        vertical_line_detector.py    ← compound lines (vertical strokes) for the calibration check
        junction_locator.py          ← snap a seed pixel to a curve × line junction
        skeletonizer.py              ← skeletonize(mask): Zhang–Suen centre lines
        skeleton_branches.py         ← skeleton_branches(skeleton): branches between junctions, spurs pruned
        junction_detector.py         ← detect_junctions(mask): line junctions and crossings (node map)
        ring_detector.py             ← detect_rings(mask): small drawn circles (compound compositions)
        dash_end_detector.py         ← detect_line_ends(mask): where line ends meet a line, and free line ends
        dash_mask.py                 ← dash_mask(mask): dashes only (tracing of dashed lines)
        text_detector.py             ← detect_text_boxes(mask): printed labels (glyph groups, loop blobs)
      tracing/
        curve_tracer.py              ← trace_path(mask, start, end, waypoints) (heapq Dijkstra)
        curve_sampler.py             ← sample a TracedCurve on a wt% grid with endpoint rules
        polyline_simplifier.py       ← Douglas–Peucker in wt% space (ternary polylines)
        quadratic_segment_fitter.py  ← fit_quadratic_segment: one quadratic arc between two track points
        convex_curve_fitter.py       ← fit_convex_curve: inflection-free Bézier (degree ≤ 4) of an isotherm piece
        divider_follower.py          ← follow_divider: the divider stretch a curve runs along between two track points
        contour_segments.py          ← contour_segments(grid, level, origin, step): marching-squares segments of one level
        branch_chainer.py            ← chain_branches(branches, junctions, text, barrier): lines through crossings, breaks, dashes, labels
      figures/
        label_reader.py              ← Tesseract on a crop → guess + confidence
        rotated_label_reader.py      ← read_rotated_number(glyphs, angle): digits read upright or along a line
        page_word_reader.py          ← read_page_words(image, mask, box): every word of a page area (two readings merged)
        caption_parser.py            ← figure captions and labels in the OCR text of one page
        figure_indexer.py            ← caption OCR over a page range → figure index
        figure_index_merger.py       ← merge a re-indexed page range into the existing index
      nbs/
        nbs_text_normalizer.py       ← fixes OCR noise in the NBS text layer
        nbs_entry_index.py           ← parse the NBS dump into NbsEntry[]
        nbs_matcher.py               ← compare an invariant with NBS entries → NbsComparison[]
        status_resolver.py           ← extracted / confirmed / conflict
        composition_converter.py     ← mol% ↔ wt%
      builders/
        binary_calibrator.py         ← calibrate_binary(mask, config): frame + ticks → CalibrationResult
        binary_system_builder.py     ← config + measurements → system dict
        ternary_curve_filler.py      ← fills polyline_wt in an existing ternary file
        node_label_resolver.py       ← resolve_node_labels: node labels in config text → invariant id or pixel
        ternary_structure_editor.py  ← config edits: move/rename points, set keys, append entries
        node_map_builder.py          ← build_node_map(system, mask): numbered points for topology hints
        topology_report_builder.py   ← build_topology_report(name, system, nodes, …): field circuits, points, routes in node labels
        nearest_compound.py          ← nearest_compound(wt, components, compounds): compound within 1.5 wt%
        compound_points_builder.py   ← build_compound_points(system, nodes, compounds, …): rings → compound points (overlay)
        boundary_arrow_segments.py   ← boundary_arrow_segments(system, origin): page-pixel boundary pieces with their arrows
        field_regions_builder.py     ← build_field_regions(system, calibration): the triangle split by the boundaries, field per region
        field_temperature_builder.py ← build_field_approximation(system, calibration, invariants): temperature surface per field
        isotherm_detector.py         ← detect_isotherms(system, mask, calibration, invariants, …): isotherm pieces, fields, temperatures
        isotherm_temperature_solver.py ← solve_isotherm_temperatures(groups, labels, ladders, step, chains): temperatures from the crossing and field order
        isotherm_field_order.py      ← field_order_chains(pieces, groups, stop): neighbouring lines along sections across a field
        isotherm_side_labels.py      ← side_label_pieces(words, pieces, mask): piece labelled by a word beside it (leader or touch)
        auto_system_builder.py       ← build_auto_system(system, detection, calibration): system with only the detected isotherms
        auto_overlay_curves.py       ← auto_overlay_curves(system, detection, calibration): boundaries + detected pieces for the overlay
        boundary_graph_builder.py    ← detect_boundary_graph(mask, corners): heavy strokes → curves, junctions, edge points
        field_namer.py               ← name_fields(graph, …, words, mask): field names from labels, leaders, compositions
        node_temperature_reader.py   ← read_node_temperatures, read_curve_temperatures: printed °C of nodes and saddles
        auto_ternary_builder.py      ← build_auto_ternary(start, graph, naming, temperatures, …): system file from the page alone
      compounds/
        compound_data_lookup.py      ← melting_candidates(formula, compound-data dir): meltingPoint values, highest first
        oxide_compound_builder.py    ← new_oxide_compound, merge_compound_data (atlas vs compound-data, a/c/x choice)
        compounds_file_editor.py     ← format_compound, add_compound, replace_compound (compact layout of compounds.json)
      output/
        system_json_writer.py        ← compact layout writer (binary files)
        review_report.py             ← review markdown
        system_comparer.py           ← compare_systems(old, new) → SystemComparison
        isotherm_draft_comparison.py ← compare_isotherm_draft(detected, config isotherms): found, coverage, same temperature
        isotherm_draft_report.py     ← isotherm_draft_report(name, detection, rows, unmatched): markdown of the draft
        auto_extraction_report.py    ← compare_auto_system, auto_extraction_report: automatic system vs the semi-manual file
      validation/
        dataset_validator.py         ← validate the whole dataset → ValidationIssue[]
        candidate_validator.py       ← validate the dataset with a candidate in place (temporary copy)
        inferred_temperature_check.py ← inferred_temperature_problem(T, inferred): arithmetic of an inferred isotherm temperature
    scripts/
      extract_phase_diagram.py       ← CLI entry point (thin wrapper)
  tests/
    phase_diagrams/                  ← no __init__.py (it would shadow src/phase_diagrams)
      conftest.py                    ← fixtures
      pd_helpers.py                  ← synthetic diagram, NBS text snippet, small dataset
      fixtures/golden/               ← writer golden files (copies of al2o3-mgo.json, mgo-sio2.json)
      test_calibration.py
      test_detectors.py
      test_curve_tracer.py
      test_curve_sampler.py
      test_composition_converter.py
      test_nbs.py
      test_figure_index.py           ← caption parser and index merge on real OCR text
      test_status_resolver.py
      test_system_json_writer.py
      test_ternary_curve_filler.py
      test_ternary_structure_editor.py
      test_quadratic_segment_fitter.py
      test_convex_curve_fitter.py
      test_divider_follower.py
      test_ternary_overlay_renderer.py
      test_node_map.py               ← skeleton, junctions, rings, edge points, node labels in the curves config
      test_field_approximation.py    ← contour segments, field regions, surfaces, hull clipping
      test_compound_points.py        ← compound of the system, temperature from the invariant on the ring or the melting point
      test_isotherm_detection.py     ← skeleton branches, chaining, solver, inferred bounds, draft entries, synthetic page
      test_isotherm_order_and_labels.py ← field-order sections, side labels, corner rule, label long axis, isotherm comparison
      test_auto_extraction.py        ← boundary graph of a synthetic page, page words, field names, node and saddle °C, system, comparison
      test_dataset_validator.py
      test_candidates.py             ← comparison, promotion check on a temporary dataset copy
      test_regression_atlas.py       ← needs the atlas PDF; skipped when absent
```
