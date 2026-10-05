# STEP 02 — Shared calculation components

**Priority:** HIGH  
**Depends on:** [STEP_01_SHELL_AND_API.md](STEP_01_SHELL_AND_API.md)  
**Code root:** `frontend/src/components/calc/`

---

## Goal

Reusable, module-agnostic building blocks so every calculator looks and behaves the same, including the **Highcharts** chart layer used by every results panel. They know nothing about specific materials — material pickers live in the Materials module (Step 3).

---

## Scope

| Belong | Do not belong |
|--------|----------------|
| `CalculatorPage` two-column shell | Material catalogues / pickers |
| Oxide and gas composition editors | Endpoint-specific result tables |
| Number / temperature / enum fields | Mix (fraction) table — Step 9 |
| Calculate button, result panel, error alert | Section-specific chart options (live in each section) |
| Highcharts setup + generic chart components | |

---

## Target tree

```
frontend/src/components/calc/
├── CalculatorPage.tsx
├── OxideCompositionInput.tsx
├── GasCompositionInput.tsx
├── TemperatureField.tsx
├── NumberField.tsx
├── EnumSelect.tsx
├── CalculateButton.tsx
├── ResultPanel.tsx
├── ResultCard.tsx
├── ResultTable.tsx             # simple key/value or row table
├── JsonErrorAlert.tsx
└── index.ts
```

Forms use **react-hook-form** + **yup**; MUI inputs are wired through `Controller`.

---

## CalculatorPage

Props: `title`, `description`, `inputs`, `results`.

```
┌─────────────────────────────────────────────┐
│ Title + short description                   │
├──────────────────┬──────────────────────────┤
│ Inputs (left)    │ Results (right)          │
│ [Calculate]      │ ResultPanel              │
└──────────────────┴──────────────────────────┘
```

Stacks vertically on narrow screens (inputs first).

---

## OxideCompositionInput

Edits `Record<string, number>` in a chosen unit. Used by Glasses (Step 8) and Mineral compositions (Step 9).

### Props

```ts
interface OxideCompositionInputProps {
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  unit: 'wt' | 'mol';
  onUnitChange?: (unit: 'wt' | 'mol') => void; // shows wt% / mol% toggle when provided
  allowedOxides?: string[];                     // restrict keys (see note below)
  readOnly?: boolean;                           // e.g. computed bulk composition
}
```

### Behaviour

- Rows: oxide key (select from `allowedOxides` or a default glass/refractory list, custom key allowed when unrestricted) + value.
- Shows the **sum**; warns when it is not ≈ 100 (warning only).
- **Normalize** scales to 100.
- **wt% / mol% toggle**: switching unit calls `POST /refractory/utils/convert-composition` and replaces the values with the converted ones — the numbers on screen always match the selected unit.

```json
{ "composition": { "SiO2": 72.2, "Na2O": 13.4, "CaO": 11.2 }, "direction": "wt_to_mol" }
```

`direction`: `wt_to_mol` | `mol_to_wt`.

### Allowed oxides — backend constraint

The backend runs `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`. No refractory endpoint takes an oxide list any more: phase equilibrium, refractoriness and mix thermal take mix fractions, and the eight-field `OxideCompositionDto` is removed (step 3 of the phase-equilibrium work). Glass viscosity keeps its own wide composition record.

- Export `GLASS_OXIDES` (wide list: `SiO2, Al2O3, Na2O, K2O, Li2O, CaO, MgO, BaO, ZnO, PbO, B2O3, Fe2O3, TiO2, ZrO2, SrO, …`) from `components/calc/oxides.ts`. `REFRACTORY_OXIDES` (the former eight keys) is removed with its only user, the bulk composition card of [Step 9](STEP_09_MINERAL_COMPOSITIONS.md).
- Provide `pickOxides(composition, allowed)` → `{ kept, ignored }` so callers can strip unsupported keys and display "ignored: B2O3 1.2 %".

---

## GasCompositionInput

Rows of gas species (`N2, O2, CO2, CO, H2O, H2, CH4, Ar, SO2, …` — list supplied by caller from the Gases catalogue) with **mole fractions 0–1**. Shows sum, Normalize to 1.

---

## Field helpers

| Component | Role |
|-----------|------|
| `TemperatureField` | Number + unit (`C` \| `K`) in label; optional `min`/`max` |
| `NumberField` | Numeric `TextField` (`valueAsNumber`), unit adornment |
| `EnumSelect` | `Select` from `{ value, label }[]` |
| `CalculateButton` | Primary button with loading state |
| `ResultPanel` | idle hint / loading / error / children |
| `ResultCard` | label + value + unit |
| `ResultTable` | columns + rows, numeric formatting |
| `JsonErrorAlert` | Nest `message` string or `message[]` |

