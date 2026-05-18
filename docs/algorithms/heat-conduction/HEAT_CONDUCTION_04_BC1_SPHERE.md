# Heat Conduction Solver: BC I — Solid Sphere (Radius = $R$)

> **Scope:** Boundary Conditions of the First Kind ($Bi \to \infty$). Surface temperature $T_s$ is instantaneously enforced and held constant.
> $$\Theta = \frac{T - T_s}{T_0 - T_s}, \qquad \bar{\Theta} = \frac{\bar{T} - T_s}{T_0 - T_s}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$
> Mean thermal diffusivity $\bar{a}$ evaluated over $[T_s, T_c]$ — see [Material Properties](HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. IV, Sec. 4, pp. 107–113.

The coordinate $r$ is measured from the center ($r = 0$) to the outer surface ($r = R$).

---

## 1. Local Temperature Profile
*(Ch. IV, Sec. 4, p. 107, Eq. 4.4.18)*

$$\Theta(r, \tau) = \sum_{n=1}^{\infty} A_n \frac{\sin\!\left(\mu_n \frac{r}{R}\right)}{\mu_n \frac{r}{R}} \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

> At the center ($r = 0$): apply the limit $\displaystyle\lim_{x \to 0} \frac{\sin x}{x} = 1$.

**Eigenvalues** *(Ch. IV, Sec. 4, p. 107, Eq. 4.4.19)*:
$$\mu_n = n\pi$$

**Amplitude Coefficients** *(Ch. IV, Sec. 4, p. 107, Eq. 4.4.19)*:
$$A_n = 2(-1)^{n+1}$$

---

## 2. Mean Volumetric Temperature
*(Ch. IV, Sec. 4, p. 113, Eq. 4.4.37)*

$$\bar{\Theta}(\tau) = \sum_{n=1}^{\infty} B_n \exp\!\left(-\mu_n^2 \cdot Fo\right), \qquad B_n = \frac{6}{\mu_n^2} = \frac{6}{n^2\pi^2}$$

---

## 3. Iterative Convergence Loop (BC I)

1. **Initialization:** Set $T_c = T_0$.
2. **Property update:** Compute $\bar{\lambda}$, $\bar{c}$, $\bar{a}$ over $[T_s, T_c]$; update $Fo = \bar{a}\tau/R^2$.
3. **Compute** $T_{c,\text{new}}$ at $r = 0$ (sum $n = 100$ terms).
4. **Tolerance check:** If $|T_{c,\text{new}} - T_c| < 10^{-4}$ °C → stop. Else $T_c \leftarrow T_{c,\text{new}}$, repeat.
5. **Final output:** Local $T$ at nodes $\{0.0,\, 0.25,\, 0.50,\, 0.75,\, 1.0\}$ and mean $\bar{T}(\tau)$.

