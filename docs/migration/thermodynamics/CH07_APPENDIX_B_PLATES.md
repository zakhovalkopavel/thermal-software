# CH07 Appendix B — Plate and Vertical Surface Correlations

**Back:** [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md)

Covers `FlowGeometry` values: `FLAT_PLATE`, `FLAT_PLATE_ROUGH`, `VERTICAL_PLATE`,
`VERTICAL_CYLINDER`, `HORIZONTAL_PLATE_HOT_UP`, `HORIZONTAL_PLATE_HOT_DOWN`, `INCLINED_PLATE`.

---

## FLAT_PLATE — forced convection

`L` = plate length in flow direction. Properties at film temperature T_f = (T_∞ + T_s)/2.

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `flat_plate_laminar` | `Nu_L = 0.664·Re_L^0.5·Pr^(1/3)` | Re_L ≤ 5×10⁵, Pr ≥ 0.6 (avg over L) | Incropera §7.2 (Blasius) |
| `flat_plate_turbulent` | `Nu_L = 0.037·Re_L^0.8·Pr^(1/3)` | Re_L > 5×10⁵, Pr ≥ 0.6 (avg over L) | Incropera §7.2 |
| `flat_plate_mixed` | `Nu_L = (0.037·Re_L^0.8 − 871)·Pr^(1/3)` | Re_L > 5×10⁵, mixed BL, Pr ≥ 0.6 | Incropera §7.2 |
| `churchill_ozoe` | blended form — see §A3 below | any Re_L, any Pr | Churchill & Ozoe (1973) |
| `whitaker_flat_plate` | `Nu = (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25` | 4×10⁴ ≤ Re ≤ 3×10⁵, 0.7 ≤ Pr ≤ 400 | Whitaker (1972) — see §W2 |

**Default selection:**
- Re_L ≤ 5×10⁵ → `flat_plate_laminar`
- Re_L > 5×10⁵ → `flat_plate_mixed`
- Pr < 0.05 or Pr > 50 → prefer `churchill_ozoe` (handles all Pr)

---

## VERTICAL_PLATE / VERTICAL_CYLINDER — natural convection

