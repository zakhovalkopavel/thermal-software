# STEP 08 — Materials: Glasses (calculated from composition)

**Priority:** HIGH (flagship calculator)  
**Depends on:** [STEP_02_SHARED_CALC_COMPONENTS.md](STEP_02_SHARED_CALC_COMPONENTS.md) (incl. charts), [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md)  
**Frontend root:** `frontend/src/modules/materials/sections/glasses/`  
**Backend:** `refractory.controller.ts`, `dto/glass-viscosity.dto.ts`, `services/glass-viscosity.service.ts`

---

## Goal

Glass qualities are **calculated**, not looked up. The user defines the glass by its oxide composition in **wt%** or **mol%** (typed in, or started from a preset glass), then calculates viscosity behaviour: η at T, the η(T) curve, the characteristic fixed points and the temperature for a target viscosity.

Every result is plotted: **viscosity on a logarithmic axis**, always compared against **1–3 typical glasses** from the compound library — the same glass families the backend tests use as examples.

There is no separate glass backend module — all endpoints live under `/api/v1/refractory/`.

---

## Endpoints

| UI action | Method | Path |
|-----------|--------|------|
| Preset / reference glasses | `GET` | `/refractory/glasses` (Step 3, E7 — implemented) |
| wt% ↔ mol% | `POST` | `/refractory/utils/convert-composition` |
| η at one T | `POST` | `/refractory/glass-viscosity` |
| η(T) profile | `POST` | `/refractory/glass-viscosity/profile` |
| T at target log₁₀η | `POST` | `/refractory/glass-viscosity/temperature-at-viscosity` |

---

## Composition input: wt% or mol%

1. **Start from:** `Custom` or a preset from the glass library (preset compositions are wt%).
2. `OxideCompositionInput` with `allowedOxides = GLASS_OXIDES` and the **wt% / mol%** toggle.
3. Switching the toggle converts the numbers on screen through `convert-composition`.
4. The viscosity endpoints accept **wt% only**. On Calculate:
   - unit = wt → send as is;
   - unit = mol → call `convert-composition` (`mol_to_wt`) first, then send the wt% result.
5. The results panel shows the composition **in both units** so the engineer sees exactly what was calculated.

Sum must be within 99–101 % (yup test) — offer **Normalize** otherwise.

---

## Request and response shapes

```json
// POST /refractory/glass-viscosity
{ "composition": { "SiO2": 72.2, "Na2O": 13.4, "CaO": 11.2, "MgO": 1.5, "Al2O3": 1.3, "K2O": 0.4 },
  "temperature": 1200, "model": "FLUEGEL_2007" }

// POST /refractory/glass-viscosity/profile
{ "composition": { … }, "temperatures_C": [400, 420, …, 1600] }

// POST /refractory/glass-viscosity/temperature-at-viscosity
{ "composition": { … }, "targetLogEta": 3.0 }
```

- `temperature`, `temperatures_C` in **°C**; `targetLogEta` = log₁₀(η / Pa·s).
- `model` optional: `LAKATOS_1976` | `FLUEGEL_2007` | `HETHERINGTON_1964`; omit = auto. If the requested model is out of range the backend substitutes another and reports it in `validation.warnings`.

Response fields used by the UI (from `GlassViscosityResult` and the profile method):

| Endpoint | Fields |
|----------|--------|
| single point | `viscosity_Pas`, `logViscosity`, `temperature_C`, `model` (name, parameters `A`, `B`, `T0`), `fixedPoints` (`meltingPoint_C`, `workingPoint_C`, `softeningPoint_C`, `annealingPoint_C`, `strainPoint_C`, `spans`), `validation` (`confidenceLevel`, `warnings`, `extrapolationRisk`), `composition` (normalised) |
| profile | `model`, `points[]` = `{ temperature_C, logViscosity, viscosity_Pas }`, `fixedPoints` (**`null` for Hetherington / slag models**), `validation` |
| temperature at η | `model`, `targetLogEta`, `temperature_C`, `validation` |

`targetLogEta` presets: 1.0 melting, 3.0 working, 6.6 softening, 12.0 annealing, 13.5 strain.

---

## Reference glasses for comparison

The comparison glasses are library entries (`GET /refractory/glasses`) that correspond to the compositions used as examples in the backend glass-viscosity tests:

