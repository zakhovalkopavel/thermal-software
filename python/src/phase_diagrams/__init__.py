"""
phase_diagrams — Phase-diagram extraction from the Slag Atlas, cross-checked against NSRDS-NBS 61.

Measures invariant lines, junctions and liquidus curves on rendered atlas
pages, compares invariants with NSRDS-NBS 61 entries and writes the system
files of shared/processed/phase-diagrams.

Subpackages
-----------
  constants/   module-level constants
  models/      data classes (results, measurements, NBS entries, review items)
  config/      config data classes, config loader, source registry
  rendering/   PDF pages, zoom tiles, overlays
  detection/   ink mask, line width (pixel scale), frame, ticks, invariant lines, junctions, skeleton, rings, dash ends, label boxes, ternary triangles
  tracing/     curve tracing, sampling, simplification
  figures/     label OCR, caption parsing, figure index, figure search by system, caption display, corner labels
  nbs/         NSRDS-NBS 61 text, entries, matching, statuses, composition conversion
  builders/    calibration, binary system build, ternary start files, new-system checklist, ternary curve fill, node map, topology report
  output/      system JSON writer, review report
  validation/  dataset rules PD001–PD018

Spec
----
  docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md
"""

from phase_diagrams.constants.atomic_mass               import ATOMIC_MASS
from phase_diagrams.constants.status_tolerance          import STATUS_TOLERANCE
from phase_diagrams.constants.comparison_tolerance      import COMPARISON_TOLERANCE
from phase_diagrams.constants.boundary_arrows           import BOUNDARY_ARROWS
from phase_diagrams.constants.oxide_formulas            import OXIDE_FORMULAS

from phase_diagrams.models.frame                        import Frame
from phase_diagrams.models.measured_line                import MeasuredLine
from phase_diagrams.models.traced_curve                 import TracedCurve
from phase_diagrams.models.curve_sample                 import CurveSample
from phase_diagrams.models.axis_calibration             import AxisCalibration
from phase_diagrams.models.binary_calibration           import BinaryCalibration
from phase_diagrams.models.ternary_calibration          import TernaryCalibration
from phase_diagrams.models.calibration_result           import CalibrationResult
from phase_diagrams.models.binary_extraction            import BinaryExtraction
from phase_diagrams.models.ternary_fill                 import TernaryFill
from phase_diagrams.models.nbs_entry                    import NbsEntry
from phase_diagrams.models.nbs_comparison               import NbsComparison
from phase_diagrams.models.review_item                  import ReviewItem
from phase_diagrams.models.validation_issue             import ValidationIssue
from phase_diagrams.models.system_comparison            import SystemComparison
from phase_diagrams.models.diagram_node                 import DiagramNode
from phase_diagrams.models.line_scale                   import LineScale

from phase_diagrams.config.diagram_config               import DiagramConfig
from phase_diagrams.config.curves_config                import CurvesConfig
from phase_diagrams.config.invariant_spec               import InvariantSpec
from phase_diagrams.config.liquidus_branch_spec         import LiquidusBranchSpec
from phase_diagrams.config.trace_segment_spec           import TraceSegmentSpec
from phase_diagrams.config.config_loader                import load_config
from phase_diagrams.config.source_registry              import SourceRegistry

from phase_diagrams.rendering.pdf_renderer              import render_page
from phase_diagrams.rendering.tile_renderer             import render_tile
from phase_diagrams.rendering.overlay_renderer          import render_overlay
from phase_diagrams.rendering.ternary_overlay_renderer  import render_ternary_overlay
from phase_diagrams.rendering.node_map_renderer         import render_node_map
from phase_diagrams.rendering.arrowheads                import arrowheads

from phase_diagrams.detection.ink_mask                  import ink_mask
from phase_diagrams.detection.line_width_meter          import measure_line_scale
from phase_diagrams.detection.stroke_width_filter       import stroke_width_filter
from phase_diagrams.detection.frame_detector            import detect_frame
from phase_diagrams.detection.tick_detector             import detect_ticks
from phase_diagrams.detection.tick_matcher              import match_ticks
from phase_diagrams.detection.horizontal_line_detector  import detect_horizontal_lines
from phase_diagrams.detection.vertical_line_detector    import detect_vertical_lines
from phase_diagrams.detection.junction_locator          import locate_junction
from phase_diagrams.detection.skeletonizer              import skeletonize
from phase_diagrams.detection.junction_detector         import detect_junctions
from phase_diagrams.detection.ring_detector             import detect_rings
from phase_diagrams.detection.dash_end_detector         import detect_dash_ends
from phase_diagrams.detection.dash_mask                 import dash_mask
from phase_diagrams.detection.text_detector             import detect_text_boxes
from phase_diagrams.detection.triangle_detector         import detect_triangles
from phase_diagrams.detection.triangle_reading_order    import triangle_reading_order

