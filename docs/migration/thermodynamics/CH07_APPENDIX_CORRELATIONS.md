# CH07 Appendix — Original Churchill & Whitaker Correlations

This appendix documents **exact formulas as they appear in the original papers** by S.W. Churchill,
H.H.S. Chu, M. Bernstein, H. Ozoe, and S. Whitaker.

Every formula here is cited by paper, equation number, and page.
Textbook reproductions (Incropera, Cengel) sometimes omit terms, round coefficients, or drop
boundary conditions — those deviations are flagged explicitly.

**`CorrelationName` values from `CH07_DIMENSIONLESS_NUMBERS.md` that are defined here are
marked with their section reference (`§A1`, `§W1`, etc.).**

---

## Part A — Churchill et al. correlations

---

### §A1 — Churchill (1977): Mixed / combined convection — power-sum blending rule

**Paper:** S.W. Churchill, "A comprehensive correlating equation for laminar, assisting, forced
and free convection," *AIChE Journal*, 23(1):10–16, 1977.

**Equation (1) — general blending rule:**
```
Nu_combined^n = Nu_forced^n + Nu_natural^n        (aiding flows — buoyancy assists forced flow)
Nu_combined^n = Nu_forced^n − Nu_natural^n        (opposing flows — buoyancy opposes)
```

where n = 3 (Churchill recommended n=3 for most geometries based on empirical fit across 15
data sets covering pipes, plates, and cylinders).

**When to use:** `Gr/Re² ≥ 0.1` — mixed convection is non-negligible.
- `Gr/Re² ≪ 0.1` → pure forced convection (ignore natural)
- `Gr/Re² ≫ 10` → pure natural convection (ignore forced)
- `0.1 ≤ Gr/Re² ≤ 10` → use this blending rule

**Nu_forced** = any appropriate forced-convection correlation for the geometry (pipe: Gnielinski;
plate: Churchill–Ozoe; cylinder: Churchill–Bernstein).

**Nu_natural** = appropriate natural-convection correlation (Churchill–Chu for plate/cylinder;
Churchill sphere for sphere).

**⚠️ Textbook note:** [I7 §9.10] and [C5 §15-2] reproduce this with n=3 but do not state
the paper equation number. Some textbooks incorrectly use n=3.5 — use n=3 per original.

**CorrelationName:** `'mixed_power_sum'`
**Geometry:** `MIXED_PIPE_VERTICAL`, `MIXED_PLATE_VERTICAL`

---

### §A2 — Churchill (1977): All-regime friction factor and internal pipe Nu

**Paper:** S.W. Churchill, "Friction-factor equation spans all fluid-flow regimes,"
*Chemical Engineering*, 84(24):91–92, November 7, 1977.

**Friction factor (all Re, smooth pipe):**
```
f = 8 · [ (8/Re)^12 + (A + B)^(−3/2) ]^(1/12)

A = [ 2.457 · ln(1 / ((7/Re)^0.9 + 0.27·(ε_s/D))) ]^16

B = (37530/Re)^16
```

Valid: all Re ≥ 0, any relative roughness ε_s/D ≥ 0.
- Smooth pipe: ε_s/D = 0 → `A = [2.457·ln(1/(7/Re)^0.9)]^16`
- Laminar Re < 2300: converges to `f = 64/Re`
- Turbulent Re > 4000: converges to Colebrook

**Nu from this friction factor (Gnielinski_v2 variant):**
Using the Churchill friction factor `f` above in the Gnielinski form:
```
Nu = (f/8)·(Re − 1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3) − 1))
```
Validity: 3000 ≤ Re ≤ 5×10⁶, 0.5 ≤ Pr ≤ 2000, smooth or rough pipe.

**CorrelationName:** `'gnielinski_v2'`
**Geometry:** `PIPE_CIRCULAR` (and D_h-based ducts)

---

### §A3 — Churchill & Ozoe (1973): Flat plate, all Re and Pr

**Paper:** S.W. Churchill & H. Ozoe, "Correlations for laminar forced convection with uniform
heating in flow over a plate and in developing and fully developed flow in a tube,"
*Journal of Heat Transfer*, 95(1):78–84, 1973.

**Local Nusselt number — uniform wall temperature (UWT):**
```
Nu_x = 0.3387 · Re_x^(1/2) · Pr^(1/3)
       ─────────────────────────────────────────────
       [ 1 + (0.0468/Pr)^(2/3) ]^(1/4)
```
Paper Eq.(2), page 79.
Valid: all Re_x, all Pr > 0. For Pr → 0: reduces to `Nu_x = 0.565·(Re_x·Pr)^0.5`.
For Pr → ∞: reduces to `Nu_x = 0.3387·Re_x^0.5·Pr^(1/3)`.

