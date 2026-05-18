# Heat Conduction Solver: BC I — Unbounded Hollow Cylinder ($R_1 \le r \le R_2$)

> **Scope:** Boundary Conditions of the First Kind ($Bi \to \infty$). Both inner and outer surfaces held at constant temperature $T_s$.
> $$\Theta = \frac{T - T_s}{T_0 - T_s}, \qquad \bar{\Theta} = \frac{\bar{T} - T_s}{T_0 - T_s}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$
> Mean thermal diffusivity $\bar{a}$ evaluated over $[T_s, T_c]$ — see [Material Properties](HEAT_CONDUCTION_01_MATERIAL_PROPERTIES.md).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. IV, Sec. 6, pp. 134–138.

Radial coordinate $r \in [R_1, R_2]$. The dimensionless outer-to-inner radius ratio: $m = R_2 / R_1$.

---

## 1. Auxiliary Bessel Combination Functions

**Bessel function of the second kind of zeroth order ($Y_0$ / Neumann function):**
$$Y_0(x) = \frac{2}{\pi} \left[\left(\ln \frac{x}{2} + \gamma\right) J_0(x) - \sum_{k=1}^{\infty} \frac{(-1)^k}{(k!)^2} \left(\frac{x}{2}\right)^{2k} \sum_{j=1}^{k} \frac{1}{j}\right]$$

Where $\gamma \approx 0.57721566$ is the Euler-Mascheroni constant.

**Characteristic function $U_0$:**
$$U_0\!\left(\mu_n \frac{r}{R_1}\right) = J_0\!\left(\mu_n \frac{r}{R_1}\right) Y_0(\mu_n) - J_0(\mu_n) Y_0\!\left(\mu_n \frac{r}{R_1}\right)$$

By definition, $U_0(\mu_n) \equiv 0$ at the inner boundary $r = R_1$.

**Transformed spatial function $V_0$:**
$$V_0\!\left(\mu_n \frac{r}{R_1}\right) = \frac{J_0(\mu_n)}{J_0(m \mu_n)} U_0\!\left(\mu_n \frac{r}{R_1}\right)$$

---

## 2. Eigenvalue Transcendental Equation
*(Ch. IV, Sec. 6, p. 135)*

$$J_0(\mu) Y_0(\mu m) - J_0(\mu m) Y_0(\mu) = 0$$

$\mu_n$ ($n = 1, 2, 3, \dots$) are the consecutive positive real roots of this equation.

---

## 3. Local Temperature Profile
*(Ch. IV, Sec. 6, p. 138, Eq. 4.6.43)*

$$T(r, \tau) = \frac{1}{\ln m}\!\left(T_1 \ln \frac{R_2}{r} + T_2 \ln \frac{r}{R_1}\right) + \pi \sum_{n=1}^{\infty} \left\{\frac{J_0(\mu_n m)\, V_0\!\left(\mu_n r / R_2\right)}{J_0(\mu_n) + J_0(\mu_n m)} \exp(-\mu_n^2 Fo) \left[T_0 - \frac{T_2 J_0(\mu_n) - T_1 J_0(\mu_n m)}{J_0(\mu_n) - J_0(m\mu_n)}\right]\right\}$$

Where $T_1$ and $T_2$ are temperatures at $r = R_1$ and $r = R_2$ respectively.

---

## 4. Mean Volumetric Temperature
*(Ch. IV, Sec. 6, p. 134, Eq. 4.6.25)*

$$\bar{\Theta}(\tau) = \frac{4}{R_2^2 - R_1^2} \sum_{n=1}^{\infty} \frac{1}{\mu_n^2} \cdot \frac{J_0(\mu_n R_1) - J_0(\mu_n R_2)}{J_0(\mu_n R_1) + J_0(\mu_n R_2)} \exp\!\left(-\mu_n^2 \cdot \bar{a}\tau\right)$$

---

## 5. Numerical Volumetric Integration

The reference text provides the local profile in closed form (Eq. 4.6.43) but does **not** supply a direct algebraic mean volumetric formula under asymmetric boundary conditions. The mean must be computed numerically:

$$\bar{T}(\tau) = \frac{2}{R_2^2 - R_1^2} \int_{R_1}^{R_2} T(r, \tau) \cdot r\, dr$$

**Procedure:**
1. Generate a high-resolution discrete radial mesh $r_i$ from $R_1$ to $R_2$.
2. Evaluate $T(r_i, \tau)$ using the split: steady-state $T_{\text{st}}$ plus transient series $T_{\text{tr}}$.
3. Form the integrand vector $f_i = T_i \cdot r_i$.
4. Apply numerical quadrature to integrate $f_i$ over $r_i$.
5. Multiply by $\dfrac{2}{R_2^2 - R_1^2}$ to obtain $\bar{T}(\tau)$.

