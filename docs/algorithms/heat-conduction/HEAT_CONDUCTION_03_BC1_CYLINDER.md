# Heat Conduction Solver: BC I — Infinite Cylinder (Radius = $R$)

> **Scope:** Boundary Conditions of the First Kind ($Bi \to \infty$). Surface temperature $T_s$ is instantaneously enforced and held constant.
> $$\Theta = \frac{T - T_s}{T_0 - T_s}, \qquad \bar{\Theta} = \frac{\bar{T} - T_s}{T_0 - T_s}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$
> Mean thermal diffusivity $\bar{a}$ evaluated over $[T_s, T_c]$ — see [Material Properties](HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. IV, Sec. 5, pp. 106–122.

The coordinate $r$ is measured from the central axis ($r = 0$) to the outer surface ($r = R$).

---

## 1. Bessel Functions

**Zeroth-order Bessel function of the first kind:**
$$J_0(x) = \sum_{m=0}^{\infty} \frac{(-1)^m}{(m!)^2} \left(\frac{x}{2}\right)^{2m}$$

**First-order Bessel function of the first kind:**
$$J_1(x) = \sum_{m=0}^{\infty} \frac{(-1)^m}{m!\,(m+1)!} \left(\frac{x}{2}\right)^{2m+1}$$

---

## 2. Local Temperature Profile
*(Ch. IV, Sec. 5, p. 122, Eq. 4.5.25)*

$$\Theta(r, \tau) = \sum_{n=1}^{\infty} A_n J_0\!\left(\mu_n \frac{r}{R}\right) \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

**Eigenvalues:** Consecutive positive roots of $J_0(\mu_n) = 0$:
$$\mu_1 \approx 2.4048, \quad \mu_2 \approx 5.5201, \quad \dots$$

McMahon's asymptotic expansion for large roots ($n \ge 1$):
$$\mu_n \approx \pi\!\left(n - \tfrac{1}{4}\right) + \frac{1}{8\pi\!\left(n-\tfrac{1}{4}\right)} - \frac{31}{384\pi^3\!\left(n-\tfrac{1}{4}\right)^3} + \frac{3779}{15360\pi^5\!\left(n-\tfrac{1}{4}\right)^5}$$

**Amplitude Coefficients** *(Ch. IV, Sec. 5, p. 122, Eq. 4.5.26)*:
$$A_n = \frac{2}{\mu_n J_1(\mu_n)}$$

---

## 3. Mean Volumetric Temperature
*(Ch. IV, Sec. 5, p. 106, Eq. 4.5.31–32)*

$$\bar{\Theta}(\tau) = \sum_{n=1}^{\infty} B_n \exp\!\left(-\mu_n^2 \cdot Fo\right), \qquad B_n = \frac{4}{\mu_n^2}$$

---

## 4. Iterative Convergence Loop (BC I)

1. **Initialization:** Set $T_c = T_0$.
2. **Property update:** Compute $\bar{\lambda}$, $\bar{c}$, $\bar{a}$ over $[T_s, T_c]$; update $Fo = \bar{a}\tau/R^2$.
3. **Compute** $T_{c,\text{new}}$ at $r = 0$ (sum $n = 100$ terms).
4. **Tolerance check:** If $|T_{c,\text{new}} - T_c| < 10^{-4}$ °C → stop. Else $T_c \leftarrow T_{c,\text{new}}$, repeat.
5. **Final output:** Local $T$ at nodes $\{0.0,\, 0.25,\, 0.50,\, 0.75,\, 1.0\}$ and mean $\bar{T}(\tau)$.

