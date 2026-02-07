# Chapter 2: ASTM Standards and Fixed Points

**Part I: Problem Definition and Background**

---

## ASTM C965-96(2012) Standard

### Official Title
"Standard Practice for Measuring Viscosity of Glass Above the Softening Point"

### Reference
- **Organization:** ASTM International
- **URL:** https://www.astm.org/c0965-96r12.html
- **Status:** Active standard (reapproved 2012)
- **Scope:** High-temperature glass viscosity measurements

---

## Unit System: Poise vs Pascal·second

### Critical Conversion
**ASTM C965-96 defines viscosity in POISE**

**Conversion factor:**
```
1 Pa·s = 10 poise
1 poise = 0.1 Pa·s
```

### Why This Matters

Historical glass literature uses **poise**:
- Softening point: 10^7.6 poise
- Annealing point: 10^13 poise

Modern physics uses **Pa·s**:
- Softening point: 10^6.6 Pa·s
- Annealing point: 10^12 Pa·s

**Always verify units when comparing to literature!**

---

## ASTM C965-96 Fixed Points

### Complete Table

| Fixed Point | ASTM Viscosity (poise) | Viscosity (Pa·s) | Log₁₀(η Pa·s) | Temperature Range* |
|-------------|------------------------|------------------|---------------|-------------------|
| **Melting Point** | 10 | 1 | 0.0 | 1000-1600°C |
| **Flow Point** | 10⁵ | 10⁴ | 4.0 | 900-1300°C |
| **Working Point** | 10⁴ | 10³ | 3.0 | 950-1400°C |
| **Softening Point** | 10^7.6 ≈ 4×10⁷ | 10^6.6 ≈ 4×10⁶ | 6.6 | 500-900°C |
| **Annealing Point** | 10^13 | 10^12 | 12.0 | 400-650°C |
| **Strain Point** | 10^14.5 ≈ 3×10^14 | 10^13.5 ≈ 3×10^13 | 13.5 | 370-620°C |

*Temperature ranges are approximate and depend on glass composition

### Physical Meanings

#### Melting Point (η = 1 Pa·s)
- **Physical state:** Low-viscosity liquid
- **Behavior:** Fully homogenized melt, complete mixing possible
- **Process:** Batch melting, fining
- **Typical:** 1200-1500°C for soda-lime glass

#### Flow Point (η = 10⁴ Pa·s)
- **Physical state:** Upper working limit
- **Behavior:** Glass flows readily under low pressure
- **Process:** Maximum forming rate
- **Note:** Sometimes called "upper working point"

#### Working Point (η = 10³ Pa·s)
- **Physical state:** Practical forming temperature
- **Behavior:** Optimal viscosity for:
  - Blowing (bottles, bulbs)
  - Pressing (tableware, lenses)
  - Drawing (fibers, tubes)
- **Typical:** 1050-1150°C for soda-lime glass
- **Critical for:** Production efficiency

#### Softening Point (η = 10^6.6 Pa·s)
- **Physical state:** Littleton softening point
- **Behavior:** Glass deforms under its own weight
- **Measurement:** ASTM C338 test (fiber elongation under 1 kg load)
- **Physical test:** Fiber elongates 1 mm/min at this temperature
- **Typical:** 600-750°C for soda-lime glass
- **Most commonly measured fixed point**

#### Annealing Point (η = 10^12 Pa·s)
- **Physical state:** Upper annealing temperature
- **Behavior:** Internal stresses relax in ~15 minutes
- **Process:** Start of annealing schedule
- **Typical:** 500-570°C for soda-lime glass
- **Critical for:** Stress relief, preventing breakage

#### Strain Point (η = 10^13.5 Pa·s)
- **Physical state:** Lower annealing temperature
- **Behavior:** Internal stresses relax in ~4 hours
- **Process:** End of annealing schedule
- **Typical:** 470-530°C for soda-lime glass
- **Critical for:** Final stress-free state

---

## Related ASTM Standards

### ASTM C338-93(2020)
**"Standard Test Method for Softening Point of Glass"**

- **Method:** Littleton softening point
- **Procedure:** Heat glass fiber under 1 kg load
- **Definition:** Temperature where fiber elongates at 0.65 mm/min
- **Corresponds to:** η = 10^7.6 poise = 10^6.6 Pa·s
- **URL:** https://www.astm.org/c0338-93r20.html

### ASTM C336-71(2019)
**"Standard Test Method for Annealing Point and Strain Point of Glass by Beam Bending"**

- **Method:** Three-point beam bending
- **Annealing point:** Viscosity = 10^13 poise (10^12 Pa·s)
- **Strain point:** Viscosity = 10^14.5 poise (10^13.5 Pa·s)
- **URL:** https://www.astm.org/c0336-71r19.html

### ASTM C965-96(2012)
**"Standard Practice for Measuring Viscosity of Glass Above the Softening Point"**

- **Methods:** Rotation, beam bending, fiber elongation
- **Temperature range:** Above softening point (low viscosity)
- **Viscosity range:** 10⁰ to 10^8 Pa·s

