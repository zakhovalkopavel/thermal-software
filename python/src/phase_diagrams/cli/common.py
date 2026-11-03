"""Shared helpers for the phase-diagram extraction CLI."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from phase_diagrams import (
    LineScale,
    NbsEntry,
    NbsMatcher,
    compare_systems,
    load_config,
    measure_line_scale,
    render_page,
)
from phase_diagrams.config.source_registry import SourceRegistry

_ATLAS = "slag-atlas-1995"
_NBS = "nsrds-nbs-61-1"
# Public aliases used by newer call sites.
ATLAS = _ATLAS
NBS = _NBS

_HOST_REPORTS = Path("tmp/reports/python")


def _say(command: str, message: str) -> None:
    print(f"[{command}] {message}", flush=True)


def _page_image(registry: SourceRegistry, work: Path, ref: str, page: int):
    return render_page(registry.pdf_path(ref), page, dpi=400, cache_dir=work / "renders", cache_stem=ref)


def _host(path: Path) -> str:
    """Path from the repository root; compose.yml mounts ./tmp/reports/python at the container's reports/."""
    return str(_HOST_REPORTS.joinpath(*path.parts[1:])) if path.parts and path.parts[0] == "reports" else str(path)


def _line_scale(command: str, mask: np.ndarray, line_width_px: float | None) -> LineScale:
    """Pixel scale of the page: ``lineWidth_px`` from the config, else measured on ``mask``."""
    scale = LineScale(line_width_px, "config") if line_width_px else measure_line_scale(mask)
    _say(command, f"line width {scale.line_px:g} px ({scale.source}) → pixel tolerances × {scale.factor:g}")
    return scale


def _load_nbs(work: Path, dataset: Path | None = None) -> NbsMatcher | None:
    """Load Table I entries: prefer ``dataset/nbs/``, fall back to working ``nbs/``."""
    candidates = []
    if dataset is not None:
        candidates.append(dataset / "nbs" / f"{_NBS}.entries.json")
    candidates.append(work / "nbs" / f"{_NBS}.entries.json")
    path = next((p for p in candidates if p.is_file()), None)
    if path is None:
        return None
    return NbsMatcher([NbsEntry.from_dict(e) for e in json.loads(path.read_text(encoding="utf-8"))])


def _target(dataset: Path, system: str) -> str:
    """Dataset-relative path of the system file a config writes (binary output or ternary system file)."""
    binary = dataset / "configs" / f"{system}.config.json"
    if binary.exists():
        return load_config(binary).output
    curves = dataset / "configs" / f"{system}.curves.config.json"
    if curves.exists():
        return load_config(curves).system_file
    raise FileNotFoundError(f"no config for '{system}' in {dataset / 'configs'}")


def _candidate(work: Path, relative: str) -> Path:
    return work / "candidates" / Path(relative).name


def _comparison_lines(dataset: Path, relative: str, candidate_text: str) -> list[str]:
    current = dataset / relative
    if not current.exists():
        return [f"new system: {relative} not in the dataset yet"]
    comparison = compare_systems(json.loads(current.read_text(encoding="utf-8")), json.loads(candidate_text))
    return [f"vs {relative}: {line}" for line in comparison.lines()]


def _write_candidate(command: str, dataset: Path, work: Path, relative: str, text: str, review: Path) -> None:
    candidate = _candidate(work, relative)
    candidate.parent.mkdir(parents=True, exist_ok=True)
    candidate.write_text(text, encoding="utf-8")
    _say(command, f"candidate → {candidate}")
    lines = _comparison_lines(dataset, relative, text)
    for line in lines:
        _say(command, line)
    with review.open("a", encoding="utf-8") as handle:
        handle.write("\n## Comparison with the dataset file\n\n" + "".join(f"- {line}\n" for line in lines))
