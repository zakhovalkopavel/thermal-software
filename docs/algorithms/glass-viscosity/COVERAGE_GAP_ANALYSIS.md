# Glass Viscosity — Coverage Gap Analysis

**Date:** 2026-03-06  
**Purpose:** Identify what the v1 spec claimed to cover, what Lakatos 1976 and
Fluegel 2007 actually cover, and which gaps need additional published models.

---

## 1. What Lakatos 1976 Actually Covers

Source: `shared/sources/lakatos_ocr/` — 72 glasses in 4 series (S, D, F₂, FAL).

### Component list (only these 11 oxides are in the regression)

| Component | Min (wt%) | Max (wt%) | Notes |
|-----------|-----------|-----------|-------|
| SiO₂ | 59.52 | 77.02 | denominator; not a regression term |
| Al₂O₃ | 0.00 | 8.26 | |
| Na₂O | 10.41 | 17.00 | always present; soda-lime base |
| K₂O | 0.00 | 8.70 | |
| Li₂O | 0.00 | 3.00 | |
| CaO | 4.48 | 13.32 | always present |
| MgO | 0.00 | 6.00 | |
| BaO | 0.00 | 16.54 | |
| ZnO | 0.00 | 9.39 | |
| PbO | 0.00 | 12.22 | |
| B₂O₃ | 0.00 | 14.37 | quadratic term |

### Glass system covered

**Soda-lime-silica and its near variants only.**  
Every glass in the training set has SiO₂ 60–77% and Na₂O 10–17%.  
All are silicate glasses with moderate alkali. No high-boron, no high-alumina,
no pure silica, no slag.

### Viscosity levels predicted

Three isokom temperatures only: log₁₀η = **2, 4, 6 poise** = **1, 3, 5 Pa·s**  
(not softening, annealing, or strain directly — those require fitting VTF to the
three predicted points)

### Accuracy (from paper)

σ = 4.63°C at log η 1 Pa·s, 3.34°C at log η 3 Pa·s, 3.14°C at log η 5 Pa·s

---

## 2. What Fluegel 2007 Actually Covers

Source: `shared/sources/fluegel_2007/Fluegel_table3.csv` (max component values
per viscosity level).

### Component list and maximum allowed values (mol%, excl. SiO₂)

| Component | Max @ log η 1.5 | Max @ log η 6.6 | Max @ log η 12 | Notes |
|-----------|----------------|----------------|----------------|-------|
| SiO₂ | 42.62–89.2% | 42.62–87.1% | 41.4–92.0% | min–max range |
| Al₂O₃ | 11.3 | 12.7 | 10.0 | |
| B₂O₃ | 18.15 | 16.97 | 16.97 | |
| BaO | 10.0 | 8.0 | 19.2 | |
| CaO | 33.47 | 33.1 | 50.14 | |
| F | 10.31 | 10.31 | 4.55 | fluorine |
| Fe₂O₃ | 6.99 | 2.15 | 0.57 | |
| K₂O | 41.67 | 30.0 | 34.05 | |
| Li₂O | 35.9 | 33.3 | 45.0 | |
| MgO | 16.9 | 20.0 | 16.61 | |
| MnO₂ | 3.43 | 0.18 | 0.18 | |
| Na₂O | 44.0 | 42.0 | 42.0 | |
| P₂O₅ | 4.64 | 0.85 | 0.0 | |
| PbO | 49.96 | 50.0 | 56.0 | |
| SO₃ | 1.24 | 0.32 | 0.33 | |
| SrO | 7.37 | 7.37 | 18.02 | |
| TiO₂ | 9.26 | 3.29 | 25.0 | |
| ZnO | 5.19 | 8.0 | 2.81 | |
| ZrO₂ | 9.78 | 2.77 | 1.76 | |
| + 30 minor oxides | trace | — | — | Ag₂O, Bi₂O₃, CeO₂, … |

### Glass system covered

**Broad silicate glass database** — SciGlass 5.x, tens of thousands of glasses.  
Covers oxide glasses from simple binaries to complex industrial compositions.  
Valid as long as SiO₂ is within range and no individual component exceeds its
per-viscosity-level maximum.

### Viscosity levels predicted

