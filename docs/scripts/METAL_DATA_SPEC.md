# Metal-data synthesis

**Purpose:** Turn OCR’d ASM Handbook Vol. 1 (and related) table dumps into one JSON file
per engineering alloy, grouped by metal group and (for steels / superalloys) family, then
evaluate thermal properties in the backend with natural cubic splines.

## Layout

| Role | Path |
|------|------|
| Raw tables (kept) | `shared/sources/metal-data/raw-tables/*.json` |
| Synthesized alloys | `shared/processed/metal-data/alloys/{group}/[family/]<id>.json` |
| Index / units / sources | `shared/processed/metal-data/{index,units,sources}.json` |
| Abu-Eishah join source | `shared/sources/metal-data/metal-conductivity-abu-eishah.json` |
| ASM chem-composition PDF | `shared/sources/steel/ASM Handbook - … Vol 01_chem_composition.pdf` |
| Chem-composition OCR reports | `tmp/reports/python/metal-data/asm-chem-composition/` |
| Reports | `tmp/reports/python/metal-data/{report,donor-fill,approximations,composition-gap-fill}.json` |
| Builder | `python/src/scripts/build_metal_data.py` (`metal_data` package) |
| Make | `make metal-data-build`, `make metal-data-test`, `make metal-data-asm-chem-{inventory,surya,parse}` |

### Composition gap fill (raw tables only)

From the ASM chem-composition PDF (tesseract inventory → Surya on gap pages → parse):

| New raw file | Handbook table | Printed pages |
|---|---|---|
| `tool_steel_composition.json` | Table 1 principal tool steels | 1166–1170 |
| `tool_steel_composition_obsolete.json` | Table 3 obsolete tool steels | 1171 |
| `stainless_heat_resistant_composition.json` | Table 1 wrought heat-resistant stainless | 1443–1445 |
| `former_sae_steel_composition.json` | Table 22 former SAE steels | 257–262 |

Each file includes `printed_pages` / `pdf_pages` and `ref: AsmHandbook2005Vol1`.
Residuals (ACI HA–HX cast chemistry; some commodity stainless grades not in the heat-resistant table; boron SAE letter grades; SAE 1052) are listed in `composition-gap-fill.json`.

Pure-metal Abu-Eishah λ correlations are **not** alloy records. The build joins them onto
matching element files under `shared/processed/compound-data/inorganic/<El>/` as `raw`
entries (`property: thermalConductivity`, `phase: solid`, `ref: AbuEishah2001`).

## Alloy record

```json
{
  "materialId": "sae-1008",
  "name": "1008",
  "group": "steel",
  "family": "carbon",
  "aliases": { "uns": "G10080", "sae": "1008" },
  "composition": { "C": 0.05, "Mn": 0.4 },
  "condition": "Annealed",
  "criticalTemperatures": {
    "Ac1_K": 992, "Ac3_K": 1138,
    "Ac1_C": 718, "Ac3_C": 865,
    "method": "Andrews1965", "ref": "Andrews1965"
  },
  "properties": {
    "thermalConductivity": {
      "unit": "W/(m·K)",
      "sources": ["thermal_conductivity.json"],
      "points": [{ "T_K": 373.15, "value": 57.8 }],
      "approximation": {
        "Tswitch": 1138,
        "low": {
          "type": "quadratic",
          "vars": { "a": 60.1, "b": -0.02, "c": 1e-5 },
          "min": 273.15,
          "max": 1138
        },
        "high": {
          "type": "linear",
          "vars": { "a": 12.4, "b": 0.012 },
          "min": 1138,
          "max": 1473.15
        },
        "meanRelPct": 0.31,
        "maxRelPct": 0.93
      }
    }
  },
  "sourceFiles": ["carbon_steel.json", "thermal_conductivity.json"],
  "provenance": {
    "donors": {
      "thermalConductivity": {
        "materialId": "sae-1020",
        "mode": "extend-outside-range",
        "why": "own approx covers … K; link scaled sae-1020 outside (same family carbon; ElMD=0.012, L1=0.42 wt% [ΔC=0.25%; ΔMn=0.17%])",
        "scale": 1.01,
        "error": { "rmse": 0.4, "maxRelPct": 1.2 },
        "compositionDistance": 0.012,
        "distanceMetric": "ElMD-mod_petti"
      }
    }
  }
}
```

IDs prefer `sae-<4digit>` / `aisi-<grade>` (SAE/AISI name); fall back to `uns-<code>` only when no SAE/AISI grade is known, else a trade-name slug. UNS stays in `aliases.uns` when available.

## Andrews Ac1 / Ac3 + property equations (steels)

From composition (wt%), Andrews (1965) [RefKey.Andrews1965]:

