# Heat Transfer Coefficient: Film Boiling Regime

> **Activation condition:** $T_s > T_{\text{Leidenfrost}}$ (see [HTC_01_CRITICAL_FLUX.md §6](HTC_01_CRITICAL_FLUX.md))
>
> Heat transitions across the stable continuous vapor curtain via a parallel additive circuit combining the Bromley conductive film derivation and surface thermal radiation.

---

## 1. Leidenfrost Temperature — Phase Selection Marker

Before invoking local film boiling solvers, compute the stable film collapse lower boundary $T_{\text{Leidenfrost}}$ using Berenson's minimum heat flux derivation (1961):

### 1.1. Modified Latent Enthalpy

$$r_{\text{evap}}' = r_{\text{evap}} + 0.4 \cdot c_{p,v}(T_{\text{film}}) \cdot (T_s - T_{\text{sat}})$$

Where $T_{\text{film}} = (T_s + T_{\text{sat}}) / 2$ is the vapor film reference temperature.

### 1.2. Minimum Superheat

$$\Delta T_{\text{Min}} = 0.127 \cdot \frac{\rho_v \cdot r_{\text{evap}}'}{\lambda_v} \cdot \left[\frac{g \cdot (\rho_{\text{oil}} - \rho_v)}{\rho_{\text{oil}} + \rho_v}\right]^{2/3} \cdot \left[\frac{\sigma_{\text{st}}}{g \cdot (\rho_{\text{oil}} - \rho_v)}\right]^{1/2} \cdot \left[\frac{\mu_v}{g \cdot (\rho_{\text{oil}} - \rho_v)}\right]^{1/3}$$

### 1.3. Absolute Leidenfrost Boundary

$$T_{\text{Leidenfrost}} = T_{\text{sat}} + \Delta T_{\text{Min}}$$

---

## 2. Base Effective Heat Transfer Coefficient ($T_s > T_{\text{Leidenfrost}}$)

The total effective film boiling coefficient is a parallel additive combination:

$$\alpha_{\text{eff,film}}(T_s) = \alpha_{\text{cond}}(T_s) + \frac{3}{4}\,\alpha_{\text{rad,surf}}(T_s)$$

### 2.1. Conduction Component — Bromley Derivation (1950)

$$\alpha_{\text{cond}}(T_s) = 0.62 \cdot \left[\frac{\lambda_v^3 \cdot \rho_v \cdot (\rho_{\text{oil}} - \rho_v) \cdot g \cdot r_{\text{evap}}'}{\mu_v \cdot R \cdot (T_s - T_{\text{sat}})}\right]^{0.25}$$

Where:
- $R$ — characteristic physical dimension of the solid part
- $\mu_v$ — absolute dynamic viscosity of the vapor phase (**not** kinematic; see note in Section 6)

### 2.2. Radiation Component — Surface-to-Saturated-Vapor

$$\alpha_{\text{rad,surf}}(T_s) = \varepsilon_{\text{eff}} \cdot \sigma \cdot (T_{s,\text{K}} + T_{\text{sat,K}}) \cdot (T_{s,\text{K}}^2 + T_{\text{sat,K}}^2)$$

Where:
- $\sigma = 5.67 \times 10^{-8}$ W/(m²·K⁴)
- $T_{s,\text{K}} = T_s + 273.15$, $T_{\text{sat,K}} = T_{\text{sat}} + 273.15$

---

## 3. Spatial Orientation-Based Routing

For multi-dimensional or finite body geometries, the module segments boundary surfaces by orientation and applies distinct local formulations.

### 3.1. Horizontal Faces (Top/Bottom / Horizontal Plates)

Apply the scale-independent Rayleigh-Taylor (Berenson, 1961) model driven by vapor bubble detachment wave field spacing:

$$\alpha_{\text{cond, horizontal}} = 0.425 \cdot \left[\frac{\lambda_v^3 \cdot \rho_v \cdot (\rho_{\text{oil}} - \rho_v) \cdot g \cdot r_{\text{evap}}'}{\mu_v \cdot (T_s - T_{\text{sat}}) \cdot \sqrt{\dfrac{\sigma_{\text{st}}}{g \cdot (\rho_{\text{oil}} - \rho_v)}}}\right]^{0.25}$$

### 3.2. Vertical Faces (Lateral Cylinder Surfaces / Vertical Walls)

Apply the Bromley-vertical formulation via direct mathematical analogy with Nusselt's laminar boundary layer film condensation (Hsu & Westwater, 1958). Boundary layer thickness is driven by buoyancy forces along the vertical axis of height $L$:

$$\alpha_{\text{cond, vertical}} = 0.943 \cdot \left[\frac{\lambda_v^3 \cdot \rho_v \cdot (\rho_{\text{oil}} - \rho_v) \cdot g \cdot r_{\text{evap}}'}{\mu_v \cdot L \cdot (T_s - T_{\text{sat}})}\right]^{0.25}$$

---

## 4. Klimenko's Universal Correlation (1981)

For modeling transition regions covering both laminar and turbulent vapor flows, and to prevent unphysical geometric overscaling on large parts, evaluate via Klimenko's unified capillary length scale criteria.

### 4.1. Characteristic Capillary Dimension

$$L_c = \sqrt{\frac{\sigma_{\text{st}}}{g \cdot (\rho_{\text{oil}} - \rho_v)}}$$

### 4.2. Dimensionless Parameters (Vapor Properties)

$$Ga = \frac{g \cdot L_c^3}{\nu_v^2}, \qquad Pr = \frac{\nu_v \cdot \rho_v \cdot c_{p,v}}{\lambda_v}, \qquad Ja = \frac{c_{p,v} \cdot (T_s - T_{\text{sat}})}{r_{\text{evap}}'}$$

### 4.3. Nusselt Number Selection

**Laminar Film Regime ($Ga \le 10^8$):**
- If $Ja \ge 0.5$: $\quad Nu = 0.19 \cdot (Ga \cdot Pr)^{0.25}$
- If $Ja < 0.5$: $\quad Nu = 0.15 \cdot (Ga \cdot Pr)^{0.25} \cdot Ja^{-0.33}$

**Turbulent Film Regime ($Ga > 10^8$):**
- If $Ja \ge 0.5$: $\quad Nu = 0.0086 \cdot (Ga \cdot Pr)^{0.33}$
- If $Ja < 0.5$: $\quad Nu = 0.0056 \cdot (Ga \cdot Pr)^{0.33} \cdot Ja^{-0.33}$

### 4.4. Orientation Factors & Final $\alpha_{\text{cond}}$

**Horizontal boundary components:**
$$\alpha_{\text{cond}} = 1.00 \cdot \frac{Nu \cdot \lambda_v}{L_c}$$

**Vertical boundary components (height $L$):**
$$\alpha_{\text{cond}} = 0.88 \cdot \frac{Nu \cdot \lambda_v}{L_c}$$

---

## 5. Downstream Execution Branching

Once $T_s$ drops below $T_{\text{Leidenfrost}}$, terminate this solver block and pass execution context downstream:

- **$q > q_{\text{CHF2}}$:** See [HTC_03_NUCLEATE_BOILING.md](HTC_03_NUCLEATE_BOILING.md) for the active bubble generation domain.
- **$q \le q_{\text{CHF2}}$:** Route to standard single-phase convection modules.

---

## 6. Implementation Notes

1. **Property Interpolation Precision:** All vapor thermophysical properties ($\nu_v, \mu_v, \rho_v, \lambda_v, c_{p,v}$) must be dynamically interpolated from backend lookup tables using the current film reference temperature: $T_{\text{film}} = (T_s + T_{\text{sat}}) / 2$.
2. **Viscosity Mapping:** Use absolute dynamic viscosity $\mu_v$ (not kinematic $\nu_v$) in the denominators of Sections 2.1, 3.1, and 3.2 to maintain correct physical unit dimensional consistency (W/(m²·K)).
3. **Modified Latent Heat:** $r_{\text{evap}}'$ must be recomputed at every time step as $T_s$ evolves.

---

## 7. Bibliography

- **Berenson, P. J.** (1961). Film boiling heat transfer from a horizontal surface. *Journal of Heat Transfer*, 83(3), 351–356.
- **Bromley, L. A.** (1950). Heat transfer in stable film boiling. *Chemical Engineering Progress*, 46, 221–227.
- **Hsu, Y. Y., & Westwater, J. W.** (1958). Film boiling from vertical tubes. *AIChE Journal*, 4(1), 58–62.
- **Klimenko, V. V.** (1981). Film boiling on a horizontal plate — a generalized correlation. *International Journal of Heat and Mass Transfer*, 24(1), 69–79.

