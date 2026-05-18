# Heat Conduction Solver: BC III — Infinite Plate (Thickness = $2R$)

> **Scope:** Boundary Conditions of the Third Kind ($0.1 < Bi < 100$) for an infinite plate of half-thickness $R$.
> The coordinate $x$ runs from the mid-plane ($x = 0$) to the surface ($x = R$).
>
> **Primary Reference:** Luikov A. V. *Analytical Heat Diffusion Theory.* Academic Press, 1968. Ch. VI, Sec. 3.

---

## 1. Governing Equation & Boundary Conditions

*(Ch. VI, Sec. 3, p. 187)*

$$\frac{\partial T(x, \tau)}{\partial \tau} = a \frac{\partial^2 T(x, \tau)}{\partial x^2} \qquad (\tau > 0;\;\; -R < x < +R)$$

**Initial condition** *(formula 2)*:
$$T(x, 0) = f(x)$$

**Surface boundary conditions** (third-kind, formulas 3–4):
$$-\lambda \frac{\partial T(R, \tau)}{\partial x} + \alpha\,[T_{\text{c}} - T(R, \tau)] = 0$$
$$+\lambda \frac{\partial T(-R, \tau)}{\partial x} + \alpha\,[T_{\text{c}} - T(-R, \tau)] = 0$$