- \(\mathrm{Ac1}(°C)=723-10.7\,\mathrm{Mn}-16.9\,\mathrm{Ni}+29.1\,\mathrm{Si}+16.9\,\mathrm{Cr}+290\,\mathrm{As}+6.38\,\mathrm{W}\)
- \(\mathrm{Ac3}(°C)=910-203\sqrt{C}-15.2\,\mathrm{Ni}+44.7\,\mathrm{Si}+104\,\mathrm{V}+31.5\,\mathrm{Mo}+13.1\,\mathrm{W}\)

Stored on the alloy as `criticalTemperatures` (**integer** K/°C; formula uncertainty ~±10–20 °C).

For each steel property with **≥ 3 own points** (before donor fill), a short `approximation` in **compound-equation style** (like `type`/`vars`/`min`/`max`; no `def`/`ref` — these are our fits). **Policy differs by property**:

| Property | Model | `Tswitch` / `high` |
|---|---|---|
| `thermalConductivity` | Ac3 split (λ slope **flips**): **free linear on T>Tswitch first**, then quadratic ≤ Tswitch anchored at the join. Default `Tswitch` = Andrews Ac3; if that continuous fit fails the ≤10% gate, **move `Tswitch` to a measured knot near Ac3** (`switchMovedFromAc3_K`) | `Tswitch` integer K; `high` when ≥2 points above |
| `electricalResistivity` | Same split (ρₑ slope **softens** near ~800 °C) | same |
| `specificHeat` | `indenCp` magnetic peak | `Tswitch` = \(T_C\); no `high` |
| `thermalExpansion` / `density` | Single **quadratic** over all own points | **none** (no Ac3 `high` until austenite-side data) |

| Field | Content |
|---|---|
| `Tswitch` | Integer K when a switch exists (Ac3 for λ/ρₑ; Curie for Cp); omitted for single-curve props |
| `low` | `{ type, vars, min, max }` — see types below (**4 sig figs**) |
| `high` | For λ and ρₑ: `{ type: "linear", vars: {a,b}, min, max }` — LS on points above Ac3; low branch joins it at Ac3 |
| `meanRelPct` / `maxRelPct` | Relative error (%) vs own fit points, 2 decimals |

| `low.type` | Property | `vars` |
|---|---|---|
| `quadratic` / `linear` | λ, ρₑ (≤ Ac3); α, dens. (full span) | `a,b,c?` — \(a+bT+cT^2\) |
| `indenCp` | `specificHeat` | `a,b,c,Al,Ah,Tc` — base + Inden magnetic LRO/SRO in \(\tau=T/T_C\) ([57] Inden1981; see `docs/algorithms/metals/INDEN_SPECIFIC_HEAT.md`) |

Cp requires a detectable λ-peak; otherwise no approximation. Gate: `maxRelPct ≤ 10`. Backend list/eval still uses splines on `points`.

## Donor fill (sparse series)

Nearest neighbour: same family first, then group. Ranking distance is **ElMD**
(Element Mover’s Distance, `mod_petti` scale) on Fe-balanced atomic fractions
([59] `Hargreaves2020ElMD`; package `ElMD`). wt% → mole fractions → formula string;
missing Fe is filled as \(100-\Sigma\) when sum < 99.5 wt%.

Match note in `why` brackets:
`(same family tool; ElMD=0.031, L1=0.95 wt% [ΔCr=0.5%; ΔC=0.3%; ΔMn=0.15%])` —
ElMD is the ranking metric; L1 and per-element `|Δwt%|` (largest first) are diagnostics only.
Density not donor-filled.

**`points` are own measurements only — never a donor knot copy.** Donor is a link; consumers resolve the donor alloy and apply `scale` (default 1).

| Own situation | Mode |
|---|---|
| 0–1 points | `full-series` — link donor series (no scale) |
| ≥2 points, no passed approx | `scaled-series` — link + scale \(s\) from own anchors |
| ≥3 points with passed approx | `extend-outside-range` — link + scale; use donor×\(s\) only outside approx `[Tmin, Tmax]` |

Donor links live **only** under `provenance.donors.<property>` (not under each series):
`materialId`, `mode`, `why`, `compositionDistance` (ElMD), `distanceMetric` (`ElMD-mod_petti`),
`scale` (when used), `error` `{rmse, maxRelPct}`. No proof table.

## Backend evaluation

- Poly overrides `aisi_304` / `mild_steel` keep cubic λ/ε polynomials.
- All other IDs: `MetalDataset` loads the alloy file; `MetalSeriesPoints.effective` merges own points with donor×scale by mode; `cubicSpline` evaluates λ / Cp / CTE / ρ.
- Out-of-range T → `BadRequestException` (no extrapolation).
- Emissivity is defined only for the poly grades.

Refs: `AsmHandbook2005Vol1`, `AbuEishah2001`, `Andrews1965`, `Inden1981`, `Hargreaves2020ElMD`.
