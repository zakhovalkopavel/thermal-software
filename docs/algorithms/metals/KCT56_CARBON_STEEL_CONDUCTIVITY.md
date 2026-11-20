# kCT56 — Carbon-steel thermal conductivity F(C, T)

**Status:** Alternative λ model in `MetalThermalService`  
**ID:** `kCT56`  
**Form:** Chebyshev product \(F(C,T)=\sum_{i=0}^{5}\sum_{j=0}^{6} a_{ij}\,T_i(C_n)\,T_j(T_n)\)  
**Code:** `backend/src/modules/metals/utils/kct56-conductivity.ts`  
**Coefficients:** `backend/src/modules/metals/data/kct56-conductivity.data.ts`  
**Fit workspace:** `tmp/scripts/t_conductivity_measured_ls.py`, `tmp/reports/conductivity-fit/`  
**Attempt log:** `tmp/reports/conductivity-fit/KCT56_ATTEMPTS.md`

---

## Domain

| Variable | Symbol | Range | Unit |
|----------|--------|-------|------|
| Carbon | \(C\) | 0.05 – 1.10 | wt% |
| Temperature | \(T\) | 0 – 815 | °C |

Inputs outside the domain are rejected (no extrapolation).

Normalization to Chebyshev argument \(x\in[-1,1]\):

\[
x = 2\frac{v-v_{\min}}{v_{\max}-v_{\min}}-1
\]

---

## Training data (recommended A+B)

Measured ASM points only (no donor fills, no synthetic anchors):

| Priority | Grades | Role |
|----------|--------|------|
| A (full / near-full curves) | 1008, 1025, 1042, 1078, **W1** | Shape vs \(T\) |
| B (high-C sparse) | 1060, 1064, 1070, 1080, 1086, 1095 | Extend \(C\) domain |

W1 composition from `aisi-w1.json` (C=1.10, Mn=0.25); λ from
`tools_steel_thermal_conductivity.json` (ASM HB Vol.1 Table 12), weight ×3 in the fit.

Mn is **not** a model input (matched-cell significance SNR ≪ 1 on 10xx).

---

## Objective

Penalized absolute LS:

\[
\min_a \;\lVert F-k\rVert_2^2
+ w_{\mathrm{mono}}\sum w_{\mathrm{edge}}(C)\,\max(\partial F/\partial T,0)^2
+ w_{\mathrm{smooth}}\sum w_{\mathrm{edge}}(C)\,(\Delta_T^2 F)^2
+ w_{\mathrm{flatHT}}\sum_{C\ge0.7,\,T\ge650}(\partial F/\partial C)^2
+ w_{\mathrm{ridge}}\lVert a\rVert_2^2
\]

Defaults: \(w_{\mathrm{mono}}=200\), \(w_{\mathrm{smooth}}=1\), \(w_{\mathrm{flatHT}}=50\), \(w_{\mathrm{ridge}}=10^{-3}\).

High-T C-flatness encodes the physical observation that carbon steels approach a
common austenite λ ≈ 24–26 W/(m·K) near 800 °C.

---

## Fit metrics (unique points)

| Metric | Value |
|--------|------:|
| Unique points | 61 |
| max \|rel\| | 5.28 % |
| mean \|rel\| | ~1.0 % |
| Worst point | 1008 annealed @ 20 °C |
| λ(C≥0.78, 800 °C) | ≈ 24.7 W/(m·K) |

---

## Runtime API

```
GET /api/v1/metals/thermal-properties?material=sae-1025&T_K=373.15&lambdaModel=kCT56
```

Uses alloy `composition.C`. Default `lambdaModel=table` keeps poly / cubic-spline behaviour.

---

## References (data sources)

- ASM Handbook Vol. 1 — carbon & low-alloy steel thermal conductivity tables
- ASM Handbook Vol. 1 Table 12 — tool-steel thermal conductivity (W1)
- Processed compositions: `shared/processed/metal-data/alloys/steel/carbon/`, `…/tool/aisi-w1.json`
