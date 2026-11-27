"""Render the illustrative quench example used in docs/images/quench-fields-properties.png.

Simplified model (documented on the image itself): axisymmetric finite steel cylinder,
constant thermophysical properties, constant surface HTC, explicit finite differences;
final hardness from a toy t8/5 -> martensite fraction -> hardness map.
It is an illustration, not a validated prediction.

Run on the host (docs asset generation only; not part of the application test suite):
    python3 python/src/scripts/render_quench_example.py
    # or inside the python container:
    # docker compose run --rm python python src/scripts/render_quench_example.py
"""
from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap

OUT = Path(__file__).resolve().parents[3] / "docs" / "images" / "quench-fields-properties.png"

# Geometry (m) and grid
RADIUS = 0.025
HALF_HEIGHT = 0.045
DX = 0.0005
# Material and process (illustrative)
LAMBDA = 30.0          # W/m/K
RHO_CP = 4.0e6         # J/m3/K
ALPHA = LAMBDA / RHO_CP
HTC = 3500.0           # W/m2/K, water-salt-like intensity
T_START = 850.0
T_MEDIUM = 30.0
T_END_SIM = 120.0      # s
SNAPSHOTS = (4.0, 12.0)
T_800, T_500 = 800.0, 500.0
# Toy hardenability: t8/5 below T_LOW -> full martensite, above T_HIGH -> none
T85_LOW, T85_HIGH = 6.0, 22.0
HRC_MARTENSITE, HRC_SOFT = 62.0, 32.0

BG = "#0f1b2d"
FG = "#e8eef7"
ACCENT = "#7fd4ff"


