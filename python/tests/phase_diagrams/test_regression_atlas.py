"""
Regression: regenerating the promoted binaries from their configs reproduces the dataset files.

Every binary config whose output file exists in the dataset is tested; promoting a new binary
needs no change here.

Invariant values identical, liquidus (and dome) within ±3 °C and ±0.2 wt%, same ids,
statuses and NBS sources (compare_systems). Skipped without the atlas PDF (and the NBS PDF or index).
"""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from phase_diagrams.builders.binary_calibrator import calibrate_binary
from phase_diagrams.builders.binary_system_builder import build_binary_system
from phase_diagrams.config.config_loader import load_config
from phase_diagrams.config.source_registry import SourceRegistry
from phase_diagrams.detection.ink_mask import ink_mask
from phase_diagrams.models.nbs_entry import NbsEntry
from phase_diagrams.nbs.nbs_entry_index import build_nbs_index
from phase_diagrams.nbs.nbs_matcher import NbsMatcher
from phase_diagrams.output.system_comparer import compare_systems
from phase_diagrams.rendering.pdf_renderer import render_page

_HERE = Path(__file__).resolve()
_DATASETS = [Path("/app/shared/processed/phase-diagrams"), _HERE.parents[3] / "shared/processed/phase-diagrams"]
_WORK_DIRS = [Path("/app/reports/phase-diagrams"), _HERE.parents[3] / "tmp/reports/python/phase-diagrams"]


def _first_existing(paths: list[Path]) -> Path | None:
    return next((p for p in paths if p.exists()), None)


def _promoted_binaries() -> list[str]:
    """Binary configs whose output file is in the dataset (ternary curves configs excluded)."""
    found = _first_existing(_DATASETS)
    if found is None:
        return []
    names = []
    for path in sorted((found / "configs").glob("*.config.json")):
        if path.name.endswith(".curves.config.json"):
            continue
        output = json.loads(path.read_text(encoding="utf-8")).get("output")
        if output and (found / output).exists():
            names.append(path.name.removesuffix(".config.json"))
    return names


@pytest.fixture(scope="module")
def dataset() -> Path:
    found = _first_existing(_DATASETS)
    if found is None:
        pytest.skip("dataset folder not found")
    registry = SourceRegistry(found)
    if not registry.pdf_path("slag-atlas-1995").exists():
        pytest.skip("Slag Atlas PDF not available")
    return found


@pytest.fixture(scope="module")
def work_dir(tmp_path_factory) -> Path:
    return _first_existing(_WORK_DIRS) or tmp_path_factory.mktemp("phase-diagrams")


@pytest.fixture(scope="module")
def nbs(dataset: Path, work_dir: Path) -> NbsMatcher:
    index = work_dir / "nbs" / "nsrds-nbs-61-1.entries.json"
    if index.exists():
        return NbsMatcher([NbsEntry.from_dict(e) for e in json.loads(index.read_text(encoding="utf-8"))])
    registry = SourceRegistry(dataset)
    pdf = registry.pdf_path("nsrds-nbs-61-1")
    if not pdf.exists():
        pytest.skip("NBS index and PDF not available")
    text = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], check=True, capture_output=True, text=True).stdout
    entries, _ = build_nbs_index(text, registry.page_offset("nsrds-nbs-61-1"))
    return NbsMatcher(entries)


def _regenerate(name: str, dataset: Path, work_dir: Path, nbs: NbsMatcher) -> dict:
    config = load_config(dataset / "configs" / f"{name}.config.json")
    registry = SourceRegistry(dataset)
    image = render_page(
        registry.pdf_path(config.ref), config.pdf_page, cache_dir=work_dir / "renders", cache_stem=config.ref
    )
    mask = ink_mask(image)
    compounds = json.loads((dataset / "compounds.json").read_text(encoding="utf-8"))
    result = calibrate_binary(mask, config)
    return build_binary_system(config, image, mask, result, nbs, compounds, (image.shape[1], image.shape[0])).system


@pytest.mark.parametrize("name", _promoted_binaries())
def test_regenerated_file_matches(name, dataset, work_dir, nbs):
    output = json.loads((dataset / "configs" / f"{name}.config.json").read_text(encoding="utf-8"))["output"]
    old = json.loads((dataset / output).read_text(encoding="utf-8"))
    comparison = compare_systems(old, _regenerate(name, dataset, work_dir, nbs))
    assert comparison.differences == []