> ⚠️ Both formulas taken verbatim from
> [`recuperator.js:819`](../../../legacy/scripts/recuperator.js#L819)–[`:820`](../../../legacy/scripts/recuperator.js#L820).
> The boundary **Ra = 10⁹** must not change.

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `churchill_chu_laminar` | `Nu = 0.68 + 0.670·Ra_L^(1/4) / (1+(0.492/Pr)^(9/16))^(4/9)` | Ra ≤ 10⁹, all Pr | [recuperator.js:819](../../../legacy/scripts/recuperator.js#L819); Churchill & Chu (1975a) Eq.(1) — see §A5 |
| `churchill_chu_all_ra` | `Nu = (0.825 + 0.387·Ra_L^(1/6) / (1+(0.492/Pr)^(9/16))^(8/27))²` | 10⁻¹ ≤ Ra ≤ 10¹², all Pr | [recuperator.js:820](../../../legacy/scripts/recuperator.js#L820); Churchill & Chu (1975a) Eq.(2) — see §A5 |
| `churchill_chu` *(auto)* | Ra < 10⁹ → `_laminar`; Ra ≥ 10⁹ → `_all_ra` | all Ra | legacy default |

**Vertical cylinder criterion** (from legacy):
Use vertical plate correlations when `D/L ≥ 35/Gr_L^(1/4)` — boundary layer thin relative to D.

---

## HORIZONTAL_PLATE_HOT_UP / HOT_DOWN — natural convection

`L_c = A_s / P` (surface area / perimeter).

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `mcadams_hot_up` | `Nu = 0.54·Ra^(1/4)` | 10⁴ ≤ Ra ≤ 10⁷ | Incropera §9.7 |
| `mcadams_hot_up` | `Nu = 0.15·Ra^(1/3)` | 10⁷ ≤ Ra ≤ 10¹¹ | Incropera §9.7 |
| `mcadams_hot_down` | `Nu = 0.27·Ra^(1/4)` | 10⁵ ≤ Ra ≤ 10¹¹ | Incropera §9.7 |

Auto-selects between the two McAdams-hot-up ranges by Ra value.

---

## INCLINED_PLATE — natural convection

**Churchill (1977) g_eff method:**

```
g_eff = g·cos(θ)       (θ = angle from vertical; 0° = vertical, 90° = horizontal)
```

Apply vertical plate correlations (`churchill_chu`) with `g_eff` in place of `g`.

**Applicability:**
- θ ≤ 60°, lower surface heated → `g_eff = g·cos(θ)` accurate
- θ ≤ 45°, upper surface heated → `g_eff = g·cos(θ)` acceptable
- θ > 45°, upper surface heated → use horizontal plate correlations (longitudinal rolls develop)
- θ > 60° → treat as horizontal regardless

**`CorrelationName`:** `'churchill_inclined'`

See §A7 for paper citation.

---

## §A3 — Churchill & Ozoe (1973): Flat plate, all Re and Pr

**Paper:** S.W. Churchill & H. Ozoe, "Correlations for laminar forced convection with uniform
heating in flow over a plate …" *Journal of Heat Transfer*, 95(1):78–84, 1973.

### Uniform wall temperature (UWT) — Eq.(2), page 79

```
Nu_x = 0.3387·Re_x^(1/2)·Pr^(1/3) / [ 1 + (0.0468/Pr)^(2/3) ]^(1/4)

Nu_L = 0.6774·Re_L^(1/2)·Pr^(1/3) / [ 1 + (0.0468/Pr)^(2/3) ]^(1/4)   (average)
```

### Uniform heat flux (UHF) — Eq.(4), page 80

```
Nu_x = 0.4637·Re_x^(1/2)·Pr^(1/3) / [ 1 + (0.0207/Pr)^(2/3) ]^(1/4)
```

> ⚠️ UHF coefficient **0.4637** and denominator constant **0.0207** differ substantially
> from UWT. Most textbooks omit the UHF form entirely.

**Validity:** All Re_x (laminar boundary layer, Re_x < 5×10⁵), All Pr > 0.  
For Pr → 0: `Nu → 0.565·(Re·Pr)^0.5`. For Pr → ∞: `Nu → 0.3387·Re^0.5·Pr^(1/3)`.

**`CorrelationName`:** `'churchill_ozoe'`  **`FlowGeometry`:** `FLAT_PLATE`

---

## §A5 — Churchill & Chu (1975a): Vertical plate / cylinder, natural convection

**Paper:** S.W. Churchill & H.H.S. Chu, "Correlating equations for laminar and turbulent free
convection from a vertical plate," *Int. J. Heat Mass Transfer*, 18(11):1323–1329, 1975.

### Equation (1) — preferred for Ra ≤ 10⁹ (laminar)

```
Nu_L = 0.68 +  0.670·Ra_L^(1/4) / [ 1 + (0.492/Pr)^(9/16) ]^(4/9)
```

Coefficient **0.670** — not 0.67 (Churchill writes 0.670 in paper).

### Equation (2) — valid for all Ra

```
Nu_L = [ 0.825 + 0.387·Ra_L^(1/6) / (1+(0.492/Pr)^(9/16))^(8/27) ]²
```

**Validity:** 10⁻¹ ≤ Ra ≤ 10¹², All Pr. Authors recommend Eq.(1) for Ra < 10⁹; Eq.(2) required for Ra > 10⁹.

### UHF boundary condition variant

Replace `0.492` with `0.437` in both equations (Churchill & Chu (1975a) Table 1, page 1326).
Most textbooks only show the UWT form.

---

## §A7 — Churchill (1977): Inclined plate, natural convection

**Method:** Replace `g` with `g·cos(θ)` in Ra and Gr, then apply §A5 vertical plate correlations.

**Paper:** S.W. Churchill, "A comprehensive correlating equation for buoyancy-induced flow in
channels," *AIChE Journal*, 22(3):543–545, 1977.

The `cos(θ)` substitution is exact only for the lower (stable, heated) surface.
For the upper (unstable) surface above 45°, it underpredicts Nu — use horizontal plate instead.

---

## §W2 — Whitaker (1972): Flat plate, external forced flow

**Paper:** Whitaker (1972) AIChE — Eq.(5), page 364.

```
Nu_L = (0.4·Re_L^(1/2) + 0.06·Re_L^(2/3))·Pr^0.4·(μ/μ_s)^(1/4)
```

**Validity:** 4×10⁴ ≤ Re_L ≤ 3×10⁵, 0.7 ≤ Pr ≤ 400, 1.0 ≤ (μ/μ_s) ≤ 3.4.

Average correlation over plate length. The two-term Re blend `0.4·Re^0.5 + 0.06·Re^(2/3)`
represents transition from laminar-dominated → turbulent-dominated boundary layer.
Pr^0.4 (not Pr^(1/3)) is Whitaker's fit for liquids with varying Pr.

Properties at free-stream temperature. μ_s at surface temperature.

**`CorrelationName`:** `'whitaker_flat_plate'`  **`FlowGeometry`:** `FLAT_PLATE`

