# Thermal Distribution Specification — Getting Started Guide

**Welcome to the thermal-distribution/ specification ecosystem!**

This directory contains comprehensive, production-ready specifications for implementing thermal distribution algorithms.

---

## 📑 Table of Contents

1. [Quick Navigation](#-quick-navigation)
2. [File Structure](#-file-structure)
3. [Getting Started (5-Minute Path)](#-getting-started-5-minute-path)
4. [Common Tasks](#-common-tasks)
5. [Troubleshooting](#-troubleshooting)
6. [Related Documentation](#-related-documentation)
7. [Production Readiness Checklist](#-production-readiness-checklist)
8. [Getting Help](#-getting-help)
9. [Key Features](#-key-features-of-this-specification)
10. [File Summary](#-file-summary)

---

## 📍 Quick Navigation

### "I need to implement the algorithm" 
→ **Start here:** `THERMAL_DISTRIBUTION_SPEC_00_Overview.md`  
→ **Then read:** `THERMAL_DISTRIBUTION_SPEC_06_API.md`  
→ **Code examples:** `THERMAL_DISTRIBUTION_SPEC_10_Examples.md`

### "I need to understand a complex concept"
→ **Quick overview:** `THERMAL_DISTRIBUTION_SPEC_11_QuickReference.md`  
→ **Deep dive:** Read corresponding spec file (01-08)  
→ **Cross-reference:** Use `SPEC_NAVIGATION_GUIDE.md` to find equivalent sections

### "I need to set up validation tests"
→ **Start here:** `THERMAL_DISTRIBUTION_SPEC_09_Validation.md`  
→ **Setup CI:** Section §7 (CI Integration Checklist)  
→ **Test data:** `THERMAL_DISTRIBUTION_SPEC_07_Calibration.md` Section §4

### "I need calibration data setup"
→ **Start here:** `THERMAL_DISTRIBUTION_SPEC_07_Calibration.md`  
→ **JSON templates:** Section §4 (includes examples)  
→ **Workflow:** Section §5

### "I want quick formula lookup"
→ **Start here:** `THERMAL_DISTRIBUTION_SPEC_11_QuickReference.md`  
→ **Printable:** This file is optimized for printing as reference card

---

## 📚 File Structure

### Core Algorithm Specifications (00-08)

| File | Topic | Length | Purpose |
|------|-------|--------|---------|
| 00_Overview.md | Quick start, Biot invariant, normalization | 46 lines | Understanding purpose & scope |
| 01_Geometries.md | 10 supported geometries, Rdist selection | 31 lines | Geometry-specific logic |
| 02_Methods_A_Spectral.md | Spectral method, eigenvalues, Newton | 27 lines | Implementing spectral approach |
| 03_Methods_B_Power.md | Power-law B1/B2, closed forms | 22 lines | Implementing power models |
| 04_Methods_ProductSolution.md | Product-solution for multi-axis | 22 lines | Composite geometry handling |
| 05_VolumeAverage.md | Averaging formulas, Gauss quadrature | 15 lines | Computing average temperature |
| 06_API.md | TypeScript interfaces, function signatures | 57 lines | Code API reference |
| 08_Bibliography.md | References and sources | 13 lines | Theoretical background |

### Extended Resources (07, 09-11)

| File | Topic | Length | Purpose |
|------|-------|--------|---------|
| 07_Calibration.md | Calibration methodology, grids, JSON examples | 200+ lines | Setting up calibration |
| 09_Validation.md | Testing protocols, error thresholds, CI | 320+ lines | Validation & testing approach |
| 10_Examples.md | 5 complete working code examples | 420+ lines | Learning by example |
| 11_QuickReference.md | Formula summary, troubleshooting, metrics | 280+ lines | Quick lookup reference |

---

## 🚀 Getting Started (5-Minute Path)

1. **Read Overview** (5 min)
   ```
   Why? Understand the purpose, scope, and key concepts
   File: 00_Overview.md
   Takeaway: What is Biot invariant? Why use product-solution?
   ```

2. **Skim Quick Reference** (10 min)
   ```
   Why? Get familiar with main formulas and when to use each method
   File: 11_QuickReference.md
   Takeaway: What's the formula for B2? When to use B1 vs B2?
   ```

3. **Look at an Example** (15 min)
   ```
   Why? See practical code usage
   File: 10_Examples.md (Section 1.1 or 1.2)
   Takeaway: How to call averageTemperature()? What's expected output?
   ```

undefined

## 🔧 Common Tasks

### "I need to add a new geometry"
1. Add case in Geometries.md
2. Define Rdist selection rule
3. Choose method (spectral/power/product-solution)
4. Add example in Examples.md
5. Update Calibration.md grid for new geometry
6. Add validation tests in Validation.md

### "I need to add a new method"
1. Document method in appropriate spec (02_B_Power.md for power variants, etc.)
2. Add to API.md (ProfileMethod type, function signature)
3. Add example in Examples.md (method comparison)
4. Add acceptance criteria in Validation.md

### "I need to optimize for speed"
→ See 11_QuickReference.md Section "Performance Typical Values"
- B1 fastest (0.3 ms)
- B2 good balance (0.8-1.2 ms)
- Spectral slower (2.1 ms)

### "I need maximum accuracy"
→ See 11_QuickReference.md Section "When to Use Which Method"
- Use Spectral (A) — <1e-9 error
- Use Product-Solution for multi-axis — reference accuracy

---

## ❓ Troubleshooting

### "My temperature is out of bounds (not in [Ts, Tc])"
→ See 11_QuickReference.md Section "Common Mistakes"
- Check: Tc > Ts
- Check: T(0) = Tc, T(max) = Ts boundary conditions
- Check: 10_Examples.md for normalization pattern

### "Large error vs reference (>1%)"
→ See 10_Examples.md Section "Best Practices & Tips" → "Debugging & Validation"
- Check Bi consistency (V/S calculation)
- Increase gaussNodes to N=32 or N=64
- Try Spectral method instead of Power

### "Newton convergence fails"
→ See 02_Methods_A_Spectral.md Section §2
- Bi out of expected range? (safe: 0.01 to 100)
- λ near m·π? (Newton singularity)
- Use blended initializer (recommended)

### "Profile doesn't match expected curve"
→ See 10_Examples.md Section "Best Practices"
- Verify boundary conditions (T ends match)
- Check method (B1 poor for Bi>5, use B2 instead)
- Increase N for smoother profile

---

## 📖 Related Documentation

### Comparison & Navigation
- `SPEC_COMPARISON_ANALYSIS.md` — Detailed analysis vs SPEC_v1_7_FULL
- `SPEC_COMPARISON_SUMMARY.md` — Quick decision guide
- `SPEC_NAVIGATION_GUIDE.md` — Cross-reference between documents
- `SPEC_INDEX.md` — Master index of all specs

### Authoritative Reference
- `SPEC_v1_7_FULL (1).md` — Complete Russian specification (v1.7)
  - Use for: Deep theoretical background, calibration methodology (§19)
  - For: RU-speaking teams, archival reference

### Expansion Summary
- `THERMAL_DISTRIBUTION_EXPANSION_SUMMARY.md` — What was added in Session 2

---

## 🎯 Production Readiness Checklist

Before deploying to production, ensure:

- [ ] **Implementation (Spec 00-06)**
  - [ ] Core algorithm implemented per API.md
  - [ ] All 10 geometries supported
  - [ ] Examples.md patterns verified

- [ ] **Validation (Spec 09)**
  - [ ] Acceptance criteria understood (§1.1)
  - [ ] Test suite structure setup (§4)
  - [ ] CI/CD integrated (§7)

- [ ] **Calibration (Spec 07)**
  - [ ] Test case schema created (§3)
  - [ ] Calibration data generated (§4)
  - [ ] Workflow documented (§5)

- [ ] **Quality**
  - [ ] All tests passing (Tavg error < 1e-3, RMS < 1e-2)
  - [ ] Performance acceptable (<5ms per call)
  - [ ] No regressions vs baseline

- [ ] **Documentation**
  - [ ] Code comments reference relevant spec sections
  - [ ] Team trained on thermal-distribution/ specs
  - [ ] Edge cases documented

---

## 📞 Getting Help

### If you need to understand...
| Topic | See File |
|-------|----------|
| Biot & characteristic length | 00_Overview.md §0.1 |
| Which geometry to use | 01_Geometries.md |
| How spectral method works | 02_Methods_A_Spectral.md + 11_QuickReference.md |
| B2 formula | 03_Methods_B_Power.md + 11_QuickReference.md |
| Product-solution | 04_Methods_ProductSolution.md |
| Volume averaging | 05_VolumeAverage.md + 11_QuickReference.md |
| API functions | 06_API.md |
| Calibration setup | 07_Calibration.md |
| Validation testing | 09_Validation.md |
| Code examples | 10_Examples.md |
| Any formula quickly | 11_QuickReference.md |
| How specs compare | SPEC_COMPARISON_ANALYSIS.md |

### If you're looking for...
| Content | Go To |
|---------|-------|
| Quick start | This document |
| Learning path | This document (Learning Paths section) |
| Working code | 10_Examples.md |
| Error thresholds | 09_Validation.md §1 |
| JSON templates | 07_Calibration.md §4 |
| Performance metrics | 11_QuickReference.md |
| Troubleshooting | 11_QuickReference.md or 10_Examples.md |
| Cross-reference | SPEC_NAVIGATION_GUIDE.md |

---

## 🌟 Key Features of This Specification

✅ **Production-Ready**
- Comprehensive (11 specs, 2000+ lines)
- Detailed acceptance criteria
- Complete testing methodology
- Calibration templates

✅ **Developer-Friendly**
- English language (English specs)
- Human-readable formulas (no LaTeX)
- 5 working code examples
- Quick reference card included

✅ **Implementer-Focused**
- Clear API specification
- Parameter guidance
- Performance metrics
- Best practices documented

✅ **Maintainable**
- Modularized (11 focused files)
- Each file single topic
- Clear cross-references
- Version-tracked easily

---

## 📦 File Summary

**12 files, 2000+ lines of specification**

```
Core Algorithms (00-08):       ~260 lines
Extended Resources (07,09-11): ~800 lines  
Total Thermal Distribution:    ~2100 lines

Plus:
  - Comparison Analysis:     ~810 lines
  - Navigation Guide:        ~600 lines
  - Comparison Summary:      ~400 lines
  - Expansion Summary:       ~400 lines
  
Total Ecosystem:             ~4310 lines
```

---

**Last Updated:** February 7, 2026  
**Version:** 1.7 (Production-Ready)  
**Status:** ✅ Complete and Ready for Use

---

**Ready to implement? Start with THERMAL_DISTRIBUTION_SPEC_00_Overview.md →**

