# Glass Viscosity V2 — Specification

**Two-Stage Isokom + VTF Architecture**

---

## What This Spec Covers

This specification defines a new glass viscosity service based on two peer-reviewed empirical models:

| Model | Reference | Viscosity levels predicted | Unit system |
|---|---|---|---|
| **Lakatos 1976** | Lakatos et al., *Glass Techn.* Aug 1976 | log η = 2, 4, 6 (poise) | wt% per 100 parts SiO₂ |
| **Fluegel 2007** | Fluegel, *Glass Technol.* 48(1) 2007 | log η = 1.5, 6.6, 12 (Pa·s) | mol% excluding SiO₂ |

Both models predict temperatures at **fixed viscosity levels** (isokom temperatures). A shared **Vogel-Tammann-Fulcher (VTF) fitting layer** uses those three predicted temperatures to fit a continuous viscosity curve, from which any ASTM fixed-point temperature can be derived.

---

## Why This Replaces V1

The v1 specification used Arrhenius-based approximations with constant per-component coefficients. Its fundamental problems are documented in [v1 Chapter 1](../glass-viscosity/chapter-01-current-issues.md). The v1 spec is **preserved as-is** for reference.

The key differences in v2:

- All coefficients are verbatim from the source papers — no arbitrary constants
- The B₂O₃ non-linearity (boron anomaly) is captured by the quadratic terms in both models
- Mixed alkali and other interaction effects are captured by cross-product terms (Fluegel)
- Every model prediction carries a confidence estimate based on the reported model standard error
- VTF fitting guarantees physically consistent temperature ordering for all ASTM fixed points

---

## Architecture

```
Composition (wt%)
       │
       ├─── [Encoding: wt% → parts/SiO₂] ──► Lakatos 1976 regression ──► T₂, T₄, T₆ (°C at log η = 2, 4, 6 poise)
       │                                                                           │
       └─── [Encoding: wt% → mol% excl. SiO₂] ─► Fluegel 2007 regression ──► T₁·₅, T₆·₆, T₁₂ (°C at log η = 1.5, 6.6, 12 Pa·s)
                                                                                   │
                                         ┌─────────────────────────────────────────┘
                                         ▼
                              VTF fit: log η = A + B/(T − T₀)
                              (three-point exact solve)
                                         │
                                         ▼
                              Any ASTM fixed-point temperature
                              (melting, working, softening, annealing, strain)
```

---

## Chapters

| # | File | Content |
|---|---|---|
| 1 | [chapter-01-design-goals.md](./chapter-01-design-goals.md) | Architecture, scope, units policy |
| 2 | [chapter-02-source-data.md](./chapter-02-source-data.md) | CSV file index, traceability, critical encoding notes |
| 3 | [chapter-03-model-selection.md](./chapter-03-model-selection.md) | Side-by-side comparison, applicability rules |
| 4 | [chapter-04-lakatos-1976.md](./chapter-04-lakatos-1976.md) | Full Lakatos model, coefficient tables, worked example |
| 5 | [chapter-05-fluegel-2007.md](./chapter-05-fluegel-2007.md) | Full Fluegel model, coefficient tables, worked example |
| 6 | [chapter-06-composition-encoding.md](./chapter-06-composition-encoding.md) | Encoding algorithms for both models |
| 7 | [chapter-07-vtf-fitting.md](./chapter-07-vtf-fitting.md) | VTF three-point solve, fixed-point inversion |
| 8 | [chapter-08-output-structures.md](./chapter-08-output-structures.md) | TypeScript interfaces |
| 9 | [chapter-09-confidence.md](./chapter-09-confidence.md) | Error propagation, confidence intervals, warnings |
| 10 | [chapter-10-validation-dataset.md](./chapter-10-validation-dataset.md) | Lakatos 44 glasses + Fluegel 6 standards |
| 11 | [chapter-11-test-requirements.md](./chapter-11-test-requirements.md) | Test suites, acceptance tolerances |
| 12 | [chapter-12-references.md](./chapter-12-references.md) | Full citations, traceability matrix |

---

## Source Data Files

```
shared/sources/lakatos_ocr/
  Lakatos_1976.txt            ← original paper OCR text
  page_001_table_007.csv      ← regression coefficients for T at log η 2, 4, 6
  page_002_table_006.csv      ← VTF constants B, A, T₀ as regression coefficients
  page_002_table_007.csv      ← standard deviations σ per viscosity level
  page_003_table_001.csv      ← validation dataset part A (30 glasses)
  page_004_table_002.csv      ← validation dataset part B (14 glasses in groups F₂, FAL)

shared/sources/fluegel_2007/
  fluegel_2006.txt            ← original paper OCR text
  Fluegel_table1.csv          ← 7 reference glass compositions (mol%)
  Fluegel_table2.csv          ← model comparison at log η 1.5 (melting point)
  Fluegel_table3.csv          ← composition validity ranges per component per viscosity level
  Fluegel_table4.csv          ← regression coefficients for T at log η 1.5 Pa·s
  Fluegel_table5.csv          ← regression coefficients for T at log η 6.6 Pa·s
  Fluegel_table6.csv          ← regression coefficients for T at log η 12.0 Pa·s
  Fluegel_table12.csv         ← experimental vs model isokom temperatures for 6 standards
```

---

**Start reading:** [Chapter 1 — Design Goals & Approach](./chapter-01-design-goals.md)