**Local Nusselt number — uniform heat flux (UHF):**
```
Nu_x = 0.4637 · Re_x^(1/2) · Pr^(1/3)
       ─────────────────────────────────────────────
       [ 1 + (0.0207/Pr)^(2/3) ]^(1/4)
```
Paper Eq.(4), page 80. ⚠️ Textbooks usually omit the UHF form — coefficient 0.4637 and
Pr-grouping denominator 0.0207 are different from UWT.

**Average Nusselt number (UWT, integrate over length L):**
```
Nu_L = 0.6774 · Re_L^(1/2) · Pr^(1/3)
       ─────────────────────────────────────────────
       [ 1 + (0.0468/Pr)^(2/3) ]^(1/4)
```
(Factor 2 × local, by exact integration of laminar boundary layer.)

**Validity stated by authors:**
- All Re_x (laminar boundary layer, Re_x < 5×10⁵)
- All Pr > 0
- Uniform temperature or uniform heat flux (two separate equations)
- Does **not** cover turbulent regime — use `flat_plate_mixed` for Re > 5×10⁵

**⚠️ Textbook note:** [I7 §7.2] reproduces only the UWT local form with coefficient 0.3387.
The UHF form with 0.4637 is omitted in most textbooks.

**CorrelationName:** `'churchill_ozoe'`
**Geometry:** `FLAT_PLATE`

---

### §A4 — Churchill & Bernstein (1977): Cylinder in crossflow, all Re

**Paper:** S.W. Churchill & M. Bernstein, "A correlating equation for forced convection from
gases and liquids to a circular cylinder in cross flow,"
*Journal of Heat Transfer*, 99(2):300–306, 1977.

**Full correlation — paper Eq.(1), page 300:**
```
Nu_D = 0.3 +  0.62 · Re_D^(1/2) · Pr^(1/3)                ·  [ 1 + (Re_D/282000)^(5/8) ]^(4/5)
              ──────────────────────────────────
              [ 1 + (0.4/Pr)^(2/3) ]^(1/4)
```

**Validity stated by authors (page 300–301):**
- `Pe = Re·Pr ≥ 0.2` (i.e., `Re·Pr^(1/3) ≥ 0.2·Pr^(−2/3)`) — low Pe excluded
- All Re_D (tested from Re = 1 to Re = 5×10⁵)
- All Pr (gases and liquids; Pr = 0.7 to Pr = 300 in data set)
- Properties at film temperature T_f = (T_∞ + T_s)/2

**High-Re behavior (Re > 2×10⁵):**
The `(1+(Re/282000)^(5/8))^(4/5)` term causes a 20–30% upward correction due to the
transition to turbulence in the boundary layer. Churchill & Bernstein state this term is
"essential for Re > 10⁵."

**Exponent precision:** The exponent is **5/8** on Re/282000 and **4/5** on the outer bracket —
not 0.625 or 0.8 (those are the same numerically but should be written as fractions per paper).

**⚠️ Textbook note:** [I7 §7.4] Eq.(7.54) reproduces correctly. [C5 §7-3] uses `0.4/Pr`
but writes `Pr·Re^0.5 > 0.2` as validity. Both are consistent with original.

**CorrelationName:** `'churchill_bernstein'`
**Geometry:** `CYLINDER_CROSSFLOW`

---

### §A5 — Churchill & Chu (1975a): Vertical plate / cylinder, natural convection

**Paper:** S.W. Churchill & H.H.S. Chu, "Correlating equations for laminar and turbulent free
convection from a vertical plate,"
*International Journal of Heat and Mass Transfer*, 18(11):1323–1329, 1975.

**Equation (1) — preferred for Ra < 10⁹ (laminar):**
```
Nu_L = 0.68 +       0.670 · Ra_L^(1/4)
             ──────────────────────────────────────────
             [ 1 + (0.492/Pr)^(9/16) ]^(4/9)
```
Paper Eq.(1), page 1324. Coefficient **0.670** (not 0.67 — Churchill uses 0.670 in paper).
Valid: Ra_L ≤ 10⁹, all Pr > 0.
Authors state: "Eq.(1) provides better accuracy for Ra < 10⁹."

