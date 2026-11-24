# Step 10 — App settings, units and precision

**Commits:** 1
**Install:** none

**Goal:**
- the user chooses the temperature unit, pressure unit and language **once**, in a settings menu, and every page follows;
- result precision follows one global preset per physical quantity, which a page can override where it needs to.

---

## 1. Current state

- **Temperature units differ by page:**
  - thermal distribution takes input in °C (`Tc`, `T0`) and draws its charts in °C;
  - recuperator takes input in K (`tAirStart_K`) and draws its charts in K;
  - metals, refractories, raw materials and glasses each have their own °C/K toggle on the temperature sweep (`TemperatureSweep.unit`);
  - results show K on some pages and °C on others.

  That is about 60 temperature unit literals in about 53 files.
- **Pressure is Pa only:** the HTC input `P_Pa` and the bed pressure drop.
- **Precision is fixed:** `formatValue(value, digits = 4)` shows 4 significant digits everywhere, with ad-hoc overrides (`LOG_DIGITS = 3` in glasses, `digits: 3` for thermal expansion). Whole numbers are never rounded to significant digits, so Re 12345.6 shows as `12346`.
- **Composition wt%/mol% toggles** (`OxideCompositionInput`, `BulkCompositionCard`, `GlassesSection`) are **out of scope** and stay on their pages unchanged.

## 2. Settings

| Setting | Values | Default | Internal (canonical) unit |
|---------|--------|---------|---------------------------|
| `temperatureUnit` | `C`, `K` | `C` | K |
| `pressureUnit` | `Pa`, `kPa`, `bar`, `atm` | `Pa` | Pa |
| `language` | languages with resources | browser language, otherwise `en` | — |

**Files in `src/shared/settings/`:**

| File | Content |
|------|---------|
| `types/app-settings.type.ts` | `{ temperatureUnit, pressureUnit, language }` |
| `constants/app-settings-defaults.constants.ts` | Defaults |
| `constants/app-settings-storage.constants.ts` | `localStorage` key `thermal.settings` and schema version `1` |
| `mappers/read-stored-settings.mapper.ts` | Parses stored JSON; unknown version or invalid values fall back to the defaults per field; a `thermal.language` value from Step 09 is migrated into `language` and the old key is removed |
| `components/AppSettingsProvider.tsx` | Context holding the settings and a `setSetting(key, value)` function; persists on change; `language` calls `i18n.changeLanguage` |
| `hooks/useAppSettings.ts` | Reads the context |
| `src/app/components/SettingsMenu.tsx` | Gear icon in the AppBar that opens a popover with three selects. The Step 09 `LanguageSwitcher` moves into it; the language select is hidden while only one language is available |

There are **no page-level unit toggles**. The global setting is the only control.

## 3. Units

**Files in `src/shared/units/`:**

| File | Content |
|------|---------|
| `types/quantity.type.ts` | `'temperature' \| 'temperatureDelta' \| 'pressure' \| 'compositionPct' \| 'fraction' \| 'logViscosity' \| 'dimensionless' \| ...`. Quantities without a unit choice keep their fixed unit text |
| `constants/temperature-units.constants.ts` | `{ C: { symbol: '°C', fromKelvin, toKelvin }, K: { symbol: 'K', ... } }` |
| `constants/temperature-delta-units.constants.ts` | Same symbols; conversion without the 273.15 offset |
| `constants/pressure-units.constants.ts` | `Pa` ×1, `kPa` ×1e3, `bar` ×1e5, `atm` ×101325, with symbols |
| `hooks/useQuantityUnit.ts` | `useQuantityUnit(quantity)` returns `{ symbol, toDisplay(canonical), fromInput(display) }` for the current setting |

**Rules:**

1. **Forms, requests, API types and chart data keep canonical units** (K, Pa), as the backend does.
   - Validation limits in schemas are in canonical units, so they match the Swagger minimums.
   - Request mappers no longer convert °C to K.
2. **Conversion happens only at display and input:**
   - `FormQuantityField` shows `toDisplay(value)` with `symbol`, and stores `fromInput(typed)`;
   - result cards, table columns and chart axes convert through `useQuantityUnit`.

   Switching the unit only re-renders. Form values and requests don't change.
