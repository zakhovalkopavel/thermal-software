# Inden magnetic specific heat (`indenCp`)

**Status:** Used by metal-data synthesis for steel `specificHeat` approximations.  
**Refs:** [57] Inden1981, [58] HillertJarl1978 (context).

## Model

Ferritic / carbon / low-alloy steels show a λ-shaped Cp peak at the Curie temperature \(T_C\) (often ~1000 K), **below** Andrews Ac3. A quadratic ≤ Ac3 cannot fit that peak.

Stored equation type `indenCp` (compound style: `type` / `vars` / `min` / `max`):

\[
C_p(T)=a+bT+cT^2+
\begin{cases}
A_L\,f_{\mathrm{LRO}}(\tau) & \tau<1\\
A_H\,f_{\mathrm{SRO}}(\tau) & \tau>1
\end{cases}
\qquad \tau=T/T_C
\]

Inden logarithmic shapes (ε-capped as \(\tau\to 1\) so Cp stays finite):

\[
f_{\mathrm{LRO}}=\ln\frac{1+\tau^3}{1-\tau^3},\qquad
f_{\mathrm{SRO}}=\ln\frac{1+\tau^{-5}}{1-\tau^{-5}}
\]

`vars`: `a`, `b`, `c`, `Al`, `Ah`, `Tc` (integer K). Top-level `Tswitch` = `Tc`.

## Fit

1. Detect an interior λ-peak (prominence vs neighbours).
2. Scan integer \(T_C\) near the peak (±30 K); least-squares on \((a,b,c,A_L,A_H)\).
3. Accept if `maxRelPct` ≤ 10% on own points (before donor fill).

Smooth series without a Curie peak → no Cp approximation (quadratic path is not forced).

## Relation to Ac3

Alloy `criticalTemperatures` still hold Andrews Ac1/Ac3. For Cp the approximation switch is **magnetic** (\(T_C\)), not Ac3. Other properties keep `Tswitch` = Ac3 with quadratic / linear branches.