def simulate():
    nr = int(RADIUS / DX) + 1
    nz = int(HALF_HEIGHT / DX) + 1
    r = np.arange(nr) * DX
    temp = np.full((nz, nr), T_START)
    dt = 0.2 * DX * DX / ALPHA
    n_steps = int(T_END_SIM / dt)
    r_safe = np.where(r == 0, DX, r)
    t85_start = np.full_like(temp, np.nan)
    t85_end = np.full_like(temp, np.nan)
    snaps: dict[float, np.ndarray] = {}
    probe_t, probe_surface, probe_core = [], [], []
    pending = sorted(SNAPSHOTS)
    for step in range(n_steps + 1):
        time = step * dt
        hot = (temp <= T_800) & np.isnan(t85_start)
        t85_start[hot] = time
        cold = (temp <= T_500) & np.isnan(t85_end)
        t85_end[cold] = time
        if pending and time >= pending[0]:
            snaps[pending.pop(0)] = temp.copy()
        if step % 25 == 0:
            probe_t.append(time)
            probe_surface.append(temp[nz // 2, -1])
            probe_core.append(temp[0, 0])
        lap_r = np.zeros_like(temp)
        lap_z = np.zeros_like(temp)
        lap_r[:, 1:-1] = (temp[:, 2:] - 2 * temp[:, 1:-1] + temp[:, :-2]) / DX**2 + (
            temp[:, 2:] - temp[:, :-2]
        ) / (2 * DX * r_safe[1:-1])
        lap_r[:, 0] = 4 * (temp[:, 1] - temp[:, 0]) / DX**2
        # surface node r = R: ghost node from convection BC
        ghost = temp[:, -2] - 2 * DX * HTC / LAMBDA * (temp[:, -1] - T_MEDIUM)
        lap_r[:, -1] = (ghost - 2 * temp[:, -1] + temp[:, -2]) / DX**2 + (ghost - temp[:, -2]) / (2 * DX * RADIUS)
        lap_z[1:-1, :] = (temp[2:, :] - 2 * temp[1:-1, :] + temp[:-2, :]) / DX**2
        lap_z[0, :] = 2 * (temp[1, :] - temp[0, :]) / DX**2  # symmetry plane z = 0
        ghost_z = temp[-2, :] - 2 * DX * HTC / LAMBDA * (temp[-1, :] - T_MEDIUM)
        lap_z[-1, :] = (ghost_z - 2 * temp[-1, :] + temp[-2, :]) / DX**2
        temp = temp + dt * ALPHA * (lap_r + lap_z)
    t85 = t85_end - t85_start
    return r, temp, snaps, t85, np.array(probe_t), np.array(probe_surface), np.array(probe_core)


def mirror(field: np.ndarray) -> np.ndarray:
    """Full axial cross-section from the quarter model (r >= 0, z >= 0)."""
    half = np.concatenate([field[:, :0:-1], field], axis=1)
    return np.concatenate([half[:0:-1, :], half], axis=0)


def style_axes(ax) -> None:
    ax.set_facecolor(BG)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)


def main() -> None:
    r, final_t, snaps, t85, probe_t, surf, core = simulate()
    martensite = np.clip((T85_HIGH - t85) / (T85_HIGH - T85_LOW), 0.0, 1.0)
    hardness = HRC_SOFT + (HRC_MARTENSITE - HRC_SOFT) * martensite
    extent = (-RADIUS * 1000, RADIUS * 1000, -HALF_HEIGHT * 1000, HALF_HEIGHT * 1000)

    plt.rcParams.update({"font.family": "DejaVu Sans", "text.color": FG, "axes.labelcolor": FG})
    fig = plt.figure(figsize=(16, 9), dpi=120, facecolor=BG)
    grid = fig.add_gridspec(2, 3, height_ratios=[3.6, 1.5], hspace=0.30, wspace=0.08, left=0.07, right=0.93, top=0.84, bottom=0.08)

    fig.text(0.04, 0.93, "Quenching a steel part: temperature field to final properties", fontsize=24, fontweight="bold", color=FG)
    fig.text(0.04, 0.885, "Illustrative example (simplified model: constant properties, constant HTC, toy hardenability)", fontsize=13, color=ACCENT)

    heat = "inferno"
    for i, (name, frame) in enumerate(snaps.items()):
        ax = fig.add_subplot(grid[0, i])
        style_axes(ax)
        im = ax.imshow(mirror(frame), extent=extent, origin="lower", cmap=heat, vmin=T_MEDIUM, vmax=T_START)
        ax.contour(np.linspace(extent[0], extent[1], 2 * len(r) - 1), np.linspace(extent[2], extent[3], mirror(frame).shape[0]),
                   mirror(frame), levels=[300, 500, 700], colors="white", linewidths=0.6, alpha=0.5)
        ax.set_title(f"Temperature at t = {name:g} s", fontsize=15, color=FG, pad=10)
        if i == 1:
            cax = fig.add_axes([0.065, 0.50, 0.012, 0.24])
            cb = fig.colorbar(im, cax=cax)
            cb.set_label("T, °C", color=FG, fontsize=11)
            cb.ax.yaxis.set_tick_params(color=FG, labelcolor=FG)
            cb.outline.set_edgecolor(BG)

    ax = fig.add_subplot(grid[0, 2])
    style_axes(ax)
    cmap = LinearSegmentedColormap.from_list("hard", ["#2b6cb0", "#38b2ac", "#f6e05e", "#ed8936", "#e53e3e"])
    im = ax.imshow(mirror(hardness), extent=extent, origin="lower", cmap=cmap, vmin=HRC_SOFT, vmax=HRC_MARTENSITE)
    ax.set_title("Final hardness (HRC) and martensite", fontsize=15, color=FG, pad=10)
    xs = np.linspace(extent[0], extent[1], 2 * len(r) - 1)
    ys = np.linspace(extent[2], extent[3], mirror(hardness).shape[0])
    cs = ax.contour(xs, ys, mirror(martensite), levels=[0.25, 0.5, 0.75], colors="white", linewidths=0.8)
    ax.clabel(cs, fmt=lambda v: f"{v * 100:.0f}% M", fontsize=9, colors="white")
    cax = fig.add_axes([0.935, 0.50, 0.012, 0.24])
    cb = fig.colorbar(im, cax=cax)
    cb.set_label("HRC", color=FG, fontsize=11)
    cb.ax.yaxis.set_tick_params(color=FG, labelcolor=FG)
    cb.outline.set_edgecolor(BG)

    ax = fig.add_subplot(grid[1, :2])
    ax.set_facecolor(BG)
    ax.plot(probe_t, surf, color="#63b3ed", lw=2.8, label="surface")
    ax.plot(probe_t, core, color="#f6ad55", lw=2.8, label="core")
    ax.axhspan(T_500, T_800, color="#ffffff", alpha=0.07)
    ax.text(T_END_SIM * 0.30, 640, "800 to 500 °C window: t8/5 sets the structure", color=FG, fontsize=11, alpha=0.85)
    ax.set_xlim(0, T_END_SIM)
    ax.set_ylim(0, T_START + 30)
    ax.set_xlabel("time, s", fontsize=12)
    ax.set_ylabel("temperature, °C", fontsize=12)
    ax.tick_params(colors=FG)
    for spine in ax.spines.values():
        spine.set_color("#2d3f5a")
    ax.grid(color="#2d3f5a", lw=0.6)
    ax.legend(facecolor=BG, edgecolor="#2d3f5a", labelcolor=FG, loc="center right", fontsize=12)

    ax = fig.add_subplot(grid[1, 2])
    ax.set_facecolor(BG)
    ax.axis("off")
    lines = [
        ("Pipeline", ACCENT, 15, "bold"),
        ("sourced data (HTC, CCT)", FG, 13, "normal"),
        ("   to temperature field T(x, y, z, t)", FG, 13, "normal"),
        ("   to phases (martensite, bainite)", FG, 13, "normal"),
        ("   to hardness, distortion, crack risk", FG, 13, "normal"),
    ]
    for k, (text, color, size, weight) in enumerate(lines):
        ax.text(0.0, 0.95 - k * 0.19, text, color=color, fontsize=size, fontweight=weight, transform=ax.transAxes)

    fig.savefig(OUT, facecolor=BG)
    mid = t85.shape[0] // 2
    print("wrote", OUT, f"core t8/5 = {t85[0, 0]:.1f} s, surface t8/5 = {t85[mid, -1]:.1f} s")
    print("hardness range", float(hardness.min()), float(hardness.max()))


if __name__ == "__main__":
    OUT.parent.mkdir(parents=True, exist_ok=True)
    main()