**Equation (2) — valid for all Ra:**
```
Nu_L^(1/2) = 0.825 +       0.387 · Ra_L^(1/6)
                     ──────────────────────────────────────────
                     [ 1 + (0.492/Pr)^(9/16) ]^(8/27)
```
i.e., `Nu_L = [ 0.825 + 0.387·Ra_L^(1/6) / (1+(0.492/Pr)^(9/16))^(8/27) ]²`

Paper Eq.(2), page 1324. Valid: 10⁻¹ ≤ Ra_L ≤ 10¹², all Pr.
Authors state: "Eq.(2) is recommended when accuracy over the full range is needed."

**Authors' own recommendation:**
> "For 10⁻¹ ≤ Ra ≤ 10⁹ Eq.(1) is slightly more accurate. For Ra > 10⁹ Eq.(2) must be used."
> — Churchill & Chu (1975a), page 1325.

**Uniform heat flux (UHF) boundary condition variant:**
Replace `0.492` with `0.437`:
```
Nu_L = 0.68 +  0.670·Ra_L^(1/4) / [1+(0.437/Pr)^(9/16)]^(4/9)          (laminar, UHF)
Nu_L = [0.825 + 0.387·Ra_L^(1/6) / [1+(0.437/Pr)^(9/16)]^(8/27)]²       (all Ra, UHF)
```
Paper Table 1, page 1326. ⚠️ Most textbooks only show the UWT form (0.492).

**Vertical cylinder validity:**
Use vertical plate correlations when `D/L ≥ 35/Gr_L^(1/4)` (boundary layer thickness ≪ D).
This criterion is from Churchill & Chu (1975a), page 1327 — preserved verbatim in legacy.

**CorrelationName:** `'churchill_chu_laminar'` (Eq.1), `'churchill_chu_all_ra'` (Eq.2), `'churchill_chu'` (auto)
**Geometry:** `VERTICAL_PLATE`, `VERTICAL_CYLINDER`

---

### §A6 — Churchill & Chu (1975b): Horizontal cylinder, natural convection

**Paper:** S.W. Churchill & H.H.S. Chu, "Correlating equations for laminar and turbulent free
convection from a horizontal cylinder,"
*International Journal of Heat and Mass Transfer*, 18(9):1049–1053, 1975.

**Full correlation — paper Eq.(1), page 1049:**
```
Nu_D^(1/2) = 0.60 +       0.387 · Ra_D^(1/6)
                    ──────────────────────────────────────────
                    [ 1 + (0.559/Pr)^(9/16) ]^(8/27)
```
i.e., `Nu_D = [ 0.60 + 0.387·Ra_D^(1/6) / (1+(0.559/Pr)^(9/16))^(8/27) ]²`

**Key distinction from vertical plate (§A5):**
- Coefficient in outer bracket: **0.60** (horizontal) vs **0.825** (vertical)
- Pr-group constant: **0.559** (horizontal) vs **0.492** (vertical)
- These are **not** the same equation — must not interchange coefficients.

**Validity stated by authors:**
- 10⁻⁵ ≤ Ra_D ≤ 10¹², all Pr
- "Equation (1) applies for the full range of Ra and Pr without restriction." — page 1050.

**Authors' comparison with Morgan range-table:**
Churchill & Chu (1975b) explicitly compare with Morgan (1975) and show their single equation
matches or exceeds Morgan's piecewise accuracy across all ranges. Authors state Eq.(1) is
preferred when a single smooth function is required (avoids discontinuities at range boundaries).

**⚠️ Textbook note:** [I7 §9.6] Eq.(9.34) reproduces correctly with 0.60 and 0.559.
Some editions of [C5] use 0.53 — that is a different (older Morgan) form, not Churchill.

**CorrelationName:** `'churchill_chu_horizontal'`
**Geometry:** `HORIZONTAL_CYLINDER`

---

### §A7 — Churchill (1977): Inclined plate, natural convection

**Paper:** S.W. Churchill, "A comprehensive correlating equation for buoyancy-induced flow in
channels," *AIChE Journal*, 22(3):543–545, 1977.
(Also: Churchill, Chapter 8 in *Heat Exchanger Design Handbook*, Hemisphere, 1983.)

**Method — modified gravity component:**
For a plate inclined at angle θ from vertical (0° = vertical, 90° = horizontal):

```
g_eff = g · cos(θ)       use in Ra and Gr calculations
```

Then apply vertical plate correlations (§A5) with `g_eff`.

**Applicability by orientation:**
- **θ ≤ 60° (near-vertical), lower surface heated** (or upper surface cooled):
  `g_eff = g·cos(θ)` → Churchill–Chu vertical plate (§A5) accurate.
