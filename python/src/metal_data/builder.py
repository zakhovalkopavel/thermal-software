"""Orchestrate metal-data synthesis: ingest → approximate → donor fill → write."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from metal_data.approximation import apply_approximations
from metal_data.donor import apply_donor_fill
from metal_data.ingest import ingest_raw_tables
from metal_data.writers import write_dataset


def build_metal_data(
    raw_dir: Path,
    out_dir: Path,
    report_dir: Path,
) -> dict[str, Any]:
    """Build per-alloy processed dataset from raw tables."""
    raw_dir = Path(raw_dir)
    out_dir = Path(out_dir)
    report_dir = Path(report_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    registry, warnings = ingest_raw_tables(raw_dir)
    # Fit own measured points before donor fill so sparse grades stay without approx.
    approximation_report = apply_approximations(registry)
    donor_report = apply_donor_fill(registry)
    summary = write_dataset(
        out_dir,
        registry,
        donor_report=donor_report,
        approximation_report=approximation_report,
        warnings=warnings,
        report_dir=report_dir,
    )
    return summary
