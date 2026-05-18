# Heat Conduction Solver: BC III — Infinite Hollow Cylinder ($R_1 \le r \le R_2$)

> **Scope:** Boundary Conditions of the Third Kind ($0.1 < Bi < 100$) for an unbounded hollow cylinder with independent inner and outer convective boundaries. Both surfaces exchange heat with the same ambient temperature $T_{\text{c}}$.
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. VI, Sec. 7, pp. 254–255.

Radial domain: $R_1 < r < R_2$.

---

## 1. Governing Equation & Boundary Conditions
*(Ch. VI, Sec. 7, p. 254, Eq. 1)*

$$\frac{\partial T(r, \tau)}{\partial \tau} = a \left(\frac{\partial^2 T(r, \tau)}{\partial r^2} + \frac{1}{r} \frac{\partial T(r, \tau)}{\partial r}\right) \qquad (\tau > 0;\;\; R_1 < r < R_2)$$

**Initial condition** *(formula 1)*: $T(r, 0) = f(r)$

**Inner surface boundary condition** *(third-kind, formula 2)*:
$$\frac{\partial T(R_1, \tau)}{\partial r} + \frac{\alpha_1}{\lambda}\,[T_{\text{c}} - T(R_1, \tau)] = 0$$

**Outer surface boundary condition** *(third-kind, formula 3)*:
$$-\frac{\partial T(R_2, \tau)}{\partial r} + \frac{\alpha_2}{\lambda}\,[T_{\text{c}} - T(R_2, \tau)] = 0$$

---

## 2. Eigenvalue Equation & Spatial Basis Function

### 2.1. Transcendental Characteristic Equation
*(Ch. VI, Sec. 7, p. 255, Eq. 6)*

The eigenvalues $p_n$ are the positive real roots of:
$$\left[\frac{\alpha_1}{\lambda} J_0(p R_1) + p J_1(p R_1)\right] \cdot \left[\frac{\alpha_2}{\lambda} Y_0(p R_2) - p Y_1(p R_2)\right] - \left[\frac{\alpha_2}{\lambda} J_0(p R_2) - p J_1(p R_2)\right] \cdot \left[\frac{\alpha_1}{\lambda} Y_0(p R_1) + p Y_1(p R_1)\right] = 0$$

Where $J_0, J_1$ are Bessel functions of the first kind and $Y_0, Y_1$ are Bessel functions of the second kind (Neumann functions).

### 2.2. Spatial Basis Linear Combination $W_0$
*(Ch. VI, Sec. 7, p. 255, Eq. 7)*

For each root $p_n$:
$$W_0(p_n, r) = -\left[\frac{\alpha_1}{\lambda} Y_0(p_n R_1) + p_n Y_1(p_n R_1)\right] J_0(p_n r) + \left[p_n J_1(p_n R_1) + \frac{\alpha_1}{\lambda} J_0(p_n R_1)\right] Y_0(p_n r)$$

---

## 3. General and Parabolic Initial Distribution $T(r, 0) = f(r)$

### 3.1. Scale Transformation
*(Ch. VI, Sec. 7, p. 254, formula 4)*

$$f_1(r) = T_{\text{c}} - f(r)$$

### 3.2. Local Profile Series
*(Ch. VI, Sec. 7, p. 255, Eq. 5)*

$$\vartheta(r, \tau) = T_{\text{c}} - T(r, \tau) = \sum_{n=1}^{\infty} E_n \exp\!\left(-a p_n^2 \tau\right) W_0(p_n, r)$$

### 3.3. Numerical Evaluation of Coefficients $E_n$
*(Ch. VI, Sec. 7, p. 255, Eq. 10)*

$$E_n = \frac{\pi^2 p_n^2}{2} \cdot \left[\frac{\alpha_2}{\lambda} J_0(p_n R_2) - p_n J_1(p_n R_2)\right]^2 \cdot \frac{\displaystyle\int_{R_1}^{R_2} r \cdot f_1(r) \cdot W_0(p_n, r)\, dr}{\left(p_n^2 + \frac{\alpha_1^2}{\lambda^2}\right)\!\left[\frac{\alpha_1}{\lambda} J_0(p_n R_1) + p_n J_1(p_n R_1)\right]^2 - \left(p_n^2 + \frac{\alpha_2^2}{\lambda^2}\right)\!\left[\frac{\alpha_2}{\lambda} J_0(p_n R_2) - p_n J_1(p_n R_2)\right]^2}$$

The numerator integral must be computed numerically (Simpson's rule) over $N$ discrete radial nodes from $R_1$ to $R_2$.

### 3.4. Volumetric Mean

$$\bar{\vartheta}(\tau) = T_{\text{c}} - \bar{T}(\tau) = \frac{2}{R_2^2 - R_1^2} \sum_{n=1}^{\infty} E_n \exp\!\left(-a p_n^2 \tau\right) \int_{R_1}^{R_2} r \cdot W_0(p_n, r)\, dr$$

The integral $\int r\, W_0(p_n, r)\, dr$ is evaluated numerically alongside the main solver.

### 3.5. Output Post-Processing

$$T(r, \tau) = T_{\text{c}} - \vartheta(r, \tau), \qquad \bar{T}(\tau) = T_{\text{c}} - \bar{\vartheta}(\tau)$$

### 3.6. Initialization Edge Cases

- **Uniform initialization** $f(r) = T_0$: pass $f_1(r) = T_{\text{c}} - T_0$ (constant) directly into the numerator integral.
- **Parabolic initialization:** pass the quadratic function $f_1(r)$ directly into the numerical integration block. This unified approach handles all initialization edge cases.