3. **Every field spec declares its quantity:** `NumberFieldSpec` gains `quantity?: Quantity`, and `unit` is used only when there is no quantity. Temperature differences (`airPreheat_K` and similar offsets) are `temperatureDelta`.
4. **Chart series declare a quantity per axis:** `ChartAxis` gains `quantity`, and the series mapper output stays canonical. `XYLineChart` converts point values and the axis unit text for display. The CSV export from the chart menu also uses display units, with the unit in the column header.
5. **Removed:**
   - `shared/utils/celsius-to-kelvin.ts` and `kelvin-to-celsius.ts`, replaced by the unit constants. Their consumers switch in this commit or, inside sections, during the section migration;
   - `TemperatureSweep.unit` and the °C/K toggle in `TemperatureSweepFields`;
   - `TemperatureField`'s `unit` prop;
   - the °C-only fields in thermal distribution and `MaterialPropertyLookup`;
   - the °C or K literals in chart axes and results.

## 4. Precision

**Three levels, the most specific wins:**

1. **Global preset**, in `src/shared/units/constants/quantity-precision.constants.ts`:

   ```ts
   export const QUANTITY_PRECISION = {
     temperature:      { mode: 'decimals', value: 0 },
     temperatureDelta: { mode: 'decimals', value: 0 },
     compositionPct:   { mode: 'decimals', value: 1, smallValueSignificant: 2 },
     fraction:         { mode: 'decimals', value: 2 },
     logViscosity:     { mode: 'decimals', value: 2 },
     pressure:         { mode: 'significant', value: 3 },
     default:          { mode: 'significant', value: 3 },
   } satisfies Record<Quantity | 'default', PrecisionRule>;
   ```

2. **Page override:** `<section>/constants/<section>-precision.constants.ts` is a `Partial<Record<Quantity, PrecisionRule>>`. `<PrecisionScope overrides={...}>` (in `shared/units/components/`) wraps the section entry component.
3. **Single-value override:** `precision` on a result card item, a table column or a chart series. It replaces `digits`, `LOG_DIGITS` and similar overrides.

**Formatting:**
- `useFormatQuantity()` returns `format(canonicalValue, quantity, override?)`. It resolves the rule (value override, then page override, then global preset), converts to the display unit and formats with `Intl` for the current language. Example: `format(1743.25, 'temperature')` gives `1470 °C`, or `1743 K` with the K setting.
- `formatValue` is rewritten around `PrecisionRule`:
  - `significant` also rounds whole numbers (12345.6 gives `12 300`, with the language's group separator);
  - values ≥ 1e6 or < 1e-3 keep the `1.23·10⁴` notation;
  - trailing zeros are trimmed.
- Rounding is display only. Inputs, requests, chart data and query results keep full precision.

| Value | Today | After (global preset) |
|-------|-------|-----------------------|
| Flame temperature 1743.25 °C | `1743` | `1743 °C` |
| Air temperature 293.15 K | `293.2` | `293 K` or `20 °C` |
| Composition 34.123 % | `34.12` | `34.1` |
| Composition 0.3512 % | `0.3512` | `0.35` |
| Emissivity 0.8523 | `0.8523` | `0.85` |
| λ 1.23456 W/(m·K) | `1.235` | `1.23` |
| Re 12345.6 | `12346` | `12 300` |

## 5. Adoption in this commit

- **Infrastructure:** `shared/settings`, `shared/units`, `SettingsMenu`.
- **Shared UI:** the formatter, `ResultCard`, `ResultTable`, `XYLineChart`, `ScatterChart` and the chart tooltips use `useFormatQuantity` and `useQuantityUnit`.
- **Shared form:** `FormQuantityField` is added, and `FormNumberFieldGrid` uses it for specs with a temperature or pressure quantity.
- **Body geometry,** the Step 08 pilot, adopts quantities.
- **Every other section** adopts settings, quantities and precision in its migration commit (Steps 11 and 12, section checklist item "Units and precision"). Until a section migrates, its existing fixed-unit fields keep working as they are.

## 6. Tests

- **Unit tests:**
  - temperature conversion round-trips;
  - `temperatureDelta` ignores the offset;
  - pressure conversions;
  - `read-stored-settings`: an invalid or old stored value falls back to the default per field;
  - `formatValue` for every rule and each row of the table above;
  - precision resolution order.
- **Component tests:**
  - `SettingsMenu` changes the setting and persists it;
  - `FormQuantityField` with °C shows 20 for 293.15 K, and typing 25 stores 298.15;
  - switching the unit changes the displayed results but not the request sent;
  - `PrecisionScope` overrides the global preset.
- **Contract tests:** unchanged. They prove the request bodies remain in canonical units.

## 7. Acceptance

- `npm run verify` passes.
- With the setting at K, Body geometry and every shared component show K. With °C, they show °C. Requests are identical in both cases.
- Commit: `refactor(frontend): step 10 app settings, units and precision`.
