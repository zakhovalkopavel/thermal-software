# CoolProp dense viscosity and Chung mixture μ

**Module:** `backend/src/modules/thermodynamics/`  
**Orchestrator:** `utils/viscosity/gas-viscosity.ts` → `GasViscosity`  
**CoolProp:** `coolprop-viscosity-data.ts`, `coolprop-viscosity.ts`  
**Chung μ:** `chung-viscosity.ts` + `constants/chung-viscosity.constants.ts`  
**Refs:** [CoolProp], [Chung1988], [Poling5] §§9-5–9-7

## Pure μ(T,P)

| Step | Condition | Model |
|------|-----------|--------|
| Dilute η₀ | `viscosity.values` non-empty | Compound `def` |
| Dilute η₀ | else σ, ε/k | Chapman–Enskog LJ/Stockmayer |
| Dense Δη | `coolpropKey` + evaluable RF and/or higher-order | Δη_RF + Δη_HO at ρ from `GasDensity` |

Final: \(\mu = \eta_0 + \Delta\eta\) when CoolProp dense terms exist; else \(\mu = \eta_0\).

CoolProp models evaluated in TypeScript:

- Dilute: `collision_integral`, `powers_of_T`, `powers_of_Tr`
- Initial density: `Rainwater-Friend` → Δη_RF = η₀ · B_η · ρ_molar
- Higher-order: `modified_Batschinski_Hildebrand`

Deferred: expression DSL, hardcoded C++ paths, ECS, friction_theory, CoolProp `Chung` top-level block. When viscosity is a JSON list (e.g. Nitrogen), the first evaluable coefficient model is used.

## Mixture μ(T,P)

Chung density parameter \(y = V_{c,m}/(6V)\) with \(V = M/\rho\) from `GasDensity`:

| Condition | Model |
|-----------|--------|
| \(y < 0.01\) | Wilke of dilute μᵢ **+** Chung Δη = μ_Chung(T,V) − μ_Chung⁰(T) |
| \(y \ge 0.01\) | Full Chung dense μ at mixture pseudo-criticals (Poling §9-7) |

The low-\(y\) residual mirrors pure CoolProp Δη on dilute μ so mixture μ varies
with \(P\) even below the switch. Switch constant: `MIXTURE_VISCOSITY.Y_SWITCH`
(same numerical value as mixture λ).

## Chung dense formula (summary)

\[
F_c = 1 - 0.2756\,\omega + 0.059035\,\mu_r^4 + \kappa,\quad
T^*=1.2593\,T/T_c
\]

\[
\mu\,[\mu\mathrm{P}] = \mu^*\,36.344\,\sqrt{M T_c}/V_c^{2/3}
\]

with \(G_1,G_2,\mu^*,\mu^{**}\) and \(E_1\ldots E_{10}\) from Poling Ch. 9 (not Table 10-3). Ω_v from Neufeld.

## Wiring

| Call site | Behaviour |
|-----------|-----------|
| `TransportService.viscosityResult(sp,T,P)` | `GasViscosity.forCompound` |
| `TransportService.viscosityMixResult(mole,T,P)` | `GasViscosity.forMixture` |
| Chung λ η⁰ / Eucken / HE | dilute μ only (`GasViscosity.diluteResult`) |
