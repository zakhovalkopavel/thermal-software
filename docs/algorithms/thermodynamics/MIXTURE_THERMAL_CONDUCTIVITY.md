# Mixture gas thermal conductivity

**Module:** `backend/src/modules/thermodynamics/`  
**Orchestrator:** `TransportService.thermalConductivityMixResult`  
**Refs:** [Hirschfelder1954], [Poling5] §10-6 / §§9-5 & 10-5, [Chung1988]

## Switch

Chung density parameter:

\[
y = \frac{V_{c,m}}{6V},\quad
V = \frac{M}{\rho(T,P)}\ \text{with }\rho\text{ from }GasDensity
\]

| Condition | Method |
|-----------|--------|
| \(y < 0.01\) | Hirschfelder–Eucken Form A (Mason–Saxena) |
| \(y \ge 0.01\) | Chung et al. (1988) dense-gas λ |

Constant: `MIXTURE_THERMAL_CONDUCTIVITY.Y_SWITCH` in
`constants/mixture-thermal-conductivity.constants.ts`.

Molar volume \(V\) uses `GasDensity.forMixture` (Helmholtz → Peng–Robinson →
limited ideal gas). Pure-component \(\lambda_i\) may include NIST IR 8209 residual
\(\lambda^r\) when CoolProp TRANSPORT provides it
(`NISTIR_8209_THERMAL_CONDUCTIVITY.md`); the **mixture** rule remains HE / Chung.

## Low density — Hirschfelder–Eucken (Form A)

Static class: `utils/conductivity/hirschfelder-eucken.ts` → `HirschfelderEucken`.

1. Pure \(\lambda_i(T)\) (stored \(k(T)\) or pure Eucken from \(\mu\)).
2. Pure \(\eta_i(T)\) from viscosity `def`.
3. Split: \(\lambda_{i,\mathrm{tr}} = \tfrac{15}{4}(R/M_i)\eta_i\),
   \(\lambda_{i,\mathrm{int}} = \max(0,\lambda_i - \lambda_{i,\mathrm{tr}})\).
4. Mason–Saxena \(A_{ij}\) (Wilke shape with \(\lambda_{\mathrm{tr}}\)):

\[
A_{ij}=\frac{\bigl[1+\sqrt{\lambda_{i,\mathrm{tr}}/\lambda_{j,\mathrm{tr}}}\,(M_j/M_i)^{1/4}\bigr]^2}{\sqrt{8(1+M_i/M_j)}}
\]

5. Mix both parts with the same \(A_{ij}\); \(\lambda_m = \lambda_{m,\mathrm{tr}} + \lambda_{m,\mathrm{int}}\).

## High density — Chung 1988

Static class: `utils/conductivity/chung-thermal-conductivity.ts` → `ChungThermalConductivity`.  
Working equations: Poling 5th ed. §§9-5 (mixing), 10-5 (dense λ), 10-7 (mixtures).  
Primary paper: [Chung1988] (Chung, Ajlan, Lee, Starling, *Ind. Eng. Chem. Res.* 1988).

Chung’s method is a corresponding-states correlation: mixture pseudo-criticals are
built first, then the **pure-fluid** dense-gas formula is evaluated at those
pseudo-properties. It corrects a low-pressure viscosity \(\eta^0\) for density via
\(y\), and accounts for polyatomic heat capacity through \(\Psi\).

### Inputs (per species)

| Symbol | Source | Units in code |
|--------|--------|----------------|
| \(y_i\) | mole fractions | — |
| \(M_i\) | `CompoundValue.Mr` | kg/mol |
| \(T_{c,i}\) | `criticalTemperature` | K |
| \(V_{c,i}\) | `criticalVolume` | m³/mol |
| \(\omega_i\) | `acentricFactor` (default 0) | — |
| \(\mu_i\) | `dipoleMoment` → Debye (default 0) | Debye |
| \(\kappa_i\) | association factor | **always 0** here |

Missing \(T_c\) or \(V_c\) → throw. Dipole in compound-data is SI [C·m]; convert with
\(1\,\mathrm{D} = 3.33564\times 10^{-30}\,\mathrm{C\cdot m}\).

Also needed at mixture level:

- \(\eta^0\) = Wilke mixture viscosity at \(T\) [Pa·s] (our dilute \(\mu\) correlations)
- \(C_{v,m} = \sum_i y_i C_{p,i} - R\) [J/(mol·K)] (ideal-gas)
- \(V = M/\rho\) [m³/mol] from `GasDensity.forMixture`

### Mixing rules (Poling Eqs. 9-5.25–9-5.44)

Pure sizes / energies from criticals (\(V_c\) temporarily in cm³/mol):

\[
\sigma_i = 0.809\,V_{c,i}^{1/3},\qquad
\frac{\varepsilon_i}{k} = \frac{T_{c,i}}{1.2593}
\]

Combining rules (\(\xi_{ij}=\zeta_{ij}=1\)):

\[
\sigma_{ij}=\sqrt{\sigma_i\sigma_j},\quad
\frac{\varepsilon_{ij}}{k}=\sqrt{\frac{\varepsilon_i}{k}\frac{\varepsilon_j}{k}},\quad
\omega_{ij}=\tfrac12(\omega_i+\omega_j),\quad
M_{ij}=\frac{2M_i M_j}{M_i+M_j}
\]