Three isokom temperatures: log₁₀η = **1.5, 6.6, 12.0 Pa·s**  
(approximately: working point, softening point, annealing point)

### Accuracy

Standard error ~10–17°C per isokom level for in-range compositions (paper Table 2).

---

## 3. What the v1 Spec Claimed to Cover (and Doesn't)

The v1 spec defined **8 glass system types**. Here is each one checked against
Lakatos and Fluegel coverage:

### 3.1 Soda-Lime-Silica

| | Lakatos 1976 | Fluegel 2007 |
|---|---|---|
| SiO₂ range | 59.5–77% | 42.6–89.2% |
| Coverage | ✅ Core model | ✅ Covered |
| Gap | None | None |

**Verdict: fully covered by both models.**

---

### 3.2 Borosilicate

| Component | Lakatos max | Fluegel max (log η 6.6) |
|-----------|-------------|------------------------|
| B₂O₃ | 14.37 wt% | 16.97 mol% |
| SiO₂ | 59.5–77% | up to 87% |
| Na₂O | 10–17% (always present) | up to 42 mol% |
| K₂O | 0–8.7% | up to 30 mol% |

**Lakatos:** Not designed for high-B₂O₃ borosilicate. Na₂O is always ≥10% in
training data — Pyrex has only 3.9% Na₂O, well outside Lakatos training range.  
**Fluegel:** ✅ Covers borosilicate (B₂O₃ up to ~17 mol%, low-Na compositions).

**Verdict: outside Lakatos, covered by Fluegel.**  
For the certified NIST SRM 717a composition, use Fluegel 2007 or the fixed
certified VTF parameters (A=−3.8, B=16200 K, T₀=245 K) directly.

---

### 3.3 Aluminosilicate / High-Alumina

| Component | Lakatos max | Fluegel max (log η 6.6) |
|-----------|-------------|------------------------|
| Al₂O₃ | 8.26 wt% | 12.7 mol% |
| SiO₂ | 59.5–77% | 42.6–87% |

**Lakatos:** Al₂O₃ max is 8.26 wt%. E-glass has Al₂O₃ ~14 wt% — outside range.  
**Fluegel:** Al₂O₃ max 12.7 mol% ≈ ~13 wt%. E-glass (14 wt%) is also at the
edge of Fluegel's range. True high-alumina glass (Al₂O₃ > 15%) is **outside
both models**.

**Verdict: partially outside Lakatos, borderline for Fluegel, fully outside
both for Al₂O₃ > ~13 wt%.**

---

### 3.4 Lead Glass

| Component | Lakatos max | Fluegel max (log η 6.6) |
|-----------|-------------|------------------------|
| PbO | 12.22 wt% | 50 mol% |
| Na₂O in training | 10–17% always | any |

**Lakatos:** Has PbO up to 12.22 wt% but always paired with Na₂O ≥ 10 wt%.
True lead crystal (24% PbO, 4% Na₂O) has insufficient Na₂O.  
**Fluegel:** ✅ PbO up to 50 mol% — fully covers lead glass.

**Verdict: outside Lakatos, covered by Fluegel.**

---

### 3.5 Pure Silica (> 99% SiO₂)

**Lakatos:** SiO₂ max 77% — pure silica is completely outside.  
**Fluegel:** SiO₂ max ~89–92% — pure silica (>99%) is also outside.

**Verdict: outside BOTH models.**  
Requires dedicated pure-silica VTF parameters from Hetherington (1964) or
Urbain (1982): `log₁₀(η) = −3.905 + 31400/T` (T in K, Arrhenius form).

---

### 3.6 Sodium Silicate Binary (Na₂O > 18%, SiO₂ 60–75%, minimal others)

**Lakatos:** Na₂O max in training is 17% — a binary 25% Na₂O / 75% SiO₂ is
outside.  
**Fluegel:** Na₂O max 42 mol% ✅ — but the Fluegel model is calibrated on
multi-component data; very high-Na₂O binaries may be extrapolation.

**Verdict: outside Lakatos, within Fluegel but borderline for pure binaries.**

---

### 3.7 Calcium-Aluminate Slag (CaO > 30%, SiO₂ < 50%)