from phase_diagrams.tracing.curve_tracer                import trace_path
from phase_diagrams.tracing.curve_sampler               import sample_curve
from phase_diagrams.tracing.polyline_simplifier         import simplify_polyline
from phase_diagrams.tracing.quadratic_segment_fitter    import fit_quadratic_segment
from phase_diagrams.tracing.convex_curve_fitter         import fit_convex_curve
from phase_diagrams.tracing.divider_follower            import follow_divider

from phase_diagrams.figures.label_reader                import read_label
from phase_diagrams.figures.caption_parser              import parse_figure_captions
from phase_diagrams.figures.figure_indexer              import index_figures
from phase_diagrams.figures.figure_index_merger         import merge_figure_index
from phase_diagrams.figures.system_components           import system_components
from phase_diagrams.figures.formula_letters             import formula_letters
from phase_diagrams.figures.formula_display             import display_formula
from phase_diagrams.figures.formula_molar_mass          import formula_molar_mass
from phase_diagrams.figures.figure_finder               import find_system_figures
from phase_diagrams.figures.caption_display             import display_caption
from phase_diagrams.figures.corner_label_reader         import read_corner_labels
from phase_diagrams.figures.corner_components           import corner_components

from phase_diagrams.nbs.nbs_text_normalizer             import NbsTextNormalizer
from phase_diagrams.nbs.nbs_entry_index                 import build_nbs_index
from phase_diagrams.nbs.nbs_matcher                     import NbsMatcher
from phase_diagrams.nbs.status_resolver                 import resolve_status
from phase_diagrams.nbs.composition_converter           import convert_composition

from phase_diagrams.builders.binary_calibrator          import calibrate_binary
from phase_diagrams.builders.binary_system_builder      import build_binary_system
from phase_diagrams.builders.ternary_curve_filler       import fill_ternary_curves
from phase_diagrams.builders.ternary_structure_editor   import edit_ternary_structure
from phase_diagrams.builders.node_map_builder           import build_node_map
from phase_diagrams.builders.topology_report_builder    import build_topology_report
from phase_diagrams.builders.boundary_arrow_segments    import boundary_arrow_segments
from phase_diagrams.builders.ternary_start_builder      import build_ternary_start
from phase_diagrams.builders.new_system_checklist       import new_system_checklist

from phase_diagrams.output.system_json_writer           import write_system_json
from phase_diagrams.output.review_report                import review_report
from phase_diagrams.output.system_comparer              import compare_systems

from phase_diagrams.validation.dataset_validator        import validate_dataset
from phase_diagrams.validation.candidate_validator      import validate_with_candidate
from phase_diagrams.validation.inferred_temperature_check import inferred_temperature_problem

__all__ = [
    # constants
    "ATOMIC_MASS",
    "STATUS_TOLERANCE",
    "COMPARISON_TOLERANCE",
    "BOUNDARY_ARROWS",
    "OXIDE_FORMULAS",
    # models
    "Frame",
    "MeasuredLine",
    "TracedCurve",
    "CurveSample",
    "AxisCalibration",
    "BinaryCalibration",
    "TernaryCalibration",
    "CalibrationResult",
    "BinaryExtraction",
    "TernaryFill",
    "NbsEntry",
    "NbsComparison",
    "ReviewItem",
    "ValidationIssue",
    "SystemComparison",
    "DiagramNode",
    "LineScale",
    # config
    "DiagramConfig",
    "CurvesConfig",
    "InvariantSpec",
    "LiquidusBranchSpec",
    "TraceSegmentSpec",
    "load_config",
    "SourceRegistry",
    # rendering
    "render_page",
    "render_tile",
    "render_overlay",
    "render_ternary_overlay",
    "render_node_map",
    "arrowheads",
    # detection
    "ink_mask",
    "measure_line_scale",
    "stroke_width_filter",
    "detect_frame",
    "detect_ticks",
    "match_ticks",
    "detect_horizontal_lines",
    "detect_vertical_lines",
    "locate_junction",
    "skeletonize",
    "detect_junctions",
    "detect_rings",
    "detect_dash_ends",
    "dash_mask",
    "detect_text_boxes",
    "detect_triangles",
    "triangle_reading_order",
    # tracing
    "trace_path",
    "sample_curve",
    "simplify_polyline",
    "fit_quadratic_segment",
    "fit_convex_curve",
    "follow_divider",
    # figures
    "read_label",
    "parse_figure_captions",
    "index_figures",
    "merge_figure_index",
    "system_components",
    "formula_letters",
    "display_formula",
    "formula_molar_mass",
    "find_system_figures",
    "display_caption",
    "read_corner_labels",
    "corner_components",
    # nbs
    "NbsTextNormalizer",
    "build_nbs_index",
    "NbsMatcher",
    "resolve_status",
    "convert_composition",
    # builders
    "calibrate_binary",
    "build_binary_system",
    "fill_ternary_curves",
    "edit_ternary_structure",
    "build_node_map",
    "build_topology_report",
    "boundary_arrow_segments",
    "build_ternary_start",
    "new_system_checklist",
    # output
    "write_system_json",
    "review_report",
    "compare_systems",
    # validation
    "validate_dataset",
    "validate_with_candidate",
    "inferred_temperature_problem",
]