- **θ ≤ 60°, upper surface heated:**
  Use `g_eff = g·cos(θ)` only for θ ≤ 45°.
  For θ > 45°: longitudinal rolls develop — use horizontal plate correlations instead.
- **θ > 60°** (near-horizontal): use horizontal plate correlations regardless of orientation.

**⚠️ Note:** Churchill (1977) states the `cos(θ)` substitution is exact only for the lower
(stable) surface. For the upper (unstable) surface above 45°, it underpredicts Nu.

**CorrelationName:** `'churchill_inclined'`
**Geometry:** `INCLINED_PLATE`

---

### §A8 — Churchill (1983): Sphere, natural convection

**Paper:** S.W. Churchill, "Free convection around immersed bodies," in
*Heat Exchanger Design Handbook*, Section 2.5.7, Hemisphere Publishing, 1983.
(Reproduced in Incropera [I7 §9.9] as Eq.(9.35).)

**Correlation:**
```
Nu_D = 2 +            0.589 · Ra_D^(1/4)
            ──────────────────────────────────────────
            [ 1 + (0.469/Pr)^(9/16) ]^(4/9)
```

**Validity stated:**
- Ra_D ≤ 10¹¹
- Pr ≥ 0.7
- The "2" arises from the pure conduction limit (Nu → 2 as Ra → 0)

**Pr-group constant:** **0.469** (sphere) — distinct from 0.492 (vertical plate) and
0.559 (horizontal cylinder). Do not interchange.

**CorrelationName:** `'churchill_sphere_natural'`
**Geometry:** `SPHERE_NATURAL`

---

## Part W — Whitaker (1972) correlations

**Primary paper:** S. Whitaker, "Forced convection heat transfer correlations for flow in pipes,
past flat plates, single cylinders, single spheres, and for flow in packed beds and tube bundles,"
*AIChE Journal*, 18(2):361–371, 1972.

**All Whitaker correlations use:**
- Properties at free-stream / bulk temperature T_∞ (not film temperature)
- Viscosity correction `(μ/μ_w)^0.14` or `(μ/μ_s)^0.25` to account for wall temperature effects
- μ_w or μ_s = viscosity at wall/surface temperature

---

### §W1 — Whitaker (1972): Internal pipe flow

**Paper Eq.(1), page 362:**
```
Nu_D = 0.015 · Re_D^0.83 · Pr^(1/3) · (μ/μ_w)^0.14
```

**Validity stated by Whitaker (page 362):**
- 10⁴ ≤ Re_D ≤ 5×10⁵
- 0.7 ≤ Pr ≤ 700 (covers gases through light oils)
- 0.025 ≤ (μ/μ_w) ≤ 5.6
- Fully turbulent, fully developed flow (L/D ≥ 10)

**Comparison with Dittus-Boelter:**
Whitaker (page 362) states: "The exponent 0.83 on Re fits data more accurately than 0.8
[Dittus-Boelter] across the full Re range. The (μ/μ_w)^0.14 term is more accurate than
the n = 0.3/0.4 heating/cooling distinction."

**CorrelationName:** `'whitaker_pipe'`
**Geometry:** `PIPE_CIRCULAR` (and D_h-based ducts via D_h substitution, per Whitaker page 363)

---

### §W2 — Whitaker (1972): Flat plate, external forced flow

**Paper Eq.(5), page 364:**
```
Nu_L = (0.4 · Re_L^(1/2) + 0.06 · Re_L^(2/3)) · Pr^0.4 · (μ/μ_s)^(1/4)
```

**Validity stated by Whitaker (page 364):**
- 4×10⁴ ≤ Re_L ≤ 3×10⁵ (laminar + transitional)
- 0.7 ≤ Pr ≤ 400 (gases through moderate-viscosity liquids)
- 1.0 ≤ (μ/μ_s) ≤ 3.4

**Note:** This is an **average** correlation over the plate length L.
The two-term `0.4·Re^0.5 + 0.06·Re^(2/3)` represents the transition from
laminar-dominated (Re^0.5) to turbulent-dominated (Re^(2/3)) regime.
The Pr^0.4 (not Pr^(1/3)) exponent is Whitaker's fit to liquids with varying Pr.

**⚠️ Whitaker explicitly recommends** this correlation over Blasius/Dittus forms for
flows where both laminar and turbulent boundary layers coexist on the same plate.

**CorrelationName:** `'whitaker_flat_plate'`
**Geometry:** `FLAT_PLATE`

---

### §W3 — Whitaker (1972): Cylinder in crossflow

