# NASA Thermodynamic Database Parser — Specification

## Purpose

Produce two standalone JSON files from the raw NASA thermodynamic text databases:

| Output file | Source file(s)                                           | Format |
|---|----------------------------------------------------------|---|
| `shared/processed/nasa7.json` | `shared/sources/NASA/nasa7-origin.dat`                   | NASA SP-273 (1971) — 7-coefficient |
| `shared/processed/nasa9.json` | `shared/sources/NASA/nasa9-origin.dat` + `nasa9-new.dat` | NASA RP-1311 (1996) — 9-coefficient |

The JSON files are:
- Directly usable for thermodynamic calculations
- Shaped to match the TypeScript types `Nasa7Equation` and `Nasa9Equation` in
  `backend/src/common/thermal/type/`
- Suitable for creating new `CompoundValue` entities in the gas compound files

---

## Topic index

| Doc | Contents |
|-----|----------|
| [nasa-thermo-layout-and-cli.md](./nasa-thermo-layout-and-cli.md) | Implementation layout, running, input format |
| [nasa-thermo-schema-and-rules.md](./nasa-thermo-schema-and-rules.md) | JSON schema and parsing rules |
| [nasa-thermo-validation-tests-and-mapping.md](./nasa-thermo-validation-tests-and-mapping.md) | Validation, output, tests, CLI, TS mapping, references |