**Symmetry condition at mid-plane** (valid when $f(x)$ is an even function, formula 4'):
$$\frac{\partial T(0, \tau)}{\partial x} = 0$$

---

## 2. Base Case: Uniform Initial Temperature $f(x) = T_0 = \text{const}$

### 2.1. Dimensionless Criteria

$$Bi = \frac{\alpha_{\text{eff}} \cdot R}{\bar{\lambda}}, \qquad Fo = \frac{\bar{a} \cdot \tau}{R^2}$$

### 2.2. Local Temperature Profile
*(Ch. VI, Sec. 3, p. 195, Eq. 6.3.19)*

$$\Theta(x, \tau) = \frac{T(x, \tau) - T_{\text{c}}}{T_0 - T_{\text{c}}} = \sum_{n=1}^{\infty} A_n \cos\!\left(\mu_n \frac{x}{R}\right) \exp\!\left(-\mu_n^2 \cdot Fo\right)$$

**Transcendental eigenvalue equation** *(Ch. VI, Sec. 3, p. 195, Eq. 6.3.17)*:
$$\operatorname{ctg}\,\mu = \frac{\mu^2 - Bi^2}{2\mu\, Bi}$$

**Amplitude coefficients** *(Ch. VI, Sec. 3, p. 196, Eq. 6.3.20)*:
$$A_n = \frac{2 \sin \mu_n}{\mu_n + \sin \mu_n \cos \mu_n}$$

### 2.3. Mean Volumetric Temperature
*(Ch. VI, Sec. 3, p. 211, Eq. 6.3.44–45)*

$$\bar{\theta}(\tau) = \frac{\bar{T}(\tau) - T_{\text{c}}}{T_0 - T_{\text{c}}} = \sum_{n=1}^{\infty} B_n \exp\!\left(-\mu_n^2\, Fo\right)$$

**Volumetric mean coefficients**:
$$B_n = \frac{A_n \sin \mu_n}{\mu_n} = \frac{2\,Bi^2}{\mu_n^2\,(Bi^2 + Bi + \mu_n^2)}$$

---

## 3. General Extension: Arbitrary Initial Distribution $T(x, 0) = f(x)$

### 3.1. Scale Transformation
*(Ch. VI, Sec. 3, p. 187)*

Define the excess initial profile relative to ambient temperature $T_{\text{c}}$:
$$f_1(x) = T_{\text{c}} - f(x)$$

### 3.2. General Local Profile
*(Ch. VI, Sec. 3, p. 194, Eq. 15a)*

$$\vartheta(x, \tau) = T_{\text{c}} - T(x, \tau) = \sum_{m=1}^{\infty} \frac{\mu_m \sin \mu_m \cdot \cos\!\left(\mu_m \frac{x}{R}\right)}{\mu_m - \sin \mu_m \cos \mu_m} \cdot \left[\frac{2}{R} \int_{0}^{R} f_1(x) \cos\!\left(\mu_m \frac{x}{R}\right) dx\right] \exp\!\left(-\mu_m^2 \cdot Fo\right)$$

### 3.3. Numerical Integration for Fourier Coefficients

Isolate the integral into a general coefficient $D_m$ computed numerically (e.g., Simpson's rule) over $N$ discrete points from $0$ to $R$:

$$D_m = \frac{2 \mu_m \sin \mu_m}{R(\mu_m - \sin \mu_m \cos \mu_m)} \int_{0}^{R} f_1(x) \cos\!\left(\mu_m \frac{x}{R}\right) dx$$

Local profile evaluates to:
$$\vartheta(x, \tau) = \sum_{m=1}^{\infty} D_m \cos\!\left(\mu_m \frac{x}{R}\right) \exp\!\left(-\mu_m^2 \cdot Fo\right)$$

### 3.4. General Volumetric Mean

Analytical integration over the half-thickness $R$:
$$\bar{\vartheta}(\tau) = T_{\text{c}} - \bar{T}(\tau) = \sum_{m=1}^{\infty} D_m \cdot \left[\frac{\sin \mu_m}{\mu_m}\right] \exp\!\left(-\mu_m^2 \cdot Fo\right)$$

### 3.5. Output Post-Processing

$$T(x, \tau) = T_{\text{c}} - \vartheta(x, \tau)$$
$$\bar{T}(\tau) = T_{\text{c}} - \bar{\vartheta}(\tau)$$

---

## 4. Special Sub-Case: Parabolic (Quadratic) Initial Profile

### 4.1. Condition

Applies strictly when $f(x)$ follows a symmetric quadratic parabola:
$$T(x, 0) = T_{\text{ctr}} - (T_{\text{ctr}} - T_{\text{surf}}) \frac{x^2}{R^2}$$

Where:
- $T_{\text{ctr}}$ — initial absolute temperature at the center ($x = 0$)
- $T_{\text{surf}}$ — initial absolute temperature at the surface ($x = R$)

### 4.2. Excess Temperature Shift

Map absolute temperatures to the inverted excess scale:
$$\vartheta_{\text{ctr}} = T_{\text{c}} - T_{\text{ctr}}, \qquad \vartheta_{\text{surf}} = T_{\text{c}} - T_{\text{surf}}$$

### 4.3. Analytical Parabolic Coefficients
*(Ch. VI, Sec. 3, p. 212, Eq. 6.3.48)*

Bypass numerical integration entirely. The exact analytic coefficient is:
$$D_m = C_m \cdot A_m$$

Where $A_m$ is the standard base-case amplitude (Section 2.2) and the parabolic shape modifier $C_m$ is:
$$C_m = \vartheta_{\text{surf}} - 2\,(\vartheta_{\text{ctr}} - \vartheta_{\text{surf}}) \left(\frac{1}{Bi} - \frac{1}{\mu_m^2}\right)$$

The eigenvalues $\mu_m$ and coefficients $A_m$ are identical to the base case (Section 2).

### 4.4. Analytical Outputs

$$T(x, \tau) = T_{\text{c}} - \sum_{m=1}^{\infty} C_m \cdot A_m \cos\!\left(\mu_m \frac{x}{R}\right) \exp\!\left(-\mu_m^2 \cdot Fo\right)$$

$$\bar{T}(\tau) = T_{\text{c}} - \sum_{m=1}^{\infty} C_m \cdot B_m \exp\!\left(-\mu_m^2 \cdot Fo\right)$$

Where $B_m$ is reused from the base uniform case (Section 2.3).

### 4.5. Reduction Check (Unit Test Constraint)

If the initial profile is uniform ($T_{\text{ctr}} = T_{\text{surf}} = T_0$), then $C_m = \vartheta_0 = T_{\text{c}} - T_0$, which reduces the equations identically back to the base case (Section 2). Use this as a mandatory unit test constraint.

---

## 5. Implementation Notes

1. **Root-Finder Reuse:** Sections 2, 3, and 4 all use roots from the same transcendental equation $\operatorname{ctg}\,\mu = (\mu^2 - Bi^2)/(2\mu\,Bi)$. Do not duplicate the root-finding implementation.
2. **Profile Routing:** If the input flag indicates a parabolic profile, route directly to Section 4 to avoid the costly numerical integration in Section 3.
3. **Parabolic Modifier Loop:** $C_m$ depends on $\mu_m$, so it must be computed inside the series loop at each term index.
4. **Biot Re-evaluation:** Each time $Bi$ changes (new time step with updated $\alpha_{\text{eff}}$), a fresh set of roots $\mu_n$ must be computed.

