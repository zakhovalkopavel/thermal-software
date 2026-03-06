# Slag & Fluoride Melt Viscosity — Expansion Plan

**Date:** 2026-03-06  
**Scope:** Add Urbain (1981) and Riboud (1981) models for slags and fluoride
melts; clarify when Fluegel 2007 can also be used for those systems.

---

## 1. What Must Be Corrected (from VISCOSITY_PARAMETERS_AUDIT + COVERAGE_GAP_ANALYSIS)

### 1.1 `SLAG_CAO_AL2O3` — removed in the 2026-03-06 audit

The old enum entry was deleted because:

- **Wrong model architecture:** a simple Arrhenius with component-effect-on-B
  deltas has no published basis for slag.  
- **Wrong formula convention:** code used `ln(η) = A + B/T` but compared the
  result as log₁₀, producing a systematic ~2.3× under-prediction.  
- **Wrong model entirely:** the correct approach for industrial slags is the
  Urbain / Riboud framework (`log₁₀(η) = A + 1000·B/T` with A and B derived
  from slag composition via separate regression equations).

### 1.2 `FLUORIDE_GLASS` — removed in the 2026-03-06 audit

The old enum entry was deleted because:

- Parameters (A = −4.0, B = 8 000 K, T₀ = 150 K) produced errors of
  +4–5 log units versus the Poulain (1977) data.  
- T₀ = 150 K is physically unreasonable (should be ~250–350 K for fluoride
  glass near Tg).  
- No reliable multi-component regression exists for ZBLAN-type pure fluoride
  glass; it should remain `NOT_SUPPORTED`.

However, for **oxide-fluoride mixed melts** (fluorine as a minor flux in a
silicate or slag matrix), both Fluegel 2007 (F up to 10.31 mol%) and Riboud
(CaF₂ as an explicit coefficient) provide validated coverage and must be added.

---

## 2. What Must Be Added

### 2.1 Urbain (1981) — CaO-Al₂O₃-SiO₂ system

| Property | Detail |
|----------|--------|
| Full reference | Urbain, G. (1981). "Viscosité de liquides du système CaO-Al₂O₃." *Rev. Int. Hautes Tempér. Réfract.* 18:155–163 |
| Formula | `log₁₀(η · T^0.5) = A_m + B_m/T` where A_m and B_m are derived from optical basicity (Λ) of the melt |
| System | CaO-Al₂O₃-SiO₂ above liquidus |
| Valid T range | 1300–1700°C |
| Valid composition | CaO 0–60%, Al₂O₃ 0–40%, SiO₂ 0–60% (melt must be above liquidus) |
| Not valid for | Glasses below liquidus; high-MgO or high-FeO slags without correction |
| Enum key | `URBAIN_1981` |

### 2.2 Riboud (1981) — industrial mixed slag (continuous casting powders)

| Property | Detail |
|----------|--------|
| Full reference | Riboud, P.V.; Roux, Y.; Lucas, L.D.; Gaye, H. (1981). "Improvement of continuous casting powders." *Fachberichte Hüttenpraxis Metallweiterverarbeitung* 19(10):859–869 |
| Formula | `η = A · exp(B/T)` (Pa·s, Arrhenius); A and B computed from composition coefficients for CaO, SiO₂, Al₂O₃, MgO, CaF₂, FeO, MnO, Na₂O |
| System | Industrial mixed slags including mould powder slags; fluoride-bearing slags |
| Valid T range | 1300–1600°C |
| Valid composition | Explicitly covers CaF₂ (fluoride flux) as a tabulated coefficient |
| Advantage over Urbain | More components (8 vs 3); explicit CaF₂ term covers fluoride-bearing slags |
| Enum key | `RIBOUD_1981` |

### 2.3 Fluegel (2007) — partial overlap with oxide-fluoride glasses

| System | Fluegel applicability |
|--------|-----------------------|
| Low-F oxide-fluoride glass (F < 10.31 mol%) | ✅ Covered — F is an explicit coefficient in Fluegel table 3 |
| Fluoride-bearing slag (F > 10 mol%, SiO₂ < 42%) | ❌ Outside Fluegel — use Riboud |
| Pure fluoride glass (ZBLAN, etc.) | ❌ Outside all models — `NOT_SUPPORTED` |

---

## 3. What Must Be Removed (already done) and Why

