# THERMAL DISTRIBUTION SPEC — Overview & Quick Start (EN, Technical Rewrite)

**Version:** 1.7  
**Language:** en‑US  
**Purpose:** Complete specification for a Node.js/TypeScript library that computes steady (or quasi‑steady, 1D‑type) temperature profiles inside solid bodies of simple and composite shapes under a convective boundary, and their corresponding **volume‑average temperatures**. The spec consolidates advanced algorithms introduced in v1.6 and restores the pedagogical completeness from v1.4 (classical ‘academic’ formulas, worked examples, and calibration guidance).  

---
## 0.1 Scope
The library returns: (i) temperature at depth, (ii) temperature profiles along normalized coordinates, and (iii) volume‑average temperature and internal energy. Supported models:
- **A) Spectral** (quasi‑spherical form; 1–3 modes usually sufficient)
- **B1) Power‑law, heuristic** (single parameter n(Bi))
- **B2) Power‑law, spectral‑anchored** (n from 2‑point or LS anchor vs spectral S(x))
- **Product‑Solution** (separable multi‑axis composition of normalized 1D sub‑profiles)

**Biot policy (invariant):** always compute \(\mathrm{Bi} = (h/k)\,(V/S)\) using the thermal characteristic length \(L_c = V/S\). The profile scaling radius \(R_{dist}\) may differ from \(R_{Bi}\).  

---
## 0.2 Normalization & coordinates
- From center: \(x\in[0,1]\) (0 center, 1 boundary); from boundary: \(\xi=1-x\in[0,1]\).
- Temperatures are constructed to satisfy \(T(0)=T_c\) and \(T(1)=T_s\) by design.

---
## 0.3 When to use which model
- **A, Spectral:** realistic curvature with low modal count (1–3); robust vs Bi. 
- **B1:** fast engineering fit; use when only a smooth monotone curve is required.
- **B2:** near‑spectral accuracy with a single exponent n obtained from spectral anchoring (2‑point or LS with weights 1/x/x²). 
- **Product‑solution:** essential for finite cylinders, prisms, cones, frustums, pyramids—whenever multi‑axis separation is appropriate.

---
## 0.4 Volume average & quadrature
- Closed forms for **slab/cylinder/sphere** with weights 1, 2x, 3x² respectively.
- **Gauss-Legendre** quadrature on [0, 1] or tensor products in 2D/3D; recommended nodes: N = 16/32/64 depending on curvature/Bi.

---
## 0.5 File map
This English rewrite is split across nine files:
1. Overview & Quick Start (this file)
2. Geometries (incl. cones, frustums, pyramids, truncated pyramids)
3. Method A — Spectral
4. Methods B — Power‑law (B1/B2)
5. Product‑Solution method
6. Volume‑average & Quadrature
7. TypeScript API
8. Calibration (full, all shapes)
9. Bibliography (all sources from v1.4 & v1.6 and added items)
