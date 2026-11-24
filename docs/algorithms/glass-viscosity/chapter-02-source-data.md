# Chapter 2: Source Data and Traceability

**Part I: Background and Approach**

---

## Overview

Every coefficient used in this spec is sourced from one of two papers. This chapter documents exactly which CSV file provides which data, what each column means, and critical encoding details that must be understood before implementing.

---

## Lakatos 1976

### Full Citation

> Lakatos, T.; Johansson, L-G.; Simmingskőld, B.
> **"Updated factors for calculation of viscosity"** (August 1976).
> Internal communication / *Glasteknik Tidskrift* supplement.
>
> This 1976 update pools data from four earlier Lakatos publications:
> 1. *Glass Techn.* 13(3):88–95, June 1972 — SiO₂–Al₂O₃–Na₂O–K₂O–CaO–MgO system
> 2. *Glast. Tidskr.* 27(2):25–28, 1972 — Component effects
> 3. *Glast. Tidskr.* 30(1):7–8, 1975 — Li₂O and B₂O₃ in soda-lime-silica glass
> 4. *Glast. Tidskr.* 31(2):31–35, 1976 — SiO₂–Al₂O₃–Na₂O–K₂O–CaO–MgO system with viscosity, liquidus, hydrolytical resistance

### Source Files

All files are in `shared/sources/lakatos_ocr/`.

#### `Lakatos_1976.txt`
Full OCR text of the paper. Contains the formula derivation, qualitative discussion of component effects, and inline references to the table CSV files.

#### `page_002_table_006.csv` — VTF constant regression coefficients ⭐ PRIMARY

This is the **primary production table** for the Lakatos model (`buildVtf()` uses this).

```
,B,A,T₀
Constant,6237.013,1.713,149.4
Al2O3,15.21,-0.0087,1.4
Na2O,-66.01,-0.0162,0.5
K₂O,-5.41,0.0066,-2.36
Li₂O,-115.18,-0.0318,-13.29
CaO,-60.63,0.0064,7.71
MgO,56.21,0.0589,-2.12
BaO,-21.03,0.0026,1.09
ZnO,-3.76,0.016,0.96
PbO,-25.44,-0.005,0.82
B₂O3,-155.11,-0.0465,12.03
(B₂O₃)²,4.0999,0.001627,-0.2765
```

**Column meaning:** For each VTF constant (B, A, T₀), the table gives one regression coefficient per oxide component. All three VTF constants are evaluated from composition in a single step — no intermediate isokom temperatures.

**Critical:** The compositions are **NOT in wt%**. They are in **parts per 100 parts of SiO₂ by weight** (see Chapter 6).

**Note on B₂O₃:** Two rows — a linear term `B₂O₃` and a quadratic term `(B₂O₃)²`. Add both contributions for each VTF constant.

**Equation form used in this table:**
```
T [°C] = B_vtf / (log η [poise] + A_vtf) + T₀_vtf
```
Note `+ A_vtf` in the denominator and log η in **poise** — this is Lakatos's own convention.
To convert to the standard form (`log η [Pa·s] = A_std + B_std / (T − T₀_std)`):
```
A_std = −(A_vtf + 1),   B_std = B_vtf,   T₀_std = T₀_vtf
```
See Chapter 4 for the full derivation and worked example.

**Constant:** `LAKATOS_1976_DIRECT_VTF_COEFFICIENTS` in `constants/viscosity-parameters.ts`

#### `page_001_table_007.csv` — Isokom temperature regression coefficients (illustration)

This table is used for **scientific illustration of component effects only** — it is NOT used for production viscosity calculations.

Lakatos described it as an intermediate step:
> *"Although the factors for calculating the temperatures for different viscosity levels are only an intermediate step, it is of interest to study the effects of different oxides on temperature at different viscosity levels."*

```
,log η 2.0,log η 4.0,log η 6.0
Constant,1847.8,1249.7,962.9
Al2O3,8.32,5.23,4.01
Na2O,-12.65,-9.19,-7.06
K2O,-5.93,-4.17,-3.53
Li2O,-35.54,-30.04,-26.45
CaO,-11.27,-3.99,-0.74
MgO,-5.87,-0.12,0.91
BaO,-5.67,-3.04,-1.88
ZnO,-5.37,-1.88,-0.71
PbO,-4.85,-3.17,-2.24
B₂O₃,-21.62,-11.97,-6.42
(B₂O₃)²,0.5122,0.3182,0.19
```

**Column meaning:** Temperature in °C at each isokom viscosity level (log poise). Subtract 1 to convert to log Pa·s. The coefficients reveal how much each oxide shifts the viscosity curve at each level — the primary value of this table.