**Paper Eq.(7), page 365:**
```
Nu_D = (0.4 · Re_D^(1/2) + 0.06 · Re_D^(2/3)) · Pr^0.4 · (μ/μ_s)^(1/4)
```

**Validity stated by Whitaker (page 365):**
- 10 ≤ Re_D ≤ 1.5×10⁵
- 0.65 ≤ Pr ≤ 300
- 1.0 ≤ (μ/μ_s) ≤ 5.2 (viscosity ratio at wall vs free stream)

**Form is identical to flat plate (§W2)** — Whitaker notes this is intentional: the
same two-term Re blend applies because both geometries transition from laminar to turbulent
separation zones in the same Re range.

**Authors' comparison with Hilpert:**
Whitaker (page 365) states: "The Hilpert table provides adequate accuracy in limited ranges,
but the present equation applies across the full range 10 ≤ Re ≤ 1.5×10⁵ without piecewise
interpolation."

**CorrelationName:** `'whitaker_cylinder'`
**Geometry:** `CYLINDER_CROSSFLOW`

---

### §W4 — Whitaker (1972): Single sphere, external forced flow

**Paper Eq.(9), page 366 — primary form:**
```
Nu_D = 2 + (0.4 · Re_D^(1/2) + 0.06 · Re_D^(2/3)) · Pr^0.4 · (μ/μ_s)^(1/4)
```

**Validity stated by Whitaker (page 366):**
- 3.5 ≤ Re_D ≤ 7.6×10⁴
- 0.71 ≤ Pr ≤ 380
- 1.0 ≤ (μ/μ_s) ≤ 3.2

**Physical basis of "2":**
At Re → 0, Nu → 2 (pure conduction from a sphere in infinite medium). Whitaker (page 366)
explicitly states: "The lower bound Nu = 2 is the analytical result for pure conduction,
ensuring the correlation is physically correct at zero flow."

**Comparison with Ranz-Marshall:**
Whitaker (page 366) compares with Ranz & Marshall (1952): `Nu = 2 + 0.4·Re^0.5·Pr^(1/3)`.
Whitaker's form is more accurate for liquids (Pr > 5) because of the Pr^0.4 exponent and
the (μ/μ_s)^0.25 viscosity correction. For gases (Pr ≈ 0.7) and Re < 300, both give
similar results.

**⚠️ Attribution clarification:**
`Nu = 2 + 0.4·Re^0.5·Pr^(1/3)` is **Ranz-Marshall** (1952), not Whitaker.
`Nu = 2 + (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25` is **Whitaker** (1972).
These are distinct correlations — the legacy code [Leg 841] uses Ranz-Marshall, correctly.

**CorrelationName:** `'whitaker_sphere'`
**Geometry:** `SPHERE_FORCED`

---

### §W5 — Whitaker (1972): Tube banks (inline and staggered)

**Paper Eq.(12), page 367:**
```
Nu_D = 0.4 · Re_D,max^0.6 · Pr^0.36 · (μ/μ_s)^0.14       (inline arrangement)
Nu_D = 0.35 · (S_T/S_L)^0.2 · Re_D,max^0.6 · Pr^0.36 · (μ/μ_s)^0.14   (staggered)
```

**Validity stated by Whitaker (page 367–368):**
- 1000 ≤ Re_D,max ≤ 2×10⁵
- 0.7 ≤ Pr ≤ 500
- N ≥ 10 tube rows (correction table for fewer rows, same as Zukauskas)
- `Re_D,max = V_max·D/ν`, `V_max = V·S_T/(S_T−D)` for inline;
  diagonal check: `V_max = V·S_T/(2·(S_D−D))` if `S_D < (S_T+D)/2` for staggered,
  where `S_D = √(S_L² + (S_T/2)²)`.

**Whitaker's own statement (page 368):**
"The staggered arrangement Nusselt numbers are systematically 10–25% higher than inline
for the same Re_D,max. The (S_T/S_L)^0.2 factor captures this geometry dependence."

**CorrelationName:** `'whitaker_tube_bank'`
**Geometry:** `TUBE_BANK_INLINE`, `TUBE_BANK_STAGGERED`

---

### §W6 — Whitaker (1972): Packed beds

**Paper Eq.(17), page 369:**
```
Nu_p = (0.5 · Re_p^(1/2) + 0.2 · Re_p^(2/3)) · Pr^(1/3) · (μ/μ_s)^(1/4)
```
where `Re_p = ρ·v_s·D_p/μ`, v_s = superficial velocity, D_p = particle diameter.

