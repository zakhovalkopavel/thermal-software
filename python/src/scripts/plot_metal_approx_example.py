#!/usr/bin/env python3
"""One-page visualisation: points, short Ac3 quadratic approx, donor original + scaled."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Optional

import matplotlib.pyplot as plt
import numpy as np


PROPS = (
    ("thermalConductivity", "Thermal conductivity λ"),
    ("specificHeat", "Specific heat Cp"),
    ("thermalExpansion", "Thermal expansion α"),
    ("electricalResistivity", "Electrical resistivity ρ"),
)


def _approx_curve(approx: dict[str, Any], t: np.ndarray, _points: list[dict[str, float]]) -> np.ndarray:
    from metal_data.approximation import eval_approximation

    return np.asarray([eval_approximation(approx, float(ti)) for ti in t], dtype=float)


def _load_alloy(root: Path, material_id: str) -> dict[str, Any]:
    index = json.loads((root / "index.json").read_text(encoding="utf-8"))
    meta = index["materials"][material_id]
    return json.loads((root / meta["path"]).read_text(encoding="utf-8"))


def _plot_property(
    ax: plt.Axes,
    title: str,
    series: dict[str, Any],
    donor: Optional[dict[str, Any]],
    donor_alloy: Optional[dict[str, Any]],
    prop: str,
) -> None:
    points = series.get("points") or []
    t_pts = np.asarray([p["T_K"] for p in points], dtype=float)
    y_pts = np.asarray([p["value"] for p in points], dtype=float)
    approx = series.get("approximation")

    t_min = float(np.min(t_pts)) if len(t_pts) else 273.15
    t_max = float(np.max(t_pts)) if len(t_pts) else 1273.15
    if approx:
        t_min = min(t_min, float(approx["low"]["min"]))
        high = approx.get("high")
        t_max = max(t_max, float(high["max"] if isinstance(high, dict) else approx["low"]["max"]))
    if donor and donor_alloy:
        d_pts = ((donor_alloy.get("properties") or {}).get(prop) or {}).get("points") or []
        if d_pts:
            t_min = min(t_min, min(p["T_K"] for p in d_pts))
            t_max = max(t_max, max(p["T_K"] for p in d_pts))

    t_line = np.linspace(t_min, t_max, 400)
    if approx:
        t_line = np.unique(np.sort(np.append(t_line, float(approx["Tswitch"]))))

    if donor and donor_alloy:
        d_pts = ((donor_alloy.get("properties") or {}).get(prop) or {}).get("points") or []
        if d_pts:
            dt = np.asarray([p["T_K"] for p in d_pts], dtype=float)
            dy = np.asarray([p["value"] for p in d_pts], dtype=float)
            order = np.argsort(dt)
            dt, dy = dt[order], dy[order]
            ax.plot(dt, dy, color="#9aa0a6", linestyle="--", linewidth=1.6, label=f"donor original ({donor['materialId']})")
            if donor.get("scale") is not None:
                ax.plot(
                    dt,
                    dy * float(donor["scale"]),
                    color="#e8710a",
                    linestyle="-.",
                    linewidth=1.8,
                    label=f"donor scaled (s={float(donor['scale']):.4g})",
                )

    if approx:
        y_approx = _approx_curve(approx, t_line, points)
        low_eq = approx["low"].get("type", "?")
        high = approx.get("high")
        switch_name = "Tc" if low_eq == "indenCp" else "Ac3"
        label = f"{low_eq}"
        if isinstance(high, dict):
            label = f"{low_eq}/{high.get('type')}"
        t0 = float(approx["low"]["min"])
        t1 = float(high["max"] if isinstance(high, dict) else approx["low"]["max"])
        ax.plot(
            t_line,
            y_approx,
            color="#1a73e8",
            linewidth=2.0,
            label=label,
        )
        ax.axvspan(t0, t1, color="#1a73e8", alpha=0.06, label="validity")
        ax.axvline(
            approx["Tswitch"],
            color="#d93025",
            linestyle=":",
            linewidth=1.4,
            label=f"{switch_name}={approx['Tswitch']} K",
        )

    if approx and donor:
        t0 = float(approx["low"]["min"])
        high = approx.get("high")
        t1 = float(high["max"] if isinstance(high, dict) else approx["low"]["max"])
        own_mask = (t_pts >= t0 - 1e-9) & (t_pts <= t1 + 1e-9)
        ax.scatter(t_pts[own_mask], y_pts[own_mask], s=36, color="#202124", zorder=4, label="own / in-window")
        ext = ~own_mask
        if np.any(ext):
            ax.scatter(
                t_pts[ext],
                y_pts[ext],
                s=42,
                facecolors="none",
                edgecolors="#e8710a",
                linewidths=1.6,
                zorder=4,
                label="scaled exterior",
            )
    else:
        ax.scatter(t_pts, y_pts, s=36, color="#202124", zorder=4, label="tabulated points")

    if donor and donor.get("why"):
        err = donor.get("error") or {}
        note = donor["why"]
        if donor.get("scale") is not None:
            note += f"\ns={donor['scale']:.4g}"
        if err.get("maxRelPct") is not None:
            note += f", maxRel={err['maxRelPct']:.2f}%"
        ax.text(0.02, 0.02, note, transform=ax.transAxes, fontsize=6, va="bottom", ha="left", color="#5f6368")

    ax.set_title(title, fontsize=11)
    ax.set_xlabel("T (K)")
    ax.set_ylabel(series.get("unit", ""))
    ax.grid(True, alpha=0.25)
    handles, labels = ax.get_legend_handles_labels()
    seen: set[str] = set()
    uniq_h, uniq_l = [], []
    for h, lab in zip(handles, labels):
        if lab in seen:
            continue
        seen.add(lab)
        uniq_h.append(h)
        uniq_l.append(lab)
    ax.legend(uniq_h, uniq_l, fontsize=7, loc="best")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--material-id", default="sae-1025")
    parser.add_argument("--metal-data-root", type=Path, default=Path("/app/shared/processed/metal-data"))
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("/app/reports/metal-data/sae-1025-approximation.png"),
    )
    args = parser.parse_args()

    alloy = _load_alloy(args.metal_data_root, args.material_id)
    crit = alloy.get("criticalTemperatures")
    donors = ((alloy.get("provenance") or {}).get("donors") or {})
    donor_ids = {d.get("materialId") for d in donors.values() if d.get("materialId")}
    donor_alloys = {mid: _load_alloy(args.metal_data_root, mid) for mid in donor_ids if mid}

    fig, axes = plt.subplots(2, 2, figsize=(14, 10), constrained_layout=True)
    ac = ""
    if crit:
        ac = f"  |  Ac1={crit['Ac1_C']}°C  Ac3={crit['Ac3_C']}°C (Andrews)"
    fig.suptitle(f"{args.material_id}: short quadratic ≤ Ac3 · donor{ac}", fontsize=13)

    for ax, (prop, title) in zip(axes.ravel(), PROPS):
        series = (alloy.get("properties") or {}).get(prop)
        if not series:
            ax.set_title(f"{title} (missing)")
            ax.axis("off")
            continue
        donor_meta = donors.get(prop) or {}
        donor_alloy = donor_alloys.get(donor_meta.get("materialId") or "")
        _plot_property(ax, title, series, donor_meta or None, donor_alloy, prop)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(args.out, dpi=160)
    plt.close(fig)
    print(f"wrote {args.out}")


if __name__ == "__main__":
    main()
