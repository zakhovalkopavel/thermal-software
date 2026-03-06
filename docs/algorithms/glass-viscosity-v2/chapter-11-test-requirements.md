# Chapter 11: Test Requirements

**Part IV: Validation**

---

## Test File Locations

Following project conventions (`docs/SERVICE_TEST_SPEC.md`):

```
backend/test/unit/modules/refractory/
  glass-viscosity-v2/
    composition-encoding.spec.ts
    lakatos-model.spec.ts
    fluegel-model.spec.ts
    vtf-fitting.spec.ts
    fixed-points.spec.ts
    integration.spec.ts
```

---

## Test Suite 1: Composition Encoding

**File:** `composition-encoding.spec.ts`

### 1.1 Lakatos Encoding — wt% → parts/SiO₂

| Test ID | Input | Expected output | Tolerance |
|---|---|---|---|
| ENC-LAK-001 | SiO₂=72, Na₂O=14, CaO=10, Al₂O₃=2, MgO=2 | Na₂O=19.44, CaO=13.89, Al₂O₃=2.78, MgO=2.78 | ±0.01 |
| ENC-LAK-002 | SiO₂=77.02, Na₂O=12.03, CaO=10.12, Al₂O₃=0.19, K₂O=0.13 (S1 glass) | Na₂O=15.619, CaO=13.139, Al₂O₃=0.2467, K₂O=0.1688 | ±0.01 |
| ENC-LAK-003 | SiO₂=0 | Throws `ENCODING_ERROR_SIO2_ZERO` | — |
| ENC-LAK-004 | SiO₂=40 | Throws `ENCODING_ERROR_SIO2_TOO_LOW` | — |
| ENC-LAK-005 | Composition sums to 99.5% | Normalizes and proceeds with warning | — |
| ENC-LAK-006 | Contains TiO₂=3 (not in Lakatos set) | Ignores TiO₂, returns `COMPONENTS_IGNORED` warning | — |

### 1.2 Fluegel Encoding — wt% → mol%

| Test ID | Input | Expected (mol%) | Tolerance |
|---|---|---|---|
| ENC-FLU-001 | SiO₂=71.43, Al₂O₃=1.31, Na₂O=8.25, K₂O=6.27, CaO=9.62, TiO₂=0.32, ZnO=2.81 (NIST 710A) | SiO₂≈76.04, Na₂O≈8.77, K₂O≈4.26, CaO≈10.97, Al₂O₃≈0.82, TiO₂≈0.26, ZnO≈2.21 | ±0.05 |
| ENC-FLU-002 | Any component wt% < 0 | Throws `ENCODING_ERROR_NEGATIVE_COMPONENT` | — |
| ENC-FLU-003 | Single-component 100% SiO₂ | C_SiO₂=100 mol%, regression inputs empty | — |
| ENC-FLU-004 | Unknown oxide present | Warning emitted, component skipped | — |

---

## Test Suite 2: Lakatos Model

**File:** `lakatos-model.spec.ts`

### 2.1 Coefficient Evaluation

| Test ID | Description | Acceptance |
|---|---|---|
| LAK-001 | S1 glass (S1 row from Table 1A): T₂=1503.7, T₄=1054.3, T₆=843.3 | ±1.0°C per level |
| LAK-002 | D9 glass (B₂O₃=2.05): T₂=1373.5, T₄=982.2, T₆=803.4 — tests B₂O₃ quadratic term | ±1.0°C per level |
| LAK-003 | D17 glass (B₂O₃=14.37): T₂=1200.0, T₄=905.3, T₆=772.4 — high B₂O₃ quadratic | ±1.0°C per level |
| LAK-004 | D5 glass (BaO=8.73): T₂=1404.4, T₄=990.9, T₆=798.1 — tests BaO coefficient | ±1.0°C per level |
| LAK-005 | F₂-10 glass (Li₂O=3.0): T₂=1365.4, T₄=939.2, T₆=743.0 — tests Li₂O coefficient | ±1.0°C per level |

### 2.2 Full Validation Dataset Pass (44 glasses)

All 44 rows in the Lakatos validation tables (Chapter 10) must pass:

```
|T_implementation(v) − T_paper(v)| ≤ 1.0°C for v ∈ {2, 4, 6} poise
```

