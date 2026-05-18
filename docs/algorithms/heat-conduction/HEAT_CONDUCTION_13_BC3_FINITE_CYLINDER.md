# Heat Conduction Solver: BC III — Finite Cylinder (Radius = $R$, Length = $2l$)

> **Scope:** Boundary Conditions of the Third Kind ($0.1 < Bi < 100$) for a finite solid cylinder with independent Biot numbers on the lateral surface and end faces.
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. VI, Sec. 8, pp. 258–263.

The cylinder is bounded by the lateral surface at $r = R$ (Biot $Bi_1$) and two end faces at $z = \pm l$ (Biot $Bi_2$). Origin at the geometric center.

---

## 1. Governing Equation & Boundary Conditions
*(Ch. VI, Sec. 8, p. 258, Eq. 1)*

$$\frac{\partial T(r,z,\tau)}{\partial \tau} = a\!\left(\frac{\partial^2 T}{\partial r^2} + \frac{1}{r}\frac{\partial T}{\partial r} + \frac{\partial^2 T}{\partial z^2}\right) \qquad (\tau > 0;\;\; 0 < r < R;\;\; -l < z < +l)$$

**Initial condition** *(formula 2)*: $T(r, z, 0) = T_0 = \text{const}$

**Lateral surface** *(third-kind, formula 3)*:
$$-\frac{\partial T(R, z, \tau)}{\partial r} + H_1\,[T_{\text{c}} - T(R, z, \tau)] = 0, \qquad H_1 = \frac{Bi_1}{R}$$

**End faces** *(third-kind, formula 5)*:
$$-\frac{\partial T(r, l, \tau)}{\partial z} + H_2\,[T_{\text{c}} - T(r, l, \tau)] = 0, \qquad H_2 = \frac{Bi_2}{l}$$

**Symmetry conditions** *(formulas 4, 6)*:
$$\frac{\partial T(0, z, \tau)}{\partial r} = 0, \qquad \frac{\partial T(r, 0, \tau)}{\partial z} = 0$$

---

## 2. Intersection Theorem (Product Rule)
*(Ch. VI, Sec. 8, pp. 258–259, Eqs. 7–16)*

$$\theta_{\text{finite}}(r, z, \tau) = \frac{T_{\text{c}} - T(r,z,\tau)}{T_{\text{c}} - T_0} = \theta_{\text{cylinder}}(r, \tau) \cdot \theta_{\text{plate}}(z, \tau)$$

**Architecture constraint:** Do not build 2D spatial grids. Invoke [BC III Infinite Cylinder](HEAT_CONDUCTION_09_BC3_CYLINDER.md) with $Bi_1$ and $R$, and [BC III Infinite Plate](HEAT_CONDUCTION_08_BC3_PLATE.md) with $Bi_2$ and $l$. Multiply both outputs.

---

## 3. Local Temperature Profile Double Series
*(Ch. VI, Sec. 8, p. 259, Eq. 17)*

$$1 - \theta = \frac{T_{\text{c}} - T(r,z,\tau)}{T_{\text{c}} - T_0} = \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} A_{n,1} A_{m,2} J_0\!\left(\mu_{n,1} \frac{r}{R}\right) \cos\!\left(\mu_{m,2} \frac{z}{l}\right) \exp\!\left[-\!\left(\frac{\mu_{n,1}^2}{R^2} + \frac{\mu_{m,2}^2}{l^2}\right) a\tau\right]$$

**Radial roots & coefficients** — from Infinite Cylinder solver with $Bi_1$:
$$\mu_{n,1} J_1(\mu_{n,1}) - Bi_1\, J_0(\mu_{n,1}) = 0$$
$$A_{n,1} = \frac{2\,Bi_1}{J_0(\mu_{n,1})\,[\mu_{n,1}^2 + Bi_1^2]}$$

**Axial roots & coefficients** — from Infinite Plate solver with $Bi_2$:
$$\operatorname{ctg}\,\mu_{m,2} = \frac{\mu_{m,2}^2 - Bi_2^2}{2\mu_{m,2}\, Bi_2}$$
$$A_{m,2} = (-1)^{m+1} \frac{2\,Bi_2\,\sqrt{\mu_{m,2}^2 + Bi_2^2}}{\mu_{m,2}\,(\mu_{m,2}^2 + Bi_2^2 + Bi_2)}$$

---

## 4. Volumetric Mean Temperature
*(Ch. VI, Sec. 8, p. 263, Eq. 18)*

$$\bar{\theta} = 1 - \sum_{n=1}^{\infty} \sum_{m=1}^{\infty} B_{n,1} B_{m,2} \exp\!\left[-\!\left(\frac{\mu_{n,1}^2}{R^2} + \frac{\mu_{m,2}^2}{l^2}\right) a\tau\right]$$

**Radial volumetric coefficient** (Infinite Cylinder with $Bi_1$):
$$B_{n,1} = \frac{4\,Bi_1^2}{\mu_{n,1}^2\,(\mu_{n,1}^2 + Bi_1^2)}$$

**Axial volumetric coefficient** (Infinite Plate with $Bi_2$):
$$B_{m,2} = \frac{2\,Bi_2^2}{\mu_{m,2}^2\,(\mu_{m,2}^2 + Bi_2^2 + Bi_2)}$$

**Final absolute temperature reconstruction:**
$$T(r, z, \tau) = T_{\text{c}} - (T_{\text{c}} - T_0) \cdot \theta_{\text{cylinder}}(r, \tau) \cdot \theta_{\text{plate}}(z, \tau)$$

