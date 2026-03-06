# Glass Viscosity V2 — Chapter Index

## Navigation

**START HERE:** [README.md — Overview and Architecture](./README.md)

---

## All Chapters

### Part I: Background and Approach

| # | Chapter | Content |
|---|---|---|
| 1 | [Design Goals and Architecture](./chapter-01-design-goals.md) | Two-stage architecture, VTF convention, scope, units policy |
| 2 | [Source Data and Traceability](./chapter-02-source-data.md) | All CSV files described, critical encoding warnings |
| 3 | [Model Applicability and Selection](./chapter-03-model-selection.md) | Side-by-side comparison, decision flowchart, validity ranges |

### Part II: Model Implementations

| # | Chapter | Content |
|---|---|---|
| 4 | [Lakatos 1976 Model](./chapter-04-lakatos-1976.md) | Formula, full coefficient table, step-by-step algorithm, worked example (S1 glass) |
| 5 | [Fluegel 2007 Model](./chapter-05-fluegel-2007.md) | Formula, all three coefficient tables, cross-product notation, worked example (NIST 710A) |
| 6 | [Composition Encoding Utilities](./chapter-06-composition-encoding.md) | wt%→parts/SiO₂ (Lakatos) and wt%→mol% (Fluegel) algorithms, molar mass table |
| 7 | [VTF Fitting Layer](./chapter-07-vtf-fitting.md) | Three-point analytical solve, determinant form, fixed-point inversion, physical constraints |

### Part III: Output and Confidence

| # | Chapter | Content |
|---|---|---|
| 8 | [Output Structures](./chapter-08-output-structures.md) | TypeScript interfaces: VtfParameters, FixedPoints, LakatosResult, FluegelResult, GlassViscosityV2Result |
| 9 | [Error and Confidence Estimation](./chapter-09-confidence.md) | Uncertainty propagation, confidence level rules, warning generation, dual-model comparison |

### Part IV: Validation

| # | Chapter | Content |
|---|---|---|
| 10 | [Validation Dataset](./chapter-10-validation-dataset.md) | All 44 Lakatos glasses + 6 Fluegel standards with expected values |
| 11 | [Test Requirements](./chapter-11-test-requirements.md) | Test suites, test IDs, acceptance tolerances |

### Part V: Reference

| # | Chapter | Content |
|---|---|---|
| 12 | [References and Traceability](./chapter-12-references.md) | Full citations, standard glass IDs, CSV traceability matrix |

---

## Quick Access by Task

### "I want to implement the Lakatos model"
→ [Chapter 6: Composition encoding](./chapter-06-composition-encoding.md) → [Chapter 4: Lakatos formula and coefficients](./chapter-04-lakatos-1976.md) → [Chapter 7: VTF fitting](./chapter-07-vtf-fitting.md)

### "I want to implement the Fluegel model"
→ [Chapter 6: Composition encoding](./chapter-06-composition-encoding.md) → [Chapter 5: Fluegel formula and coefficients](./chapter-05-fluegel-2007.md) → [Chapter 7: VTF fitting](./chapter-07-vtf-fitting.md)

### "I want to understand which model to use"
→ [Chapter 3: Model selection](./chapter-03-model-selection.md)

### "I want to know what outputs to produce"
→ [Chapter 8: Output structures](./chapter-08-output-structures.md)

### "I want to write tests"
→ [Chapter 10: Validation dataset](./chapter-10-validation-dataset.md) → [Chapter 11: Test requirements](./chapter-11-test-requirements.md)

### "I'm getting a suspicious result — what could be wrong?"
→ [Chapter 1: Common pitfalls summary](./chapter-01-design-goals.md) → [Chapter 2: Critical encoding notes](./chapter-02-source-data.md#critical-encoding-notes) → [Chapter 9: Warning codes](./chapter-09-confidence.md)

---

## Key Numbers at a Glance

| Item | Value |
|---|---|
| Lakatos σ at log η 1 Pa·s | 4.63°C |
| Lakatos σ at log η 3 Pa·s | 3.34°C |
| Lakatos σ at log η 5 Pa·s | 3.14°C |
| Fluegel SE (conservative) | 17°C |
| Lakatos training glasses | 44 |
| Fluegel validation standards | 6 (5 in-range) |
| Poise → Pa·s conversion | log η (Pa·s) = log η (poise) − 1 |
| Lakatos viscosity levels (poise) | 2, 4, 6 |
| Lakatos viscosity levels (Pa·s) | 1, 3, 5 |
| Fluegel viscosity levels (Pa·s) | 1.5, 6.6, 12.0 |
| ASTM softening point | log η = 6.6 Pa·s |
| ASTM annealing point | log η = 12.0 Pa·s |
| ASTM strain point | log η = 13.5 Pa·s |

---

**Previous spec:** [Glass Viscosity V1](../glass-viscosity/INDEX.md) (kept as-is for reference)

