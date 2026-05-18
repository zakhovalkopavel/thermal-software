# Heat Conduction Solver: Material Properties & Input Parameters

> **Applies to:** All geometries under both BC I and BC III solvers.
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Source data from D. U. Furrer, S. L. Semiatin, *ASM Handbook – Volume 22B: Metals Process Simulation*, The Materials Information Society.

---

## 1. Temperature-Dependent Thermophysical Properties — AISI 304

The thermophysical properties of AISI 304 stainless steel vary with temperature $T$ (in °C). The following standard linear approximations are used throughout the solver:

| Property | Symbol | Formula | Units |
|---|---|---|---|
| Density | $\rho$ | constant $= 7930$ | kg/m³ |
| Thermal conductivity | $\lambda(T)$ | $14.6 + 0.015 \cdot T$ | W/(m·K) |
| Specific heat capacity | $c(T)$ | $462 + 0.134 \cdot T$ | J/(kg·K) |

---

## 2. Mean Property Evaluation

Because material properties are temperature-dependent, all dimensionless criteria ($Fo$, $Bi$) must use **integrated mean values** over the active temperature range.

### 2.1. BC I — Mean Properties over $[T_s, T_c]$

When the surface temperature $T_s$ is the boundary constraint, properties are averaged between the surface and the current center temperature $T_c$:

$$\bar{\lambda} = \frac{1}{T_c - T_s} \int_{T_s}^{T_c} \lambda(T)\, dT = 14.6 + 0.0075 \cdot (T_c + T_s)$$

$$\bar{c} = \frac{1}{T_c - T_s} \int_{T_s}^{T_c} c(T)\, dT = 462.0 + 0.067 \cdot (T_c + T_s)$$

$$\bar{a} = \frac{\bar{\lambda}}{\rho \cdot \bar{c}} \quad \text{[m}^2\text{/s]}$$

### 2.2. BC III — Mean Properties over $[T_f, T_c]$

When a fluid environment at temperature $T_f$ provides the boundary condition, properties are averaged between the ambient fluid and the current center temperature $T_c$:

$$\bar{\lambda} = 14.6 + 0.0075 \cdot (T_c + T_f)$$

$$\bar{c} = 462.0 + 0.067 \cdot (T_c + T_f)$$

$$\bar{a} = \frac{\bar{\lambda}}{\rho \cdot \bar{c}} \quad \text{[m}^2\text{/s]}$$

---

## 3. Dimensionless Criteria

The two dimensionless parameters governing all transient solutions are:

$$Fo = \frac{\bar{a} \cdot \tau}{R^2} \qquad \text{(Fourier number)}$$

$$Bi = \frac{\alpha_{\text{eff}} \cdot R}{\bar{\lambda}} \qquad \text{(Biot number)}$$

Where $R$ is the characteristic geometric dimension (half-thickness for a plate, outer radius for cylinders and sphere).

---

## 4. Total Effective Heat Transfer Coefficient ($\alpha_{\text{eff}}$) — BC III Only

To remain compatible with Luikov's analytical BC III solutions, an instantaneous, linearized effective heat transfer coefficient $\alpha_{\text{eff}}$ must be evaluated at the boundary based on the current absolute surface temperature $T_{s,\text{K}} = T_s + 273.15$ [K]:

$$\alpha_{\text{eff}}(T_s) = \alpha_{\text{conv}}(T_s) + \alpha_{\text{rad,surf}}(T_s) + \alpha_{\text{rad,gas}}(T_s)$$

### 4.1. Convective Component
$$\alpha_{\text{conv}}(T_s) = \alpha_0 \cdot |T_s - T_f|^k$$

Where $\alpha_0$ and $k$ are empirical convection model parameters specific to the fluid and flow geometry.

### 4.2. Surface Enclosure Radiation Component
$$\alpha_{\text{rad,surf}}(T_s) = \varepsilon_{\text{eff}} \cdot \sigma \cdot (T_{s,\text{K}} + T_{\text{surr,K}}) \cdot (T_{s,\text{K}}^2 + T_{\text{surr,K}}^2) \cdot \left(\frac{T_s - T_{\text{surr}}}{T_s - T_f}\right)$$

Where:
- $\sigma = 5.67 \times 10^{-8}$ W/(m²·K⁴) — Stefan-Boltzmann constant
- $\varepsilon_{\text{eff}}$ — reduced effective emissivity of the surface-enclosure system
- $T_{\text{surr,K}} = T_{\text{surr}} + 273.15$ — absolute enclosure wall temperature [K]

### 4.3. Gas Volume Radiation Component
$$\alpha_{\text{rad,gas}}(T_s) = \sigma \cdot \left(\frac{\varepsilon_g T_{g,\text{K}}^4 - a_g T_{s,\text{K}}^4}{T_s - T_f}\right)$$

Where:
- $\varepsilon_g$ — gas emissivity at the gas temperature
- $a_g$ — gas absorptivity evaluated at the surface temperature
- $T_{g,\text{K}} = T_g + 273.15$ — absolute gas temperature [K]

> **Note for Oil Quenching:** For oil cooling processes, $\alpha_{\text{eff}}$ cannot be assumed constant. The solver must evaluate a non-linear piecewise function $\alpha_{\text{eff}} = f(T_s)$ reflecting three boiling intervals: film boiling, nucleate boiling, and pure convective heat transfer. See [Heat Transfer Coefficient Regimes](../heat-transfer-coefficient/HTC_00_REGIMES_OVERVIEW.md).

---

## 5. Input Parameters Summary

### 5.1. Inputs Common to All Cases
| Parameter | Symbol | Description | Units |
|---|---|---|---|
| Geometry choice | — | Plate / Cylinder / Sphere / Hollow Cylinder / Parallelepiped / Finite Cylinder | — |
| Initial uniform temperature | $T_0$ | Temperature at $\tau = 0$ | °C |
| Characteristic dimension | $R$ | Half-thickness (plate) or outer radius (cylinder, sphere) | m |
| Inner radius (hollow) | $R_1$ | Inner radius for hollow cylinder | m |
| Outer radius (hollow) | $R_2$ | Outer radius for hollow cylinder | m |
| Half-length (finite cylinder) | $l$ | Axial half-length | m |
| Parallelepiped half-dimensions | $R_1, R_2, R_3$ | Half-dimensions along $x, y, z$ axes | m |

### 5.2. Additional Inputs for BC I
| Parameter | Symbol | Description | Units |
|---|---|---|---|
| Surface temperature | $T_s$ | Constant boundary constraint maintained by the coolant | °C |
| Elapsed time | $\tau$ | Time since process start | s |

### 5.3. Additional Inputs for BC III
| Parameter | Symbol | Description | Units |
|---|---|---|---|
| Fluid temperature | $T_f$ | Ambient fluid bulk temperature | °C |
| Enclosure temperature | $T_{\text{surr}}$ | Surrounding solid enclosure temperature | °C |
| Gas temperature | $T_g$ | Emitting/absorbing gas temperature | °C |
| Surface emissivity | $\varepsilon_{\text{eff}}$ | Reduced emissivity of part-enclosure system | — |
| Gas emissivity | $\varepsilon_g$ | Gas emissivity at $T_g$ | — |
| Gas absorptivity | $a_g$ | Gas absorptivity at surface temperature $T_s$ | — |
| Convection parameters | $\alpha_0, k$ | Base convection coefficient and temperature exponent | W/(m²·K^{1+k}) |
| Time step | $\Delta\tau$ | Discrete time increment | s |
| Target end time | $\tau_{\text{end}}$ | Total process duration | s |

