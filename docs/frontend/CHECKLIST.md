# Frontend calculation UI — checklist

Track implementation against [README.md](README.md). Tick an item only when it works in code.

---

## STEP 01 — Shell and API

- [ ] Router + AppBar (Home | Materials | Processes) + outlet
- [ ] `services/api/client.ts` with `VITE_API_URL` or `/api/v1`
- [ ] Home: two module tiles + health widget
- [ ] `modules/materials` and `modules/processes` skeletons with placeholder routes

## STEP 02 — Shared components

- [ ] `CalculatorPage` two-column layout
- [ ] `OxideCompositionInput` with wt% / mol% toggle via convert endpoint
- [ ] `REFRACTORY_OXIDES`, `GLASS_OXIDES`, `pickOxides()`
- [ ] `GasCompositionInput`
- [ ] Field helpers, `ResultPanel`, `ResultTable`, `JsonErrorAlert`
- [ ] Highcharts installed; `components/charts/highcharts.ts` initialises exporting, export-data, offline-exporting, accessibility
- [ ] `XYLineChart` (linear + logarithmic axes, plot lines/bands, markers), `CategoryBarChart`, `PieChart`, `ScatterChart`, `ChartCard`

## STEP 03 — Materials module + catalogue endpoints

- [x] Spec: backend catalogue endpoints E1–E10, one construct per file (Step 3 §1)
- [x] Spec: frontend module shell (six sections), types, API, hooks, `MaterialPicker`, temperature sweep (Step 3 §2)
- [ ] Backend: `GET /metals/list` (E1)
- [ ] Backend: `GET /refractory/refractories`, `/refractories/properties` (E2, E3)
- [ ] Backend: `GET /refractory/materials`, `/materials/:materialId` (E4, E5)
- [ ] Backend: `GET /refractory/material-groups` + one route per library group (E6, E7)
- [ ] Backend: `GET /refractory/particle-sizes` (E8)
- [ ] Backend: `GET /refractory/mix-components` (E9) — binders, oxides, silicates, clays, carbides, nitrides by primary group
- [ ] Backend: `GET /refractory/material-categories` (E10) — all library materials, each once, by primary group
- [ ] Backend: tests (Step 3 §1.5) + docs (Step 3 §1.6)
- [ ] Backend: numeric `T_K` query fix on `/metals/thermal-properties` — **awaiting approval** (not applied)
- [ ] Frontend: Materials hub (6 cards), section tabs, catalogue hooks, `MaterialPicker`, `TemperatureSweepFields`

## STEP 04 — Metals

- [x] Spec (Step 4)
- [ ] Single T and T-range λ / ε, up to 2 grades
- [ ] Chart: λ and ε on two y-axes, clamped ε zone shaded
- [ ] `?material=` deep link

## STEP 05 — Gases

- [x] Spec (Step 5)
- [ ] Pure gas: Cp, Cv, γ, M, μ, ν, ρ, λ, Pr (≤ 3 gases), single T and T range
- [ ] Mixture: full set incl. Pr and diffusion; presets; Σ ≠ 1 blocks Calculate
- [ ] Property-vs-T chart (ρ, ν on log axis); mixture pie
- [ ] Cp methods comparison in J/(mol·K)

## STEP 06 — Refractories

- [x] Spec (Step 6)
- [ ] Grouped catalogue of 19 products
- [ ] Single T, range, compare (≤ 4 products)
- [ ] Clamped ε marked
- [ ] λ(T), ε(T) and ranking charts

## STEP 07 — Raw materials

- [x] Spec (Step 7)
- [ ] Categories from E10; search; secondary groups as chips
- [ ] Composition pie + table; reference properties (only those present)
- [ ] Calculated λ_eff(T), Cp(T) for mix raw materials via mix/composition → thermal-conductivity; coverage and warnings; model limits labelled
- [ ] Calculated block disabled with reason for non-mix materials and materials without accepted oxides
- [ ] Compare up to 3 materials; `?category=&material=` deep link

## STEP 08 — Glasses

- [ ] Presets from glass library + custom composition
- [ ] wt% / mol% input; mol converted to wt before calculating
- [ ] η at T, profile, T at target log η
- [ ] Fixed points, VTF, model warnings
- [ ] η(T) chart on logarithmic axis (10⁰–10¹⁵) with reference viscosity levels
- [ ] 1–3 reference glasses from the library on the chart (default soda-lime, borosilicate, lead; fused silica optional)
- [ ] Task results marked on the curve; fixed-points and composition comparison charts

## STEP 09 — Mineral compositions

- [x] Spec: `POST /refractory/mix/composition` backend + frontend (Step 9 §2) — approved
- [ ] Backend: `POST /refractory/mix/composition` + tests + docs (Step 9 §2.3–2.5)
- [ ] Mix table: material × size fraction × mass % × density; picker = mix components from E9 only
- [ ] Mix composition: fired basis, loss on ignition, accepted oxides (wt% / mol%), other oxides, non-oxide groups, true density
- [ ] Chemical: phase equilibrium, mineral phases, refractoriness, λ_eff
- [ ] Granulometry: Andreasen, Funk–Dinger, participation
- [ ] Packing: CPM, Furnas → φ, porosity
- [ ] Water demand, range, shrinkage
- [ ] Blend optimiser + "Apply to mix"
- [ ] Charts: mix structure, bulk composition, phase (pie, liquid vs T), cumulative PSD on log size axis with q slider, packing, water range, shrinkage vs T, optimiser bubble map
- [ ] Backend limits enforced in the form (8 oxides, density 1000–4000)

## STEP 10 — Processes: combustion, wall

- [ ] Processes hub + tabs
- [ ] Combustion calculator
- [ ] Multilayer wall with metal + refractory layer picker
- [ ] Combustion → wall hand-off
- [ ] Charts: combustion composition / mass balance / α sweep; wall T-profile with layer bands and pinned variants

## STEP 11 — Processes: advanced

- [ ] HTC / dimensionless with dynamic geometry fields
- [ ] Recuperator
- [ ] Thermal distribution (criteria + temperatures)
- [ ] λ taken from a Materials item
- [ ] Charts: HTC (h vs w, Nu vs Re log-log), recuperator (counter-flow T, energy balance), thermal distribution (T(ξ) over time, T̄(τ))

---

## Cross-cutting

- [ ] No hardcoded backend host / port
- [ ] No material tables or formulas duplicated in the frontend
- [ ] Nest validation errors visible to the user
- [ ] Every calculated series has a chart with "Show table" and PNG / SVG / CSV export
- [ ] Charts only plot API data (presentation transforms in `*.chart.ts`)
- [ ] Highcharts licence confirmed before production
- [ ] Cross-module imports only via `modules/*/index.ts`
- [ ] `npm run lint` clean