This is a batch test. Each row from the CSV files is fed as input; the expected output is the "Calc. T" column values.

**Note:** Rows with missing MgO (blank cell in CSV, e.g. S10, S14, S18, S22) should be treated as MgO = 0.

### 2.3 Unit Conversion Check

| Test ID | Description | Acceptance |
|---|---|---|
| LAK-UNIT-001 | After Lakatos calculation, the returned VTF point for "log η 2 poise" must be labeled log η = **1 Pa·s** | Exactly 1.0 |
| LAK-UNIT-002 | After Lakatos calculation, the returned VTF point for "log η 4 poise" must be labeled log η = **3 Pa·s** | Exactly 3.0 |
| LAK-UNIT-003 | After Lakatos calculation, the returned VTF point for "log η 6 poise" must be labeled log η = **5 Pa·s** | Exactly 5.0 |

---

## Test Suite 3: Fluegel Model

**File:** `fluegel-model.spec.ts`

### 3.1 Coefficient Evaluation — Linear Terms

| Test ID | Glass | T at log η 1.5 Pa·s | T at log η 6.6 Pa·s | T at log η 12.0 Pa·s | Tolerance |
|---|---|---|---|---|---|
| FLU-001 | NIST 710A | **1314** | **729** | **551** | ±2°C |
| FLU-002 | NIST 717A | **1378** | **731** | **520** | ±2°C |
| FLU-003 | 711 (lead) | **1172** | **614** | **445** | ±2°C |
| FLU-004 | 710 | **1294** | **732** | **564** | ±2°C |
| FLU-005 | DGG I | **1303** | **715** | **535** | ±2°C |

### 3.2 Cross-Product Term Tests

A test composition that exercises the Na₂O×CaO, K₂O×Li₂O, and B₂O₃×Na₂O cross-product terms:

| Test ID | Description |
|---|---|
| FLU-CROSS-001 | NIST 717A (has B₂O₃=16.97, Na₂O=1.03, Li₂O=2.14, K₂O=5.42): verify B₂O₃×Na₂O, B₂O₃×K₂O, B₂O₃×Li₂O cross-product contributions are included in result |
| FLU-CROSS-002 | Manually compute T at log η 12 for a 3-component SLS glass (SiO₂+Na₂O+CaO only), verify the Na₂O×CaO term is correctly included |

### 3.3 Polynomial Term Tests

| Test ID | Description |
|---|---|
| FLU-POLY-001 | A glass with K₂O=15 mol% (excl. SiO₂): verify (K₂O)², (K₂O)³ contribute nonlinearly |
| FLU-POLY-002 | A glass with Li₂O=20 mol% (excl. SiO₂): verify (Li₂O)², (Li₂O)³ terms contribute |

### 3.4 Range Validation

| Test ID | Description |
|---|---|
| FLU-RANGE-001 | Na₂O = 50 mol% (above max 44): returns `OUT_OF_RANGE_COMPONENT` warning |
| FLU-RANGE-002 | SiO₂ = 35 mol% (below min 42.62): returns `OUT_OF_RANGE_SIO2` warning |
| FLU-RANGE-003 | Fe₂O₃ = 3 mol% at log η 6.6 (above max 2.15): returns warning for that level |

---

## Test Suite 4: VTF Fitting

**File:** `vtf-fitting.spec.ts`

### 4.1 Three-Point Exact Solve

| Test ID | Input points | Expected A | Expected B | Expected T₀ | Tolerance |
|---|---|---|---|---|---|
| VTF-001 | (1503.19, 1), (1054.33, 3), (843.30, 5) — S1 Lakatos | ≈ −3.45 | ≈ 6430 | ≈ 57 | A: ±0.05, B: ±20, T₀: ±1 |
| VTF-002 | (1314, 1.5), (729, 6.6), (551, 12) — NIST 710A Fluegel | compute and check physical bounds | B > 0, T₀ > 0 | — |
| VTF-003 | Three collinear points in (T, log η) | Throws `VTF_FIT_SINGULAR` | — | — |
| VTF-004 | Points that result in T₀ ≤ 0 | Throws `VTF_FIT_INVALID_T0` | — | — |
| VTF-005 | Points that result in B ≤ 0 | Throws `VTF_FIT_INVALID_B` | — | — |

### 4.2 Round-Trip Accuracy

