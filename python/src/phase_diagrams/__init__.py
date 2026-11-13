"""
phase_diagrams — Phase-diagram extraction from the Slag Atlas, cross-checked against NSRDS-NBS 61.

Measures invariant lines, junctions and liquidus curves on rendered atlas
pages, compares invariants with NSRDS-NBS 61 entries and writes the system
files of shared/processed/phase-diagrams.

Layout
------
  Generic diagram CV (config, detection, tracing, rendering, most models/builders/figures)
  is imported from ``source_extract.diagrams``. This package keeps Atlas/NBS adapters:

  constants/   host oxide formulas/notation and status tolerance (+ re-exports via top-level)
  models/      NBS entry/comparison, melting candidates
  figures/     atlas caption display (oxide defaults)
  nbs/         NSRDS-NBS 61 text, entries, matching, statuses, composition conversion
  builders/    host system builders, field naming, topology, ternary editors, compound points
  compounds/   compounds.json entries of single oxides from compound-data and the atlas
  output/      system JSON writer, review report, isotherm draft report and comparison
  validation/  dataset rules PD001–PD020
  cli/         extract CLI

Spec
----
  docs/scripts/phase-diagrams/README.md
"""

from source_extract.diagrams.constants.atomic_mass import ATOMIC_MASS
from phase_diagrams.constants.status_tolerance          import STATUS_TOLERANCE
from source_extract.diagrams.constants.comparison_tolerance import COMPARISON_TOLERANCE
from source_extract.diagrams.constants.boundary_arrows import BOUNDARY_ARROWS
from phase_diagrams.constants.oxide_formulas            import OXIDE_FORMULAS
from phase_diagrams.constants.oxide_notation            import OXIDE_NOTATION

from source_extract.diagrams.models.frame import Frame
from source_extract.diagrams.models.measured_line import MeasuredLine
from source_extract.diagrams.models.traced_curve import TracedCurve
from source_extract.diagrams.models.curve_sample import CurveSample
from source_extract.diagrams.models.axis_calibration import AxisCalibration
from source_extract.diagrams.models.binary_calibration import BinaryCalibration
from source_extract.diagrams.models.ternary_calibration import TernaryCalibration
from source_extract.diagrams.models.calibration_result import CalibrationResult
from source_extract.diagrams.models.binary_extraction import BinaryExtraction
from source_extract.diagrams.models.ternary_fill import TernaryFill
from phase_diagrams.models.nbs_entry                    import NbsEntry
from phase_diagrams.models.nbs_comparison               import NbsComparison
from source_extract.diagrams.models.review_item import ReviewItem
from source_extract.diagrams.models.validation_issue import ValidationIssue
from source_extract.diagrams.models.system_comparison import SystemComparison
from source_extract.diagrams.models.diagram_node import DiagramNode
from source_extract.diagrams.models.line_scale import LineScale
from phase_diagrams.models.melting_candidate            import MeltingCandidate
from source_extract.diagrams.models.temperature_point import TemperaturePoint
from source_extract.diagrams.models.field_approximation import FieldApproximation
from source_extract.diagrams.models.compound_point import CompoundPoint
from source_extract.diagrams.models.branch_chain import BranchChain
from source_extract.diagrams.models.detected_isotherm import DetectedIsotherm
from source_extract.diagrams.models.isotherm_detection import IsothermDetection
from source_extract.diagrams.models.boundary_graph import BoundaryEdge, BoundaryGraph, BoundaryNode
from source_extract.diagrams.models.page_word import PageWord

from source_extract.diagrams.config.diagram_config import DiagramConfig
from source_extract.diagrams.config.curves_config import CurvesConfig
from source_extract.diagrams.config.invariant_spec import InvariantSpec
from source_extract.diagrams.config.liquidus_branch_spec import LiquidusBranchSpec
from source_extract.diagrams.config.trace_segment_spec import TraceSegmentSpec
from source_extract.diagrams.config.config_loader import load_config
from source_extract.diagrams.config.source_registry import SourceRegistry

from source_extract.diagrams.rendering.pdf_renderer import render_page
from source_extract.diagrams.rendering.tile_renderer import render_tile
from source_extract.diagrams.rendering.overlay_renderer import render_overlay
from source_extract.diagrams.rendering.ternary_overlay_renderer import render_ternary_overlay
from source_extract.diagrams.rendering.node_map_renderer import render_node_map
from source_extract.diagrams.rendering.arrowheads import arrowheads
from source_extract.diagrams.rendering.isotherm_draft_renderer import render_isotherm_draft