**Lakatos:** SiO₂ always 60–77% — slag is completely outside.  
**Fluegel:** CaO max 33.1 mol% (log η 6.6), SiO₂ minimum 42.6% — CaO-rich
slag with SiO₂ < 42% is outside Fluegel too. Fluegel is also calibrated on
glass (below liquidus), not on slag (above liquidus).

**Verdict: outside BOTH models entirely. Slag is a different material class.**

---

### 3.8 Fluoride Glass

**Lakatos:** No fluorine in model — completely outside.  
**Fluegel:** F (fluorine) max 10.31 mol% — low-fluorine glasses may be covered,
but ZBLAN-type heavy-metal fluoride glasses are outside.

**Verdict: outside Lakatos, partially covered by Fluegel for oxide-fluoride
mixed glasses; pure fluoride glasses outside both.**

---

## 4. Gap Summary Table

| v1 System | Lakatos 1976 | Fluegel 2007 | Gap? |
|-----------|-------------|-------------|------|
| Soda-Lime-Silica | ✅ Core | ✅ | No gap |
| Borosilicate | ⚠️ Na₂O too high in training | ✅ | Lakatos only valid for Na-rich borosilicate |
| Aluminosilicate (Al₂O₃ 8–13%) | ⚠️ Near edge | ✅ borderline | Minor gap |
| Aluminosilicate (Al₂O₃ > 13%) | ❌ Outside | ❌ Outside | **GAP** |
| Lead Glass | ⚠️ Low-Na pairs only | ✅ | Lakatos only for Na-rich lead glass |
| Pure Silica (> 99% SiO₂) | ❌ Outside | ❌ Outside | **GAP** |
| Sodium Silicate binary | ⚠️ Na₂O > 17% outside | ✅ borderline | Minor gap |
| Calcium-Aluminate Slag | ❌ Outside | ❌ Outside | **GAP — different material** |
| Fluoride Glass | ❌ Outside | ⚠️ Low-F only | **GAP for pure fluoride** |

---

## 5. Models That Can Fill the Gaps

### Gap 1: Pure Silica (SiO₂ > 99%)

**Model:** Hetherington et al. (1964) — simple two-parameter Arrhenius  
**Formula:** `log₁₀(η) = −3.905 + 31400/T` (T in Kelvin)  
**Valid range:** SiO₂ 99–100%, T = 1100–2300°C  
**Reference:** Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964).
"The Viscosity of Vitreous Silica." *Physics and Chemistry of Glasses* 5(5):130–136.  
**Status:** Single published equation, no composition dependence needed.
This is a real peer-reviewed fit to measured data. Can be implemented as a
direct fixed formula with no parameters to tune.

---

### Gap 2: High-Alumina / Aluminosilicate (Al₂O₃ > 13 wt%)

**Model:** Giordano, Russell & Dingwell (2008) — GRD model  
**Formula:** `log₁₀(η) = A + B / (C − T)` where A, B, C are computed from
composition via 10-oxide regression  
**Oxides:** SiO₂, TiO₂, Al₂O₃, FeO(T), MgO, CaO, Na₂O, K₂O, H₂O, P₂O₅  
**Valid range:** Natural silicate melts including geological compositions with
high Al₂O₃; also covers industrial aluminosilicates  
**Reference:** Giordano, D.; Russell, J.K.; Dingwell, D.B. (2008). "Viscosity
of magmatic liquids: A model." *Earth and Planetary Science Letters* 271:123–134.  
**Coefficient table:** Freely available in the paper (Table 1, 10×3 matrix).  
**Note:** GRD predicts A, B, C as functions of composition; then the same VTF
inversion logic applies.  
**Status:** Widely cited, validated on ~1800 measurements of silicate melts.
Covers SiO₂ 33–80%, Al₂O₃ 0–27%, useful for high-alumina refractory glasses
and geological melts.

---

### Gap 3: Calcium-Aluminate Slag (CaO > 30%, SiO₂ < 50%, T > liquidus)

**This is not a glass — it is a molten slag above its liquidus temperature.**
The Arrhenius and VTF frameworks used for glass do not apply in the same way.

**Model A — Urbain (1981):**  
`log₁₀(η · T^0.5) = A + B/T` where A and B are functions of optical basicity  
Valid for CaO-Al₂O₃-SiO₂ system, T = 1300–1700°C  
**Reference:** Urbain, G. (1981). "Viscosité de liquides du système CaO-Al₂O₃."
*Rev. Int. Hautes Tempér. Réfract.* 18:155–163.

