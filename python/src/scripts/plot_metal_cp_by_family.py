#!/usr/bin/env python3
"""Cp vs T: one page per steel family, 4 alloys each (points + indenCp when present).

Writes a multipage PDF under reports/metal-data/.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.backends.backend_pdf import PdfPages

from metal_data.approximation import eval_approximation

PROP = "specificHeat"
N_PER_FAMILY = 4


def _load_index(root: Path) -> dict[str, Any]:
    return json.loads((root / "index.json").read_text(encoding="utf-8"))


def _load_alloy(root: Path, rel_path: str) -> dict[str, Any]:
    return json.loads((root / rel_path).read_text(encoding="utf-8"))


def _pick_steels(root: Path, index: dict[str, Any]) -> dict[str, list[tuple[str, dict[str, Any]]]]:
    """Best Cp-bearing steels per family: prefer indenCp, then more points, then sharper peak."""
    by_fam: dict[str, list[tuple[tuple, str, dict[str, Any]]]] = defaultdict(list)
    for mid, meta in index.get("materials", {}).items():
        if meta.get("group") != "steel":
            continue
        alloy = _load_alloy(root, meta["path"])
        series = (alloy.get("properties") or {}).get(PROP)
        points = (series or {}).get("points") or []
        if len(points) < 3:
            continue
        ys = [float(p["value"]) for p in points]
        med = sorted(ys)[len(ys) // 2] or 1.0
        peak_ratio = max(ys) / med
        has_inden = (series.get("approximation") or {}).get("low", {}).get("type") == "indenCp"
        key = (0 if has_inden else 1, -len(points), -peak_ratio, mid)
        by_fam[meta.get("family") or "_"].append((key, mid, alloy))

    picked: dict[str, list[tuple[str, dict[str, Any]]]] = {}
    for fam, rows in sorted(by_fam.items()):
        rows.sort(key=lambda r: r[0])
        picked[fam] = [(mid, alloy) for _, mid, alloy in rows[:N_PER_FAMILY]]
    return picked


def _plot_cp(ax: plt.Axes, material_id: str, alloy: dict[str, Any]) -> None:
    series = (alloy.get("properties") or {}).get(PROP) or {}
    points = series.get("points") or []
    t_pts = np.asarray([p["T_K"] for p in points], dtype=float)
    y_pts = np.asarray([p["value"] for p in points], dtype=float)
    approx = series.get("approximation")

    t_min = float(np.min(t_pts)) if len(t_pts) else 273.15
    t_max = float(np.max(t_pts)) if len(t_pts) else 1273.15
    if approx:
        t_min = min(t_min, float(approx["low"]["min"]))
        t_max = max(t_max, float(approx["low"]["max"]))

    ax.scatter(t_pts, y_pts, s=22, color="#202124", zorder=4, label="points")

    if approx:
        t_line = np.linspace(t_min, t_max, 300)
        t_line = np.unique(np.sort(np.append(t_line, float(approx["Tswitch"]))))
        y_line = np.asarray([eval_approximation(approx, float(t)) for t in t_line])
        eq = approx["low"].get("type", "?")
        ax.plot(t_line, y_line, color="#1a73e8", linewidth=1.8, label=eq)
        ax.axvline(
            approx["Tswitch"],
            color="#d93025",
            linestyle=":",
            linewidth=1.2,
            label=f"Tc={approx['Tswitch']} K",
        )
        err = approx.get("maxRelPct")
        subtitle = f"{material_id}  ·  {eq}"
        if err is not None:
            subtitle += f"  maxRel={err:.2f}%"
    else:
        subtitle = f"{material_id}  ·  points only"

    crit = alloy.get("criticalTemperatures") or {}
    if crit.get("Ac3_K") is not None:
        ax.axvline(crit["Ac3_K"], color="#9334e6", linestyle="--", linewidth=1.0, alpha=0.7, label=f"Ac3={crit['Ac3_K']} K")

    ax.set_title(subtitle, fontsize=9)
    ax.set_xlabel("T (K)", fontsize=8)
    ax.set_ylabel(series.get("unit", "J/(kg·K)"), fontsize=8)
    ax.grid(True, alpha=0.25)
    ax.tick_params(labelsize=7)
    ax.legend(fontsize=6, loc="best")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--metal-data-root", type=Path, default=Path("/app/shared/processed/metal-data"))
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("/app/reports/metal-data/cp-by-steel-family.pdf"),
    )
    args = parser.parse_args()

    index = _load_index(args.metal_data_root)
    picked = _pick_steels(args.metal_data_root, index)
    if not picked:
        raise SystemExit("no steel Cp series found")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with PdfPages(args.out) as pdf:
        for fam, steels in picked.items():
            fig, axes = plt.subplots(2, 2, figsize=(11, 8.5), constrained_layout=True)
            fig.suptitle(f"Steel family “{fam}” — specific heat Cp (up to 4 alloys)", fontsize=12)
            for ax in axes.ravel():
                ax.axis("off")
            for ax, (mid, alloy) in zip(axes.ravel(), steels):
                ax.axis("on")
                _plot_cp(ax, mid, alloy)
            for ax in axes.ravel()[len(steels) :]:
                ax.set_visible(False)
            pdf.savefig(fig, dpi=140)
            plt.close(fig)

    print(f"wrote {args.out} ({len(picked)} pages, {N_PER_FAMILY} alloys/family)")


if __name__ == "__main__":
    main()
