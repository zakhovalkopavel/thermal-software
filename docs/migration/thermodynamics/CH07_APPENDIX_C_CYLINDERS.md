# CH07 Appendix C — Cylinder Correlations

**Back:** [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md)

Covers `FlowGeometry` values: `CYLINDER_CROSSFLOW`, `ELLIPTICAL_CYLINDER`,
`HORIZONTAL_CYLINDER`, `CONCENTRIC_CYLINDERS`.

---

## CYLINDER_CROSSFLOW — forced convection

`D` = outer diameter. Properties at film temperature T_f = (T_∞ + T_s)/2.

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `churchill_bernstein` *(default)* | blended form — see §A4 below | all Re, Re·Pr^0.5 > 0.2 | Churchill & Bernstein (1977) |
| `hilpert` | `Nu = C·Re_D^m·Pr^(1/3)` — C, m from table below | 0.4 ≤ Re ≤ 4×10⁵, Pr ≥ 0.7 | Incropera §7.4; Cengel §7-3 |
| `whitaker_cylinder` | `Nu = (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25` | 10 ≤ Re ≤ 1.5×10⁵, 0.65 ≤ Pr ≤ 300 | Whitaker (1972) — see §W3 |

**Default:** `churchill_bernstein` — widest validity, single smooth equation, no piecewise table.

### Hilpert constants

| Re | C | m |
|---|---|---|
| 0.4–4 | 0.989 | 0.330 |
| 4–40 | 0.911 | 0.385 |
| 40–4000 | 0.683 | 0.466 |
| 4000–40000 | 0.193 | 0.618 |
| 40000–400000 | 0.027 | 0.805 |

---

## ELLIPTICAL_CYLINDER — forced convection

`Nu = C·Re_a^m·Pr^(1/3)`, C and m from Owen (1952); tabulated in VDI F5.
Use major axis `a` for characteristic length.

---

## HORIZONTAL_CYLINDER — natural convection

`D` = diameter.

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `morgan` *(default)* | `Nu = C·Ra_D^n` — C, n from table below | 10⁻¹⁰ ≤ Ra ≤ 10¹² | Incropera §9.6; Morgan (1975) |
| `churchill_chu_horizontal` | full blended form — see §A6 below | 10⁻⁵ ≤ Ra ≤ 10¹², all Pr | Churchill & Chu (1975b) |

### Morgan range table

| Ra_D | C | n |
|---|---|---|
| 10⁻¹⁰–10⁻² | 0.675 | 0.058 |
| 10⁻²–10² | 1.02 | 0.148 |
| 10²–10⁴ | 0.850 | 0.188 |
| 10⁴–10⁷ | 0.480 | 0.250 |
| 10⁷–10¹² | 0.125 | 0.333 |

**Default:** `morgan`. Use `churchill_chu_horizontal` when a smooth, differentiable function
is required (avoids discontinuities at range boundaries).

---

## CONCENTRIC_CYLINDERS — natural convection

**Raithby–Hollands** — Incropera §9.7:

```
k_eff/k = 0.386·(Pr/(0.861+Pr))^(1/4)·Ra_c^(1/4)

Ra_c = (ln(D_o/D_i))^4 / (r_i^(−3/5) + r_o^(−3/5))^5 · Ra_δ

q' = 2π·k_eff·ΔT / ln(D_o/D_i)   [W/m]
```

`δ = (D_o − D_i)/2`, `Ra_δ = g·β·ΔT·δ³/(ν·α)`.

**`CorrelationName`:** `'raithby_hollands_cylinders'`

---

## §A4 — Churchill & Bernstein (1977): Cylinder in crossflow

**Paper:** S.W. Churchill & M. Bernstein, "A correlating equation for forced convection from
gases and liquids to a circular cylinder in cross flow,"
*Journal of Heat Transfer*, 99(2):300–306, 1977 — Eq.(1), page 300.

```
Nu_D = 0.3 +  0.62·Re_D^(1/2)·Pr^(1/3)                     ·  [1 + (Re_D/282000)^(5/8)]^(4/5)
              ─────────────────────────────────
              [1 + (0.4/Pr)^(2/3)]^(1/4)
```

**Validity:** Re·Pr^0.5 ≥ 0.2, all Re (tested Re = 1 to 5×10⁵), all Pr.
Properties at film temperature T_f = (T_∞ + T_s)/2.

**Exponent precision:** `(5/8)` and `(4/5)` — not 0.625 or 0.8.

**High-Re note:** The `[1+(Re/282000)^(5/8)]^(4/5)` term adds 20–30% for Re > 2×10⁵ due to
boundary-layer transition. Authors state this term is "essential for Re > 10⁵."

> ⚠️ Coefficient `0.4` in `(0.4/Pr)^(2/3)` is correct. Some editions of Cengel use 0.53 —
> that is the older Morgan form, not Churchill.

**`CorrelationName`:** `'churchill_bernstein'`  **`FlowGeometry`:** `CYLINDER_CROSSFLOW`

---

## §A6 — Churchill & Chu (1975b): Horizontal cylinder, natural convection

**Paper:** S.W. Churchill & H.H.S. Chu, "Correlating equations for laminar and turbulent free
convection from a horizontal cylinder,"
*Int. J. Heat Mass Transfer*, 18(9):1049–1053, 1975 — Eq.(1), page 1049.

```
Nu_D = [ 0.60 + 0.387·Ra_D^(1/6) / (1+(0.559/Pr)^(9/16))^(8/27) ]²
```

**Validity:** 10⁻⁵ ≤ Ra_D ≤ 10¹², All Pr.

**Key distinctions from vertical plate (Appendix B §A5):**

| Coefficient | Vertical plate (§A5 Eq.2) | Horizontal cylinder (§A6) |
|---|---|---|
| Outer bracket constant | **0.825** | **0.60** |
| Pr-group constant | **0.492** | **0.559** |

These are **not** interchangeable — different geometry, different empirical fit.

**`CorrelationName`:** `'churchill_chu_horizontal'`  **`FlowGeometry`:** `HORIZONTAL_CYLINDER`

---

## §W3 — Whitaker (1972): Cylinder in crossflow

**Paper:** Whitaker (1972) AIChE — Eq.(7), page 365.

```
Nu_D = (0.4·Re_D^(1/2) + 0.06·Re_D^(2/3))·Pr^0.4·(μ/μ_s)^(1/4)
```

**Validity:** 10 ≤ Re_D ≤ 1.5×10⁵, 0.65 ≤ Pr ≤ 300, 1.0 ≤ (μ/μ_s) ≤ 5.2.

Properties at free-stream temperature. μ_s at surface temperature.

Identical functional form to `whitaker_flat_plate` (§W2) — Whitaker notes both geometries
transition from laminar to turbulent separation in the same Re range.

**`CorrelationName`:** `'whitaker_cylinder'`  **`FlowGeometry`:** `CYLINDER_CROSSFLOW`