| Library `materialId` | Glass family | Used in tests as | Test file |
|----------------------|--------------|------------------|-----------|
| `soda_lime_glass` | Soda-lime-silica (window / container) | `windowGlass` (SiO2 72.2, Na2O 13.4, CaO 11.2, MgO 1.5, Al2O3 1.3, K2O 0.4) | `glass-viscosity.service.spec.ts`, `glass-viscosity-model-selection.spec.ts` |
| `borosilicate_glass` | Borosilicate (Pyrex) | `pyrex` (SiO2 80.6, B2O3 12.9, Al2O3 2.3, Na2O 3.9, K2O 0.3), NIST SRM 717A | same |
| `lead_glass` | Lead-silicate | NIST SRM 711 (~45 wt% PbO) | same |
| `quartz_glass` | Fused silica (Hetherington) | `{ SiO2: 100 }` / Hetherington-SiO2 | `glass-viscosity-model-selection.spec.ts` |

Rules:

- The ids live in `sections/glasses/glass.references.ts` as `GLASS_REFERENCE_IDS` (ids only). Compositions always come from the library endpoint — never copied into the frontend. The chart legend shows the library composition, which may differ slightly from the inline test values (e.g. library soda-lime SiO2 72.0 vs test 72.2).
- **"Compare with"** multi-select, **min 1, max 3** references. Default selection: `soda_lime_glass`, `borosilicate_glass`, `lead_glass`. `quartz_glass` is available but not preselected (its curve sits far above the others below ~1200 °C).
- If the user's own glass was started from one of the reference presets and not edited, that reference is removed from the comparison list (no duplicate curve).
- References are calculated with the **same `temperatures_C` grid and the same `model` value** as the user's glass; if the backend substitutes the model for a reference, the legend shows the model actually used (e.g. "Borosilicate — FLUEGEL_2007").

---

## Calculation flow

On **Calculate** the hook `useGlassCalculation` runs in parallel:

1. the selected task for the user glass (single point / profile / T at η);
2. `POST /glass-viscosity/profile` for the user glass on the **chart grid** — always, so every task has a curve to show;
3. `POST /glass-viscosity/profile` for each selected reference on the same grid.

Chart grid: default **400–1600 °C, step 20 °C** (61 points); in the *Profile* task the user's from / to / step replaces the default. Reference profiles are cached by `(materialId, grid, model)` so changing the user composition does not re-request them.

A failed reference request shows a small warning in the chart subtitle and does not block the user's result.

---

## Charts

### Chart 1 — Viscosity curve η(T), logarithmic

| Property | Value |
|----------|-------|
| Component | `XYLineChart` |
| x-axis | Temperature, °C, linear, grid range |
| y-axis | Viscosity η, Pa·s, **`type: 'logarithmic'`**, fixed range **10⁰ … 10¹⁵**, tick labels `10ⁿ` |
| User glass series | `y = 10^logViscosity` from `points[]`, solid, thick (`emphasis: true`) |
| Reference series (1–3) | same mapping, dashed, distinct palette colours |
| Horizontal plot lines | viscosity reference levels: 10¹ melting, 10³ working, 10⁶·⁶ softening, 10¹² annealing, 10¹³·⁵ strain (labelled) |
| Fixed-point markers | scatter overlay at (`meltingPoint_C` … `strainPoint_C`, level) for the user glass; skipped when `fixedPoints` is `null` |
| Task overlay | *At T*: marker at (`temperature_C`, `viscosity_Pas`) + vertical plot line at T. *T at η*: horizontal line at `10^targetLogEta`, vertical line at the returned `temperature_C` |
| Tooltip | shared by T: each series shows η (Pa·s, engineering notation) **and** log₁₀η |

Notes:

- y values are computed as `Math.pow(10, logViscosity)` (not `viscosity_Pas`, which is rounded by the backend for Hetherington) — presentation-only transform in `glass.chart.ts`.
- Points with η outside 10⁰–10¹⁵ are clipped by the axis range, not removed from the table.
- An alternative y-axis toggle "log₁₀η (linear)" is **not** provided: the logarithmic η axis is the single representation.

### Chart 2 — Fixed points comparison

| Property | Value |
|----------|-------|
| Component | `CategoryBarChart` (grouped columns) |
| Categories | Melting (10¹), Working (10³), Softening (10⁶·⁶), Annealing (10¹²), Strain (10¹³·⁵) |
| Series | user glass + each reference; y = temperature °C |
| Missing | glasses whose profile has `fixedPoints: null` (Hetherington) are omitted with a note |

