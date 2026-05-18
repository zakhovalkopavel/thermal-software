# Heat Conduction Solver: BC III — Finite Parallelepiped ($2R_1 \times 2R_2 \times 2R_3$)

> **Scope:** Boundary Conditions of the Third Kind ($0.1 < Bi < 100$) for a rectangular parallelepiped with independent Biot numbers on each face pair.
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. VI, Sec. 9, pp. 263–265.

The parallelepiped origin is at the geometric center. Boundaries at $x = \pm R_1$, $y = \pm R_2$, $z = \pm R_3$.
Each face pair has its own Biot number: $Bi_1 = \alpha_1 R_1 / \lambda$, $Bi_2 = \alpha_2 R_2 / \lambda$, $Bi_3 = \alpha_3 R_3 / \lambda$.

---

## 1. Governing Equation & Boundary Conditions
*(Ch. VI, Sec. 9, p. 263, Eq. 1)*

$$\frac{\partial T(x, y, z, \tau)}{\partial \tau} = a\, \nabla^2 T(x, y, z, \tau) \qquad (\tau > 0;\;\; -R_i < x_i < +R_i)$$

**Initial condition** *(formula 2)*: $T(x, y, z, 0) = T_0 = \text{const}$

**Surface boundary conditions** *(third-kind, formulas 3–5)*:
$$\mp \frac{\partial T(\pm R_1, y, z, \tau)}{\partial x} + H_1\,[T_{\text{c}} - T(\pm R_1, y, z, \tau)] = 0, \qquad H_1 = \frac{Bi_1}{R_1}$$
$$\mp \frac{\partial T(x, \pm R_2, z, \tau)}{\partial y} + H_2\,[T_{\text{c}} - T(x, \pm R_2, z, \tau)] = 0, \qquad H_2 = \frac{Bi_2}{R_2}$$
$$\mp \frac{\partial T(x, y, \pm R_3, \tau)}{\partial z} + H_3\,[T_{\text{c}} - T(x, y, \pm R_3, \tau)] = 0, \qquad H_3 = \frac{Bi_3}{R_3}$$

---

## 2. Three-Dimensional Intersection Theorem (Product Rule)
*(Ch. VI, Sec. 9, p. 264, Eq. 6)*

$$\frac{T(x, y, z, \tau) - T_{\text{c}}}{T_0 - T_{\text{c}}} = \frac{T(x, \tau) - T_{\text{c}}}{T_0 - T_{\text{c}}} \cdot \frac{T(y, \tau) - T_{\text{c}}}{T_0 - T_{\text{c}}} \cdot \frac{T(z, \tau) - T_{\text{c}}}{T_0 - T_{\text{c}}}$$

**Architecture constraint:** Do not build 3D spatial grids or matrix loops. Invoke [BC III Infinite Plate](HEAT_CONDUCTION_08_BC3_PLATE.md) three times independently with $(Bi_1, R_1)$, $(Bi_2, R_2)$, $(Bi_3, R_3)$, then multiply the outputs.

---

## 3. Local Temperature Profile Triple Series
*(Ch. VI, Sec. 9, p. 264, Eq. 7)*

$$\theta = \frac{T(x,y,z,\tau) - T_0}{T_{\text{c}} - T_0} = 1 - \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} \sum_{k=1}^{\infty} A_{n,1} A_{m,2} A_{k,3} \cos\!\left(\mu_{n,1} \frac{x}{R_1}\right) \cos\!\left(\mu_{m,2} \frac{y}{R_2}\right) \cos\!\left(\mu_{k,3} \frac{z}{R_3}\right) \exp\!\left[-\!\left(\frac{\mu_{n,1}^2}{R_1^2} + \frac{\mu_{m,2}^2}{R_2^2} + \frac{\mu_{k,3}^2}{R_3^2}\right) a\tau\right]$$

**Roots and coefficients** — for each axis $i = 1, 2, 3$, derive $\mu$ and $A$ using $Bi_i$ *(formulas 8–9)*:
- $\mu$ roots from: $\operatorname{ctg}\,\mu = \dfrac{1}{Bi}\,\mu$
- Amplitude coefficient:
$$A = \frac{2\sin\mu}{\mu + \sin\mu\cos\mu} = (-1)^{p+1} \frac{2\,Bi\,\sqrt{Bi^2 + \mu^2}}{\mu\,(Bi^2 + Bi + \mu^2)}$$
where index $p$ maps to $n$, $m$, or $k$ for the respective axis.

---

## 4. Volumetric Mean Temperature
*(Ch. VI, Sec. 9, p. 264, Eq. 11)*

$$\bar{\theta} = 1 - \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} \sum_{k=1}^{\infty} B_{n,1} B_{m,2} B_{k,3} \exp\!\left[-\!\left(\frac{\mu_{n,1}^2}{R_1^2} + \frac{\mu_{m,2}^2}{R_2^2} + \frac{\mu_{k,3}^2}{R_3^2}\right) a\tau\right]$$

Volumetric mean coefficients for each axis *(formula 12)*:
$$B = \frac{2\,Bi^2}{\mu^2\,(Bi^2 + Bi + \mu^2)}$$

**Final absolute temperature:**
$$T(x, y, z, \tau) = T_{\text{c}} - (T_{\text{c}} - T_0) \cdot \Theta_x(x, \tau) \cdot \Theta_y(y, \tau) \cdot \Theta_z(z, \tau)$$

