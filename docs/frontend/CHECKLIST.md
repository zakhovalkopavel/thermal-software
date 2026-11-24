# Frontend calculation UI — checklist

Track implementation against [README.md](README.md). Tick an item only when it works in code.

---

## STEP 01 — Shell and API

- [x] Router + AppBar (Home | Materials | Processes) + outlet
- [x] `services/api/client.ts` with `VITE_API_URL` or `/api/v1`
- [x] Home: two module tiles + health widget
- [x] `modules/materials` and `modules/processes` skeletons with placeholder routes

## STEP 02 — Shared components

- [x] `CalculatorPage` two-column layout
- [x] `OxideCompositionInput` with wt% / mol% toggle via convert endpoint
- [x] `REFRACTORY_OXIDES`, `GLASS_OXIDES`, `pickOxides()`
- [x] `GasCompositionInput`
- [x] Field helpers, `ResultPanel`, `ResultTable`, `JsonErrorAlert`
- [x] Highcharts installed; `components/charts/highcharts.ts` initialises exporting, export-data, offline-exporting, accessibility
- [x] `XYLineChart` (linear + logarithmic axes, plot lines/bands, markers), `CategoryBarChart`, `PieChart`, `ScatterChart`, `ChartCard`

## STEP 03 — Materials module + catalogue endpoints

- [x] Spec: backend catalogue endpoints E1–E10, one construct per file (Step 3 §1)
- [x] Spec: frontend module shell (six sections), types, API, hooks, `MaterialPicker`, temperature sweep (Step 3 §2)
- [x] Backend: `GET /metals/list` (E1)
- [x] Backend: `GET /refractory/refractories`, `/refractories/properties` (E2, E3)
- [x] Backend: `GET /refractory/materials`, `/materials/:materialId` (E4, E5)
- [x] Backend: `GET /refractory/material-groups` + one route per library group (E6, E7)
- [x] Backend: `GET /refractory/particle-sizes` (E8)
- [x] Backend: `GET /refractory/mix-components` (E9) — binders, oxides, silicates, clays, carbides, nitrides by primary group
- [x] Backend: `GET /refractory/material-categories` (E10) — all library materials, each once, by primary group
- [x] Backend: tests (Step 3 §1.5) + docs (Step 3 §1.6)
- [x] Backend: numeric `T_K` query fix on `/metals/thermal-properties` — approved and applied
- [x] Frontend: Materials hub (6 cards), section tabs, catalogue hooks, `MaterialPicker`, `TemperatureSweepFields`

## STEP 04 — Metals

- [x] Spec (Step 4)
- [x] Single T and T-range λ / ε, up to 2 grades
- [x] Chart: λ and ε on two y-axes, clamped ε zone shaded
- [x] `?material=` deep link

## STEP 05 — Gases

- [x] Spec (Step 5)
- [x] Pure gas: Cp, Cv, γ, M, μ, ν, ρ, λ, Pr (≤ 3 gases), single T and T range — `air` alias fails in the backend transport endpoints (awaiting approval), shown as a partial-result warning
- [x] Mixture: full set incl. Pr and diffusion; presets; Σ ≠ 1 blocks Calculate
- [x] Property-vs-T chart (ρ, ν on log axis); mixture pie
- [x] Cp methods comparison in J/(mol·K)

## STEP 06 — Refractories

- [x] Spec (Step 6)
- [x] Grouped catalogue of 19 products
- [x] Single T, range, compare (≤ 4 products)
- [x] Clamped ε marked
- [x] λ(T), ε(T) and ranking charts

## STEP 07 — Raw materials

- [x] Spec (Step 7)
- [x] Categories from E10; search; secondary groups as chips
- [x] Composition pie + table; reference properties (only those present)
- [x] Calculated λ_eff(T), Cp(T) for mix raw materials via mix/composition → thermal-conductivity; coverage and warnings; model limits labelled
- [x] Calculated block disabled with reason for non-mix materials and materials without accepted oxides
- [x] Compare up to 3 materials; `?category=&material=` deep link