Mixture aggregates (sums over all pairs \(i,j\)):

\[
\begin{aligned}
\sigma_m^3 &= \sum_i\sum_j y_i y_j\,\sigma_{ij}^3 \\
(\varepsilon/k)_m &= \frac{\sum_i\sum_j y_i y_j\,(\varepsilon_{ij}/k)\,\sigma_{ij}^3}{\sigma_m^3} \\
\omega_m &= \frac{\sum_i\sum_j y_i y_j\,\omega_{ij}\,\sigma_{ij}^3}{\sigma_m^3} \\
M_m &= \left[
  \frac{\sum_i\sum_j y_i y_j\,(\varepsilon_{ij}/k)\,\sigma_{ij}^2\,M_{ij}^{1/2}}
       {(\varepsilon/k)_m\,\sigma_m^2}
\right]^2 \\
\mu_m^4 &= \sigma_m^3\sum_i\sum_j y_i y_j\,
  \frac{\mu_i^2\mu_j^2}{\sigma_{ij}^3},\qquad
\kappa_m = \sum_i\sum_j y_i y_j\,\kappa_{ij}=0
\end{aligned}
\]

Back to pseudo-criticals and reduced dipole:

\[
V_{c,m}=\Bigl(\frac{\sigma_m}{0.809}\Bigr)^3,\qquad
T_{c,m}=1.2593\,(\varepsilon/k)_m,\qquad
\mu_{r,m}=\frac{131.3\,\mu_m}{\sqrt{V_{c,m}\,T_{c,m}}}
\]

(\(V_{c,m}\) stored again as m³/mol; \(M_m\) as kg/mol. Note \(M_m\) is the Chung
mixing-rule mass, **not** the mole-average \(\sum y_i M_i\).)

### Dense-gas λ (Poling Eq. 10-5.5)

\[
\lambda =
\frac{31.2\,\eta^0\,\Psi}{M'}
\bigl(G_2^{-1}+B_6 y\bigr)
+ q\,B_7\,y^2\,T_r^{1/2}\,G_2
\]

with \(M'\) in kg/mol, \(\eta^0\) in Pa·s, \(\lambda\) in W/(m·K),
\(T_r=T/T_{c,m}\), and

\[
y=\frac{V_{c,m}}{6V},\qquad
q=3.586\times 10^{-3}
\Bigl(\frac{T_{c,m}}{M'}\Bigr)^{1/2}V_{c,m}^{-2/3}
\]

(\(V_{c,m}\) in **cm³/mol** inside \(q\)).

**Polyatomic factor \(\Psi\)** (Poling under Eq. 10-3.14):

\[
\begin{aligned}
\alpha &= \frac{C_{v,m}}{R}-\tfrac32,\qquad
\beta = 0.7862-0.7109\,\omega_m+1.3168\,\omega_m^2,\qquad
Z = 2+10.5\,T_r^2 \\
\Psi &= 1+\alpha\,
\frac{0.215+0.28288\alpha-1.061\beta+0.26665 Z}
     {0.6366+\beta Z+1.061\,\alpha\beta}
\end{aligned}
\]

**Density functions:**

\[
G_1=\frac{1-0.5y}{(1-y)^3},\qquad
G_2=\frac{(B_1/y)\bigl[1-\mathrm{e}^{-B_4 y}\bigr]+B_2 G_1\mathrm{e}^{B_5 y}+B_3 G_1}
         {B_1 B_4+B_2+B_3}
\]

**Poling Table 10-3** (\(i=1\ldots 7\)), stored as `TABLE_10_3` in
`constants/chung-thermal-conductivity.constants.ts`. That identifier is only
Poling’s chapter table number (p. 10.23); Chung (1988) does not give the
coefficient set a separate formal name. It is the \(a_i,b_i,c_i,d_i\) fit for
**thermal conductivity** (not the Ch. 9 viscosity table):

\[
B_i = a_i + b_i\,\omega_m + c_i\,\mu_{r,m}^4 + d_i\,\kappa_m
\]

| \(i\) | \(a_i\) | \(b_i\) | \(c_i\) | \(d_i\) |
|------:|--------:|--------:|--------:|--------:|
| 1 | 2.4166 | 0.74824 | −0.91858 | 121.72 |
| 2 | −0.50924 | −1.5094 | −49.991 | 69.983 |
| 3 | 6.6107 | 5.6207 | 64.76 | 27.039 |
| 4 | 14.543 | −8.9139 | −5.6379 | 74.344 |
| 5 | 0.79274 | 0.82019 | −0.69369 | 6.3173 |
| 6 | −5.8634 | 12.801 | 9.5893 | 65.529 |
| 7 | 91.089 | 128.11 | −54.217 | 523.81 |

As \(y\to 0\), the \(B_6 y\) and \(q B_7 y^2\ldots\) terms vanish and \(\lambda\)
approaches the low-pressure Chung form based on \(\eta^0\Psi/M'\). We still
prefer Hirschfelder–Eucken below \(y=0.01\) because that path uses our stored
pure \(\lambda_i(T)\) correlations rather than estimating λ from viscosity alone.

## Call chain

`P_Pa` (default 101 325 Pa) is threaded from fluid / dimensionless / gas-mixture
API DTOs into `thermalConductivityMixResult`. Validity messages name the method
used (`HirschfelderEucken` or `Chung1988`) and report \(y\).