Number formatting helper `formatValue(value, digits)` in `components/calc/format.ts` (engineering notation for very small / large values).

---

## Charts (Highcharts)

### Dependencies

```bash
npm install highcharts highcharts-react-official
```

### Target tree

```
frontend/src/components/charts/
├── highcharts.ts               # single Highcharts import + module init + global theme
├── HighchartsChart.tsx         # thin wrapper around HighchartsReact (typed options, resize)
├── ChartCard.tsx               # MUI Card: title, subtitle, chart, "show table" toggle
├── XYLineChart.tsx             # y(x) series; linear or logarithmic axes
├── CategoryBarChart.tsx        # grouped / stacked columns or bars
├── PieChart.tsx                # composition shares
├── ScatterChart.tsx            # x/y (+ optional bubble size), click → select row
├── chart.theme.ts              # colours, fonts from the MUI theme
├── chart.format.ts             # tick/tooltip formatters (units, 10ⁿ labels)
└── index.ts
```

### `highcharts.ts`

- Import `highcharts` once and initialise modules: `exporting`, `export-data` (CSV / XLSX-like table download), `offline-exporting` (PNG/SVG without the Highcharts export server), `accessibility`.
- `Highcharts.setOptions` with the theme: MUI palette colours, `credits.enabled = false`, `lang.thousandsSep = ' '`, `chart.style.fontFamily` from MUI.
- All chart components import Highcharts from this file, never from `'highcharts'` directly.

### Component contracts

```ts
interface XYSeries {
  name: string;
  data: [number, number][];      // [x, y]
  dashStyle?: 'Solid' | 'Dash' | 'ShortDot';
  emphasis?: boolean;            // thicker line for the user's own result
  yAxis?: number;                // secondary axis index
  unit?: string;                 // shown in tooltip
}

interface XYLineChartProps {
  title: string;
  xAxis: { title: string; unit?: string; type?: 'linear' | 'logarithmic'; min?: number; max?: number };
  yAxes: Array<{ title: string; unit?: string; type?: 'linear' | 'logarithmic'; min?: number; max?: number; opposite?: boolean }>;
  series: XYSeries[];
  xPlotLines?: Array<{ value: number; label: string }>;
  yPlotLines?: Array<{ value: number; label: string }>;
  xPlotBands?: Array<{ from: number; to: number; label: string }>;
  markers?: Array<{ name: string; points: [number, number][] }>; // scatter overlays
}
```

`CategoryBarChart`, `PieChart`, `ScatterChart` follow the same pattern: plain data in props, options built inside. Sections pass data only; if a section needs something special it passes an `optionsOverride` that is deep-merged.

### Rules

- **Data comes from API responses**; charts never compute physics. Pure presentation transforms (unit conversion K↔°C, `10^logViscosity`, cumulative sums of mass fractions) are allowed in `*.chart.ts` mappers next to the section.
- Every chart has a **"Show table"** toggle (via `ChartCard`) and the exporting menu (PNG, SVG, CSV).
- Charts appear in the **results column above** the numeric tables; single-value results (one T) keep cards only.
- Logarithmic axes use `type: 'logarithmic'` with tick labels `10ⁿ` from `chart.format.ts`; values ≤ 0 are dropped before plotting.
- Large sweeps: `boost` module not required (≤ a few hundred points per chart).

---

## Acceptance criteria

- [ ] `CalculatorPage` renders two columns on desktop, stacked on mobile
- [ ] `OxideCompositionInput` adds/removes rows, normalizes, and switches wt% ↔ mol% via the API
- [ ] `pickOxides` strips non-allowed oxides and reports them
- [ ] `JsonErrorAlert` renders a Nest 400 readably
- [ ] Everything exported from `components/calc/index.ts`; no material-specific logic inside
- [ ] `highcharts` + `highcharts-react-official` installed; modules initialised once in `components/charts/highcharts.ts`
- [ ] `XYLineChart` renders linear and logarithmic axes, plot lines, bands and marker overlays
- [ ] `ChartCard` "Show table" toggle and PNG / SVG / CSV export work offline

---

## Next

→ [STEP_03_MATERIALS_MODULE.md](STEP_03_MATERIALS_MODULE.md)
