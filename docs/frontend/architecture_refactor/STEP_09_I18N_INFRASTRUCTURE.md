# Step 09 — i18n infrastructure

**Commits:** 1
**Install (user):**

```bash
docker exec thermal-frontend sh -c 'cd /app && npm i i18next react-i18next && npm i -D eslint-plugin-i18next'
```

**Goal:** all UI text comes from locale files with type-checked keys. Four languages are registered; only **English** text is written in this refactor.

---

## 1. Languages

```ts
export const LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'uk', nativeName: 'Українська' },
] as const;
```

- `en` is the source language and `fallbackLng`.
- Resources are discovered from `src/locales/<code>/<namespace>.json` with `import.meta.glob(..., { eager: true })`. Adding `locales/fr/` is all it takes to enable French.
- The switcher shows only languages that have resources. During the refactor that is only English, so the switcher is hidden. It appears automatically when a second language is added.
- The selected language is stored in `localStorage` (`thermal.language`). Without a stored value, the first `navigator.languages` entry that has resources is used, otherwise English. Step 10 moves the language into the app settings (`thermal.settings`) and migrates this key.
- `document.documentElement.lang` follows the current language.

## 2. Files

| File | Content |
|------|---------|
| `src/shared/i18n/languages.constants.ts` | `LANGUAGES` |
| `src/shared/i18n/language-storage.constants.ts` | Storage key |
| `src/shared/i18n/i18n-resources.ts` | Glob-loaded resources, grouped by language and namespace |
| `src/shared/i18n/available-languages.ts` | `LANGUAGES` filtered by loaded resources |
| `src/shared/i18n/i18n.ts` | `i18next.use(initReactI18next).init({ resources, lng, fallbackLng: 'en', ns: NAMESPACES, defaultNS: 'common', interpolation: { escapeValue: false }, returnNull: false })`; in development `saveMissing` logs a warning |
| `src/shared/i18n/namespaces.constants.ts` | `['common', 'home', 'materials', 'processes']` |
| `src/shared/i18n/i18next.d.ts` | `CustomTypeOptions` with `resources` typed from the English JSON imports; `defaultNS: 'common'` |
| `src/shared/i18n/translation-key.type.ts` | Typed key union used by constants (`labelKey`, `titleKey`) |
| `src/shared/hooks/useNumberFormat.ts` | `Intl.NumberFormat` for the current language, used by the calc formatters and the chart formatters |
| `src/shared/ui/charts/config/apply-highcharts-lang.ts` | `Highcharts.setOptions({ lang })` from the `common:charts.*` keys and the language's separators; called on `languageChanged` |
| `src/app/components/LanguageSwitcher.tsx` | Select in the AppBar, rendered only when more than one language is available; moves into the settings menu in Step 10 |
| `src/locales/en/common.json` | Buttons, generic errors, validation messages, chart menu, units of time, layout and navigation |
| `src/locales/en/home.json`, `materials.json`, `processes.json` | Empty objects, filled per section in Steps 11 and 12 |
| `src/main.tsx` | Imports `@/shared/i18n/i18n` before rendering |

## 3. What is translated in this commit

- `app/` (navigation, layout), `pages/` (Home, NotFound, HealthWidget).
- `shared/ui/*` (CalculateButton, ResultPanel, JsonErrorAlert, ComingSoon, RouteErrorBoundary, ChartCard menus, table headers of shared components).
- `shared/form/*`: wrappers translate `{ key, values }` validation messages through `t()`, replacing the English fallback from Step 08.
- Module hubs and layouts (titles and section cards).
- `NumberFieldSpec.label` becomes `labelKey`, `helper` becomes `helperKey`, `ResultCardItem.label` becomes `labelKey`, and table columns gain `labelKey`. Sections still pass English text through a temporary `label` fallback, which is removed section by section in Steps 11 and 12 and deleted in Step 13.

**Key naming:** `<namespace>:<area>.<group>.<item>`, for example `common:actions.calculate`, `common:validation.min`, `processes:htc.fields.fluidTemperature`, `materials:glasses.tabs.viscosity`.

**Not translated:**
- units (`K`, `°C`, `W/(m·K)`, `Pa·s`);
- chemical formulas;
- backend enum values sent to the API;
- backend error messages (shown as returned).

## 4. Lint

`i18next/no-literal-string` is added in `markup-only` mode as a `lint:refactor` warning. It ignores attributes such as `data-testid`, `variant` and `color`, and strings made only of units, formulas, digits and punctuation.

## 5. Tests

- Unit tests:
  - the locale parity test (`src/locales/locales.test.ts`, [TESTING.md §4.2](TESTING.md#42-unit-tests-srctestts)) is in place; with only English it checks that no value is empty;
  - every `labelKey` in constants exists.
- Component tests:
  - `LanguageSwitcher` is hidden with one language and shown with a mocked second language;
  - a validation error renders English text.
- Smoke tests:
  - they run with i18n initialised;
  - no route logs a missing-key warning (the warning makes the test fail).

## 6. Acceptance

- `npm run verify` passes.
- The `lint:refactor` warning count for literal strings covers only modules' sections, which are migrated in Steps 11 and 12.
- Commit: `refactor(frontend): step 09 i18n infrastructure, English resources for app, pages and shared`.
