# Heat Conduction Solver: BC I — Finite Cylinder (Radius = $R$, Length = $2l$)

> **Scope:** Boundary Conditions of the First Kind ($Bi \to \infty$). All surfaces held at constant temperature $T_s$.
> $$\Theta = \frac{T - T_s}{T_0 - T_s}, \qquad \bar{\Theta} = \frac{\bar{T} - T_s}{T_0 - T_s}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$
> Mean thermal diffusivity $\bar{a}$ evaluated over $[T_s, T_c]$ — see [Material Properties](HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. IV, Sec. 8, pp. 144–145.

Radial boundary at $r = R$; axial boundaries at $z = \pm l$. Origin at geometric center.
Geometric ratio: $K_l = R / l$.

---

## 1. Product Solution Rule

The finite cylinder dimensionless temperature is the direct product of the 1D Infinite Cylinder and 1D Infinite Plate solutions:
$$\Theta_{\text{finite}}(r, z, \tau) = \Theta_{\text{cylinder}}(r, \tau) \cdot \Theta_{\text{plate}}(z, \tau)$$

**Architecture constraint:** Do not implement a 2D meshing loop. Invoke [BC I Infinite Cylinder](HEAT_CONDUCTION_03_BC1_CYLINDER.md) with $R$ and [BC I Infinite Plate](HEAT_CONDUCTION_02_BC1_PLATE.md) with $l$, then multiply outputs.

---

## 2. Local Temperature Profile
*(Ch. IV, Sec. 8, p. 144, Eq. 4.8.6)*

$$\Theta(r, z, \tau) = \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} A_n A_m J_0\!\left(\mu_n \frac{r}{R}\right) \cos\!\left(\mu_m \frac{z}{l}\right) \exp\!\left(-\!\left[\mu_n^2 + \mu_m^2 K_l^2\right] Fo\right)$$

**Eigenvalues:**
- Radial ($n$): $\mu_n$ are consecutive positive roots of $J_0(\mu_n) = 0$
- Axial ($m$): $\mu_m = (2m-1)\dfrac{\pi}{2}$

**Amplitude Coefficients:**
$$A_n = \frac{2}{\mu_n J_1(\mu_n)}, \qquad A_m = (-1)^{m+1}\frac{2}{\mu_m}$$

---

## 3. Mean Volumetric Temperature
*(Ch. IV, Sec. 8, p. 145, Eq. 4.8.7)*

$$\bar{\Theta}(\tau) = \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} B_n B_m \exp\!\left(-\!\left[\mu_n^2 + \mu_m^2 K_l^2\right] Fo\right)$$

**Volumetric Coefficients:**
$$B_n = \frac{4}{\mu_n^2} \quad \text{(radial cylinder)}, \qquad B_m = \frac{2}{\mu_m^2} \quad \text{(axial plate)}$$