## STEP 08 — Glasses

- [x] Presets from glass library + custom composition
- [x] wt% / mol% input; mol converted to wt before calculating
- [x] η at T, profile, T at target log η
- [x] Fixed points, VTF, model warnings (model substitution detected from the returned model name — the backend does not return `preferredModelRejected`)
- [x] η(T) chart on logarithmic axis (10⁰–10¹⁵) with reference viscosity levels
- [x] 1–3 reference glasses from the library on the chart (default soda-lime, borosilicate, lead; fused silica optional)
- [x] Task results marked on the curve; fixed-points and composition comparison charts

## STEP 09 — Mineral compositions

- [x] Spec: `POST /refractory/mix/composition` backend + frontend (Step 9 §2) — approved
- [x] Backend: `POST /refractory/mix/composition` + tests + docs (Step 9 §2.3–2.5)
- [x] Mix table: material × size fraction × mass % × density; picker = mix components from E9 only
- [x] Mix composition: fired basis, loss on ignition, accepted oxides (wt% / mol%), other oxides, non-oxide groups, true density
- [x] Chemical: phase equilibrium, mineral phases, refractoriness, λ_eff (phase equilibrium returns 500 at several temperatures — backend bug awaiting approval)
- [x] Granulometry: Andreasen, Funk–Dinger, participation (Andreasen sent with `Dmin_mm = 0`; with Dmin > 0 the backend returns the Funk–Dinger result)
- [x] Packing: CPM, Furnas → φ, porosity
- [x] Water demand, range, shrinkage
- [x] Blend optimiser + "Apply to mix" (best-by picks computed from the returned results; viable ranges not shown — the API returns no `summary` / `componentRanges`)
- [x] Charts: mix structure, bulk composition, phase (pie, liquid vs T), cumulative PSD on log size axis with q slider, packing, water range, shrinkage vs T, optimiser bubble map
- [x] Backend limits enforced in the form (8 oxides, density 1000–4000)

## STEP 10 — Processes: combustion, wall

- [x] Processes hub + tabs
- [x] Combustion calculator (4 modes: solid one-step, solid two-step, gas/liquid, packed bed)
- [x] Multilayer wall with metal + refractory layer picker
- [x] Combustion → wall hand-off (and Combustion → recuperator via router state)
- [x] Charts: combustion composition / mass balance / α sweep; wall T-profile with layer bands and pinned variants

## STEP 11 — Processes: advanced

- [x] HTC / dimensionless with dynamic geometry fields (single gas or mixture; "air" is not offered because the dimensionless endpoint returns 500 for it — backend bug awaiting approval) + body-geometry tab
- [x] Recuperator (combustion from the Step 10 forms or handed off from Combustion; no solver-limit fields — the DTO has none besides the target length)
- [x] Thermal distribution (criteria + at depth + profile + average; `plate`, `auto` and `V_over_A` are not offered — they need `halfThickness` / `V` / `A`, which the DTO rejects; ξ axis follows the backend: 0 = centre, 1 = surface)
- [x] λ taken from a Materials item (metal or refractory at a chosen T; recuperator also takes ε)
- [x] Charts: HTC (h vs w, Nu vs Re log-log), recuperator (counter-flow T, energy balance, flame T, velocities), thermal distribution (T(ξ), T(ξ) over time, T̄(τ))

---

## Cross-cutting

- [x] No hardcoded backend host / port
- [x] No material tables or formulas duplicated in the frontend
- [x] Nest validation errors visible to the user
- [x] Every calculated series has a chart with "Show table" and PNG / SVG / CSV export
- [x] Charts only plot API data (presentation transforms live in `*.mapper.ts` next to each chart)
- [ ] Highcharts licence confirmed before production
- [x] Cross-module imports only via `modules/*/index.ts`
- [x] `npm run lint` clean
