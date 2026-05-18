# Thermal Distribution Specification — Getting Started Guide

**Version:** 2.0  
**Algorithm foundation:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968.

---

## 📍 Quick Navigation

### "I need to implement the algorithm"
→ **Start here:** `THERMAL_DISTRIBUTION_SPEC_00_Overview.md`
→ **API contract:** `THERMAL_DISTRIBUTION_SPEC_06_API.md`
→ **Code examples:** `THERMAL_DISTRIBUTION_SPEC_10_Examples.md`

### "I need the mathematical formulas"
→ **BC I geometries:** `../heat-conduction/HEAT_CONDUCTION_02–07_BC1_*.md`
→ **BC III geometries:** `../heat-conduction/HEAT_CONDUCTION_08–13_BC3_*.md`
→ **Time stepping / oil quench:** `../heat-conduction/HEAT_CONDUCTION_14_TIME_STEPPING.md`
→ **BC selection & Kondratiev:** `../heat-conduction/HEAT_CONDUCTION_15_BC_SELECTION_KONDRATIEV.md`

### "I need to understand complex geometries / β-scaling"
→ `../heat-conduction/HEAT_CONDUCTION_16_COMPLEX_GEOMETRIES.md`
→ `THERMAL_DISTRIBUTION_SPEC_01_Geometries.md`

### "I need to set up validation tests"
→ `THERMAL_DISTRIBUTION_SPEC_09_Validation.md`
→ `THERMAL_DISTRIBUTION_SPEC_07_Calibration.md`

### "I need quick formula lookup"
→ `THERMAL_DISTRIBUTION_SPEC_11_QuickReference.md`

---

## 📚 File Structure

### Integration & API Specs (this directory)

| File | Topic |
|------|-------|
| `SPEC_00_Overview.md` | Purpose, BC routing, criteria, file map |
| `SPEC_01_Geometries.md` | 6 exact + complex/variable-section geometries, Rdist rules |
| `SPEC_06_API.md` | TypeScript interfaces and function signatures |
| `SPEC_07_Calibration.md` | Calibration methodology, test grids, JSON schema |
| `SPEC_08_Bibliography.md` | Full reference list (Luikov primary) |
| `SPEC_09_Validation.md` | Testing protocols, error thresholds, CI |
| `SPEC_10_Examples.md` | 5 complete TypeScript usage examples |
| `SPEC_11_QuickReference.md` | Formula quick-lookup card |

### Mathematical Algorithm Specs (heat-conduction/)

| File | Geometry |
|------|-------|
| `HC-02_BC1_PLATE.md` | Infinite Plate — BC I |
| `HC-03_BC1_CYLINDER.md` | Infinite Cylinder — BC I |
| `HC-04_BC1_SPHERE.md` | Solid Sphere — BC I |
| `HC-05_BC1_HOLLOW_CYLINDER.md` | Hollow Cylinder — BC I |
| `HC-06_BC1_PARALLELEPIPED.md` | Parallelepiped — BC I product rule |
| `HC-07_BC1_FINITE_CYLINDER.md` | Finite Cylinder — BC I product rule |
| `HC-08_BC3_PLATE.md` | Infinite Plate — BC III (uniform/parabolic/arbitrary) |
| `HC-09_BC3_CYLINDER.md` | Infinite Cylinder — BC III |
| `HC-10_BC3_SPHERE.md` | Solid Sphere — BC III |
| `HC-11_BC3_HOLLOW_CYLINDER.md` | Hollow Cylinder — BC III |
| `HC-12_BC3_PARALLELEPIPED.md` | Parallelepiped — BC III product rule |
| `HC-13_BC3_FINITE_CYLINDER.md` | Finite Cylinder — BC III product rule |
| `HC-14_TIME_STEPPING.md` | Non-linear time-stepping (oil quenching) |
| `HC-15_BC_SELECTION_KONDRATIEV.md` | Boundary condition selection & Kondratiev RTR |
| `HC-16_COMPLEX_GEOMETRIES.md` | Engineering approximations for complex shapes |

---

## 🚀 Getting Started (5-Minute Path)

1. **Read Overview** (5 min) — `SPEC_00_Overview.md`
   - What is BC I vs BC III? When to use each?
   - How does the product rule work?

2. **Skim Quick Reference** (10 min) — `SPEC_11_QuickReference.md`
   - All eigenvalue equations, amplitude & mean coefficients at a glance
   - API summary

3. **Pick an Example** (15 min) — `SPEC_10_Examples.md`
   - Water quench → Section 1 (BC I)
   - Furnace heating → Section 2 (BC III)
   - Oil quench → Section 3 (time-stepping)

4. **Check the geometry** — `SPEC_01_Geometries.md`
   - Is your body a simple 1D? Use the direct solver.
   - Compound? Apply product rule.
   - Irregular shape? Use β-scaling (Path B).

---

## 🔧 Common Tasks

### "Add a new geometry"
1. Determine if it maps to an existing class (1D / product-rule / complex)
2. Document Rdist selection rule in `SPEC_01_Geometries.md`
3. Link to the relevant `heat-conduction/` spec (or create one if needed)
4. Add an example in `SPEC_10_Examples.md`
5. Add calibration test grid in `SPEC_07_Calibration.md`
6. Add validation tests in `SPEC_09_Validation.md`

### "Change the solver precision"
→ Adjust `seriesTerms` in `ProfileOptions` (default 100).
→ Acceptable floor: N=50 (see `SPEC_07_Calibration.md §1.1`).

### "Add oil-quenching support"
→ Supply `alphaCurve(Ts)` and `timeStep` in `ProfileOptions`.
→ See `SPEC_10_Examples.md §3` and `HC-14_TIME_STEPPING.md`.

---

## ✅ Production Readiness Checklist

- [ ] BC I + BC III 1D solvers implemented (plate, cylinder, sphere)
- [ ] Parabolic reduction identity test passes (SPEC_09 §2.3)
- [ ] Product-rule identity test passes (SPEC_09 §2.6)
- [ ] Hollow cylinder Gauss-Legendre mean verified
- [ ] Eigenvalue cache implemented (SPEC_06 §5)
- [ ] Time-stepping loop implemented and tested
- [ ] All calibration cases pass (SPEC_07 §1.1 thresholds)
- [ ] CI pipeline green on all test groups

---

**Last Updated:** May 2026  
**Version:** 2.0  
**Status:** ✅ Aligned with heat-conduction/ verified algorithm specs
