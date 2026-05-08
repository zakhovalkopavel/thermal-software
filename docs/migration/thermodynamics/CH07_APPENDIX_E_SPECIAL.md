# CH07 Appendix E — Special Geometries

**Back:** [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md)

Covers `FlowGeometry` values: `TUBE_BANK_*`, `HORIZONTAL_CAVITY`, `VERTICAL_CAVITY`,
`MIXED_PIPE_VERTICAL`, `MIXED_PLATE_VERTICAL`, `PACKED_BED*`, `FLUIDIZED_BED`,
`CONDENSATION_*`, `POOL_BOILING`, `ROTATING_DISK`, `ROTATING_CYLINDER`,
`IMPINGING_JET_*`.

---

## TUBE_BANK_INLINE / TUBE_BANK_STAGGERED — forced convection

`Re_D,max = V_max·D/ν`.  
Inline: `V_max = V·S_T/(S_T−D)`.  
Staggered: check diagonal — `V_max = V·S_T/(2·(S_D−D))` if `S_D < (S_T+D)/2`,
where `S_D = √(S_L² + (S_T/2)²)`, otherwise same as inline.

### Zukauskas *(default)*

`Nu = C₁·C₂·Re_D,max^m·Pr^0.36·(Pr/Pr_s)^0.25`

| Re_D,max | C₁ inline | C₁ staggered | m |
|---|---|---|---|
| 10–100 | 0.80 | 0.90 | 0.40 |
| 100–10³ | 0.27 | 0.35·(S_T/S_L)^0.2 | 0.63 |
| 10³–2×10⁵ | 0.21 | 0.40 | 0.70 |
| 2×10⁵–2×10⁶ | 0.021 | 0.022 | 0.84 |

Row correction C₂ = 1.0 for N_L ≥ 20; correction table for fewer rows in Incropera §7.5.

**Validity:** 10 ≤ Re_D,max ≤ 2×10⁶, 0.7 ≤ Pr ≤ 500. Requires Pr_s (at wall temperature).

**Source:** Zukauskas (1972); Incropera §7.5.  **`CorrelationName`:** `'zukauskas'`

### Whitaker tube bank — see §W5 below

**`CorrelationName`:** `'whitaker_tube_bank'`

---

## HORIZONTAL_CAVITY — natural convection, heated from below

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `hollands` | `Nu = 1 + 1.44·[1−1708/Ra]⁺ + [(Ra/5830)^(1/3)−1]⁺` | 1708 ≤ Ra ≤ 10⁸ | Hollands et al. (1976); Incropera §9.9 |
| `globe_dropkin` | `Nu = 0.069·Ra^(1/3)·Pr^0.074` | 3×10⁵ ≤ Ra ≤ 7×10⁹ | Globe & Dropkin (1959); Incropera §9.9 |

`[·]⁺ = max(·, 0)`. Ra < 1708: pure conduction (Nu = 1).

---

## VERTICAL_CAVITY — natural convection

**MacGregor–Emery** — Incropera §9.9:

| H/L | Ra range | Formula |
|---|---|---|
| 1–2 | 10⁴–10⁷ | `Nu = 0.18·(Pr/(0.2+Pr)·Ra)^0.29` |
| 2–10 | 10³–10¹⁰ | `Nu = 0.22·(Pr/(0.2+Pr)·Ra)^0.28·(H/L)^(−1/4)` |
| 10–40 | 10⁴–10⁷ | `Nu = 0.42·Ra^(1/4)·Pr^0.012·(H/L)^(−0.3)` |
| 10–40 | 10⁶–10⁹ | `Nu = 0.046·Ra^(1/3)` |

`H/L` from `dims.b / dims.c` (height / gap width).

**`CorrelationName`:** `'macgregor_emery'`

---

## MIXED_PIPE_VERTICAL / MIXED_PLATE_VERTICAL — mixed convection

### §A1 — Churchill (1977): Power-sum blending rule