**Note on missing SiO₂:** SiO₂ has no row because the composition encoding already expresses everything relative to 100 parts SiO₂.

**Method:** `GlassViscosityLakatosIsokoms.predictIsokomsLakatos()` in `glass-viscosity-lakatos-isokoms.ts`
**Constant:** `LAKATOS_1976_COEFFICIENTS` in `constants/viscosity-parameters.ts`

#### `page_002_table_007.csv` — Standard deviations

```
at log η,2,σ=4.63°C
at log η,4,σ=3.34°C
at log η,6,σ=3.14°C
```

These are the reported residual standard deviations from the regression fit. They represent the typical accuracy of the model on the training dataset.

**Used in Chapter 9** for confidence estimation: a 95% confidence interval on each predicted isokom temperature is approximately ±2σ.

#### `page_003_table_001.csv` — Validation dataset Part A

Contains 30 glass compositions from series S (first section without series label), F₂ (flat glass type 2), and others.

**Column structure:**
```
Nr, SiO2, Al2O3, Na2O, K2O, Li2O, CaO, MgO, BaO, ZnO, PbO, B2O3,
Calc.T@log η 2, ΔT@log η 2,
Calc.T@log η 4, ΔT@log η 4,
Calc.T@log η 6, ΔT@log η 6
```

Where:
- Columns 2–12 are composition in **wt%** (raw input, not parts/SiO₂)
- "Calc. T" columns are the temperatures predicted by the Lakatos model (°C)
- "ΔT" = Calculated − Measured (positive means model predicts higher than reality)

#### `page_004_table_002.csv` — Validation dataset Part B

Same column structure as Part A. Contains groups FAL (fluoroaluminosilicate glasses) and others.

---

## Fluegel 2007

### Full Citation

> Fluegel, A.
> **"Glass viscosity calculation based on a global statistical modelling approach"**
> *Glass Technology: European Journal of Glass Science and Technology Part A*, 48(1):13–30, February 2007.
> DOI: 10.1111/j.2040-9969.2007.tb01719.x

### Source Files

All files are in `shared/sources/fluegel_2007/`.

#### `fluegel_2007.txt`
Full OCR text of the paper. Essential context for understanding the model's statistical methodology, systematic error corrections applied to the SciGlass database, and the mixed alkali model.

#### `Fluegel_table1.csv` — Reference glass compositions (wt%)

Seven standard glasses used for model validation. Columns (left to right):

| Column | Glass ID | Notes |
|---|---|---|
| 1 | CO — Soda-lime-silica container | Simple composition, widely modelled |
| 2 | NIST SRM 710A | Certified viscosity standard |
| 3 | NIST SRM 717A | Borosilicate standard |
| 4 | 711 | Lead crystal standard |
| 5 | 710 | Soda-lime standard (older) |
| 6 | DGG I | German standard glass |
| 7 | WGS — Waste glass standard | Complex multi-component composition |

**Units:** wt%. These must be converted to mol% excluding SiO₂ before use with Fluegel coefficients.

#### `Fluegel_table2.csv` — Model comparison at log η = 1.5 Pa·s

Lists predicted melting-point temperatures from 15 published models for the 7 reference glasses. The last row "This work" corresponds to the Fluegel 2007 model. Used as context data; not directly needed for implementation.

#### `Fluegel_table3.csv` — Composition validity ranges

Maximum mol% (excluding SiO₂) for each component at each viscosity level. **Used for range validation**.

```
Component, max at log η 1.5, max at log η 6.6, max at log η 12
SiO2 min., 42.62, 42.62, 41.4
SiO2 max., 89.2, 87.1, 91.97
Al2O3, 11.3, 12.7, 10
B2O3, 18.15, 16.97, 16.97
BaO, 10, 8, 19.2
CaO, 33.47, 33.1, 50.14
F, 10.31, 10.31, 4.55
Fe2O3, 6.99, 2.15, 0.57
K2O, 41.67, 30, 34.05
Li2O, 35.9, 33.3, 45
MgO, 16.9, 20, 16.61
Na2O, 44, 42, 42
PbO, 49.96, 50, 56
SrO, 7.37, 7.37, 18.02
TiO2, 9.26, 3.29, 25
ZnO, 5.19, 8, 2.81
ZrO2, 9.78, 2.77, 1.76
... (full table in CSV)
```

**Zero entries** in the table mean the component was not present in training data at that viscosity level — a zero should be treated as "not applicable / not validated" rather than "maximum is zero."

