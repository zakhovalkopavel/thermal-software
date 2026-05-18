# Heat Transfer Coefficient: Nucleate Boiling Regime

> **Activation condition:** $T_s \le T_{\text{Leidenfrost}}$ AND $q > q_{\text{CHF2}}$ (see [HTC_00_REGIMES_OVERVIEW.md §2.3](HTC_00_REGIMES_OVERVIEW.md))

---

## 1. Purpose & Scope

This module defines seven engineering models for calculating the pool boiling heat transfer coefficient $\alpha_{\text{nb}}$ [W/(m²·K)] during the nucleate boiling regime.

| # | Model | Best Use Case |
|---|---|---|
| 1 | **Labuntsov** | General hydrodynamic boundary layer; no surface parameters needed |
| 2 | **Rohsenow** | Surface-fluid interaction; requires $C_{\text{sf}}$ factor |
| 3 | **Kutateladze** | Pressure-scaled similarity; no surface roughness needed |
| 4 | **Stephan-Abdelsalam** | High-accuracy multi-class regression (water, hydrocarbons, refrigerants, cryogens) |
| 5 | **Cooper** | Specialized for heavy oils and natural plant oils (reduced pressure) |
| 6 | **Yang-Maas** | Non-Newtonian polymer solutions (shear-thinning modification) |
| 7 | **Kovalev (Marangoni)** | Polymer solutions with surface tension concentration gradients |

---

## 2. Core Input Parameters

### 2.1. Operating & Geometrical Parameters
| Symbol | Description | Units |
|---|---|---|
| $q$ | Heat flux density | W/m² |
| $R_{\text{p}}$ | Mean roughness height of heating surface | μm |
| $C_{\text{sf}}$ | Surface-fluid empirical correction factor (Rohsenow only) | — |
| $g = 9.81$ | Acceleration due to gravity | m/s² |

### 2.2. Fluid Thermophysical Properties at Saturation ($T_s$)
| Symbol | Description | Units |
|---|---|---|
| $\rho_{\text{l}},\, \rho_{\text{v}}$ | Liquid and vapor densities | kg/m³ |
| $\lambda_{\text{l}}$ | Thermal conductivity of the liquid | W/(m·K) |
| $\mu_{\text{l}},\, \nu_{\text{l}}$ | Dynamic and kinematic viscosity of the liquid | Pa·s, m²/s |
| $c_{p\text{l}}$ | Specific isobaric heat capacity of the liquid | J/(kg·K) |
| $a_{\text{l}}$ | Thermal diffusivity of the liquid: $a_{\text{l}} = \lambda_{\text{l}} / (\rho_{\text{l}} c_{p\text{l}})$ | m²/s |
| $r$ | Specific latent heat of vaporization | J/kg |
| $\sigma$ | Surface tension coefficient | N/m |
| $P_s$ | Saturation pressure | Pa |
| $P_{\text{crit}}$ | Critical pressure of the fluid | Pa |

---

## 3. Model 1: Labuntsov Method

Evaluates the internal scales of the boiling boundary layer. No surface correction factors required.

### 3.1. Similarity Scales

