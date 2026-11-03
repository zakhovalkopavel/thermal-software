"""CLI dispatch for phase-diagram extraction."""
from __future__ import annotations

import sys
from pathlib import Path

from phase_diagrams import SourceRegistry
from phase_diagrams.cli.binary import _cmd_calibrate, _cmd_extract
from phase_diagrams.cli.dataset import _cmd_compare, _cmd_promote, _cmd_validate
from phase_diagrams.cli.figures import _cmd_index_figures, _cmd_tile
from phase_diagrams.cli.isotherms import _cmd_auto, _cmd_auto_overlay, _cmd_detect_isotherms
from phase_diagrams.cli.nbs import (
    _cmd_nbs_bibliography,
    _cmd_nbs_index,
    _cmd_nbs_refs,
    _cmd_nbs_suggest,
)
from phase_diagrams.cli.parser import _build_parser
from phase_diagrams.cli.ternary import _cmd_new, _cmd_nodes, _cmd_trace_curves


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    dataset = Path(args.dataset)
    work = Path(args.work_dir)
    try:
        if args.command == "validate":
            return _cmd_validate(args, dataset, work)
        if args.command == "nbs-suggest":
            return _cmd_nbs_suggest(args, work, dataset)
        if args.command == "compare":
            return _cmd_compare(args, dataset, work)
        if args.command == "promote":
            return _cmd_promote(args, dataset, work)
        registry = SourceRegistry(dataset)
        handlers = {
            "index-figures": lambda: _cmd_index_figures(args, registry, work),
            "tile": lambda: _cmd_tile(args, registry, work),
            "calibrate": lambda: _cmd_calibrate(args, dataset, registry, work),
            "extract": lambda: _cmd_extract(args, dataset, registry, work),
            "new": lambda: _cmd_new(args, dataset, registry, work),
            "trace-curves": lambda: _cmd_trace_curves(args, dataset, registry, work),
            "nodes": lambda: _cmd_nodes(args, dataset, registry, work),
            "detect-isotherms": lambda: _cmd_detect_isotherms(args, dataset, registry, work),
            "auto-overlay": lambda: _cmd_auto_overlay(args, dataset, registry, work),
            "auto": lambda: _cmd_auto(args, dataset, registry, work),
            "nbs-index": lambda: _cmd_nbs_index(args, registry, work),
            "nbs-bibliography": lambda: _cmd_nbs_bibliography(args, registry, work),
            "nbs-refs": lambda: _cmd_nbs_refs(args, registry, work),
        }
        return handlers[args.command]()
    except (ValueError, KeyError, FileNotFoundError) as exc:
        print(f"[{args.command}] error: {exc}", file=sys.stderr)
        return 2