| Old enum key | Status | Reason |
|---|---|---|
| `SODA_LIME_SILICA` | Removed 2026-03-06 | Fake architecture (component-effect-on-B); see audit §1 |
| `BOROSILICATE` | Removed 2026-03-06 | NIST params misapplied with component effects; see audit §2 |
| `ALUMINOSILICATE` | Removed 2026-03-06 | Completely fabricated parameters; see audit §3 |
| `LEAD_GLASS` | Removed 2026-03-06 | Wrong log convention (ln vs log₁₀); see audit §4 |
| `PURE_SILICA` | Removed 2026-03-06 | B = 13 500 K instead of ~31 400 K; see audit §5 |
| `SODIUM_SILICATE` | Removed 2026-03-06 | T₀ too low, diverges at T < 800°C; see audit §6 |
| `SLAG_CAO_AL2O3` | Removed 2026-03-06 | Wrong convention + wrong model; see audit §7 |
| `FLUORIDE_GLASS` | Removed 2026-03-06 | T₀ = 150 K unphysical; no reliable regression; see audit §8 |
| `MULTI_COMPONENT_MIXING` | Removed 2026-03-06 | Softening 1413°C — completely unreasonable; see audit §9 |

---

## 4. Complete Target Enum After This Change

```
ViscosityModel {
  LAKATOS_1976        // Soda-lime-silica and near variants (SiO₂ 60–77%, Na₂O 10–17%)
  FLUEGEL_2007        // Broad silicate oxide glass incl. low-F oxide-fluoride (SiO₂ 43–89%)
  HETHERINGTON_1964   // Pure fused silica only (SiO₂ > 99%)
  URBAIN_1981         // CaO-Al₂O₃-SiO₂ slag above liquidus (1300–1700°C)
  RIBOUD_1981         // Industrial mixed slag + fluoride-bearing slag (explicit CaF₂ term)
  NOT_SUPPORTED       // Pure fluoride glass, high-FeO slag outside Riboud range, etc.
}
```

---

## 5. Model Selection Logic (updated)

```
Input composition
  │
  ├─ SiO₂ > 99 wt%                        → HETHERINGTON_1964
  │
  ├─ SiO₂ 60–77%, Na₂O 10–17%, no slag    → LAKATOS_1976  (tightest σ)
  │      (if out of Lakatos range)         → FLUEGEL_2007
  │
  ├─ Silicate glass, SiO₂ 43–89%          → FLUEGEL_2007
  │   incl. low-F oxide-fluoride (F < 10 mol%)
  │
  ├─ Slag / melt above liquidus
  │   ├─ CaO-Al₂O₃-SiO₂, T 1300–1700°C   → URBAIN_1981
  │   ├─ Mixed slag incl. CaF₂, FeO, MgO  → RIBOUD_1981   (preferred for industry)
  │   └─ Both applicable?                 → prefer RIBOUD_1981, offer URBAIN_1981
  │
  ├─ Fluoride-bearing slag (CaF₂ present) → RIBOUD_1981
  │
  └─ Pure fluoride glass / outside all    → NOT_SUPPORTED
```

---

## 6. Important Notes

- **Urbain and Riboud are slag models, not glass models.** They predict liquid
  slag viscosity above the liquidus. They do not predict softening points,
  annealing points, or strain points. The VTF pipeline used for glass (Lakatos,
  Fluegel) does not apply to these models.
- **Riboud formula is Arrhenius in Pa·s directly** (`η = A·exp(B/T)`), not VTF
  and not log₁₀. Implementation must handle this separately.
- **Urbain formula uses `η·T^0.5`** form; the viscosity is extracted as
  `η = 10^(A_m + B_m/T) / T^0.5`.
- **Fluegel covers fluorine** (F up to 10.31 mol%) as a proper coefficient.
  For oxide-fluoride mixed glasses within this limit, Fluegel is valid and
  preferred over Riboud (which is calibrated above liquidus).

---

## 7. References

- Urbain, G. (1981). "Viscosité de liquides du système CaO-Al₂O₃." *Revue Internationale des Hautes Températures et des Réfractaires* 18:155–163.
- Riboud, P.V.; Roux, Y.; Lucas, L.D.; Gaye, H. (1981). "Improvement of continuous casting powders." *Fachberichte Hüttenpraxis Metallweiterverarbeitung* 19(10):859–869.
- Fluegel, A. (2007). "Glass viscosity calculation based on a global statistical modelling approach." *Glass Technology: European Journal of Glass Science and Technology Part A* 48(1):13–30.
- Hetherington, G.; Jack, K.H.; Kennedy, J.C. (1964). "The Viscosity of Vitreous Silica." *Physics and Chemistry of Glasses* 5(5):130–136.
- Lakatos, T.; Johansson, L-G.; Simmingskőld, B. (1972/1976). *Glass Technology* 13(3):88–95 + 1976 update.
- COVERAGE_GAP_ANALYSIS.md — section 5 (Gap 3) and section 6.
- VISCOSITY_PARAMETERS_AUDIT.md — section 7 (SLAG_CAO_AL2O3 root cause).

