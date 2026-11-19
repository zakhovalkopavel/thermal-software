# Chapman–Enskog viscosity, diffusion, and Stockmayer

**Module:** `backend/src/modules/thermodynamics/`  
**Utils:** `utils/chapman-enskog/` (Neufeld Ω, LJ combining);
`utils/viscosity/chapman-enskog-viscosity.ts`,
`utils/viscosity/chapman-enskog-diffusion.ts`  
**Constants:** `constants/neufeld-collision-integrals.constants.ts`,
`constants/chapman-enskog.constants.ts`  
**Orchestrators:** `TransportService.viscosityResult`, `DiffusionService.binaryDiffusion`  
**Refs:** [Poling5] §§9-3, 11-3; Neufeld et al. 1972; Stockmayer via [Itean1961], [Svehla1995]

## Shared collision integrals (Neufeld)

Reduced temperature \(T^*=T/(\varepsilon/k)\). Fits (Poling Appendix / Neufeld 1972):

\[
\Omega^{(1,1)*}(T^*)=\Omega_D,\qquad
\Omega^{(2,2)*}(T^*)=\Omega_v
\]

Coefficients live in `NEUFELD_COLLISION_INTEGRALS` (no magic numbers in utils).
Binary pairs use Lorentz–Berthelot combining:

\[
\sigma_{12}=\tfrac12(\sigma_1+\sigma_2),\qquad
\varepsilon_{12}/k=\sqrt{(\varepsilon_1/k)(\varepsilon_2/k)}
\]

\(\sigma\) on `CompoundValue` is stored in Å (builder converts from SI metres).

## Pure viscosity \(\mu\) (dilute)

\[
\mu\,[\mu\mathrm{P}]
= 26.69\,\frac{\sqrt{M[\mathrm{g/mol}]\,T}}{\sigma^2\,\Omega_v^*},\qquad
\mu\,[\mathrm{Pa\cdot s}]=10^{-7}\,\mu\,[\mu\mathrm{P}]
\]

- Nonpolar / no significant dipole → Lennard-Jones \(\Omega_v^*=\Omega_v(T^*)\).
- Polar → Stockmayer engineering correction used with Svehla/Itean practice:

\[
\Omega_v^*\approx\Omega_v(T^*)+0.2\,\delta^2/T^*
\]

\(\delta\) preference: stored `stockmayerDelta` when \(>0\); else
\(\delta=\mu_{\mathrm{dipole}}^2/(2\varepsilon\sigma^3)\) in SI when
\(|\mu|\) ≥ `POLAR_DIPOLE_DEBYE_MIN` (0.1 D).

Dilute CE \(\mu\) is pressure-independent to first order. Dense-gas Chung \(\mu\)
is out of scope for this pass.

## Binary diffusivity \(D_{12}\)

Poling / equivalent atm form (M in g/mol, \(\sigma\) in Å, \(P\) in atm):

\[
D_{12}\,[\mathrm{cm^2/s}]
= 1.858\times 10^{-3}\,
\frac{T^{3/2}\sqrt{1/M_A+1/M_B}}{P_{\mathrm{atm}}\,\sigma_{12}^2\,\Omega_D}
\]

Returned as \(\mathrm{m^2/s}\) (\(D_{\mathrm{cm^2/s}}\times 10^{-4}\)).
Do **not** use the incomplete legacy \(0.00266\) form that omitted molar mass.

## Method selection (viscosity)

| Priority | Condition | Model |
|----------|-----------|--------|
| 1 | `viscosity.values.length > 0` | `CompoundPropertyResolver` (`def`) |
| 2 | `collisionDiameter` and `epsilonToKb` | CE LJ or Stockmayer (polarity as above) |
| — | Else | Throw |

## Dilute \(\lambda^0\) after CE \(\mu\)

When no stored \(k(T)\) and no CoolProp dilute polynomial:

1. Resolve \(\mu\) with the viscosity selection above (may be CE).
2. Eucken \(\lambda=(C_p+1.25 R)\mu/M\); modified Eucken when a Svehla \(Z\) is
   available on the compound (else classical).

Polarity affects \(\lambda\) only through \(\mu\). High \(P\) changes pure \(\lambda\)
only when CoolProp residual/critical applies
([`NISTIR_8209_THERMAL_CONDUCTIVITY.md`](./NISTIR_8209_THERMAL_CONDUCTIVITY.md)).

## Density (unchanged)

See [`GAS_DENSITY.md`](./GAS_DENSITY.md): Helmholtz → Peng–Robinson → ideal-gas
envelope (else throw).

## Source files

| Path | Role |
|------|------|
| `utils/chapman-enskog/neufeld-collision-integrals.ts` | \(\Omega_D\), \(\Omega_v\) |
| `utils/chapman-enskog/lennard-jones-combining.ts` | \(\sigma_{12}\), \(\varepsilon_{12}\) |
| `utils/viscosity/chapman-enskog-viscosity.ts` | Pure CE \(\mu\) LJ/Stockmayer |
| `utils/viscosity/chapman-enskog-diffusion.ts` | Binary \(D_{12}\) |
| `services/transport.service.ts` | Viscosity + dilute \(\lambda\) orchestration |
| `services/diffusion.service.ts` | Thin CE diffusion orchestrator |
