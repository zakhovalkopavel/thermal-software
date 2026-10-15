"""
phase_diagrams.output.isotherm_draft_comparison — Detected isotherms against the isotherm entries of a curves config.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Isotherm detection
"""
from __future__ import annotations

import numpy as np

from phase_diagrams.models.detected_isotherm import DetectedIsotherm

_SAMPLE_PX = 5.0
_ON_PX = 8.0
_DETECTED_ON_SHARE = 0.6


def compare_isotherm_draft(
    detected: list[DetectedIsotherm],
    entries: list[dict],
    origin: tuple[float, float] = (0.0, 0.0),
) -> tuple[list[dict], list[int]]:
    """Per config isotherm entry (``startPixel``, ``waypoints``, ``endPixel``; stored pixels + ``origin``
    = page pixels): the detected pieces of the same field lying on it (≥ 60 % of the piece within
    8 px of the entry's polyline), the share of the entry they cover (entry samples every 5 px within
    8 px of a piece) and whether their temperatures agree. Returns those rows and the indices of the
    detected pieces on no entry (isotherms the config lacks, or false detections).
    """
    rows = []
    used: set[int] = set()
    for entry in entries:
        line = np.array([_page(entry["startPixel"], origin)]
                        + [_page(w["pixel"] if isinstance(w, dict) else w, origin) for w in entry.get("waypoints", [])]
                        + [_page(entry["endPixel"], origin)], float)
        samples = _densify(line)
        covered = np.zeros(len(samples), bool)
        matches = []
        for k, piece in enumerate(detected):
            if piece.field != entry["field"]:
                continue
            own = _densify(np.array(piece.pixels, float))
            if (_distances(own, line) <= _ON_PX).mean() < _DETECTED_ON_SHARE:
                continue
            matches.append(k)
            used.add(k)
            covered |= _distances(samples, np.array(piece.pixels, float)) <= _ON_PX
        temperatures = sorted({detected[k].temperature_C for k in matches if detected[k].temperature_C is not None})
        rows.append({
            "field": entry["field"],
            "temperature_C": entry["temperature_C"],
            "part": entry.get("part", 1),
            "pieces": matches,
            "coverage": float(covered.mean()) if len(samples) else 0.0,
            "detected_C": temperatures,
            "agrees": bool(temperatures) and temperatures == [entry["temperature_C"]],
        })
    return rows, [k for k in range(len(detected)) if k not in used]


def _page(pixel, origin) -> tuple[float, float]:
    return float(pixel[0]) + origin[0], float(pixel[1]) + origin[1]


def _densify(line: np.ndarray) -> np.ndarray:
    if len(line) < 2:
        return line
    lengths = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(line, axis=0), axis=1))])
    at = np.linspace(0.0, lengths[-1], max(2, int(lengths[-1] / _SAMPLE_PX) + 1))
    return np.column_stack([np.interp(at, lengths, line[:, 0]), np.interp(at, lengths, line[:, 1])])


def _distances(points: np.ndarray, line: np.ndarray) -> np.ndarray:
    """Distance of each point to the polyline ``line``."""
    if len(line) < 2:
        return np.linalg.norm(points - line[0], axis=1)
    a, b = line[:-1], line[1:]
    seg = b - a
    span = np.maximum((seg ** 2).sum(axis=1), 1e-12)
    rel = points[:, None, :] - a[None, :, :]
    t = np.clip((rel * seg[None]).sum(axis=2) / span[None], 0.0, 1.0)
    feet = a[None] + t[..., None] * seg[None]
    return np.linalg.norm(points[:, None, :] - feet, axis=2).min(axis=1)
