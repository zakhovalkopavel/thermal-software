# Heat Transfer Coefficient: Critical Heat Flux (CHF) & Minimum Heat Flux (MHF) Framework

> **Role:** Computes the two boiling crisis boundaries required by the regime orchestrator ([HTC_00_REGIMES_OVERVIEW.md](HTC_00_REGIMES_OVERVIEW.md)):
> - **First Critical Heat Flux $q_{\text{crit,1}}$ (CHF):** Nucleate-to-film boiling transition.
> - **Second Critical Heat Flux $q_{\text{crit,2}}$ (MHF / Leidenfrost Point):** Film-to-nucleate re-wetting transition.

---

## 1. Input Parameters

### 1.1. Operating & Surface Parameters
| Symbol | Description | Units |
|---|---|---|
| $P_s$ | Operating saturation pressure | Pa or bar |
| $\Delta T_{\text{sub}}$ | Saturated liquid subcooling margin: $\Delta T_{\text{sub}} = T_s - T_{\text{fluid,bulk}}$ | K |
| $\theta$ | Fluid-surface static contact wetting angle | degrees |
| $\phi$ | Surface inclination angle relative to horizontal upward ($\phi = 0°$) | degrees |

### 1.2. Fluid Thermophysical Properties at Saturation ($T_s$)
| Symbol | Description | Units |
|---|---|---|
| $r$ | Specific latent heat of vaporization | J/kg |
| $\rho_{\text{l}},\, \rho_{\text{v}}$ | Saturated liquid and vapor densities | kg/m³ |
| $\mu_{\text{l}}$ | Dynamic viscosity of the liquid | Pa·s |
| $c_{p\text{l}}$ | Specific isobaric heat capacity of the liquid | J/(kg·K) |
| $\lambda_{\text{l}}$ | Thermal conductivity of the liquid | W/(m·K) |
| $\sigma$ | Surface tension coefficient | N/m |

### 1.3. Heater Wall Material Properties (required for Henry Model)
| Symbol | Description | Units |
|---|---|---|
| $\rho_{\text{wall}}$ | Density of the solid heater matrix | kg/m³ |
| $c_{p\text{wall}}$ | Specific heat capacity of the solid heater | J/(kg·K) |
| $\lambda_{\text{wall}}$ | Thermal conductivity of the solid heater | W/(m·K) |

**Constant:** $g = 9.81$ m/s²

---

## 2. Universal Baseline Calculations

Evaluate these before branching into specific models.

### 2.1. Base Hydrodynamic Flux Scale Factor ($q_{\text{hydro}}$)

$$q_{\text{hydro}} = r \cdot \sqrt{\rho_{\text{v}}} \cdot \left[g \cdot \sigma \cdot (\rho_{\text{l}} - \rho_{\text{v}})\right]^{1/4}$$

### 2.2. Universal Subcooling Magnification Modifier ($F_{\text{sub}}$)

$$F_{\text{sub}} = 1 + C_{\text{sub}} \cdot \left(\frac{\rho_{\text{l}}}{\rho_{\text{v}}}\right)^{3/4} \cdot \frac{c_{p\text{l}} \cdot \Delta T_{\text{sub}}}{r}$$

Where $C_{\text{sub}}$ is evaluated dynamically:
$$C_{\text{sub}} = 0.1 \cdot \left[1 + 2.5 \cdot \left(\frac{\rho_{\text{v}}}{\rho_{\text{l}}}\right)^{0.5}\right]$$

---

## 3. Model 1: Zuber CHF Correlation (1958)

Based on pure hydrodynamic wave mechanics (Taylor and Helmholtz wave-front breakdown). Treats the heater surface as physically neutral.

$$\boxed{q_{\text{crit,1 (Zuber)}} = K_{\text{Zuber}} \cdot q_{\text{hydro}} \cdot F_{\text{sub}}}$$

Where the fixed analytical hydrodynamic stability factor is:
$$K_{\text{Zuber}} = 0.131$$

---

## 4. Model 2: Kutateladze-Borishanskii Viscous Model (1952/1959)

Extends Kutateladze's stability criteria with viscous shear forces in the boundary layer fluid film. Critical for heavy mineral lubricants and high-viscosity oils.

### 4.1. Borishanskii Dimensionless Number ($N$)

$$N = \frac{\rho_{\text{l}} \cdot \sigma}{\mu_{\text{l}}^2} \cdot \sqrt{\frac{\sigma}{g \cdot (\rho_{\text{l}} - \rho_{\text{v}})}}$$

### 4.2. Stability Factor $K(N)$ — Regime Mapping

**Regime A — Moderate & Low-Viscosity Zone ($N > 18$):**
$$K(N) = 0.13 + 4 \cdot N^{-0.4}$$

