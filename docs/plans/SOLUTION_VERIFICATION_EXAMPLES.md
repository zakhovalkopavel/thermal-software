# Plan: Verification examples taken from sources

Status: 🟣 research · Part of [`HEAT_TREATMENT_DATA.md`](HEAT_TREATMENT_DATA.md) (§7) ·
Checks [`SOLUTION_PROPERTY_ALGORITHM.md`](SOLUTION_PROPERTY_ALGORITHM.md) ·
Sources: [`QUENCH_SOURCE_PICKLIST.md`](QUENCH_SOURCE_PICKLIST.md)

## 1. Purpose and rules

A verification example is a number **printed in a source** that a frozen model must reproduce within the
source's stated uncertainty. It answers one question: *how far can the model be trusted here?*

1. Examples are quoted from sources with `ref` and page; none comes from our own scratch calculations or from old code.
2. The model and all its coefficients are fixed **before** an example is evaluated.
3. **No example is used to adjust a model** — no fitting, no scaling factor, no re-selection of a term, no shifted coefficient. A deviation is a finding that is reported as it is.
4. A failing example is never removed, loosened or hidden. The tolerance of a test is the stated uncertainty of the *model's* source and is not widened to make a test pass; a known deviation is recorded in a deviation register with its size, and the test is marked as an expected deviation, not as passing.
5. A code change after a deviation is allowed only when the deviation is traced to a defect (unit, typo, wrong branch) and the change leaves coefficients untouched.
6. Each example carries an **independence class**:
   - `independent` — the source of the example is not among the data used to build the model;
   - `consistency` — the example is probably among the model's fitting data; agreement shows that the implementation is right, not that the model is right;
   - `claim` — printed in a patent or a review without a measurement description; used to flag, never to decide.
7. Disagreement between two sources of examples is stored as two rows, not averaged.

## 2. Result classes

| Class | Condition |
|---|---|
| `agrees` | deviation ≤ stated uncertainty of the model |
| `marginal` | deviation ≤ 2 × stated uncertainty |
| `disagrees` | larger; the model is reported as not supported at that point |
| `no-uncertainty` | the model has no stated uncertainty; the deviation is reported without a class |

## 3. Examples by property

Values below are those printed in the sources; they are expected values, not model results.

### 3.1 Density and viscosity at 20 °C (handbook table; class `consistency`, because such tables are likely among the data the models were fitted to)

| Solute | Mass % | ρ, g/cm³ | η, mPa·s |
|---|---|---|---|
| NaCl | 10 | 1.0707 | 1.193 |
| NaCl | 20 | 1.1478 | 1.557 |
| NaCl | 26 | 1.1972 | 1.990 |
| CaCl₂ | 10 | 1.0835 | 1.319 |
| CaCl₂ | 20 | 1.1775 | 1.930 |
| CaCl₂ | 30 | 1.2816 | 3.467 |
| CaCl₂ | 40 | 1.3957 | 8.997 |
| MgCl₂ | 10 | 1.0826 | 1.570 |
| MgCl₂ | 20 | 1.1742 | 2.867 |
| MgCl₂ | 30 | 1.2763 | 7.017 |
| LiCl | 10 | 1.0560 | 1.411 |
| LiCl | 20 | 1.1150 | 2.128 |
| LiCl | 30 | 1.1791 | 3.785 |
| NaNO₃ | 20 | 1.1429 | 1.263 |
| NaNO₃ | 40 | 1.3175 | 2.226 |

A second, differing basis (to be kept as separate rows): 25 % NaCl at 20 °C, density 1.18 g/cm³, viscosity ≈ 1.6 cP, boiling ≈ 108 °C (a monograph on quenching media). The viscosity differs from the handbook value by about 20 %; both are shown.

### 3.2 Freezing point (ice line)

Freezing-point depression from the same handbook table (class `independent` for the Conde ice-line formulas):

| Solute | Mass % | Depression Δ, °C |
|---|---|---|
| NaCl | 10 / 20 | 6.56 / 16.46 |
| CaCl₂ | 10 / 20 / 30 | 5.86 / 18.30 / 41.00 |
| LiCl | 10 / 14 | 12.61 / 21.04 |
| MgCl₂ | 5 | 3.01 |

Special points of the phase diagrams from the Russian handbook (picklist A3), class `independent`: CaCl₂ eutectic −49.8 °C at 30.5 %; MgCl₂ ice + 12-hydrate −33.6 °C at 20.6 %. The CaCl₂ eutectic read from the Conde figure (about 29.7 %, −54 °C) differs by about 4 K: **check on the page image before use**; if it holds it is a reported disagreement between the two sources.

### 3.3 Solubility and hydrate transitions

