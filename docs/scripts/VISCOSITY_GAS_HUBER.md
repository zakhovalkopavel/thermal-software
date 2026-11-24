# Huber 2019 gas viscosity join

Companion to [COMPOUND_DATA_SPEC.md](./COMPOUND_DATA_SPEC.md). Gas viscosity equation order is
ranked by MAPE against the Huber 2019 dilute-gas table
(`shared/sources/viscosity-gases-huber-2019.json`; report
`tmp/reports/python/compound-data/viscosity-equation-precision.json`):

1. `Perry8` (`dipprN102`)
2. `Yaws1999` (`quadratic`)
3. `VDI2010` (`quartic`)
4. `White3` (`sutherland`, then `powerLaw`)

Constants: `VISCOSITY_GAS_SOURCE_PRIORITY` / `VISCOSITY_GAS_TYPE_PRIORITY` in
`compound_data.constants.viscosity_gas_priority`. For the 35 CAS that have Huber
points, `shared/sources/viscosity-gas-defaults.json` sets
`equations.viscosity.gas.def` to the single equation with the lowest MAPE for that
compound (even when it is not first in the list). Compounds without a Huber row
keep the list-head default.

**Huber 2019 viscosity of gases** (`shared/sources/viscosity-gases-huber-2019.json`,
ref `Huber2019`): CRC Handbook dilute-gas μ(T) at 100–600 K in Pa·s (generally
100 kPa; `p0` marks the zero-density limit). Built from the OCR’d processed table
`shared/processed/viscosity-gases/crc-huber-2019/`. Stored as **`raw`** under
`viscosity` / `gas` — there is no tabulated equation type yet — with
`values.points` as `{T, mu}` pairs **without null cells**, plus `p0`,
`moreAccurate`, `pressure_Pa`, and the paper’s numbered `sourceRefs`. The parser
also attaches precision vs that table from
`shared/sources/viscosity-gas-defaults.json`: `bestEquation` `{ref, type}`,
`mape_pct`, `max_abs_pct`, and `nCompared` (in-range points used for the score).
Percent scores are stored to **2 decimal places**; μ points keep the table’s
1-decimal μPa·s resolution (as Pa·s). File key `huber2019Viscosity`. Air has no
compound-data record and is omitted. CLI: `--viscosity-gases-file` /
`--no-viscosity-gases`.

Builder packages also include:

- `parsers/viscosity_gases.py` `parse_viscosity_gases`,
  `constants/viscosity_gases_source.py` (`VISCOSITY_GASES_FILE`, `VISCOSITY_GASES_TABLES`);
- `constants/viscosity_gas_priority.py` `VISCOSITY_GAS_SOURCE_PRIORITY`,
  `viscosity_gas_defaults` (`shared/sources/viscosity-gas-defaults.json`).

CLI `build_compound_data.py` accepts `--viscosity-gases-file` (default
`shared/sources/viscosity-gases-huber-2019.json`) and `--no-viscosity-gases`.