Additionally show the **working range** (`workingPoint_C − softeningPoint_C`) and **melting-to-strain span** from `fixedPoints.spans` in the tooltip.

### Chart 3 — Composition comparison

| Property | Value |
|----------|-------|
| Component | `CategoryBarChart` (horizontal, stacked to 100 %) |
| Categories | user glass + references |
| Series | one per oxide (wt%, or mol% when the unit toggle is mol — converted via `convert-composition`) |
| Purpose | explains *why* the curves differ (e.g. B2O3 in borosilicate, PbO in lead glass) |

Layout in the results column: Chart 1 (full width) → Chart 2 + Chart 3 side by side on desktop → numeric cards and tables (task result, fixed points, VTF `A`, `B`, `T0`, profile table, composition wt% | mol%).

---

## UI

```
┌─ Glasses ─────────────────────────────────┬─ Results ──────────────────────────────────┐
│ Start from [Custom ▾ | Soda-lime | …]     │ Model used: FLUEGEL_2007  ⚠ warnings       │
│ Units (•) wt%  ( ) mol%                   │ ┌ η(T), log axis ───────────────────────┐ │
│ Oxide composition table   Σ = 100.0       │ │ 10¹⁵┤ ╲╲  ╲                            │ │
│ [Normalize]                               │ │     ┤   ╲╲  ╲   — your glass           │ │
│ Model [Auto ▾]                            │ │ 10⁶ ┤─────╲──╲── softening             │ │
│ Compare with (1–3):                       │ │     ┤      ╲   ╲ - - soda-lime         │ │
│  ☑ Soda-lime  ☑ Borosilicate  ☑ Lead      │ │ 10⁰ ┤        ╲    ╲ - - borosilicate   │ │
│  ☐ Fused silica                           │ │      400 °C … 1600 °C                  │ │
│ Task tabs: [At T] [Profile] [T at η]      │ └────────────────────────────────────────┘ │
│   At T:     T °C                          │ [Fixed points columns] [Composition bars]  │
│   Profile:  T from / to / step            │ Cards: η, log₁₀η, T(η) · VTF A, B, T0      │
│   T at η:   target log₁₀η + preset chips  │ Tables: fixed points, profile, composition │
│ [Calculate]                               │                                            │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

For preset glasses also show the library data (density, λ, cp, thermal expansion) as a small "Reference data" card.

---

## Files

```
sections/glasses/
├── GlassesSection.tsx
├── GlassCompositionForm.tsx     # preset + units + oxide editor + model
├── GlassCompareSelect.tsx       # 1–3 reference glasses
├── GlassTaskTabs.tsx
├── GlassResults.tsx             # model, warnings, cards, tables
├── charts/
│   ├── ViscosityCurveChart.tsx  # Chart 1 (log axis)
│   ├── FixedPointsChart.tsx     # Chart 2
│   └── CompositionCompareChart.tsx # Chart 3
├── glass.chart.ts               # response → series mappers (10^logViscosity, plot lines)
├── glass.references.ts          # GLASS_REFERENCE_IDS + default selection
└── glass.schema.ts              # yup
api/glasses.api.ts               # viscosity, profile, temperatureAtViscosity, convert
hooks/useGlassCalculation.ts     # mol→wt, task + chart-grid profile + reference profiles
types/glasses.types.ts
```

`glass.chart.ts` mappers are pure functions with unit tests (log mapping, clipping, null fixed points).

---

## Acceptance criteria

- [ ] Soda-lime preset at 1200 °C returns η, log₁₀η, fixed points, VTF parameters
- [ ] Entering the same glass in mol% gives the same result as in wt%
- [ ] η(T) chart uses a logarithmic y-axis (10⁰–10¹⁵) with `10ⁿ` labels and the five reference levels
- [ ] Chart shows the user glass plus 1–3 selected reference glasses loaded from the library (defaults: soda-lime, borosilicate, lead)
- [ ] Selecting more than 3 references is impossible; at least 1 is always selected
- [ ] *At T* and *T at η* results are marked on the curve
- [ ] Fixed-point and composition comparison charts render; Hetherington glass is handled without fixed points
- [ ] Model swap warning from the backend is visible (per series in the legend)
- [ ] Oxides outside the known list are rejected in the form, not by a backend 400
- [ ] Charts export PNG / CSV

---

## Next

→ [STEP_09_MINERAL_COMPOSITIONS.md](STEP_09_MINERAL_COMPOSITIONS.md)
