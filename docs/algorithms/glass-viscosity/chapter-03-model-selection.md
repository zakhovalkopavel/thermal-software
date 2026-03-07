# Chapter 3: Model Applicability and Selection

**Part I: Background and Approach**

---

## Side-by-Side Comparison

| Property | Lakatos 1976 | Fluegel 2007 |
|---|---|---|
| **Viscosity levels** | log η 2, 4, 6 poise (= 1, 3, 5 Pa·s) | log η 1.5, 6.6, 12 Pa·s |
| **Component set** | 11 components + SiO₂ reference | ~56 components (full tables 4–6) |
| **Composition encoding** | Parts per 100 parts SiO₂ by weight | Mol% excluding SiO₂ |
| **ASTM softening point coverage** | Extrapolated via VTF from log η 5 | Directly at log η 6.6 Pa·s |
| **ASTM annealing point coverage** | Extrapolated via VTF from log η 5 | Directly at log η 12 Pa·s |
| **Reported σ (training data)** | 3.14–4.63°C | 9–17°C |
| **Primary glass system** | Soda-lime-silica, narrow SLS range | All commercial glass types |
| **B₂O₃ handling** | Linear + quadratic term | Linear + quadratic or cubic term |
| **Interaction terms** | None | Up to cubic cross-products |
| **Number of training glasses** | ~44 (pooled from 4 papers) | Thousands (from SciGlass database) |
| **Mixed alkali effect** | Not captured | Captured via cross-product terms |
| **Data source** | Single laboratory (Lakatos group) | Multi-laboratory (SciGlass, corrected) |

---

## Applicability Rules

### Lakatos 1976 — Use when:

1. The glass is a silicate (SiO₂ ≥ 60 wt%) with components limited to:
   `SiO₂, Al₂O₃, Na₂O, K₂O, Li₂O, CaO, MgO, BaO, ZnO, PbO, B₂O₃`
2. No other components are present in amounts > 1 wt%
3. Composition is within the training range (see Chapter 4, validity table)
4. High accuracy is required for the melting/working range (log η 1–5 Pa·s)
5. Only the above 11 components are present — all others are silently ignored

**What to do with components outside the Lakatos set:**
Components not in the table (e.g., TiO₂, ZrO₂, SrO, Fe₂O₃) are **silently ignored** in Lakatos calculations. Their presence does not cause an error, but:
- If any ignored component exceeds 2 wt%, emit a `WARNING_COMPONENTS_IGNORED` confidence note
- If the sum of ignored components exceeds 5 wt%, downgrade the confidence to `LOW`

### Fluegel 2007 — Use when:

1. The glass contains components beyond the Lakatos 11-component set
2. The glass may be borosilicate, lead crystal, or a complex multi-oxide system
3. The glass has components present in the Fluegel coefficient tables
4. Moderate accuracy (±17°C at 2σ) is acceptable
5. The composition is within the bounds in `Fluegel_table3.csv`

**What to do with components outside the Fluegel set:**
Components not present in tables 4–6 are silently ignored. If any such component exceeds 1 wt%, emit a `WARNING_COMPONENTS_IGNORED` note.

### Dual-Model Mode — Use when:

Both conditions are met simultaneously:
1. The composition falls within Lakatos validity range
2. All Fluegel components are within `Fluegel_table3.csv` bounds

In dual-model mode:
- Run both models independently
- Produce two separate VTF fits
- Report both sets of fixed-point temperatures
- Compare: if all fixed points agree within 30°C, report the Lakatos result as primary (tighter σ)
- If any fixed point disagrees by > 30°C, report both and flag `MODELS_DISAGREE`

---

## Validity Ranges Summary

### Lakatos 1976 Composition Range

Derived from the 44 training samples in `page_003_table_001.csv` and `page_004_table_002.csv`:

| Component | Typical range in training data (wt%) | Hard limit used |
|---|---|---|
| SiO₂ | 60–80 | Must be > 50 wt% |
| Al₂O₃ | 0–8 | — |
| Na₂O | 0–15 | — |
| K₂O | 0–9 | — |
| Li₂O | 0–3 | — |
| CaO | 0–14 | — |
| MgO | 0–7 | — |
| BaO | 0–12 | — |
| ZnO | 0–8 | — |
| PbO | 0–19 | — |
| B₂O₃ | 0–17 | Quadratic valid to ~20 wt% |

If SiO₂ < 50 wt%, the Lakatos model cannot be used (the encoding `parts per 100 SiO₂` becomes unreliable).

### Fluegel 2007 Composition Range

See `Fluegel_table3.csv`. The table provides maximum mol% (excl. SiO₂) for each component at each viscosity level. SiO₂ itself has both a minimum (42.62 mol%) and maximum (89.2 mol%) bound.

---

## Decision Flowchart

```
Input composition (wt%)
         │
         ▼
SiO₂ > 99 wt%?
    └─ YES ──► HETHERINGTON_1964 (Arrhenius for pure fused silica)

         │ NO
         ▼
Slag detected?  (CaO > 20% AND SiO₂ < 50%) OR (FeO > 10%) OR (CaO+Al₂O₃ > 60% AND SiO₂ < 45%)
    └─ YES ──► X_CaF₂ > 0.08 molar or W_CaF₂ > 10 wt%?
                  ├─ YES ──► NAKAMOTO_2007  (pending — ch. 13)
                  └─ NO  ──► IIDA           (pending — ch. 13)

         │ NO
         ▼
Total fluorides > 20 wt% AND SiO₂ < 30 wt%?
    └─ YES ──► NOT_SUPPORTED (pure fluoride glass — no reliable regression)

         │ NO
         ▼
SiO₂ > 50 wt%?
    ├─ NO ──► NOT_SUPPORTED (neither Lakatos nor Fluegel valid below SiO₂ = 50%)
    └─ YES
         │
         ▼
All non-zero components in {SiO₂, Al₂O₃, Na₂O, K₂O, Li₂O, CaO, MgO, BaO, ZnO, PbO, B₂O₃}
AND within Lakatos validity ranges (Na₂O 10–17%, SiO₂ 60–77%)?
    ├─ YES ──► LAKATOS_1976
    └─ NO  ──► FLUEGEL_2007
```

---

## Model Standard Errors

These are the errors to quote in confidence notes and use for uncertainty propagation (Chapter 9):

### Lakatos 1976

| Viscosity level | Standard deviation σ |
|---|---|
| log η = 2 poise (1 Pa·s) | 4.63°C |
| log η = 4 poise (3 Pa·s) | 3.34°C |
| log η = 6 poise (5 Pa·s) | 3.14°C |

A 95% confidence interval on any single predicted isokom temperature is approximately **±2σ**, i.e., ±6.3–9.3°C.

### Fluegel 2007

The paper reports overall model standard errors of **9–17°C** (R² = 0.985–0.989) across all three viscosity levels. The exact per-level values are not separately tabulated; conservatively use **17°C** as σ for all three levels when computing confidence intervals.

A 95% confidence interval on any single predicted isokom temperature is approximately **±34°C**.

---

**Next:** [Chapter 4 — Lakatos 1976 Model](./chapter-04-lakatos-1976.md)