**SiO₂** has both a min and max entry because it is expressed here in mol% of the total composition (not as the encoding reference). These bounds are checked directly on the SiO₂ mol% value.

#### `Fluegel_table4.csv` — Coefficients for T at log η = 1.5 Pa·s (melting / low viscosity)

Header: `Variable, Coefficient, t-value`

The t-value column is for statistical significance reporting only and is not used in calculations.

**Constant term:** 1824.497 °C

Full coefficient list (extract — use the CSV as the authoritative source):

| Variable | Coefficient |
|---|---|
| Constant | 1824.497 |
| Al2O3 | 19.341 |
| B2O3 | −22.347 |
| (B2O3)² | 0.60376 |
| BaO | −18.931 |
| Bi2O3 | −42.416 |
| CaO | −17.453 |
| (CaO)² | 0.12038 |
| CeO2 | −22.418 |
| Cl | −8.563 |
| CuO | −30.913 |
| F | −11.739 |
| Fe2O3 | −13.611 |
| K2O | −31.907 |
| (K2O)² | 0.61234 |
| (K2O)³ | −0.006662 |
| Li2O | −30.336 |
| (Li2O)² | 0.22499 |
| MgO | −5.038 |
| MnO2 | −17.050 |
| K2O·MgO | 0.59449 |
| Na2O | −30.610 |
| (Na2O)² | 0.27887 |
| Nd2O3 | −39.662 |
| PbO | −21.349 |
| SO3 | −13.908 |
| SrO | −17.292 |
| ThO2 | −17.185 |
| TiO2 | −10.323 |
| UO2 | −17.672 |
| V2O5 | −21.727 |
| ZnO | −6.280 |
| ZrO2 | 0.173 |
| B2O3×Na2O | 0.28237 |
| B2O3×K2O | 0.2789 |
| B2O3×Li2O | 0.16843 |
| Al2O3×Na2O | 0.23085 |
| Al2O3×Li2O | 0.38421 |
| Al2O3×MgO | 0.44589 |
| Al2O3×CaO | 0.93909 |
| Na2O×K2O | 0.58773 |
| Na2O×Li2O | 0.20691 |
| Na2O×CaO | 0.19254 |
| K2O×Li2O | 0.24924 |
| K2O×CaO | 0.29628 |
| MgO×CaO | 0.17394 |
| Al2O3×Na2O×CaO | 0.03362 |

**Notation for cross-product terms:** `A×B` means the product `C_A · C_B` where C_A and C_B are the mol% values of components A and B.
**Notation for polynomial terms:** `(X)²` means `C_X²`; `(X)³` means `C_X³`.

#### `Fluegel_table5.csv` — Coefficients for T at log η = 6.6 Pa·s (softening point)

**Constant term:** 939.479 °C

Partial list:

| Variable | Coefficient |
|---|---|
| Constant | 939.479 |
| Al2O3 | 5.812 |
| B2O3 | −4.366 |
| (B2O3)² | −0.17367 |
| BaO | −3.385 |
| CaO | −1.791 |
| F | −9.328 |
| Fe2O3 | −11.013 |
| K2O | −20.659 |
| (K2O)² | 0.58116 |
| (K2O)³ | −0.009370 |
| Li2O | −25.075 |
| (Li2O)² | 0.46012 |
| MgO | 0.93 |
| Na2O | −19.051 |
| (Na2O)² | 0.32209 |
| (Na2O)³ | −0.002080 |
| P2O5 | 14.857 |
| PbO | −8.871 |
| SrO | −2.191 |
| TiO2 | −2.862 |
| ZnO | −1.065 |
| ZrO2 | 12.425 |
| B2O3×Na2O | 0.32005 |
| B2O3×K2O | 0.42514 |
| B2O3×Li2O | 0.39626 |
| B2O3×CaO | −0.24066 |
| Al2O3×Na2O | 0.08442 |
| Al2O3×K2O | 0.48055 |
| Na2O×K2O | 0.15519 |
| Na2O×Li2O | 0.20781 |
| Na2O×CaO | 0.09392 |
| K2O×Li2O | 0.46938 |
| K2O×MgO | 0.26354 |
| K2O×CaO | 0.47564 |
| MgO×CaO | −0.15553 |
| B2O3×Al2O3×Na2O | −0.033573 |
| Al2O3×Na2O×CaO | −0.006780 |
| Na2O×MgO×CaO | −0.012589 |

#### `Fluegel_table6.csv` — Coefficients for T at log η = 12.0 Pa·s (glass transition / annealing)

**Constant term:** 624.829 °C