from source_extract.diagrams.detection.ink_mask import ink_mask
from source_extract.diagrams.detection.line_width_meter import measure_line_scale
from source_extract.diagrams.detection.stroke_width_filter import stroke_width_filter
from source_extract.diagrams.detection.frame_detector import detect_frame
from source_extract.diagrams.detection.tick_detector import detect_ticks
from source_extract.diagrams.detection.tick_matcher import match_ticks
from source_extract.diagrams.detection.horizontal_line_detector import detect_horizontal_lines
from source_extract.diagrams.detection.vertical_line_detector import detect_vertical_lines
from source_extract.diagrams.detection.junction_locator import locate_junction
from source_extract.diagrams.detection.skeletonizer import skeletonize
from source_extract.diagrams.detection.skeleton_branches import skeleton_branches
from source_extract.diagrams.detection.junction_detector import detect_junctions
from source_extract.diagrams.detection.ring_detector import detect_rings
from source_extract.diagrams.detection.dash_end_detector import detect_dash_ends, detect_line_ends
from source_extract.diagrams.detection.dash_mask import dash_mask
from source_extract.diagrams.detection.text_detector import detect_text_boxes
from source_extract.diagrams.detection.triangle_detector import detect_triangles
from source_extract.diagrams.detection.triangle_reading_order import triangle_reading_order

from source_extract.diagrams.tracing.curve_tracer import trace_path
from source_extract.diagrams.tracing.curve_sampler import sample_curve
from source_extract.diagrams.tracing.polyline_simplifier import simplify_polyline
from source_extract.diagrams.tracing.quadratic_segment_fitter import fit_quadratic_segment
from source_extract.diagrams.tracing.convex_curve_fitter import fit_convex_curve
from source_extract.diagrams.tracing.divider_follower import follow_divider
from source_extract.diagrams.tracing.branch_chainer import chain_branches

from source_extract.diagrams.figures.label_reader import read_label
from source_extract.diagrams.figures.caption_parser import parse_figure_captions
from source_extract.diagrams.figures.figure_indexer import index_figures
from source_extract.diagrams.figures.figure_index_merger import merge_figure_index
from source_extract.diagrams.figures.system_components import system_components
from source_extract.diagrams.figures.formula_letters import formula_letters
from source_extract.diagrams.figures.formula_display import display_formula
from source_extract.diagrams.figures.formula_molar_mass import formula_molar_mass
from source_extract.diagrams.figures.figure_finder import find_system_figures
from phase_diagrams.figures.caption_display             import display_caption
from source_extract.diagrams.figures.corner_label_reader import read_corner_labels
from source_extract.diagrams.figures.corner_components import corner_components
from source_extract.diagrams.figures.rotated_label_reader import read_rotated_number
from source_extract.diagrams.figures.page_word_reader import read_page_words

from phase_diagrams.nbs.nbs_text_normalizer             import NbsTextNormalizer
from phase_diagrams.nbs.nbs_entry_index                 import build_nbs_index
from phase_diagrams.nbs.nbs_matcher                     import NbsMatcher
from phase_diagrams.nbs.nbs_page_ocr                    import (
    CharBox, assemble_line, assemble_word, dump_nbs_table_ocr, read_subscript_digit,
)
from phase_diagrams.nbs.status_resolver                 import resolve_status
from phase_diagrams.nbs.composition_converter           import convert_composition

from source_extract.diagrams.builders.binary_calibrator import calibrate_binary
from phase_diagrams.builders.binary_system_builder      import build_binary_system
from phase_diagrams.builders.ternary_curve_filler       import fill_ternary_curves
from source_extract.diagrams.builders.field_temperature_builder import build_field_approximation
from source_extract.diagrams.builders.field_regions_builder import build_field_regions
from source_extract.diagrams.builders.isotherm_temperature_solver import solve_isotherm_temperatures
from source_extract.diagrams.builders.isotherm_detector import detect_isotherms
from phase_diagrams.builders.auto_system_builder        import build_auto_system
from source_extract.diagrams.builders.auto_overlay_curves import auto_overlay_curves
from source_extract.diagrams.builders.boundary_graph_builder import detect_boundary_graph
from phase_diagrams.builders.field_namer                import FieldNaming, match_phase_name, name_fields, system_phases
from source_extract.diagrams.builders.node_temperature_reader import (
    CurveTemperature,
    printed_temperature,
    read_curve_temperatures,
    read_node_temperatures,
)
from phase_diagrams.builders.auto_ternary_builder       import build_auto_ternary
from phase_diagrams.builders.ternary_structure_editor   import edit_ternary_structure
from source_extract.diagrams.builders.node_map_builder import build_node_map
from phase_diagrams.builders.topology_report_builder    import build_topology_report
from phase_diagrams.builders.nearest_compound           import nearest_compound
from phase_diagrams.builders.compound_points_builder    import build_compound_points
from source_extract.diagrams.builders.boundary_arrow_segments import boundary_arrow_segments
from phase_diagrams.builders.ternary_start_builder      import build_ternary_start
from phase_diagrams.builders.new_system_checklist       import new_system_checklist