**Regime B — High-Viscosity Damping Zone ($N \le 18$):**
$$K(N) = 0.57 \cdot N^{-0.25}$$

### 4.3. Final Equation

$$\boxed{q_{\text{crit,1 (Kutateladze)}} = K(N) \cdot q_{\text{hydro}} \cdot F_{\text{sub}}}$$

---

## 5. Model 3: Kandlikar Surface Wetting & Inclination Model (2001)

Maps force balances (vapor momentum vs. surface tension forces) at the three-phase contact line of a bubble.

$$\boxed{q_{\text{crit,1 (Kandlikar)}} = K_{\text{Kan}} \cdot q_{\text{hydro}} \cdot F_{\text{sub}}}$$

Where the dynamic stability factor tracks fluid-surface contact angle $\theta$ and heater inclination $\phi$:
$$K_{\text{Kan}} = \left(\frac{1 + \cos\theta}{16}\right) \cdot \left[\frac{2}{\pi} + \frac{\pi}{4} \cdot (1 + \cos\theta) \cdot \cos\phi\right]^{1/2}$$

---

## 6. Model 4: Second Critical Heat Flux ($q_{\text{crit,2}}$) & Leidenfrost Point

### 6.1. Berenson Baseline Hydrodynamic Model (1961)

Minimum heat flux required to sustain a continuous vapor blanket, via classical Taylor instability on flat upward-facing geometries:
$$q_{\text{crit,2 (Berenson)}} = 0.09 \cdot r \cdot \rho_{\text{v}} \cdot \left[\frac{g \cdot \sigma \cdot (\rho_{\text{l}} - \rho_{\text{v}})}{(\rho_{\text{l}} + \rho_{\text{v}})^2}\right]^{1/4}$$

### 6.2. Henry Thermal Wall Coupling Modification (1973)

Accounts for solid-state heater thermal properties. Real vapor film collapse is initiated by localized liquid droplet wetting, governed by thermal effusivity ratio:

$$\boxed{q_{\text{crit,2 (Henry)}} = q_{\text{crit,2 (Berenson)}} \cdot \left[1 + 0.42 \cdot \left(\frac{\sqrt{\rho_{\text{l}} \cdot c_{p\text{l}} \cdot \lambda_{\text{l}}}}{\sqrt{\rho_{\text{wall}} \cdot c_{p\text{wall}} \cdot \lambda_{\text{wall}}}}\right) \cdot \left(\frac{r}{c_{p\text{wall}} \cdot \Delta T_{\text{Leidenfrost}}}\right)^{0.6}\right]}$$

> **Note:** For organic fluids and oils, if no explicit transient metrics are available, use the empirical approximation $\Delta T_{\text{Leidenfrost}} \approx 120$ K.

---

## 7. Comparative Validation Sensitivities

| Model | Key Sensitivity Behaviour |
|---|---|
| **Zuber** | Purely thermodynamic/hydrodynamic. Acts as a baseline scalar reference. |
| **Kutateladze-Borishanskii** | As fluid viscosity increases, $N$ drops, $K(N)$ climbs — viscous films stabilize against sudden vapor layer expansion. |
| **Kandlikar** | Highly sensitive to surface modifications. Hydrophilic textures ($\theta \to 0°$) raise CHF; hydrophobic surfaces suppress the nucleate envelope. |
| **Henry** | High-conductivity substrates (copper, silver) maintain vapor films longer, lowering $q_{\text{crit,2}}$. Low-conductivity walls (stainless steel, ceramics) collapse earlier, raising $q_{\text{crit,2}}$. |

---

## 8. Bibliography

1. **Zuber, N.** (1958). On the Stability of Boiling Heat Transfer. *Transactions of the ASME*, 80(3), 711–714.
2. **Kutateladze, S. S.** (1979). *Fundamentals of Heat Transfer Theory.* Moscow: Atomizdat, pp. 286–290.
3. **Borishanskii, V. M.** (1959). On the effect of viscosity on the hydrodynamic stability of a two-phase layer during boiling. *Trudy TsKTI*, 35, 11–16.
4. **Kandlikar, S. G.** (2001). A Theoretical Model to Predict Pool Boiling CHF Incorporating Effects of Contact Angle and Orientation. *Journal of Heat Transfer*, 123(6), 1071–1079.
5. **Berenson, P. J.** (1961). Film-Boiling Heat Transfer From a Horizontal Surface. *Journal of Heat Transfer*, 83(3), 351–356.
6. **Henry, R. E.** (1973). A Correlation for the Minimum Film Boiling Temperature. *AIChE Symposium Series*, 69, 81–90.