| Variable | Coefficient |
|---|---|
| Constant | 624.829 |
| Al2O3 | 4.929 |
| B2O3 | −1.121 |
| BaO | −1.110 |
| CaO | 6.84 |
| (CaO)² | −0.08269 |
| F | −8.123 |
| Fe2O3 | −8.453 |
| K2O | −12.460 |
| (K2O)² | 0.39706 |
| (K2O)³ | −0.005382 |
| Li2O | −11.571 |
| (Li2O)² | 0.27802 |
| (Li2O)³ | −0.002576 |
| MgO | 1.141 |
| Na2O | −12.854 |
| (Na2O)² | 0.35785 |
| (Na2O)³ | −0.004179 |
| PbO | −4.349 |
| SrO | 1.388 |
| TiO2 | 3.864 |
| ZrO2 | 8.927 |
| B2O3×Na2O | 0.38413 |
| B2O3×CaO | −0.20958 |
| B2O3×Al2O3 | −0.33380 |
| Al2O3×CaO | −0.13741 |
| Na2O×K2O | 0.06169 |
| Na2O×Li2O | 0.08558 |
| Na2O×CaO | −0.10283 |
| K2O×Li2O | 0.17538 |
| K2O×MgO | 0.27425 |
| K2O×CaO | 0.2247 |
| MgO×CaO | −0.21563 |
| CaO×Li2O | −0.88170 |
| Al2O3×Na2O×CaO | 0.013868 |

#### `Fluegel_table12.csv` — Model validation isokom temperatures

Experimental vs Fluegel 2007 model predictions for 6 reference standards:

| Standard | T exp @ 1.5 | T model @ 1.5 | T exp @ 6.6 | T model @ 6.6 | T exp @ 12 | T model @ 12 |
|---|---|---|---|---|---|---|
| NIST 710A | 1319 | 1314 | 731 | 729 | 545 | 551 |
| NIST 717A | 1388 | 1378 | 719 | 731 | 514 | 520 |
| 711 (lead) | 1185 | 1172 | 614 | 614 | 443 | 445 |
| 710 | 1293 | 1294 | 725 | 732 | 556 | 564 |
| DGG I | 1301 | 1303 | 721 | 715 | 539 | 535 |
| WGS | 947 | 947 | 565 | (538)* | 457 | (418)* |

*Values in parentheses are flagged as outside the model's valid composition range.

**Used as acceptance tests** in Chapter 10. The maximum allowed deviation for in-range predictions is ±2×SE where SE = 9–17°C.

---

## Critical Encoding Notes

### ⚠️ Poise vs Pa·s (1 log unit offset)

Lakatos 1976 uses **log η in poise**. Fluegel 2007 and ASTM C965-96 use **log η in Pa·s**.

```
log η (Pa·s) = log η (poise) − 1
```

When feeding Lakatos isokom temperatures into the VTF fitting stage, the viscosity labels must be converted:
- Lakatos "log η = 2" poise → **log η = 1** Pa·s
- Lakatos "log η = 4" poise → **log η = 3** Pa·s
- Lakatos "log η = 6" poise → **log η = 5** Pa·s

Failure to apply this conversion causes a **systematic 10× error** in viscosity at every predicted temperature.

### ⚠️ Lakatos Composition Encoding

Input wt% must be transformed to **parts per 100 parts of SiO₂ by weight** before multiplying by the Lakatos coefficients. This is NOT the same as wt%. See Chapter 6 for the exact algorithm.

Example: A glass with SiO₂ = 72 wt%, Na₂O = 14 wt%, CaO = 10 wt% becomes:
- Na₂O = 14/72 × 100 = 19.44 parts per 100 SiO₂
- CaO = 10/72 × 100 = 13.89 parts per 100 SiO₂

### ⚠️ Fluegel Composition Encoding

Input wt% must be converted to mol%, and then SiO₂ is **excluded** — the remaining components are expressed as mol% of the total (not renormalized). See Chapter 6 for the exact algorithm.

Example: A glass with SiO₂ = 72 wt%, Na₂O = 14 wt%, CaO = 10 wt%:
1. Convert to moles: SiO₂ = 72/60.08 = 1.198, Na₂O = 14/61.98 = 0.226, CaO = 10/56.08 = 0.178
2. Total moles = 1.602 (sum of all components)
3. Total mol% of each = (moles/total) × 100
4. **Exclude SiO₂** — use only the non-SiO₂ mol% values as inputs C_i

---

**Next:** [Chapter 3 — Model Applicability and Selection](./chapter-03-model-selection.md)