For each of the S1 glass VTF parameters:

| Test ID | Check | Tolerance |
|---|---|---|
| VTF-RT-001 | `temperatureAtViscosity(vtf, 1)` ≈ T₁ | ±0.01°C |
| VTF-RT-002 | `temperatureAtViscosity(vtf, 3)` ≈ T₂ | ±0.01°C |
| VTF-RT-003 | `temperatureAtViscosity(vtf, 5)` ≈ T₃ | ±0.01°C |

### 4.3 Fixed-Point Inversion

For S1 glass VTF parameters (A≈−3.45, B≈6430, T₀≈57):

| Test ID | Target log η (Pa·s) | Expected T (°C) | Tolerance |
|---|---|---|---|
| VTF-FP-001 | 6.6 (softening) | ≈ 697 | ±5 |
| VTF-FP-002 | 12.0 (annealing) | ≈ 473 | ±5 |
| VTF-FP-003 | 13.5 (strain) | ≈ 436 | ±5 |
| VTF-FP-004 | 4.0 (flow) | ≈ 839 | ±5 |

### 4.4 Physical Constraint Checks

| Test ID | Description |
|---|---|
| VTF-PHYS-001 | Temperature ordering: strain < annealing < softening < working < melting |
| VTF-PHYS-002 | VTF_T0_LOW warning emitted when T₀ < 50°C |
| VTF-PHYS-003 | VTF_B_EXTREME warning emitted when B > 30000 |

---

## Test Suite 5: Integration

**File:** `integration.spec.ts`

### 5.1 Lakatos Full Pipeline

For each of the 44 Lakatos glasses (Chapter 10):

1. Input composition (wt%) → Lakatos model → three isokom temperatures
2. Convert viscosity labels to Pa·s
3. Fit VTF
4. Evaluate softening point (6.6 Pa·s), annealing point (12 Pa·s), strain point (13.5 Pa·s)
5. Check ordering: strain < annealing < softening < melting

```
|T_isokom_implementation − T_paper| ≤ 1.0°C   (per viscosity level)
All fixed points physically ordered               (no tolerance — must pass exactly)
```

### 5.2 Fluegel Full Pipeline

For each of the 5 in-range Fluegel standards (Chapter 10):

1. Input composition (wt%) → Fluegel model → three isokom temperatures
2. Fit VTF
3. Evaluate all six fixed points

```
|T_isokom_implementation − T_paper_model| ≤ 2.0°C  (per viscosity level)
All fixed points physically ordered                   (must pass exactly)
```

### 5.3 Dual-Model Agreement

For the CO container glass (in scope for both models):
1. Run both Lakatos and Fluegel
2. Compare softening, annealing, strain points
3. Verify `MODELS_DISAGREE` is NOT emitted if difference < 30°C
4. Verify correct model is selected as primary (Lakatos, as it has tighter σ)

### 5.4 Error and Warning Propagation

| Test ID | Scenario | Expected behavior |
|---|---|---|
| INT-WARN-001 | Composition with TiO₂=5 wt% (not in Lakatos set) sent to Lakatos | `COMPONENTS_IGNORED` warning, confidence `REDUCED` |
| INT-WARN-002 | Composition with SiO₂=45 wt% | Lakatos returns error, only Fluegel used |
| INT-WARN-003 | Composition with K₂O=50 mol% excl SiO₂ (above Fluegel max) | `OUT_OF_RANGE_COMPONENT` warning for all three viscosity levels |
| INT-WARN-004 | Both models differ on softening by > 30°C | `MODELS_DISAGREE` system warning |

---

## Acceptance Summary

| Suite | Pass Criterion |
|---|---|
| Composition encoding | All edge cases handled, encoding matches expected values ±0.01 |
| Lakatos isokom | All 44 glasses within ±1.0°C of paper values at all three levels |
| Fluegel isokom | All 5 in-range standards within ±2.0°C of paper model values |
| VTF round-trip | All fitting points reproduced to ±0.01°C |
| VTF fixed-point inversion | Results within ±5°C of expected for S1 and 710A glasses |
| Physical ordering | All 44+5 glasses produce correctly ordered fixed points |
| Warning generation | All documented warning conditions produce the correct warning codes |

---

**Next:** [Chapter 12 — References and Traceability](./chapter-12-references.md)