**Paper:** S.W. Churchill, "A comprehensive correlating equation for laminar, assisting, forced
and free convection," *AIChE Journal*, 23(1):10–16, 1977.

```
Nu_combined^n = Nu_forced^n + Nu_natural^n   (aiding flow  — buoyancy assists)
Nu_combined^n = Nu_forced^n − Nu_natural^n   (opposing flow — buoyancy opposes)
```

**n = 3** (Churchill fit across 15 data sets covering pipes, plates, cylinders).

**When to apply:**
- `Gr/Re² ≪ 0.1` → pure forced convection
- `Gr/Re² ≫ 10` → pure natural convection
- `0.1 ≤ Gr/Re² ≤ 10` → use this blending rule

**Nu_forced** = Gnielinski for pipe; Churchill-Ozoe for plate.  
**Nu_natural** = Churchill-Chu for plate/cylinder; Churchill sphere for sphere.

> ⚠️ Incropera §9.10 and Cengel §15-2 use n=3. Some sources incorrectly use n=3.5 — use n=3 per original paper.

**`CorrelationName`:** `'mixed_power_sum'`

---

## PACKED_BED — forced convection

`Re_p = ρ·v_s·D_p/μ` (superficial velocity `v_s`, particle diameter `D_p`).

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `gunn` *(default)* | `Nu = (7−10ε+5ε²)·(1+0.7·Re_p^0.2·Pr^(1/3)) + (1.33−2.4ε+1.2ε²)·Re_p^0.7·Pr^(1/3)` | 0 ≤ Re_p ≤ 10⁵, 0.35 ≤ ε ≤ 1.0 | [HeatTransfer.js:22](../../../legacy/furnaceCombustion/modules/HeatTransfer.js#L22)–[:27](../../../legacy/furnaceCombustion/modules/HeatTransfer.js#L27); Gunn (1978) |
| `wakao_funazkri` | `Nu = 2 + 1.1·Re_p^0.6·Pr^(1/3)` | Re_p > 0, any Pr | Wakao & Funazkri (1978); VDI M8 |
| `whitaker_packed_bed` | full form with (μ/μ_s)^0.25 — see §W6 below | 10 ≤ Re_p ≤ 10⁴ | Whitaker (1972) |

**Default selection:**
- 0 ≤ Re_p ≤ 10⁵ and 0.35 ≤ ε ≤ 1.0 → `gunn`
- Re_p > 10⁵ or ε < 0.35 → `wakao_funazkri`

`PACKED_BED_CYLINDER` (non-spherical): `D_eq = 3·D_p·L_p / (D_p/2 + L_p)` → same correlations.

---

## FLUIDIZED_BED

**Wen & Yu — minimum fluidization:**

`Re_mf = (C₁² + C₂·Ar)^0.5 − C₁`, C₁ = 33.7, C₂ = 0.0408

`Ar = D_p³·ρ_f·(ρ_s−ρ_f)·g / μ²`

**Molerus & Wirth — heat transfer to immersed surface (VDI L3.4):**

`Nu = (1−ε)·Nu_slow + ε·Nu_fast`

---

## CONDENSATION_VERTICAL_PLATE — phase change

### Nusselt laminar film (default)

```
Nu_L = 0.943·[ ρ_l·(ρ_l−ρ_v)·g·h_fg'·L³ / (μ_l·k_l·ΔT) ]^(1/4)
h_fg' = h_fg + 0.68·Cp_l·ΔT
```

**`CorrelationName`:** `'nusselt_condensation'`  Source: Incropera §10.6.

### Chen turbulent (Re_δ > 1800)

```
Nu = Re_δ^(1/3)·Pr_l^0.5 / (1.08·Re_δ^1.22 − 5.2)
```

**`CorrelationName`:** `'chen_condensation'`  Source: Incropera §10.6.

---

## CONDENSATION_HORIZONTAL_TUBE — phase change

```
Nu_D = 0.725·[ ρ_l·(ρ_l−ρ_v)·g·h_fg'·D³ / (μ_l·k_l·ΔT) ]^(1/4)
```

**`CorrelationName`:** `'nusselt_condensation'`  Source: Incropera §10.6.

---

## ROTATING_DISK

`Re_ω = ω·r²/ν`

| Regime | Formula | Re_ω |
|---|---|---|
| Laminar | `Nu = 0.36·Re_ω^0.5·Pr^0.6` | < 2.5×10⁵ |
| Turbulent | `Nu = 0.0195·Re_ω^0.8·Pr^0.6` | > 2.5×10⁵ |

**`CorrelationName`:** `'dorfman_disk'`  Source: Dorfman; VDI H4.

---

## ROTATING_CYLINDER

`Ta = ω²·r_i·δ³/ν²`, `δ = r_o − r_i`

```
Nu = 0.386·(Ta·Pr)^0.5      valid when Ta^0.5·Pr > 1
```

**`CorrelationName`:** `'bjorklund_kays'`  Source: Bjorklund & Kays; VDI H5.

---

## IMPINGING_JET_SINGLE

`Re_D = V·D/ν`, `r` = radial distance from stagnation point.

```
Nu = G·Re_D^0.5·Pr^0.42
G = (D/r)·[(1−1.1·D/r)/(1+0.1·(H/D−6)·D/r)]^0.5
```

**Validity:** 2000 ≤ Re_D ≤ 4×10⁵, 2 ≤ H/D ≤ 12, 2.5 ≤ r/D ≤ 7.5.

**`CorrelationName`:** `'martin_jet_single'`  Source: Martin (1977); VDI G8.

---

## IMPINGING_JET_ARRAY

```
Nu = K·G·Re_D^0.5·Pr^0.42
K = (1+(H/D/(0.6/√f))^6)^(−0.05)
f = jet area fraction (total nozzle area / heated surface area)
```

**`CorrelationName`:** `'martin_jet_array'`  Source: Martin (1977); VDI G8.

---

## §W5 — Whitaker (1972): Tube banks

**Paper:** Whitaker (1972) AIChE — Eq.(12), page 367.

```
Inline:    Nu_D = 0.4·Re_D,max^0.6·Pr^0.36·(μ/μ_s)^0.14
Staggered: Nu_D = 0.35·(S_T/S_L)^0.2·Re_D,max^0.6·Pr^0.36·(μ/μ_s)^0.14
```

**Validity:** 1000 ≤ Re_D,max ≤ 2×10⁵, 0.7 ≤ Pr ≤ 500, N ≥ 10 rows.

Staggered arrangement gives 10–25% higher Nu than inline at same Re_D,max.
The `(S_T/S_L)^0.2` factor captures this geometry dependence (Whitaker 1972 p.368).

**`CorrelationName`:** `'whitaker_tube_bank'`

---

## §W6 — Whitaker (1972): Packed beds

**Paper:** Whitaker (1972) AIChE — Eq.(17), page 369.

```
Nu_p = (0.5·Re_p^(1/2) + 0.2·Re_p^(2/3))·Pr^(1/3)·(μ/μ_s)^(1/4)
```

`Re_p = ρ·v_s·D_p/μ`, `v_s` = superficial velocity, `D_p` = particle diameter.

**Validity:** 10 ≤ Re_p ≤ 10⁴, 0.7 ≤ Pr ≤ 380, spherical particles.
Non-spherical: `D_p = 6·V_p/S_p` (equivalent sphere diameter).

**vs Gunn:** Gunn (1978) better for ε < 0.4 and Re < 10.
Whitaker better for gases at Re > 100 with Pr far from 0.7 (includes (μ/μ_s)^0.25 for liquids).

**`CorrelationName`:** `'whitaker_packed_bed'`  **`FlowGeometry`:** `PACKED_BED`

