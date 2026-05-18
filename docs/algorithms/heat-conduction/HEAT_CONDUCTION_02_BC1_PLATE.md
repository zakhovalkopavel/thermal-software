# Heat Conduction Solver: BC I — Infinite Plate (Thickness = $2R$)

> **Scope:** Boundary Conditions of the First Kind ($Bi \to \infty$). Surface temperature $T_s$ is instantaneously enforced and held constant.
> $$\Theta = \frac{T - T_s}{T_0 - T_s}, \qquad \bar{\Theta} = \frac{\bar{T} - T_s}{T_0 - T_s}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$
> Mean thermal diffusivity $\bar{a}$ evaluated over $[T_s, T_c]$ — see [Material Properties](HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. IV, Sec. 3, pp. 86–96.

The coordinate $x$ is measured from the mid-plane ($x = 0$) to the surface ($x = R$).

---

## 1. Local Temperature Profile
*(Ch. IV, Sec. 3, p. 89, Eq. 4.3.25)*

$$\Theta(x, \tau) = \sum_{n=1}^{\infty} A_n \cos\!\left(\mu_n \frac{x}{R}\right) \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

**Eigenvalues** *(Ch. IV, Sec. 3, p. 86, Eq. 4.3.14)*:
$$\mu_n = (2n - 1)\frac{\pi}{2}$$

**Amplitude Coefficients** *(Ch. IV, Sec. 3, p. 89, Eq. 4.3.25)*:
$$A_n = (-1)^{n+1} \frac{2}{\mu_n}$$

---

## 2. Mean Volumetric Temperature
*(Ch. IV, Sec. 3, p. 96, Eq. 4.3.32)*

$$\bar{\Theta}(\tau) = \sum_{n=1}^{\infty} B_n \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

**Volumetric Coefficients**:
$$B_n = \frac{2}{\mu_n^2} = \frac{8}{(2n-1)^2 \pi^2}$$

---

## 3. Iterative Convergence Loop (BC I)

The self-consistency loop handles temperature-dependent properties:

1. **Initialization:** Set $T_c = T_0$.
2. **Property update:** Compute $\bar{\lambda}$, $\bar{c}$, $\bar{a}$ over $[T_s, T_c]$; update $Fo = \bar{a}\tau/R^2$.
3. **Compute** $T_{c,\text{new}}$ at $x = 0$ (sum $n = 100$ terms).
4. **Tolerance check:** If $|T_{c,\text{new}} - T_c| < 10^{-4}$ °C → stop. Else $T_c \leftarrow T_{c,\text{new}}$, repeat.
5. **Final output:** Local $T$ at nodes $\{0.0,\, 0.25,\, 0.50,\, 0.75,\, 1.0\}$ and mean $\bar{T}(\tau)$.

