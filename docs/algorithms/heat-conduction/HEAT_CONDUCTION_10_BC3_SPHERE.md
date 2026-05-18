# Heat Conduction Solver: BC III — Solid Sphere (Radius = $R$)

> **Scope:** Boundary Conditions of the Third Kind ($0.1 < Bi < 100$) for a symmetric solid sphere.
> The coordinate $r$ is measured from the center ($r = 0$) to the outer surface ($r = R$).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. VI, Sec. 5, pp. 223–237.

---

## 1. Governing Equation & Boundary Conditions
*(Ch. VI, Sec. 5, p. 223, Eq. 1)*

$$\frac{\partial [r \cdot T(r, \tau)]}{\partial \tau} = a \frac{\partial^2 [r \cdot T(r, \tau)]}{\partial r^2} \qquad (\tau > 0;\;\; 0 < r < R)$$

**Initial condition** *(formula 2)*: $T(r, 0) = f(r)$

**Surface boundary condition** *(third-kind, formula 3)*:
$$-\frac{\partial T(R, \tau)}{\partial r} + H\,[T_{\text{c}} - T(R, \tau)] = 0, \qquad H = \frac{\alpha}{\lambda}$$

**Center symmetry condition** *(formula 4)*:
$$\frac{\partial T(0, \tau)}{\partial r} = 0 \quad \text{and} \quad T(0, \tau) \neq \infty$$

---

## 2. Base Case: Uniform Initial Temperature $f(r) = T_0 = \text{const}$

$$Bi = \frac{\alpha_{\text{eff}} \cdot R}{\bar{\lambda}}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$

### 2.1. Eigenvalue Transcendental Equation
*(Ch. VI, Sec. 5, p. 224, Eq. 6.5.12)*

$$\tan \mu = \frac{\mu}{1 - Bi}$$

### 2.2. Local Temperature Profile
*(Ch. VI, Sec. 5, p. 228, Eq. 6.5.27)*

$$\theta = \frac{T(r, \tau) - T_0}{T_{\text{c}} - T_0} = 1 - \sum_{n=1}^{\infty} A_n \frac{R \sin\!\left(\mu_n \frac{r}{R}\right)}{r\,\mu_n} \exp\!\left(-\mu_n^2\, Fo\right)$$

**Amplitude coefficients** *(Ch. VI, Sec. 5, p. 228, Eq. 6.5.29)*:
$$A_n = (-1)^{n+1} \frac{2\,Bi\,\sqrt{\mu_n^2 + (Bi - 1)^2}}{\mu_n^2 + Bi^2 - Bi}$$

### 2.3. Mean Volumetric Temperature
*(Ch. VI, Sec. 5, p. 237, Eqs. 6.5.48–6.5.49)*

$$\bar{\theta} = \frac{\bar{T}(\tau) - T_0}{T_{\text{c}} - T_0} = 1 - \sum_{n=1}^{\infty} B_n \exp\!\left(-\mu_n^2\, Fo\right)$$

$$B_n = \frac{6\,Bi^2}{\mu_n^2\,(\mu_n^2 + Bi^2 - Bi)}$$

---

## 3. General Extension: Arbitrary Initial Distribution $T(r, 0) = f(r)$

### 3.1. Scale Transformation
*(Ch. VI, Sec. 5, p. 223, formula 14)*

$$f_1(r) = T_{\text{c}} - f(r)$$

### 3.2. General Local Profile
*(Ch. VI, Sec. 5, p. 225, Eq. 19)*

$$\vartheta(r, \tau) = T_{\text{c}} - T(r, \tau) = \sum_{n=1}^{\infty} C_n \frac{\sin\!\left(\mu_n \frac{r}{R}\right)}{r} \exp\!\left(-\mu_n^2 \frac{a\tau}{R^2}\right)$$

### 3.3. Numerical Integration for Coefficients $C_n$

From the orthogonality principle *(Ch. VI, Sec. 5, p. 226)*:
$$C_n = \frac{2\mu_n}{R(\mu_n - \sin\mu_n \cos\mu_n)} \int_{0}^{R} r \cdot f_1(r) \cdot \sin\!\left(\mu_n \frac{r}{R}\right) dr$$

The integral must be evaluated numerically (Simpson's rule) over $N$ discrete radial steps from $0$ to $R$.

### 3.4. General Volumetric Mean

$$\bar{\vartheta}(\tau) = T_{\text{c}} - \bar{T}(\tau) = \sum_{n=1}^{\infty} C_n \cdot \left[\frac{3\,(\sin\mu_n - \mu_n \cos\mu_n)}{R \cdot \mu_n^2}\right] \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

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
$$D_n = C_n \cdot A_n$$

Where $A_n$ is from Section 2.2, and the spherical parabolic shape modifier $C_n$ is:
$$C_n = \vartheta_{\text{surf}} - 2\,(\vartheta_{\text{ctr}} - \vartheta_{\text{surf}}) \left(\frac{1}{Bi} - \frac{3}{\mu_n^2}\right)$$

> **Geometric progression:** $\frac{1}{\mu^2}$ (plate) → $\frac{2}{\mu^2}$ (cylinder) → $\frac{3}{\mu^2}$ (sphere).

### 4.4. Analytical Outputs

$$T(r, \tau) = T_{\text{c}} - \sum_{n=1}^{\infty} C_n \cdot A_n \frac{R \sin\!\left(\mu_n \frac{r}{R}\right)}{r\,\mu_n} \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

$$\bar{T}(\tau) = T_{\text{c}} - \sum_{n=1}^{\infty} C_n \cdot B_n \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

Where $B_n$ is reused from the base uniform case (Section 2.3).

---

## 5. Implementation Notes

1. **Profile Routing:** If the initial profile flag is parabolic, route directly to Section 4.
2. **Parabolic Modifier Inside Loop:** $C_n$ depends on $\mu_n$; compute it inside the series loop.
3. **Root Recalculation:** Whenever $Bi$ changes between time steps, re-solve all roots $\mu_n$ from scratch.