**Model B — Riboud (1981) — more practical for mixed slags:**  
`η = A · exp(B/T)` (Arrhenius in Pa·s directly, not log) with A and B computed
from slag composition using tabulated coefficients for CaO, SiO₂, Al₂O₃, MgO,
CaF₂, FeO, MnO, Na₂O  
**Reference:** Riboud, P.V. et al. (1981). "Improvement of continuous casting
powders." *Fachberichte Hüttenpraxis Metallweiterverarbeitung* 19(10):859–869.

**Recommendation:** If slag viscosity is needed, implement Riboud (1981) as it
provides explicit composition coefficients and covers the widest range of
industrial slag compositions. Note this requires completely separate service
logic (no VTF, no glass fixed points — slags don't have softening/annealing
points).

---

### Gap 4: Fluoride Glass (pure fluoride, ZBLAN-type)

**No reliable published model with simple coefficients covers ZBLAN and similar
heavy-metal fluoride glasses.**  
Poulain (1977) provides scattered data points but no regression equation.  
A two-parameter Arrhenius fit to the spec's own data table gives very poor
coverage below Tg.

**Recommendation:** Mark as `NOT_SUPPORTED` in the implementation. Return an
error code `FLUORIDE_GLASS_NO_MODEL`. The fluoride glass market is tiny and
these glasses are not used in refractory applications. Do not implement a model
without a real published regression.

---

## 6. Recommended Model Stack

Based on this analysis, the correct set of models to implement is:

| Priority | System | Model | SiO₂ range | Key feature |
|----------|--------|-------|-----------|-------------|
| 1 | Soda-lime-silica and near variants | **Lakatos 1976** | 60–77% | Tightest σ (3–5°C), most validated for commercial glass |
| 2 | Broad oxide glass (borosilicate, lead, SLS outside Lakatos) | **Fluegel 2007** | 43–89% | Widest oxide coverage, ~50 components |
| 3 | High-alumina, geological, refractory aluminosilicate | **Giordano 2008 (GRD)** | 33–80% | Only validated model for Al₂O₃ > 13% |
| 4 | Pure fused silica | **Hetherington 1964** | >99% | Single fixed equation, no composition dependence |
| 5 | Metallurgical slag | **Riboud 1981** | — | Completely separate pipeline, no glass fixed points |
| — | Fluoride glass | **NOT SUPPORTED** | — | No reliable published regression |

**The v2 spec already covers priorities 1 and 2** (Lakatos + Fluegel).  
Priorities 3, 4, 5 are the remaining gaps.

---

## 7. What to Do With the v1 Model Types That Have No Gap

The v1 spec had separate code paths for:
- `SODA_LIME_SILICA` → replaced by Lakatos 1976
- `BOROSILICATE` → replaced by Fluegel 2007 (or fixed NIST params for 717a)
- `LEAD_GLASS` → replaced by Fluegel 2007
- `SODIUM_SILICATE` → replaced by Fluegel 2007
- `MULTI_COMPONENT_MIXING` → replaced by Fluegel 2007 (it covers most of this)

All of these fall within Fluegel 2007's coverage. The separate detection and
parameter tables for these sub-types in v1 are not needed — a single
Lakatos + Fluegel pipeline with composition range checking handles them all.

---

## References

- Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964). *Physics and Chemistry of Glasses* 5(5):130–136.
- Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1972). *Glass Technology* 13(3):88–95. + 1976 update.
- Fluegel, A. (2007). *Glass Technology: Eur. J. Glass Sci. Technol. A* 48(1):13–30.
- Giordano, D.; Russell, J.K.; Dingwell, D.B. (2008). *Earth Planet. Sci. Lett.* 271:123–134.
- Urbain, G. (1981). *Rev. Int. Hautes Tempér. Réfract.* 18:155–163.
- Riboud, P.V. et al. (1981). *Fachberichte Hüttenpraxis Metallweiterverarbeitung* 19(10):859–869.
- NIST SRM 717a Certificate of Analysis (2004). National Institute of Standards and Technology.