from phase_diagrams.compounds.compound_data_lookup      import hill_formula, melting_candidates
from phase_diagrams.compounds.oxide_compound_builder    import (atlas_disagrees, default_compound_id,
                                                                merge_compound_data, new_oxide_compound)
from phase_diagrams.compounds.compounds_file_editor     import add_compound, format_compound, replace_compound

from phase_diagrams.output.system_json_writer           import write_system_json
from phase_diagrams.output.review_report                import review_report
from phase_diagrams.output.system_comparer              import compare_systems
from phase_diagrams.output.isotherm_draft_comparison    import compare_isotherm_draft
from phase_diagrams.output.isotherm_draft_report        import isotherm_draft_report
from phase_diagrams.output.auto_extraction_report       import auto_extraction_report, compare_auto_system

from phase_diagrams.validation.dataset_validator        import validate_dataset
from phase_diagrams.validation.candidate_validator      import validate_with_candidate
from source_extract.diagrams.validation.inferred_temperature_check import inferred_temperature_problem

__all__ = [
    # constants
    "ATOMIC_MASS",
    "STATUS_TOLERANCE",
    "COMPARISON_TOLERANCE",
    "BOUNDARY_ARROWS",
    "OXIDE_FORMULAS",
    "OXIDE_NOTATION",
    # models
    "Frame",
    "MeasuredLine",
    "TracedCurve",
    "CurveSample",
    "AxisCalibration",
    "BinaryCalibration",
    "TernaryCalibration",
    "TemperaturePoint",
    "FieldApproximation",
    "CompoundPoint",
    "BranchChain",
    "DetectedIsotherm",
    "IsothermDetection",
    "BoundaryEdge",
    "BoundaryGraph",
    "BoundaryNode",
    "PageWord",
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
    "MeltingCandidate",
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
    "render_isotherm_draft",
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
    "skeleton_branches",
    "detect_junctions",
    "detect_rings",
    "detect_dash_ends",
    "detect_line_ends",
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
    "chain_branches",
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
    "read_rotated_number",
    "read_page_words",
    # nbs
    "NbsTextNormalizer",
    "build_nbs_index",
    "NbsMatcher",
    "CharBox",
    "assemble_line",
    "assemble_word",
    "dump_nbs_table_ocr",
    "read_subscript_digit",
    "resolve_status",
    "convert_composition",
    # builders
    "calibrate_binary",
    "build_binary_system",
    "fill_ternary_curves",
    "build_field_approximation",
    "build_field_regions",
    "solve_isotherm_temperatures",
    "detect_isotherms",
    "build_auto_system",
    "auto_overlay_curves",
    "detect_boundary_graph",
    "FieldNaming",
    "match_phase_name",
    "name_fields",
    "system_phases",
    "CurveTemperature",
    "printed_temperature",
    "read_curve_temperatures",
    "read_node_temperatures",
    "build_auto_ternary",
    "edit_ternary_structure",
    "build_node_map",
    "build_topology_report",
    "nearest_compound",
    "build_compound_points",
    "boundary_arrow_segments",
    "build_ternary_start",
    "new_system_checklist",
    # compounds
    "hill_formula",
    "melting_candidates",
    "atlas_disagrees",
    "default_compound_id",
    "merge_compound_data",
    "new_oxide_compound",
    "add_compound",
    "format_compound",
    "replace_compound",
    # output
    "write_system_json",
    "review_report",
    "compare_systems",
    "compare_isotherm_draft",
    "isotherm_draft_report",
    "auto_extraction_report",
    "compare_auto_system",
    # validation
    "validate_dataset",
    "validate_with_candidate",
    "inferred_temperature_problem",
]