---

## Typical Fixed Point Values by Glass Type

### Commercial Soda-Lime-Silica Glass
```
Composition: 72% SiO2, 13% Na2O, 11% CaO, 2% Al2O3, 2% MgO

Melting Point:    1385°C (η = 1 Pa·s)
Flow Point:       1152°C (η = 10⁴ Pa·s)
Working Point:    1098°C (η = 10³ Pa·s)
Softening Point:   730°C (η = 10^6.6 Pa·s)
Annealing Point:   546°C (η = 10^12 Pa·s)
Strain Point:      514°C (η = 10^13.5 Pa·s)

Temperature span (Melting to Strain): 871°C
```

### Borosilicate Glass (Pyrex-type)
```
Composition: 81% SiO2, 13% B2O3, 4% Na2O, 2% Al2O3

Melting Point:    1520°C (η = 1 Pa·s)
Flow Point:       1240°C (η = 10⁴ Pa·s)
Working Point:    1180°C (η = 10³ Pa·s)
Softening Point:   821°C (η = 10^6.6 Pa·s)
Annealing Point:   560°C (η = 10^12 Pa·s)
Strain Point:      510°C (η = 10^13.5 Pa·s)

Temperature span (Melting to Strain): 1010°C
Higher than SLS due to stronger network (B2O3 + high SiO2)
```

### Pure Fused Silica
```
Composition: 99.9% SiO2

Melting Point:    2420°C (η = 1 Pa·s)
Flow Point:       2200°C (η = 10⁴ Pa·s)
Working Point:    2100°C (η = 10³ Pa·s)
Softening Point:  1730°C (η = 10^6.6 Pa·s)
Annealing Point:  1200°C (η = 10^12 Pa·s)
Strain Point:     1075°C (η = 10^13.5 Pa·s)

Temperature span (Melting to Strain): 1345°C
Highest temperatures - pure network former
```

### Lead Crystal Glass (24% PbO)
```
Composition: 59% SiO2, 24% PbO, 12% K2O, 4% Na2O, 1% Al2O3

Melting Point:    1220°C (η = 1 Pa·s)
Flow Point:        950°C (η = 10⁴ Pa·s)
Working Point:     880°C (η = 10³ Pa·s)
Softening Point:   635°C (η = 10^6.6 Pa·s)
Annealing Point:   435°C (η = 10^12 Pa·s)
Strain Point:      405°C (η = 10^13.5 Pa·s)

Temperature span (Melting to Strain): 815°C
Lower temperatures due to strong PbO flux effect
```

---

## Composition Effects on Fixed Points

### Network Formers (Increase all temperatures)
- **SiO2:** +6 to +8°C per wt% for softening point
- **Al2O3:** +10 to +12°C per wt% (strongest effect)
- **B2O3:** Variable (-3 to +5°C depending on concentration)

### Network Modifiers (Decrease all temperatures)
- **Na2O:** -5 to -6°C per wt% for softening point
- **K2O:** -4 to -5°C per wt%
- **Li2O:** -6 to -7°C per wt% (strongest alkali)
- **CaO:** -3 to -4°C per wt%
- **MgO:** +3 to +4°C per wt% (acts as former in soda-lime glasses)
- **PbO:** -7 to -9°C per wt% (very strong flux)

### General Trend
```
High SiO2 + Al2O3 → High fixed point temperatures (refractory behavior)
High Na2O + CaO → Low fixed point temperatures (easy processing)
```

---

## Why Fixed Points Matter

### Process Control
- **Working point:** Determines production temperature and forming window
- **Softening point:** Critical for handling, tempering processes
- **Annealing point:** Sets annealing schedule (time and temperature)

### Quality Control
- **Strain point:** Verifies stress-free final product
- **Fixed point shift:** Indicates composition variation

### Energy Efficiency
- **Lower working point:** Less energy to melt and form
- **Narrow working range:** More precise temperature control needed

### Product Design
- **High strain point:** Better thermal stability
- **Wide annealing range:** More forgiving annealing schedule

---

## Measurement Methods

### Rotation Viscometer (η < 10³ Pa·s)
- **Method:** Rotating spindle or crucible
- **Range:** 0.1 to 10³ Pa·s
- **Accuracy:** ±2-5%
- **Used for:** Melting point, flow point, working point

### Fiber Elongation (η = 10^6.6 Pa·s)
- **Method:** ASTM C338 Littleton test
- **Load:** 1 kg on glass fiber
- **Measurement:** Temperature where elongation = 0.65 mm/min
- **Accuracy:** ±3-5°C
- **Used for:** Softening point

### Beam Bending (η = 10^12 to 10^13.5 Pa·s)
- **Method:** ASTM C336 three-point bending
- **Measurement:** Temperature where specific deformation rate occurs
- **Accuracy:** ±5-10°C
- **Used for:** Annealing point, strain point

---

**Next:** [Chapter 3 - Model Selection Framework](./chapter-03-model-selection.md)