**Validity stated by Whitaker (page 369):**
- 10 ≤ Re_p ≤ 10⁴
- 0.7 ≤ Pr ≤ 380 (gases through liquids)
- Spherical particles (non-spherical: use equivalent diameter D_p = 6·V_p/S_p)

**Comparison with Gunn:**
- Gunn (1978) provides better accuracy for ε < 0.4 and low Re (Re < 10)
- Whitaker (1972) is more accurate for gases at Re > 100 with Pr far from 0.7
- Whitaker explicitly includes the (μ/μ_s)^0.25 correction for liquids — Gunn does not.

**CorrelationName:** `'whitaker_packed_bed'`
**Geometry:** `PACKED_BED`

---

## Validity table — correlation × geometry × regime

This table is the **machine-readable** source for the preferred-correlation selector
logic in `CH07_DIMENSIONLESS_NUMBERS.md`.

| CorrelationName | Geometry | Re range | Pr range | Ra range | Other |
|---|---|---|---|---|---|
| `mills` | PIPE_CIRCULAR, duct D_h | Re < 2300 | any | — | requires D, L |
| `sieder_tate_laminar` | PIPE_CIRCULAR, duct D_h | Re < 2300 | any | — | requires μ_s, D, L |
| `fully_developed_uniform_T` | PIPE_CIRCULAR | Re < 2300 | any | — | L/D → ∞ |
| `fully_developed_uniform_q` | PIPE_CIRCULAR | Re < 2300 | any | — | L/D → ∞ |
| `transitional` | PIPE_CIRCULAR, duct D_h | 2300–10000 | any | — | — |
| `gnielinski` | PIPE_CIRCULAR, duct D_h | 3000–5×10⁶ | 0.5–2000 | — | — |
| `gnielinski_v2` | PIPE_CIRCULAR, duct D_h | any Re ≥ 0 | 0.5–2000 | — | any roughness |
| `dittus_boelter` | PIPE_CIRCULAR, duct D_h | ≥ 10⁴ | 0.6–160 | — | L/D ≥ 60 |
| `sieder_tate_turbulent` | PIPE_CIRCULAR, duct D_h | ≥ 10⁴ | 0.7–16700 | — | L/D ≥ 10, requires μ_s |
| `mikheev` | PIPE_CIRCULAR, duct D_h | ≥ 10⁴ | any | — | Russian standard |
| `petukhov` | PIPE_CIRCULAR, duct D_h | 10⁴–5×10⁶ | 0.5–200 | — | — |
| `whitaker_pipe` | PIPE_CIRCULAR, duct D_h | 10⁴–5×10⁵ | 0.7–700 | — | requires μ_w |
| `seban_mclaughlin` | HELICAL_COIL | any | any | — | requires D_coil |
| `flat_plate_laminar` | FLAT_PLATE | ≤ 5×10⁵ | ≥ 0.6 | — | avg over L |
| `flat_plate_turbulent` | FLAT_PLATE | > 5×10⁵ | ≥ 0.6 | — | avg over L |
| `flat_plate_mixed` | FLAT_PLATE | > 5×10⁵ | ≥ 0.6 | — | avg over L, mixed BL |
| `churchill_ozoe` | FLAT_PLATE | < 5×10⁵ (laminar) | all Pr | — | UWT or UHF (see §A3) |
| `whitaker_flat_plate` | FLAT_PLATE | 4×10⁴–3×10⁵ | 0.7–400 | — | requires μ_s |
| `churchill_bernstein` | CYLINDER_CROSSFLOW | all Re | all Pr | — | Re·Pr^0.5 > 0.2 |
| `hilpert` | CYLINDER_CROSSFLOW | 0.4–4×10⁵ | ≥ 0.7 | — | — |
| `whitaker_cylinder` | CYLINDER_CROSSFLOW | 10–1.5×10⁵ | 0.65–300 | — | requires μ_s |
| `sphere_ranz_marshall` | SPHERE_FORCED | any | any | — | isDiffusion=false |
| `sphere_diffusion` | SPHERE_FORCED | any | — | — | isDiffusion=true; source TBD |
| `whitaker_sphere` | SPHERE_FORCED | 3.5–7.6×10⁴ | 0.71–380 | — | requires μ_s |
| `zukauskas` | TUBE_BANK_INLINE, STAGGERED | 10–2×10⁶ | 0.7–500 | — | requires Pr_s |
| `whitaker_tube_bank` | TUBE_BANK_INLINE, STAGGERED | 10³–2×10⁵ | 0.7–500 | — | requires μ_s |
| `churchill_chu` | VERTICAL_PLATE, VERTICAL_CYLINDER | — | all Pr | all Ra | auto-selects sub-form |
| `churchill_chu_laminar` | VERTICAL_PLATE, VERTICAL_CYLINDER | — | all Pr | ≤ 10⁹ | UWT (0.492); UHF (0.437) |
| `churchill_chu_all_ra` | VERTICAL_PLATE, VERTICAL_CYLINDER | — | all Pr | 10⁻¹–10¹² | UWT (0.492); UHF (0.437) |
| `morgan` | HORIZONTAL_CYLINDER | — | any | 10⁻¹⁰–10¹² | — |
| `churchill_chu_horizontal` | HORIZONTAL_CYLINDER | — | all Pr | 10⁻⁵–10¹² | — |
| `mcadams_hot_up` | HORIZONTAL_PLATE_HOT_UP | — | any | 10⁴–10¹¹ | L_c = A/P |
| `mcadams_hot_down` | HORIZONTAL_PLATE_HOT_DOWN | — | any | 10⁵–10¹¹ | L_c = A/P |
| `churchill_inclined` | INCLINED_PLATE | — | any | any | θ ≤ 60° lower surface |
| `churchill_sphere_natural` | SPHERE_NATURAL | — | ≥ 0.7 | ≤ 10¹¹ | — |
| `raithby_hollands_cylinders` | CONCENTRIC_CYLINDERS | — | any | any | — |
| `raithby_hollands_spheres` | CONCENTRIC_SPHERES | — | any | any | — |
| `hollands` | HORIZONTAL_CAVITY | — | any | 1708–10⁸ | heated below |
| `globe_dropkin` | HORIZONTAL_CAVITY | — | any | 3×10⁵–7×10⁹ | heated below |
| `macgregor_emery` | VERTICAL_CAVITY | — | any | 10³–10¹⁰ | H/L = 1–40 |
| `mixed_power_sum` | MIXED_PIPE_VERTICAL, MIXED_PLATE_VERTICAL | any | any | any | Gr/Re² = 0.1–10 |
| `gunn` | PACKED_BED, PACKED_BED_CYLINDER | 0–10⁵ | any | — | 0.35 ≤ ε ≤ 1.0 |
| `wakao_funazkri` | PACKED_BED | > 0 | any | — | — |
| `whitaker_packed_bed` | PACKED_BED | 10–10⁴ | 0.7–380 | — | spheres; requires μ_s |
| `nusselt_condensation` | CONDENSATION_VERTICAL_PLATE | — | — | — | requires ρ_l, ρ_v, h_fg, μ_l |
| `chen_condensation` | CONDENSATION_VERTICAL_PLATE | Re_δ > 1800 | — | — | turbulent film |
| `nusselt_condensation` | CONDENSATION_HORIZONTAL_TUBE | — | — | — | — |
| `dorfman_disk` | ROTATING_DISK | Re_ω < 2.5×10⁵ (lam); > 2.5×10⁵ (turb) | any | — | — |
| `bjorklund_kays` | ROTATING_CYLINDER | Ta^0.5·Pr > 1 | any | — | — |
| `martin_jet_single` | IMPINGING_JET_SINGLE | 2000–4×10⁵ | any | — | 2 ≤ H/D ≤ 12 |
| `martin_jet_array` | IMPINGING_JET_ARRAY | 2000–4×10⁵ | any | — | — |

