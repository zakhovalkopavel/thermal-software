# Chapter 1: Design Goals and Architecture

**Part I: Background and Approach**

---

## Why V1 Failed

The v1 implementation used a single Arrhenius model with constant per-component viscosity coefficients. The full problem analysis is in [v1 Chapter 1](../glass-viscosity/chapter-01-current-issues.md). The core defects were:

1. **Constant component coefficients** — real effects depend on concentration and co-modifier context
2. **No B₂O₃ non-linearity** — the boron anomaly is well-known but was not captured
3. **Fixed-point offsets** — `workingPoint = softeningPoint + 100°C` is composition-independent nonsense
4. **Unvalidated arbitrary constants** — no literature provenance for any coefficient
5. **Wrong equation form** — Arrhenius `η = A·exp(B/T)` is known to be inferior to VTF for glass

**This spec replaces all of that with coefficients directly from peer-reviewed papers and a VTF-based architecture.**

---

## Two-Stage Architecture

Glass viscosity prediction in this spec works in two stages:

### Stage 1 — Isokom Temperature Regression

An **isokom temperature** is the temperature at which a specific glass reaches a specific viscosity. The two regression models each predict isokom temperatures at three fixed viscosity levels:

| Model | Viscosity levels (Pa·s) | Viscosity levels (poise) |
|---|---|---|
| Lakatos 1976 | log η = 1, 3, 5 Pa·s | log η = 2, 4, 6 poise |
| Fluegel 2007 | log η = 1.5, 6.6, 12 Pa·s | log η = 2.5, 7.6, 13 poise |

The conversion is: **log η (Pa·s) = log η (poise) − 1** (exactly, because 1 Pa·s = 10 poise).

Each model uses a different composition encoding and covers a different component set. The output of Stage 1 is three (temperature, log η) pairs.

### Stage 2 — VTF Curve Fit

The three (T, log η) pairs from Stage 1 are used to fit the **Vogel-Tammann-Fulcher equation**:

```
log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
```

With exactly three points, the system of three equations in three unknowns (A, B, T₀) has a unique analytic solution. The fitted VTF curve then provides temperatures at **any** ASTM fixed-point viscosity by inversion:

```
T = B / (log η − A) + T₀
```

This guarantees that all ASTM fixed-point temperatures are derived from the **same physically consistent curve**.

---

## VTF Equation Convention

This spec uses the **Fluegel convention** throughout:

```
log₁₀(η [Pa·s]) = A + B / (T [°C] − T₀)
```

Note: Some literature (including Lakatos 1976) writes:

```
T = B / (log η [poise] + A) + T₀
```

These are the same equation rearranged; both use temperature in °C. The Fluegel convention is adopted here because:
- Pa·s is the SI unit (used in Fluegel tables and ASTM C965-96)
- The A + B/(T−T₀) form makes it obvious that A is the high-temperature limit of log η
- All fixed-point definitions in this spec use Pa·s

When consuming Lakatos isokom temperatures, the viscosity values must be converted: **log η (Pa·s) = log η (poise) − 1**.

---

## Scope and Limitations

### In Scope
- Multi-component silicate glasses where SiO₂ is the dominant network former
- Compositions within the validated ranges of Lakatos 1976 or Fluegel 2007
- Temperature range approximately 400–1600°C
- All six ASTM C965-96 fixed points

### Out of Scope
- Pure oxide systems (binary or ternary phase diagrams)
- Slag systems (high FeO, high CaO without SiO₂ network) — see [Chapter 13](./chapter-13-slags-fluoride.md) for the Iida and Nakamoto 2007 models
- Phosphate glasses (PO₄ network)
- Metallic glasses
- Temperatures above 1600°C or below 400°C for silicate glasses

---

## Units Policy

| Quantity | Unit used in this spec | Note |
|---|---|---|
| Temperature | °C | All model inputs and outputs |
| Viscosity | Pa·s | SI unit; log₁₀ scale |
| Composition (Lakatos encoding) | parts per 100 parts SiO₂ by weight | See Chapter 6 |
| Composition (Fluegel encoding) | mol% excluding SiO₂ | See Chapter 6 |
| Composition (user input) | wt% (normalized to 100%) | Raw input from user |
| Pressure | — | Viscosity is at 1 atm only |

---

**Next:** [Chapter 2 — Source Data and Traceability](./chapter-02-source-data.md)

