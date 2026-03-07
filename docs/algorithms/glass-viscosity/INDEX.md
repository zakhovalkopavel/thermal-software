# Glass Viscosity — Index

## Part I: Background and Approach

- [Chapter 1 — Design Goals and Architecture](./chapter-01-design-goals.md)
- [Chapter 2 — Source Data and Traceability](./chapter-02-source-data.md)
- [Chapter 3 — Model Applicability and Selection](./chapter-03-model-selection.md)

## Part II: Silicate Glass Model Implementations

- [Chapter 4 — Lakatos 1976 Model](./chapter-04-lakatos-1976.md)
- [Chapter 5 — Fluegel 2007 Model](./chapter-05-fluegel-2007.md)
- [Chapter 6 — Composition Encoding](./chapter-06-composition-encoding.md)
- [Chapter 7 — VTF Fitting](./chapter-07-vtf-fitting.md)

## Part III: Extended Systems

- [Chapter 13 — Slag and Fluoride Melt Viscosity](./chapter-13-slags-fluoride.md)
  *(Iida model, Nakamoto 2007, Mills/NPL liquidus — pending implementation)*

## Part IV: Output Structures, Confidence and Validation

- [Chapter 8 — Output Structures](./chapter-08-output-structures.md)
- [Chapter 9 — Error and Confidence Estimation](./chapter-09-confidence.md)
- [Chapter 10 — Validation Dataset](./chapter-10-validation-dataset.md)
- [Chapter 11 — Test Requirements](./chapter-11-test-requirements.md)

## Part V: Reference

- [Chapter 12 — References and Traceability](./chapter-12-references.md)
- [Chapter 14 — Implementation State](./chapter-14-implementation-state.md)

---

## Quick Reference: Model Selection

| Composition | Model | Type |
|-------------|-------|------|
| SiO₂ > 99 wt% | Hetherington 1964 | Arrhenius |
| SiO₂ 60–77%, Na₂O 10–17%, SLS components only | Lakatos 1976 | VTF (via isokom) |
| Broad silicate oxide glass | Fluegel 2007 | VTF (via isokom) |
| Industrial slag, CaF₂ ≤ 8 mol% | Iida (pending) | Modified Weymann-Frenkel |
| Fluoride-bearing slag, CaF₂ > 5 mol% | Nakamoto 2007 (pending) | Modified Arrhenius |
| Pure fluoride glass (ZBLAN-type) | NOT_SUPPORTED | — |