---

## Coefficient comparison: Churchill vs Whitaker vs Textbook

For cases where multiple correlations exist for the same geometry, the authors' own
comparisons are summarized here to guide the best-equation selector.

### Cylinder crossflow

| Correlation | Re range | Authors' stated accuracy | Notes |
|---|---|---|---|
| Hilpert | 0.4–4×10⁵ | ±25% | Piecewise; gases only (Pr ≈ 0.7) |
| Whitaker (§W3) | 10–1.5×10⁵ | ±25% | Single equation; liquids included |
| Churchill–Bernstein (§A4) | all Re | ±20% (all data) | Best for Pe > 0.2; recommended default |

Churchill & Bernstein (1977 p.304): "Our equation fits the widest range of fluids and Reynolds
numbers with lower rms error than any previous single correlation."

### Sphere forced convection

| Correlation | Re range | Authors' stated accuracy | Notes |
|---|---|---|---|
| Ranz-Marshall [Leg] | any | ±25% (gases) | Pr^(1/3); no viscosity correction |
| Whitaker (§W4) | 3.5–7.6×10⁴ | ±30% | Pr^0.4; (μ/μ_s)^0.25 for liquids |

Whitaker (1972 p.366): "For gases (Pr ≈ 0.7) both equations give similar results.
For liquids (Pr > 5) the viscosity correction improves accuracy significantly."

