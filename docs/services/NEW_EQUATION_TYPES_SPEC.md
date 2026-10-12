# New Equation Types Spec

**Status:** Planned, not implemented yet.

This spec covers the backend equation types that the compound-data dataset ([COMPOUND_DATA_SPEC.md](../scripts/COMPOUND_DATA_SPEC.md)) already writes, but the backend cannot evaluate yet. The dataset stores them as ready-to-use `EquationValue` objects. This step adds the methods.

Formulas and test values come from [CalebBell/chemicals](https://github.com/CalebBell/chemicals) at commit `e79047588b30cfabc564c79fb26d760c746877d7`. Each type links to the function it was checked against.

Types:
- `dipprN114`
- `trcCp`
- `shomate`
- `zabranskySpline`
- `zabranskyQuasiPolynomial`
- `dipprN101`
- `ppds9`
- `ppds10`
- `ppds12`
- `dipprN106`
- `wagner25`

The VDI gas viscosity, gas thermal conductivity and liquid thermal conductivity polynomials use the existing `quartic` type, so they need nothing here.

---

## Files per type

Each type follows the existing pattern (see `dipprN102`):

- `backend/src/common/thermal/type/<name>-equation.ts`: the vars type, one export per file, also exported from `type/index.ts`. Piecewise types add `<name>-range.ts`, as `nasa9-range.ts` does.
- `backend/src/common/thermal/utils/equation-methods/<name>-equation-method.ts`: a class implementing `Equation<T>` with `calculate`, `integral` and `calculateAverage`, exported from `equation-methods/index.ts`.
- `backend/src/common/thermal/dto/equation-type.dto.ts`: a new `EquationTypeDto` value.
- `backend/src/common/thermal/utils/common.ts`: a new case in `Common.equation`.
- `backend/test/unit/thermal/utils/<name>-equation-method.spec.ts`: the unit test.
- [COMMON_THERMAL_LIBRARY.md](COMMON_THERMAL_LIBRARY.md): a new row in the equation types table.
- `python/src/chemicals_tables/constants/`: the type moves from `planned_equation_types.py` to `equation_type.py`.

The method doc comment states the formula and the refs, as in `dippr-equation-102-method.ts`.

---

## Common rules

### Evaluation contract

- `calculate(x, vars, min, max, k = 1)` clamps x with `Common.validInterval(x, min, max)`, evaluates the formula and multiplies by `k`.
- `integral(x, ...)` returns an antiderivative at the clamped x, times `k`. Only differences of `integral` have a physical meaning.
- `calculateAverage(x1, x2, ...)` returns the integral over [x1, x2] divided by (x2 − x1). When |x2 − x1| < 1e-10 it returns `calculate(x1, ...)`.

### Gas constant

- Methods do not apply R. Types whose source formula gives Y/R (`trcCp`, `zabranskySpline`, `zabranskyQuasiPolynomial`) get `k = R` in the dataset, as the Poling `quartic` entries do.
- Exception: `ppds12`. Its published formula is R·Tc·(...), so the method applies `PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK` itself and the dataset leaves `k` out.

### Ranges that are not set

- The dataset writes `min/max = null` when the source gives no range (VDI gas properties).
- `EquationValue.min/max` stay `number`. The code that reads the dataset into `EquationValue` maps `null` to `-Infinity` / `Infinity`, so `Common.validInterval` does not clamp.
- Numerical integrals start at `origin = min` when `min` is finite, else at 298.15 K.

### Numerical integrals

Types without a closed-form antiderivative use `gaussLegendre20` from `backend/src/common/utils/quadrature`, as `dipprN102` does:
- `integral(x) = gaussLegendre20(calculate, origin, x)`;
- `calculateAverage(x1, x2) = gaussLegendre20(calculate, x1, x2) / (x2 − x1)`.

### Piecewise types

`shomate` and `zabranskySpline` store `vars.ranges = [{Tmin, Tmax, ...coefficients}]`, sorted by `Tmin`, contiguous.
- Range selection is the same as `nasa9`: the first range with T ≤ Tmax, else the last range.
- `integral(x)` is cumulative and continuous: the sum of each full range below x, plus the partial range, starting at `ranges[0].Tmin`. This differs from `nasa9`, whose integral jumps at range boundaries.
- `calculateAverage` splits [x1, x2] at the range boundaries, like `nasa9`.

### Reduced temperature

τ = 1 − T/Tc and Tr = T/Tc.
- `ppds10`, `ppds12`, `dipprN106` and `wagner25` clip τ to 0 when T ≥ Tc, as chemicals does. Then `ppds10` returns ρc, `ppds12` returns 0, `dipprN106` returns 0 and `wagner25` returns Pc.
- `dipprN114` and `zabranskyQuasiPolynomial` diverge at Tc (1/τ and ln(τ) terms). The method throws `RangeError` when τ ≤ 0 after clamping. The dataset builder reports every entry with `max ≥ Tc`.

---

## Types

### `dipprN114`

- **Source:** Perry 2-153 (DIPPR 114), liquid Cp. Chemicals: `EQ114` in `chemicals/dippr.py`.
- **Vars:** `{ Tc, c1, c2, c3, c4 }`
- **Formula:** f(T) = c1²/τ + c2 − 2·c1·c3·τ − c1·c4·τ² − c3²·τ³/3 − c3·c4·τ⁴/2 − c4²·τ⁵/5
- **Integral (closed form):** with dT = −Tc·dτ,
  ∫f(T)·dT = −Tc·[c1²·ln(τ) + c2·τ − c1·c3·τ² − c1·c4·τ³/3 − c3²·τ⁴/12 − c3·c4·τ⁵/10 − c4²·τ⁶/30]
- **Dataset:** J/(kmol K), `k: 1e-3`, ref `Perry8`.
- **Test:** `calculate(20, {Tc: 33.19, c1: 66.653, c2: 6765.9, c3: -123.63, c4: 478.27}, 13.95, 32)` = 19423.948911676463 (hydrogen).

### `trcCp`

- **Source:** TRC ideal-gas Cp. Chemicals: `TRCCp` and `TRCCp_integral` in `chemicals/heat_capacity.py`.
- **Vars:** `{ a0, a1, a2, a3, a4, a5, a6, a7, I, J }`. `I` and `J` are the integration constants for H and S. `J` is stored for a later entropy method and is not used here.
- **Formula:** Cp/R = a0 + (a1/T²)·exp(−a2/T) + a3·y² + (a4 − a5/(T − a7)²)·y⁸
  - y = (T − a7)/(T + a6) when T > a7, else 0.
  - When T = a7, the a5 term is dropped (y = 0).
- **Integral (closed form):** H/R = a0·T + (a1/a2)·exp(−a2/T) + I + h(T)
  - When a2 = 0, the second term is −a1/T.
  - h(T) = 0 when T ≤ a7. Otherwise:
    h = (a6 + a7)·[(2·a3 + 8·a4)·ln(1 − y) + (a3·(1 + 1/(1 − y)) + a4·(7 + 1/(1 − y)))·y + a4·(3·y² + 5·y³/3 + y⁴ + 3·y⁵/5 + y⁶/3) + (a4 − a5/(a6 + a7)²)·y⁷/7]
- **Dataset:** `k: R`, `min/max` = Tmin/Tmax, ref `TRC1994`.
- **Tests** (with `k = R`):
  - `calculate(300, {a0: 4.0, a1: 7.65e5, a2: 720, a3: 3.565, a4: -0.052, a5: -1.55e6, a6: 52, a7: 201, I: 0, J: 0}, 50, 3000, R)` = 42.065271080974654
  - `integral(298.15, same vars with I: 1.2, 50, 3000, R)` = 10802.536262068483

### `shomate`

- **Source:** NIST WebBook Shomate, as stored by chemicals (`webbook_shomate_coefficients.json`). Chemicals: `Shomate` and `Shomate_integral` in `chemicals/heat_capacity.py`.
- **Vars:** `{ ranges: [{ Tmin, Tmax, a, b, c, d, e }] }`
- **Formula:** Cp = a + b·T + c·T² + d·T³ + e/T², with T in K. Chemicals has already converted the WebBook coefficients from t = T/1000 to T in K.
- **Antiderivative per range:** F(T) = a·T + b·T²/2 + c·T³/3 + d·T⁴/4 − e/T. The integral uses the piecewise rule.
- **Dataset:** J/(mol K), no `k`, ref `NISTWebBook`.
- **Water vapour coefficients:** a = 30.09200, b = 6.832514e-3, c = 6.793435e-6, d = −2.534480e-9, e = 0.082139e6.
- **Tests:**
  - `calculate(500, ...)` = 35.21836175.
  - F(500) = 15979.2447. Check this through the private antiderivative helper.
  - For two ranges, `integral` is continuous at the boundary, and `integral(x2) − integral(x1)` across the boundary equals the sum of the two F differences.

### `zabranskySpline`

- **Source:** Zabransky liquid Cp, spline rows grouped per CAS and data type. Chemicals: `Zabransky_cubic` and `Zabransky_cubic_integral` in `chemicals/heat_capacity.py`.
- **Vars:** `{ ranges: [{ Tmin, Tmax, a1, a2, a3, a4 }] }`
- **Formula:** Cp/R = a1 + a2·θ + a3·θ² + a4·θ³, with θ = T/100.
- **Antiderivative per range:** F(T) = 100·θ·(a1 + a2·θ/2 + a3·θ²/3 + a4·θ³/4). The integral uses the piecewise rule.
- **Dataset:** `k: R`, ref `Zabransky1996`.
- **Tests** (vars a1 = 20.9634, a2 = −10.1344, a3 = 2.8253, a4 = −0.256738, `k = R`):
  - `calculate(298.15, ...)` = 75.31465144297.
  - For one range with Tmin = 0 and Tmax = 1000, `integral(298.15)` = 31051.690370364, since F(0) = 0.

### `zabranskyQuasiPolynomial`

- **Source:** Zabransky liquid Cp, quasi-polynomial rows. Chemicals: `Zabransky_quasi_polynomial` and `Zabransky_quasi_polynomial_integral` in `chemicals/heat_capacity.py`.
- **Vars:** `{ Tc, a1, a2, a3, a4, a5, a6 }`
- **Formula:** Cp/R = a1·ln(1 − Tr) + a2/(1 − Tr) + a3 + a4·Tr + a5·Tr² + a6·Tr³
- **Integral (closed form):** for T < Tc,
  F(T) = T·(a3 − a1) + a4·T²/(2·Tc) + a5·T³/(3·Tc²) + a6·T⁴/(4·Tc³) + a1·T·ln(1 − T/Tc) − Tc·(a1 + a2)·ln(Tc − T)
- **Dataset:** `k: R`, ref `Zabransky1996`.
- **Behaviour at Tc:** chemicals caps Tr at 1 − 1e-15. Here the method throws `RangeError` instead (see Reduced temperature).
- **Tests** (vars Tc = 591.79, a1 = −3.12743, a2 = 0.0857315, a3 = 13.7282, a4 = 1.28971, a5 = 6.42297, a6 = 4.10989, `k = R`):
  - `calculate(330, ...)` = 165.472878778683.
  - `integral(300) − integral(200)` = 14662.031376528757.

### `dipprN101`

- **Source:** Perry 2-313, liquid viscosity. Chemicals: `EQ101` in `chemicals/dippr.py`.
- **Vars:** `{ c1, c2, c3, c4, c5 }`
- **Formula:** f(T) = exp(c1 + c2/T + c3·ln(T) + c4·T^c5)
- **Integral:** numerical. Chemicals notes that no closed form exists.
- **Dataset:** Pa·s, ref `Perry8`.
- **Test:** `calculate(300, {c1: 73.649, c2: -7258.2, c3: -7.3037, c4: 4.1653e-6, c5: 2}, 273.16, 647.1)` = 3537.44834545549. This is the water vapour pressure example from chemicals, so it checks the formula, not the units.

### `ppds9`

- **Source:** VDI Heat Atlas PPDS 9, liquid viscosity. Chemicals: `PPDS9` in `chemicals/viscosity.py`.
- **Vars:** `{ a, b, c, d, e }`
- **Formula:** μ = e·exp(a·s^(1/3) + b·s^(4/3)), with s = (c − T)/(T − d).
  - Use `Math.cbrt(s)`, which gives the real cube root when s < 0 (T > c), as chemicals does.
  - s^(4/3) = s·cbrt(s).
- **Integral:** numerical.
- **Singularity:** the formula is singular at T = d. The dataset builder reports entries with `min ≤ d`.
- **Dataset:** Pa·s, ref `VDI2010`.
- **Test:** `calculate(400, {a: 1.74793, b: 1.33728, c: 482.347, d: 41.78, e: 9.963e-5}, 200, 480)` = 0.00035091137378230684.

### `ppds10`

- **Source:** VDI Heat Atlas PPDS 10, saturated liquid density. Chemicals: `volume_VDI_PPDS` in `chemicals/volume.py`.
- **Vars:** `{ Tc, rhoc, a, b, c, d }`
- **Formula:** ρ = ρc + a·τ^0.35 + b·τ^(2/3) + c·τ + d·τ^(4/3)
- **Integral (closed form):** ∫ρ·dT = ρc·T − Tc·[a·τ^1.35/1.35 + 3·b·τ^(5/3)/5 + c·τ²/2 + 3·d·τ^(7/3)/7]
- **Dataset:** kg/m3, ref `VDI2010`.
- **Test:** `calculate(300, {Tc: 126.19, rhoc: 313, a: 470.922, b: 493.251, c: -560.469, d: 389.611}, -Infinity, Infinity)` = 313.0. Here T > Tc, so τ is clipped to 0. Add a second check below Tc against the formula.

### `ppds12`

- **Source:** VDI Heat Atlas PPDS 12, enthalpy of vaporization. Chemicals: `PPDS12` in `chemicals/phase_change.py`.
- **Vars:** `{ Tc, a, b, c, d, e }`
- **Formula:** ΔHvap = R·Tc·(a·τ^(1/3) + b·τ^(2/3) + c·τ + d·τ² + e·τ⁶). The method applies R.
- **Integral (closed form):** ∫ΔHvap·dT = −R·Tc²·[3·a·τ^(4/3)/4 + 3·b·τ^(5/3)/5 + c·τ²/2 + d·τ³/3 + e·τ⁷/7]
- **Dataset:** J/mol, no `k`, ref `VDI2010`.
- **Test:** `calculate(300, {Tc: 591.75, a: 4.60584, b: 13.97224, c: -10.592315, d: 2.120205, e: 4.277128}, 178, 591.75)` = 37948.76862035925.

### `dipprN106`

- **Source:** VDI Heat Atlas surface tension, DIPPR 106 form. Chemicals: `EQ106` in `chemicals/dippr.py`.
- **Vars:** `{ Tc, c1, c2, c3, c4, c5 }`
- **Formula:** σ = c1·τ^(c2 + c3·Tr + c4·Tr² + c5·Tr³)
- **Integral:** numerical. Chemicals notes that no closed form was found.
- **Dataset:** N/m, ref `VDI2010`. Absent `c3..c5` are written as 0.
- **Test:** `calculate(300, {Tc: 647.096, c1: 0.17766, c2: 2.567, c3: -3.3377, c4: 1.9699, c5: 0}, 273.16, 647.096)` = 0.07231499373541 (water).

### `wagner25`

- **Source:** VDI Heat Atlas vapour pressure, Wagner 2.5/5 form, also known as PPDS 16. Chemicals: `Wagner` in `chemicals/vapor_pressure.py`.
- **Vars:** `{ Tc, Pc, a, b, c, d }`
- **Formula:** ln(P) = ln(Pc) + (a·τ + b·τ^1.5 + c·τ^2.5 + d·τ⁵)/Tr
- **Integral:** numerical.
- **Dataset:** Pa, ref `VDI2010`.
- **Test:** `calculate(100, {Tc: 190.551, Pc: 4599200, a: -6.02242, b: 1.26652, c: -0.5707, d: -1.366}, 90.7, 190.551)` = 34415.004762637 (methane).

---

## Test checklist per type

Model each spec on `dippr-equation-102-method.spec.ts`:
- `calculate` matches the chemicals value above, to 10 significant digits (`toBeCloseTo` with enough digits for the magnitude).
- `k` scales `calculate`, `integral` and `calculateAverage`.
- Clamping: below `min` equals `calculate(min)`, above `max` equals `calculate(max)`.
- `integral` is consistent with `calculate`: the central finite difference of `integral` at a mid-range point is close to `calculate`.
- `calculateAverage(x1, x2)` equals (integral(x2) − integral(x1))/(x2 − x1). At x1 = x2 it equals `calculate`.
- Infinite range: `min = -Infinity`, `max = Infinity` evaluate without clamping, and numerical integrals start at 298.15 K.
- Piecewise types: range selection at a boundary, a continuous `integral` across the boundary, and an average across the boundary.
- Reduced-temperature types: the τ ≤ 0 behaviour described above, either clipping or `RangeError`.

---

## Dataset integration

- The compound-data builder already writes these types with the vars names above (see [COMPOUND_DATA_SPEC.md](../scripts/COMPOUND_DATA_SPEC.md#planned-equation-types)). Changing a name here means changing the builder too.
- The refs `TRC1994`, `Zabransky1996` and `VDI2010` are added to `RefKey` by the compound-data step. `Perry8` and `NISTWebBook` already exist.
- Once a type is implemented, a dataset entry is valid when `Common.equation(type).calculate(...)` reproduces the chemicals value at one temperature inside its range. The builder's report lists one check temperature per entry for this purpose.
- Loading the compound-data JSON into `CompoundValue` objects is a separate, later step. Its input format is described by the interfaces in [utils/compound-data/](../../backend/src/common/thermal/utils/compound-data/index.ts). That step maps `null` ranges to ±Infinity and takes `EquationValue.ref` from `ref[0]` (the dataset writes `ref` as the source row tuple `[RefKey, line, fileKey]`).

---

## References

- CalebBell/chemicals, commit `e79047588b30cfabc564c79fb26d760c746877d7`: https://github.com/CalebBell/chemicals/tree/e79047588b30cfabc564c79fb26d760c746877d7
- Perry's Chemical Engineers' Handbook, 8th ed., Tables 2-153 and 2-313 (`Perry8`).
- Thermodynamics of Organic Compounds in the Gas State, Vol. II, TRC/CRC, 1994 (`TRC1994`). Chemicals cites Kabo and Roganov; confirm the authors against the book.
- Zabransky, M., Ruzicka, V., Majer, V., and Domalski, E. S., Heat Capacity of Liquids: Critical Review and Recommended Values, AIP, 1996 (`Zabransky1996`).
- VDI Heat Atlas, 2nd ed., Springer, 2010 (`VDI2010`).
- NIST Chemistry WebBook, Shomate coefficients (`NISTWebBook`).
- DIPPR Project 801, equation forms 101, 106 and 114.
