# STEP 11 — Processes: HTC, recuperator, thermal distribution

**Priority:** MEDIUM / LATER  
**Depends on:** [STEP_10_PROCESS_CALCS.md](STEP_10_PROCESS_CALCS.md)  
**Frontend root:** `frontend/src/modules/processes/sections/{htc,recuperator,thermal-distribution}/`

---

## Goal

Complete the Processes module with the specialist tasks. PSD / packing / blend optimisation are **not** here — they belong to Materials → Mineral compositions (Step 9).

`/api/v1/numeric/*` (root finders, regression) stays a backend utility and is not shown in the UI.

---

## 1. Heat-transfer coefficient / dimensionless numbers

**Route:** `/processes/htc`  
**Backend:** `thermodynamics.controller.ts`, `thermodynamics-fluid.controller.ts`

| Method | Path | Role |
|--------|------|------|
| `GET` | `/thermodynamics/fluid/list` | Fluid picker (same list as Materials → Gases) |
| `GET` | `/thermodynamics/fluid/flow-modes` | Flow regimes |
| `GET` | `/thermodynamics/geometry/list` | Geometries + required dimension fields |
| `GET` | `/thermodynamics/correlations` | Nusselt correlations + validity ranges |
| `POST` | `/thermodynamics/dimensionless` | Full set Re, Pr, Gr, Ra, Nu, h (primary) |
| `POST` | `/thermodynamics/dimensionless/{reynolds,prandtl,grashof,rayleigh,nusselt,htc}` | Single numbers (advanced) |
| `POST` | `/thermodynamics/body-geometry` | Surface, volume, mean beam length |

UI:

- Geometry select → dimension fields rendered dynamically from `geometry/list`.
- Fluid: named gas or mixture (`GasCompositionInput`), T_fluid, T_wall, velocity.
- Correlation select filtered by geometry; show its validity range and warn when Re/Pr are outside.
- Results: Re, Pr, Gr, Ra, Nu, h, correlation used. Secondary tab: body geometry calculator.

Charts:

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| h vs velocity | `XYLineChart` | x = gas velocity [m/s] (sweep, ≤ 25 points); y1 = h [W/(m²·K)]; y2 (right) = Re, **logarithmic**; vertical plot lines at the laminar / transition / turbulent Re limits of the chosen correlation |
| Nu vs Re | `XYLineChart` | both axes **logarithmic**; the sweep points; plot band = correlation validity range |

---

## 2. Recuperator

**Route:** `/processes/recuperator`  
**Backend:** `recuperator.controller.ts` (`POST /recuperator/calculate`); DTO reference `docs/migration/recuperator/CH04_DTOS.md`

Form in sections so it stays readable:

| Section | Fields (examples) |
|---------|-------------------|
| Combustion | power, fuel LHV, excess air, air inlet T |
| Geometry | `holeForm`, `d0_m`, wall / channel counts, `surfaceArea_m2` |
| Materials | wall and insulation materials (`MaterialPicker kinds={['metal', 'refractory']}`), λ / ε overrides |
| Solver | grid-search limits |

Results (`RecuperatorResultDto`): `recuperatorLength_m`, `tAirEnd_K`, `tSmokeStart_K`, `tSmokeEnd_K`, `tFlame_K`, `maxFlameTemp_K`, `energyReturnedPercent`, `airEnergyIncrease_W`, `smokeEnergyDecrease_W`, `smokeTotalEnergy_W`, `alphaAverage_Wm2K`, `averageDeltaT_K`, velocities `w*_ms`, `mFuel_kgh`.

Charts:

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Counter-flow temperatures | `XYLineChart` | x = position along the recuperator, 0 … `recuperatorLength_m`; smoke line from `tSmokeStart_K` (x = 0) to `tSmokeEnd_K` (x = L); air line from air inlet T (x = L) to `tAirEnd_K` (x = 0); straight segments, caption notes only end temperatures are returned |
| Energy balance | `CategoryBarChart` | `smokeTotalEnergy_W`, `smokeEnergyDecrease_W`, `airEnergyIncrease_W`; label shows `energyReturnedPercent` |
| Flame temperature gain | `CategoryBarChart` | `tFlame_K` vs `maxFlameTemp_K` |
| Velocities | `CategoryBarChart` (grouped) | smoke / air × start / end |

---

## 3. Thermal distribution (transient conduction)

**Route:** `/processes/thermal-distribution`  
**Backend:** `thermal-distribution.controller.ts`

Shared inputs: `bcType` (`BC_I` \| `BC_III`), `Tc`, `T0`, `tau`, `lambda`, `thermalDiffusivity`, `shape`, `alpha` (BC_III), profile / Biot options.

| Tab | Method | Path | Output |
|-----|--------|------|--------|
| Criteria | `POST` | `/thermal-distribution/criteria` | Bi, Fo, … |
| At depth | `POST` | `/thermal-distribution/temperature/at-depth` | T at `relDepth` |
| Profile | `POST` | `/thermal-distribution/temperature/profile` | T(ξ) for `relativeDepths[]` |
| Average | `POST` | `/thermal-distribution/temperature/average` | volume-average T |

Material helper: "Take λ from material" — pick a metal or refractory and a temperature; λ is fetched from the Materials endpoints and filled into `lambda` (thermal diffusivity still entered by the user).

Charts:

| Chart | Component | Axes / series |
|-------|-----------|---------------|
| Temperature profile T(ξ) | `XYLineChart` | x = relative depth ξ (0 = surface, 1 = centre); y = T; horizontal plot lines at `Tc` (medium) and `T0` (initial) |
| Profiles over time | `XYLineChart` | same axes; one series per τ in a user list (e.g. 5 values), requested in parallel — shows the heating front moving inward |
| Average T vs time | `XYLineChart` | x = τ (sweep, ≤ 30 points) ; y = volume-average T from `temperature/average` |
| Criteria | cards (Bi, Fo) — no chart |

---

## Acceptance criteria

- [ ] HTC page builds dimension fields from `geometry/list` and computes the full dimensionless set
- [ ] Recuperator returns results for a documented example body
- [ ] Thermal-distribution criteria and at least one temperature endpoint work
- [ ] λ can be taken from a Materials catalogue item
- [ ] HTC (h vs w, Nu vs Re log-log), recuperator (counter-flow T, energy balance) and thermal-distribution (T(ξ) over time, T̄(τ)) charts render
- [ ] `/numeric/*` does not appear in navigation

---

## Done

After Step 11 every user-facing controller is reachable from either the Materials or the Processes module. Sign off in [CHECKLIST.md](CHECKLIST.md).