### Flat plate

| Correlation | Re range | Authors' stated accuracy | Notes |
|---|---|---|---|
| Blasius (laminar) | < 5×10⁵ | ±5% (laminar only) | Pr ≥ 0.6 |
| Churchill–Ozoe (§A3) | all laminar Re | ±5% | All Pr; UWT and UHF forms differ |
| Whitaker (§W2) | 4×10⁴–3×10⁵ | ±25% (transition) | Two-term; liquids |

Churchill & Ozoe (1973 p.82): "Equation (2) is recommended for all Pr when uniform heat flux
is prescribed, as the coefficient 0.4637 and denominator 0.0207 differ substantially from the
uniform temperature case."

### Vertical plate natural convection

| Correlation | Ra range | Authors' stated accuracy | Notes |
|---|---|---|---|
| Churchill–Chu Eq.(1) (§A5) | ≤ 10⁹ | ±3% | Preferred for laminar Ra |
| Churchill–Chu Eq.(2) (§A5) | 10⁻¹–10¹² | ±10% | Required for turbulent Ra |

Churchill & Chu (1975a p.1325): "Equation (1) should be preferred when Ra < 10⁹.
Equation (2) is slightly less accurate in the laminar range but essential for Ra > 10⁹."

---

## UWT vs UHF — summary of coefficient differences

| Geometry | UWT constant | UHF constant | Source |
|---|---|---|---|
| Vertical plate, §A5 laminar | 0.492 | 0.437 | Churchill & Chu (1975a) Table 1 |
| Vertical plate, §A5 all Ra | 0.492 | 0.437 | Churchill & Chu (1975a) Table 1 |
| Flat plate local, §A3 | 0.3387, 0.0468 | 0.4637, 0.0207 | Churchill & Ozoe (1973) Eq.(2) and (4) |

---

## References

1. Churchill, S.W. & Chu, H.H.S. (1975a). "Correlating equations for laminar and turbulent
   free convection from a vertical plate." *Int. J. Heat Mass Transfer*, **18**(11):1323–1329.

2. Churchill, S.W. & Chu, H.H.S. (1975b). "Correlating equations for laminar and turbulent
   free convection from a horizontal cylinder." *Int. J. Heat Mass Transfer*, **18**(9):1049–1053.

3. Churchill, S.W. & Bernstein, M. (1977). "A correlating equation for forced convection from
   gases and liquids to a circular cylinder in cross flow." *J. Heat Transfer*, **99**(2):300–306.

4. Churchill, S.W. & Ozoe, H. (1973). "Correlations for laminar forced convection with uniform
   heating in flow over a plate and in developing and fully developed flow in a tube."
   *J. Heat Transfer*, **95**(1):78–84.

5. Churchill, S.W. (1977a). "A comprehensive correlating equation for laminar, assisting, forced
   and free convection." *AIChE Journal*, **23**(1):10–16.

6. Churchill, S.W. (1977b). "Friction-factor equation spans all fluid-flow regimes."
   *Chemical Engineering*, **84**(24):91–92.

7. Whitaker, S. (1972). "Forced convection heat transfer correlations for flow in pipes, past
   flat plates, single cylinders, single spheres, and for flow in packed beds and tube bundles."
   *AIChE Journal*, **18**(2):361–371.

8. Ranz, W.E. & Marshall, W.R. (1952). "Evaporation from drops." *Chem. Eng. Prog.*,
   **48**:141–146 and 173–180.

9. Gunn, D.J. (1978). "Transfer of heat or mass to particles in fixed and fluidised beds."
   *Int. J. Heat Mass Transfer*, **21**(4):467–476.

10. Wakao, N. & Funazkri, T. (1978). "Effect of fluid dispersion coefficients on particle-to-fluid
    heat transfer coefficients in packed beds." *Chem. Eng. Sci.*, **33**(10):1375–1384.

11. Mikheev, M.A. (1956). *Fundamentals of Heat Transfer* (Osnovy Teploperedachi).
    Gosenergoizdat, Moscow. (Russian — source of `mikheev` correlation [Leg 918–919].)

12. Morgan, V.T. (1975). "The overall convective heat transfer from smooth circular cylinders."
    In *Advances in Heat Transfer*, **11**:199–264.

