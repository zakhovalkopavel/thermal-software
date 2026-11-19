# NIST IR 8209 pure-fluid thermal conductivity

**Module:** `backend/src/modules/thermodynamics/`  
**Evaluator:** `utils/conductivity/coolprop-conductivity.ts` → `CoolpropConductivity`  
**Critical:** `utils/conductivity/coolprop-olchowy-sengers.ts` → `CoolpropOlchowySengers`  
**Loader:** `utils/conductivity/coolprop-transport-data.ts` → `CoolpropTransportData`  
**Orchestrator:** `TransportService.thermalConductivityResult`  
**Refs:** [NISTIR8209], [CoolProp]

## Scope

Pure-fluid gas thermal conductivity in the NIST IR 8209 / REFPROP form as stored in
CoolProp fluid JSON (`TRANSPORT.conductivity`):

\[
\lambda(T,\rho) = \lambda^0(T) + \lambda^r(T,\rho) + \lambda^{\mathrm{crit}}(T,\rho)
\]

CoolProp `expression` / `hardcoded` residual forms are not evaluated; those fluids
keep dilute \(\lambda^0\) only. Hardcoded critical blocks (R123, ammonia) are skipped
(only `simplified_Olchowy_Sengers` is implemented).

Mixture \(\lambda\) stays **Hirschfelder–Eucken / Chung 1988**
(`MIXTURE_THERMAL_CONDUCTIVITY.md`); Chung \(V\) uses `GasDensity`, not ideal gas.

## Dilute \(\lambda^0(T)\) (caller priority)

| Priority | Source |
|----------|--------|
| 1 | Compound-data `thermalConductivity` via `CompoundPropertyResolver` |
| 2 | CoolProp dilute `ratio_of_polynomials` |
| 3 | Resolve \(\mu\) (stored `def`, else CE LJ/Stockmayer) → Eucken / modified Eucken |

CE \(\mu\) + Eucken details:
[`CHAPMAN_ENSKOG_VISCOSITY.md`](./CHAPMAN_ENSKOG_VISCOSITY.md).
Do not fail when \(\sigma,\varepsilon/k\) exist — use CE before throwing.

`CoolpropConductivity.conductivity` takes the caller’s \(\lambda^0\) and viscosity
\(\mu\) (for \(\lambda^{\mathrm{crit}}\)), then adds \(\lambda^r\) and
\(\lambda^{\mathrm{crit}}\).

## Residual \(\lambda^r(T,\rho)\)

Mass density \(\rho\) from `GasDensity.forCompound` (Helmholtz → PR → limited ideal).

### `polynomial`

\[
\lambda^r = \sum_i B_i\,\tau^{t_i}\,\delta^{d_i},\quad
\tau=\frac{T_{\mathrm{red}}}{T},\quad
\delta=\frac{\rho}{\rho_{\mathrm{red}}}
\]

### `polynomial_and_exponential`

\[
\lambda^r = \sum_i A_i\,\tau^{t_i}\,\delta^{d_i}\,\exp(-\gamma_i\delta^{l_i})
\]

with EOS reducing \(\tau=T_c/T\), \(\delta=\rho_{\mathrm{molar}}/\rho_c\).

## Critical \(\lambda^{\mathrm{crit}}\) — simplified Olchowy–Sengers

CoolProp `simplified_Olchowy_Sengers` (defaults in `OLCHOWY_SENGERS` when a
coefficient is omitted). Same algebra as CoolProp
`conductivity_critical_simplified_Olchowy_Sengers`:

\[
\lambda^{\mathrm{crit}}
= \frac{\rho\,c_p\,R_D\,k_B\,T}{6\pi\,\eta\,\zeta}\,(\tilde\Omega-\tilde\Omega_0)
\]

with correlation length \(\zeta=\zeta_0(X-X_{\mathrm{ref}})/\Gamma)^{\nu/\gamma}\)
from isothermal compressibility at \(T\) and \(T_{\mathrm{ref}}\) (default
\(1.5\,T_c\)), and \(\tilde\Omega,\tilde\Omega_0\) as in CoolProp / NIST IR 8209.
If \(X-X_{\mathrm{ref}}\) is not positive, \(\lambda^{\mathrm{crit}}=0\).

\(c_p\), \(c_v\), and \((\partial p/\partial\rho)_T\) come from the Helmholtz EOS
(`HelmholtzThermo`); \(\eta\) is the compound viscosity at \(T\) from
`TransportService`.

## Wiring

| Call site | Behaviour |
|-----------|-----------|
| `TransportService.thermalConductivityResult` | \(\lambda^0+\lambda^r+\lambda^{\mathrm{crit}}\) when residual exists |
| `CompoundFluidPropsService` (pure, CoolProp-linked) | Delegates to `TransportService` |
| Mixture path | Pure \(\lambda_i\) may include residual/critical; mix rule still HE/Chung |

## Source files

| Path | Role |
|------|------|
| `shared/sources/coolprop/fluids/<NAME>.json` | `TRANSPORT.conductivity` coefficients |
| `types/coolprop-conductivity-*.type.ts` | Parsed dilute / residual / critical shapes |
