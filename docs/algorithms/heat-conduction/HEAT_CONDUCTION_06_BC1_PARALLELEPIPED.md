# Heat Conduction Solver: BC I — Rectangular Parallelepiped ($2R_1 \times 2R_2 \times 2R_3$)

> **Scope:** Boundary Conditions of the First Kind ($Bi \to \infty$). All six surfaces held at constant temperature $T_s$.
> $$\Theta = \frac{T - T_s}{T_0 - T_s}, \qquad \bar{\Theta} = \frac{\bar{T} - T_s}{T_0 - T_s}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$
> Mean thermal diffusivity $\bar{a}$ evaluated over $[T_s, T_c]$ — see [Material Properties](HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. IV, Sec. 7, pp. 139–145.

3D solid body with origin at the geometric center. Boundaries at $x = \pm R_1$, $y = \pm R_2$, $z = \pm R_3$.

---

## 1. Product Solution Rule
*(Ch. IV, Sec. 7, p. 144)*

As proven by Luikov via separation of variables, the multi-dimensional solution is the direct product of three independent 1D Infinite Plate solutions:
$$\Theta(x, y, z, \tau) = \Theta_{\text{plate}}(x, \tau;\, R_1) \cdot \Theta_{\text{plate}}(y, \tau;\, R_2) \cdot \Theta_{\text{plate}}(z, \tau;\, R_3)$$

**Architecture constraint:** Do not implement a 3D meshing loop. Invoke the [BC I Infinite Plate solver](HEAT_CONDUCTION_02_BC1_PLATE.md) three times with $R_1$, $R_2$, $R_3$ and multiply the outputs.

---

## 2. Local Temperature Profile
*(Ch. IV, Sec. 7, p. 144, Eq. 4.7.11)*

$$\Theta(x, y, z, \tau) = \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} \sum_{k=1}^{\infty} A_n A_m A_k \cos\!\left(\mu_n \frac{x}{R_1}\right) \cos\!\left(\mu_m \frac{y}{R_2}\right) \cos\!\left(\mu_k \frac{z}{R_3}\right) \exp\!\left[-\!\left(\mu_n^2 K_1^2 + \mu_m^2 K_2^2 + \mu_k^2 K_3^2\right) Fo\right]$$

**Eigenvalues** (identical for all three axes):
$$\mu_n = (2n-1)\frac{\pi}{2}, \quad \mu_m = (2m-1)\frac{\pi}{2}, \quad \mu_k = (2k-1)\frac{\pi}{2}$$

**Amplitude Coefficients:**
$$A_n = (-1)^{n+1}\frac{2}{\mu_n}, \quad A_m = (-1)^{m+1}\frac{2}{\mu_m}, \quad A_k = (-1)^{k+1}\frac{2}{\mu_k}$$

**Scaling factors:** $K_i = R / R_i$

---

## 3. Mean Volumetric Temperature
*(Ch. IV, Sec. 7, p. 139, Eq. 4.7.13)*

$$\bar{\Theta}(\tau) = \bar{\Theta}_{\text{plate}}(\tau;\, R_1) \cdot \bar{\Theta}_{\text{plate}}(\tau;\, R_2) \cdot \bar{\Theta}_{\text{plate}}(\tau;\, R_3)$$

$$\bar{\Theta}(\tau) = \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} \sum_{k=1}^{\infty} B_n B_m B_k \exp\!\left[-\!\left(\mu_n^2 K_1^2 + \mu_m^2 K_2^2 + \mu_k^2 K_3^2\right) Fo\right]$$

Where:
$$B_i = \frac{8}{\pi^2 (2i-1)^2}$$

