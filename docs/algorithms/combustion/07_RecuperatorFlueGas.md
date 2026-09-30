# 07 — Flue Gas for the Recuperator (`CombustionService.flueGas()`)

**Consumer:** `RecuperatorService` (`POST /recuperator/calculate`) · **Input:** `CombustionModeInputDto` ([06 §6.8](06_API.md))
**Output:** `FlueGas` (`interfaces/combustion-streams.interface.ts`) · no own endpoint

The recuperator does not have its own fuel model. The request selects one of the four combustion
modes and passes that mode's input; the recuperator takes the flue gas of the last reacting step.

## 7.1 Mode selection

```typescript
class CombustionModeInputDto {
  mode: 'solid-direct' | 'solid-two-step' | 'fluid' | 'bed';
  solidDirect?:  SolidDirectInputDto;     // mode 1 (06 §6.4)
  solidTwoStep?: SolidTwoStepInputDto;    // mode 2 (06 §6.5)
  fluid?:        FluidFuelInputDto;       // mode 3 (06 §6.6)
  bed?:          BedCombustionInputDto;   // mode 4 (06 §6.7)
}
```

Exactly the input of the selected mode must be present; a missing one or any other mode input → 400.
The nested input is validated with the mode's own DTO rules.

| `mode` | Runs | Flame temperature | Air `mAir_kgs` | Flue gas step |
|---|---|---|---|---|
| `solid-direct` | [02](02_Mode1_SolidDirect.md) | `tFlame_K` | `mAir_kgs` | `combustion` |
| `solid-two-step` | [03](03_Mode2_TwoStep.md) | `tFlame_K` (burnout) | `mAirPrimary + mAirSecondary` | `burnout` |
| `fluid` | [04](04_Mode3_Fluid.md) | `tFlame_K` | `mAir_kgs` | `combustion` |
| `bed` | [05](05_Mode4_Bed.md) | `tFlame_K` (burnout) | `mAirPrimary + mAirSecondary` | `burnout` |

All combustion air (primary and secondary, incl. humidity) is assumed to pass the recuperator.
Steam injected into the bed is not air and is not counted.

## 7.2 `FlueGas`

| Field | Definition |
|---|---|
| `mode` | selected mode |
| `tFlame_K` | flame temperature of the mode (table §7.1) |
| `mFuel_kgs`, `fPower_W` | fuel flow and LHV-based power of the mode result (bed: fuel burned in the bed) |
| `mAir_kgs` | combustion air incl. humidity (table §7.1) |
| `mFlueGas_kgs` | gaseous products of the flue gas step (`mGas_kgs`; unburnt char and ash excluded) |
| `moleFractions` | flue gas mole fractions of that step (N2, O2, CO2, CO, H2O, H2, SO2; Ar and other inerts when fed) |
| `pO2` | O2 volume fraction of the dry air (mode input, default 0.21) |

## 7.3 Air preheat offset

`flueGas(input, airPreheat_K)` adds `airPreheat_K` to every combustion air temperature of the
mode input and re-runs the mode:

| Mode | Shifted fields |
|---|---|
| `solid-direct`, `fluid` | `tAir_K` |
| `solid-two-step` | `tAirPrimary_K`; `tAirSecondary_K` if given (otherwise it follows the primary air) |
| `bed` | `tAirPrimary_K` (default 400 K = `BED_KINETICS.AIR_T_DEFAULT_K`); `tAirSecondary_K` if given |

The fuel temperature is not shifted.

## 7.4 Use in the recuperator

`RecuperatorService.calculate()`:

1. `flue = flueGas(dto.combustion)`.
2. Smoke inlet temperature (recuperator constants):
   ```
   T_smoke_start = min(T_flame / FLAME_TO_SMOKE_RATIO, T_SMOKE_START_MAX)
   FLAME_TO_SMOKE_RATIO = 1.33   (furnace efficiency ≈ 75 %)
   T_SMOKE_START_MAX    = 1750 K
   ```
3. `mSmoke = flue.mFlueGas_kgs`, `mAir = flue.mAir_kgs`, `mFuel_kgh = flue.mFuel_kgs · 3600`.
4. Smoke composition for heat transfer and radiation: the six species N2, O2, CO2, CO, H2O, H2 of
   `flue.moleFractions`, renormalised to 1 (SO2 and Ar are dropped). Air side: dry air
   N2 = 1 − pO2, O2 = pO2.
5. `tAirStart_K` (recuperator input) is the air temperature at the recuperator inlet; it is
   independent of the air temperature in the mode input, which is the air temperature at the burner.
6. `maxFlameTemp_K` = `flueGas(dto.combustion, airPreheat_K).tFlame_K` (equal to `tFlame_K` when
   `airPreheat_K` = 0).

## 7.5 Removed legacy contract

Until September 2026 the recuperator called `POST /combustion/calculate`
(`CombustionService.calculate()`): fuel given only by power and LHV (`fPower_W`, `fuelQ_Jkg`), burned
as a pure-carbon equivalent (`carbonQ` = 32.9 MJ/kg) with λ, `tAirStart_K`, `pO2`, `wH2Om`. The
endpoint, `CombustionInputDto` / `CombustionResultDto`, the carbon-equivalent fuel and the constants
`Q_CARBON_J_KG`, `Q_CO_J_KG`, `Q_H2_J_KG` are removed. The smoke start constants moved to
`RECUPERATOR`. An LHV-only fuel can still be described in mode 1 with a custom fuel
(`fuel.elementalComp` + `lhv_J_kg`).