| Example | Value | Source | Class |
|---|---|---|---|
| CaCl₂·6H₂O + α-4H₂O | 29.8 °C, 50.2 % | Russian handbook; Conde point B: 29.90 °C, 0.4984 | `independent` (two sources) |
| α-4H₂O + 2H₂O | 45.3 °C, 56.5 % | handbook; Conde point C: 44.96 °C, 0.5663 | `independent` |
| 2H₂O + H₂O | 176 °C, 75.0 % | handbook; Conde point D: 176.33 °C, 0.7486 | `independent` |
| MgCl₂ 6H₂O + 4H₂O | 116.7 °C, 46.2 % | Russian handbook | `independent` once a second source (U5) is acquired |
| MgCl₂ 4H₂O + 2H₂O | 181–182 °C, 55.8 % | handbook | `independent` |
| NaCl saturation | 26.3 % at 0 °C; 26.4 % at 20 °C; 28.2 % at 100 °C | monograph on quenching media | `claim` (handbook-derived) |
| NaCl saturation at the boiling point | 28.9 % at ≈ 108 °C | patent citing a chemistry handbook (1987) | `claim` |

### 3.4 Boiling point at 1 atm and pressure

| Example | Value | Source | Class |
|---|---|---|---|
| CaCl₂ saturated solution boils | 178 °C at 75.3 % | Russian handbook | `independent` |
| MgCl₂ saturated solution boils | 193 °C at 55.6 % | Russian handbook | `independent` |
| NaCl 25 % boils | ≈ 108 °C | monograph on quenching media | `claim` |
| 85 % bischofite (≈ 39.8 % MgCl₂ by mass) bath up to 140 °C | 140 °C | patent; context to confirm | `claim` |
| Tabulated 1 atm boiling points of CaCl₂ and MgCl₂ solutions (Russian reference books, edition to identify) | e.g. CaCl₂ 40.83 % at 120 °C, 57.89 % at 140 °C | acquisition item U6 | `independent` once the source is identified |
| Pure-water saturation pressure and temperature | printed in the water tables | textbook appendix | `independent`, checks the water layer |

For examples of pressure dependence no source value exists yet; the 1 atm points above are used, and the
pressure behaviour is checked for self-consistency (monotonic, `a_w → 1` at `w → 0`, root of `w*` unique).

### 3.5 Quench-level examples (for the engine, not for the property models)

| Example | Value | Source |
|---|---|---|
| Kobasko worked example, `λ = 20`, `a = 4·10⁻⁶`, `α_conv = 1000`, `R = 9 mm`, `T₀ = 800 °C`, `ϑ_uh = 80 K` | `ϑ_I ≈ 26 K`, `ϑ_II ≈ 9 K`, mean surface temperature 118 °C | Kobasko (2022), powder materials |
| Nucleate-boiling HTC at `q = 15 MW/m²`, bath 10 / 20 / 40 / 60 °C | 164 397 / 218 785 / 233 302 / 271 298 W/(m²·K) (average of two models) | Kobasko, heat-transfer fundamentals |
| `Ω(Bi)` | 5.40 at 0.1; 3.11 at 1; 0.75 at 10; 0.56 at 12 | Kobasko (2022), contemporary methods |
| Cooling time 875 → 200 °C, surface / centre | water 20 °C 1.2 / 8.6 s; 5 % NaCl 20 °C 0.48 / 7.4 s; 5 % NaOH 20 °C 0.31 / 7.8 s | French & Hamill (1929), Table 3 |
| Experiments with no film boiling | 12 % and 8 % CaCl₂, 6 % Na₂CO₃ (AISI 304 10×50 mm); 12 % NaCl (AISI 1030 cube 100 mm); all at 20 °C | Kobasko et al., tools in salt solutions |

The Kobasko examples are evaluated with the ϑ equations as printed; whether the printed number is reproduced
is a statement about our implementation (the example has no stated uncertainty).

## 4. Protocol

1. Freeze: the code revision and the coefficient datasets are recorded for the run.
2. Evaluate every applicable example of §3 for the chosen model.
3. Classify (§2), store the deviation, the class of independence and the revision in the report.
4. Report in `tmp/reports/` and as a table in the docs: property × salt × example × deviation × class.
5. Update the deviation register. Never edit a coefficient in response to a row of the report.
6. Tests: unit tests use the examples as expected values; tests for the `disagrees` cases are marked as
   expected deviations with the register entry; a new deviation fails the test run.

## 5. Not allowed as examples

- Results of scratch scripts and of any library without a traced source.
- The table of "saturated solutions" of unknown origin.
- The compositions of the natural brines until their charge balance is resolved ([`QUENCH_SOURCE_PICKLIST.md`](QUENCH_SOURCE_PICKLIST.md) §4).
- Values read from a figure without calibrated axes.
