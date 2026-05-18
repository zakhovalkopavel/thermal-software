# Heat Conduction Solver: BC III — Infinite Cylinder (Radius = $R$)

> **Scope:** Boundary Conditions of the Third Kind ($0.1 < Bi < 100$) for a symmetric infinite cylinder.
> The coordinate $r$ is measured from the central axis ($r = 0$) to the outer surface ($r = R$).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. VI, Sec. 6, pp. 239–253.

---

## 1. Governing Equation & Boundary Conditions
*(Ch. VI, Sec. 6, p. 239, Eq. 1)*

$$\frac{\partial T(r, \tau)}{\partial \tau} = a \left(\frac{\partial^2 T(r, \tau)}{\partial r^2} + \frac{1}{r} \frac{\partial T(r, \tau)}{\partial r}\right) \qquad (\tau > 0;\;\; 0 < r < R)$$

**Initial condition** *(formula 1)*: $T(r, 0) = f(r)$

**Surface boundary condition** *(third-kind, formula 2)*:
$$-\frac{\partial T(R, \tau)}{\partial r} + H\,[T_{\text{c}} - T(R, \tau)] = 0, \qquad H = \frac{\alpha}{\lambda}$$

**Center symmetry condition** *(formula 3)*:
$$\frac{\partial T(0, \tau)}{\partial r} = 0 \quad \text{and} \quad T(0, \tau) \neq \infty$$

---

## 2. Base Case: Uniform Initial Temperature $f(r) = T_0 = \text{const}$

$$Bi = \frac{\alpha_{\text{eff}} \cdot R}{\bar{\lambda}}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$

### 2.1. Eigenvalue Transcendental Equation
*(Ch. VI, Sec. 6, p. 240, Eq. 8 & p. 241, Eq. 9)*

$$\mu J_1(\mu) - Bi\, J_0(\mu) = 0 \quad \Longleftrightarrow \quad \frac{J_0(\mu)}{J_1(\mu)} = \frac{\mu}{Bi}$$

### 2.2. Local Temperature Profile
*(Ch. VI, Sec. 6, p. 242, Eq. 17 & p. 245, Eq. 25)*

$$\theta = \frac{T(r, \tau) - T_0}{T_{\text{c}} - T_0} = 1 - \sum_{n=1}^{\infty} A_n J_0\!\left(\mu_n \frac{r}{R}\right) \exp\!\left(-\mu_n^2\, Fo\right)$$

**Optimized amplitude coefficients** *(Ch. VI, Sec. 6, p. 245, Eq. 27)*:
$$A_n = \frac{2\,Bi}{J_0(\mu_n)\,[\mu_n^2 + Bi^2]}$$

### 2.3. Mean Volumetric Temperature
*(Ch. VI, Sec. 6, p. 253, Eqs. 33–34)*

$$\bar{\theta} = \frac{\bar{T}(\tau) - T_0}{T_{\text{c}} - T_0} = 1 - \sum_{n=1}^{\infty} B_n \exp\!\left(-\mu_n^2\, Fo\right)$$

$$B_n = \frac{2 A_n J_1(\mu_n)}{\mu_n} = \frac{4\,Bi^2}{\mu_n^2\,(\mu_n^2 + Bi^2)}$$

---

## 3. General Extension: Arbitrary Initial Distribution $T(r, 0) = f(r)$

### 3.1. Scale Transformation
*(Ch. VI, Sec. 6, p. 239, formula 4)*

$$f_1(r) = T_{\text{c}} - f(r)$$

### 3.2. General Local Profile
*(Ch. VI, Sec. 6, p. 241, Eq. 10 & p. 242, Eq. 15)*

$$\vartheta(r, \tau) = T_{\text{c}} - T(r, \tau) = \sum_{n=1}^{\infty} C_n J_0\!\left(\mu_n \frac{r}{R}\right) \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

### 3.3. Numerical Integration for Coefficients $C_n$

From the Bessel orthogonality relationship *(Ch. VI, Sec. 6, p. 242)*:
$$C_n = \frac{2}{R^2\,[J_0^2(\mu_n) + J_1^2(\mu_n)]} \int_{0}^{R} r \cdot f_1(r) \cdot J_0\!\left(\mu_n \frac{r}{R}\right) dr$$

The numerator integral must be evaluated numerically (Simpson's rule) over $N$ radial steps from $0$ to $R$.

### 3.4. General Volumetric Mean

$$\bar{\vartheta}(\tau) = T_{\text{c}} - \bar{T}(\tau) = \sum_{n=1}^{\infty} C_n \cdot \left[\frac{2 J_1(\mu_n)}{\mu_n}\right] \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

### 3.5. Output Post-Processing

$$T(r, \tau) = T_{\text{c}} - \vartheta(r, \tau), \qquad \bar{T}(\tau) = T_{\text{c}} - \bar{\vartheta}(\tau)$$

---

## 4. Special Sub-Case: Parabolic (Quadratic) Initial Profile

### 4.1. Condition

$$T(r, 0) = T_{\text{ctr}} - (T_{\text{ctr}} - T_{\text{surf}}) \frac{r^2}{R^2}$$

### 4.2. Excess Temperature Shift

$$\vartheta_{\text{ctr}} = T_{\text{c}} - T_{\text{ctr}}, \qquad \vartheta_{\text{surf}} = T_{\text{c}} - T_{\text{surf}}$$

### 4.3. Analytical Parabolic Coefficient

Bypass numerical integration. The exact coefficient is:
$$C_n = C_n^* \cdot A_n \cdot J_0(\mu_n)$$

Where $A_n$ is from Section 2.2, and the cylindrical parabolic shape modifier $C_n^*$ is:
$$C_n^* = \vartheta_{\text{surf}} - 2\,(\vartheta_{\text{ctr}} - \vartheta_{\text{surf}}) \left(\frac{1}{Bi} - \frac{2}{\mu_n^2}\right)$$

> **Geometric progression:** $\frac{1}{\mu^2}$ (plate) → $\frac{2}{\mu^2}$ (cylinder) → $\frac{3}{\mu^2}$ (sphere).

### 4.4. Analytical Outputs

$$T(r, \tau) = T_{\text{c}} - \sum_{n=1}^{\infty} C_n^* \cdot A_n \cdot J_0(\mu_n) \cdot J_0\!\left(\mu_n \frac{r}{R}\right) \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

$$\bar{T}(\tau) = T_{\text{c}} - \sum_{n=1}^{\infty} C_n^* \cdot B_n \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

Where $B_n$ is reused from the base uniform case (Section 2.3).

---

## 5. Implementation Notes

1. **Profile Routing:** If the initial profile flag is parabolic, route directly to Section 4.
2. **Parabolic Modifier Inside Loop:** $C_n^*$ depends on $\mu_n$; compute it inside the series loop.
3. **Root Recalculation:** Whenever $Bi$ changes between time steps, re-solve all roots $\mu_n$ from scratch.