$$L_* = \sqrt{\frac{\sigma}{g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}, \qquad Re_* = \frac{q \cdot L_*}{r \cdot \rho_{\text{v}} \cdot \nu_{\text{l}}}, \qquad Pr = \frac{\mu_{\text{l}} \cdot c_{p\text{l}}}{\lambda_{\text{l}}}$$

### 3.2. Governing Equations

**Sub-developed regime ($Re_* \le 0.01$):**
$$Nu_* = 0.0625 \cdot Re_*^{0.5} \cdot Pr^{1/3} \implies \alpha_{\text{nb}} = \frac{Nu_* \cdot \lambda_{\text{l}}}{L_*}$$

**Fully developed regime ($Re_* > 0.01$):**
$$Nu_* = 0.125 \cdot Re_*^{0.65} \cdot Pr^{1/3} \implies \alpha_{\text{nb}} = \frac{Nu_* \cdot \lambda_{\text{l}}}{L_*}$$

---

## 4. Model 2: Rohsenow Correlation (1952)

Solves for the wall superheat $\Delta T_{\text{sat}} = T_{\text{wall}} - T_s$ by matching the bubble release force balance with fluid-surface physical affinity.

### 4.1. Mathematical Formulation

$$\frac{c_{p\text{l}} \cdot \Delta T_{\text{sat}}}{r} = C_{\text{sf}} \cdot \left[\frac{q}{\mu_{\text{l}} \cdot r} \cdot \sqrt{\frac{\sigma}{g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}\right]^{n} \cdot Pr^{m}$$

Where: $n = 0.33$; $m = 1.0$ for Water, $m = 1.7$ for all other fluids.

### 4.2. Algorithmic Steps

1. **Isolate wall superheat:**
   $$\Delta T_{\text{sat}} = \frac{r \cdot C_{\text{sf}}}{c_{p\text{l}}} \cdot \left[\frac{q}{\mu_{\text{l}} \cdot r} \cdot \sqrt{\frac{\sigma}{g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}\right]^{0.33} \cdot Pr^{m}$$
2. **Compute heat transfer coefficient:**
   $$\alpha_{\text{nb, Rohsenow}} = \frac{q}{\Delta T_{\text{sat}}}$$

### 4.3. Standard $C_{\text{sf}}$ Reference Values

| Fluid–Surface Combination | $C_{\text{sf}}$ |
|---|---|
| Water – Copper (Polished) | 0.0130 |
| Water – Scored Copper | 0.0068 |
| Water – Stainless Steel (Mechanically Polished) | 0.0130 |
| n-Pentane – Chromium | 0.0150 |
| Benzene – Chromium | 0.0100 |

---

## 5. Model 3: Kutateladze Correlation (1952)

Based on hydrodynamic criteria of pool boiling stability. Introduces a structural dimensionless pressure ratio group.

### 5.1. Similarity Groups

$$L_K = \sqrt{\frac{\sigma}{g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}, \qquad Re_K = \frac{q}{r \cdot \rho_{\text{v}} \cdot \nu_{\text{l}}} \cdot \sqrt{\frac{\sigma}{g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}, \qquad K_p = \frac{P_s}{\sqrt{\sigma \cdot g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}$$

$$Nu_K = \frac{\alpha_{\text{nb}} \cdot L_K}{\lambda_{\text{l}}}$$

### 5.2. Governing Equation

$$Nu_K = 7.0 \times 10^{-4} \cdot Re_K^{0.7} \cdot Pr^{0.35} \cdot K_p^{0.7}$$

### 5.3. Extraction

$$\alpha_{\text{nb, Kutateladze}} = \frac{Nu_K \cdot \lambda_{\text{l}}}{L_K}$$

---

## 6. Model 4: Stephan-Abdelsalam Correlation (1980)

A comprehensive regression model built on a 5000+ experimental data point matrix. Uses the Fritz bubble departure diameter $d_{\text{db}}$ based on a static contact angle $\theta = 35°$ ($0.0146 \times 35 = 0.511$).

### 6.1. Preliminary Calculations

**Fritz Bubble Departure Diameter:**
$$d_{\text{db}} = 0.511 \cdot \sqrt{\frac{2 \cdot \sigma}{g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}$$

**Base Nusselt Definition:**
$$Nu_{\text{SA}} = \frac{\alpha_{\text{nb}} \cdot d_{\text{db}}}{\lambda_{\text{l}}} \implies \alpha_{\text{nb, Stephan}} = \frac{Nu_{\text{SA}} \cdot \lambda_{\text{l}}}{d_{\text{db}}}$$

### 6.2. Fluid-Class Formulations

#### Class A — Water
$$Nu_{\text{SA}} = 0.063 \cdot \left[\frac{q \cdot d_{\text{db}}}{\lambda_{\text{l}} \cdot T_s}\right]^{0.74} \cdot \left[\frac{\rho_{\text{v}}}{\rho_{\text{l}}}\right]^{0.156} \cdot \left[\frac{r \cdot d_{\text{db}}^2}{a_{\text{l}}^2}\right]^{0.326} \cdot Pr_{\text{l}}^{-0.5}$$

#### Class B — Hydrocarbons (Organic Liquids)
$$Nu_{\text{SA}} = 0.0546 \cdot \left[\left(\frac{\rho_{\text{v}}}{\rho_{\text{l}}}\right)^{0.5} \cdot \frac{q \cdot d_{\text{db}}}{\lambda_{\text{l}} \cdot T_s}\right]^{0.67} \cdot \left[\frac{\rho_{\text{l}} - \rho_{\text{v}}}{\rho_{\text{l}}}\right]^{-4.33} \cdot \left[\frac{r \cdot d_{\text{db}}^2}{a_{\text{l}}^2}\right]^{0.248} \cdot \left[\frac{R_{\text{p}}}{d_{\text{db}}}\right]^{0.133}$$

#### Class C — Refrigerants / Halocarbon Compounds
$$Nu_{\text{SA}} = 207 \cdot \left[\frac{q \cdot d_{\text{db}}}{\lambda_{\text{l}} \cdot T_s}\right]^{0.745} \cdot \left[\frac{\rho_{\text{v}}}{\rho_{\text{l}}}\right]^{0.581} \cdot Pr_{\text{l}}^{0.533} \cdot \left[\frac{P_s}{P_{\text{crit}}}\right]^{1.134} \cdot \left[\frac{R_{\text{p}}}{d_{\text{db}}}\right]^{0.133}$$

#### Class D — Cryogenic Fluids
$$Nu_{\text{SA}} = 0.23 \cdot \left[\frac{q \cdot d_{\text{db}}}{\lambda_{\text{l}} \cdot T_s}\right]^{0.674} \cdot \left[\frac{\rho_{\text{v}}}{\rho_{\text{l}}}\right]^{0.297} \cdot \left[\frac{r \cdot d_{\text{db}}^2}{a_{\text{l}}^2}\right]^{0.371} \cdot \left[\frac{\rho_{\text{l}} - \rho_{\text{v}}}{\rho_{\text{l}}}\right]^{-1.73}$$

---

## 7. Model 5: Cooper Correlation (1984) — Specialized for Oils

A reduced pressure correlation substituting complex transport properties with molecular weight ($M$) and reduced pressure $P_{\text{red}} = P_s / P_{\text{crit}}$. Ideal for heavy mineral oils and natural plant oils.

### 7.1. Heat Transfer Coefficient (given $q$)

$$\alpha_{\text{nb, Cooper}} = 900 \cdot q^{0.67} \cdot M^{-0.5} \cdot P_{\text{red}}^{0.12} \cdot (-\log_{10} P_{\text{red}})^{-0.55}$$

### 7.2. Molecular Weight Reference Values

| Fluid Type | $M$ [g/mol] |
|---|---|
| Mineral / Transformer Oils | 250 – 350 |
| Natural Oils (Sunflower, Rapeseed) | 850 – 890 (triglycerides) |

### 7.3. Direct Computation of Heat Flux from Surface Temperature

When $T_{\text{wall}}$ and $T_s$ are explicitly specified instead of $q$, the implicit coupling $q = \alpha \cdot \Delta T_{\text{sat}}$ can be resolved analytically. The explicit form is:

$$\boxed{q = \left[900 \cdot \Delta T_{\text{sat}} \cdot M^{-0.5} \cdot P_{\text{red}}^{0.12} \cdot (-\log_{10} P_{\text{red}})^{-0.55}\right]^{3.03}}$$

Where $\Delta T_{\text{sat}} = T_{\text{wall}} - T_s$.

**Algorithmic execution steps:**
1. Calculate wall superheat: $\Delta T_{\text{sat}} = T_{\text{wall}} - T_s$.
2. Compute the baseline product inside the brackets (with matching pressure units for $P_{\text{red}}$).
3. Apply the power transformation: raise the full bracket to $3.03$ (derived from $1/(1-0.67)$).
4. Validate: if the computed $q > q_{\text{crit}}$, the system has transitioned to film boiling — nucleate-regime correlations are invalid.

---

## 8. Model 6: Yang-Maas Modification for Polymer Solutions

Modifies boundary layer dynamics for non-Newtonian shear-thinning media obeying the Ostwald-de Waele power-law model ($\tau = K \cdot \dot{\gamma}^n$).

### 8.1. Microscale Shear Rate

$$\dot{\gamma}_{\text{bubble}} = \frac{q}{\rho_{\text{v}} \cdot r \cdot d_{\text{db}}}$$

($d_{\text{db}}$ from Section 6.1 Fritz definition.)

### 8.2. Effective Boundary Layer Viscosity

$$\mu_{\text{eff}} = K \cdot (\dot{\gamma}_{\text{bubble}})^{n-1}$$

### 8.3. Integration into Primary Models

Substitute $\mu_{\text{eff}}$ for $\mu_{\text{l}}$ (and $\nu_{\text{eff}} = \mu_{\text{eff}}/\rho_{\text{l}}$) in Labuntsov, Rohsenow, or Kutateladze:

$$Pr_{\text{eff}} = \frac{\mu_{\text{eff}} \cdot c_{p\text{l}}}{\lambda_{\text{l}}} \implies Nu_* = f(Re_{\text{eff}}, Pr_{\text{eff}}) \implies \alpha_{\text{nb, Yang-Maas}}$$

---

## 9. Model 7: Kovalev Marangoni Model for Polymer Solutions

Accounts for structural suppression of boiling caused by macro-polymer networks and concentration gradients at the expanding bubble interface (Marangoni effect).

### 9.1. Mathematical Formulation

$$\alpha_{\text{nb, Kovalev}} = \alpha_{\text{nb, water}} \cdot \left[1 - \xi \cdot \left(\frac{\partial \sigma}{\partial x} \cdot C_{\text{poly}}\right)^{0.5} \cdot Pr_{\text{l}}^{-0.2} \cdot \left(\frac{\mu_{\text{l}}}{\mu_{\text{water}}}\right)^{0.15}\right]$$

### 9.2. Parameter Definitions

| Symbol | Description |
|---|---|
| $\alpha_{\text{nb, water}}$ | Baseline boiling coefficient for pure water at identical $q$ |
| $\partial \sigma / \partial x$ | Concentration gradient of surface tension [N/(m·wt.%)] |
| $C_{\text{poly}}$ | Polymer concentration |
| $\xi$ | Structural dampening factor: $\approx 0.045$ for low-viscosity polymers; $\approx 0.12$ for long-chain polyacrylamides |

---

## 10. Comparative Validation Summary

| Model | Key Sensitivity |
|---|---|
| **Labuntsov** | Sensitive to $q^{0.65}$ shifts. No surface variability parameters. |
| **Rohsenow** | Highly sensitive to the selected $C_{\text{sf}}$ value. |
| **Kutateladze** | Strong pressure scaling via $K_p^{0.7}$ group. |
| **Stephan-Abdelsalam** | Strictly differentiates water-loops from organic loops. |
| **Cooper** | High dampening as molecular weight $M$ increases (heavy oils). |
| **Yang-Maas** | Captures non-Newtonian shear-thinning; $\alpha$ jumps sharply at high $q$. |
| **Kovalev** | Predicts 20–50% degradation of $\alpha$ as polymer network density rises. |

---

## 11. Bibliography

1. **Labuntsov, D. A.** (1960). Generalized relationships for heat transfer during nucleate boiling of liquids. *Teploenergetika*, No. 5, pp. 79–81.
2. **Rohsenow, W. M.** (1952). A Method of Correlating Heat-Transfer Data for Surface Boiling of Liquids. *Transactions of the ASME*, 74, 969–975.
3. **Kutateladze, S. S.** (1952). *Heat Transfer in Condensation and Boiling.* US Atomic Energy Commission Technical Report, AEC-tr-3770.
4. **Stephan, K., & Abdelsalam, M.** (1980). Heat transfer correlations for natural convection boiling. *International Journal of Heat and Mass Transfer*, 23(1), 73–87.
5. **Cooper, M. G.** (1984). Saturation Pool Boiling — A Simple Correlation. *International Chemical Engineering Symposium Series*, 86, 785–793.
6. **Yang, Y. M., & Maas, B.** (1994). Pool boiling heat transfer to non-Newtonian polymer solutions. *Journal of Enhanced Heat Transfer*, 1(3), 241–255.
7. **Kovalev, S. A., & Derevyanko, D. G.** (2001). Boiling heat transfer of polymer and surfactant solutions with concentration gradients. *International Journal of Heat and Mass Transfer*, 44(8), 1563–1572.
8. **VDI-Gesellschaft.** (2010). *VDI Heat Atlas* (2nd ed.). Springer. Sections H1–H3. ISBN 978-3-540-77877-6.

