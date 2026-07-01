# RECUPERATOR SPEC — 05 Recuperator Algorithm

**Module:** `backend/src/modules/recuperator/`  
**Service:** `RecuperatorService` (optimizer only)  
**Reference:** legacy `calculate()`, `calculateCriteria()` · lines 1282–1435, 1501–1548 of `recuperator.js`

---

## 5.1 Purpose

Find the **optimal operating point** `(T_smoke_end, T_air_end)` of a **counter-flow heat exchanger** such that:
- Energy balance between smoke cooling and air heating is satisfied
- Required (target) recuperator length is achieved
- Thermal losses through the outer wall are accounted for

---

## 5.2 Counter-Flow Principle

```
Smoke IN  ──►──────────────────────────────►── Smoke OUT
           T_smoke_start                        T_smoke_end

Air   OUT ◄──────────────────────────────────── Air  IN
           T_air_end                             T_air_start
```

The LMTD (log-mean temperature difference) for a pure counter-flow HX:

```
ΔT_lm = logMean(T_smoke_start − T_air_end,   T_smoke_end − T_air_start)
```

---

## 5.3 Energy Flows

```
Q_smoke  = m_smoke × cp_smoke_avg × (T_smoke_start − T_smoke_end)   [W]
Q_air    = m_air   × cp_air_avg   × (T_air_end − T_air_start)       [W]
Q_loss   = thermal loss through outer insulation                      [W]
```

Energy balance criterion:
```
criterion = |Q_smoke − Q_air − Q_loss| + |Q_smoke − Q_air − Q_loss_at_current_T|
```

Both terms must tend to zero simultaneously.

---

## 5.4 Required Length Calculation

Given `α_avg` and `ΔT_lm`, the required heat exchanger length:

```
L_recuperator = Q_air / (α_avg × ΔT_lm × L_air_perimeter)   [m]
```

Where `L_air_perimeter` is the total wetted perimeter of air channels [m].

---

## 5.5 Optimiser: 8-Neighbour Grid Search

### 5.5.1 Initial state

```
T_smoke_end ← T_smoke_start / FLAME_TO_SMOKE_RATIO × SMOKE_RATIO_INIT
T_air_end   ← T_air_start   × AIR_END_INIT
```

(Typical initial values: `T_smoke_end ≈ 473 K`, `T_air_end ≈ 1073 K`)

### 5.5.2 Step size schedule

At iteration `i`:
```
divider = 2 + (i/5)²
dSmoke  = (T_smoke_start − T_smoke_end) / divider
dAir    = (T_air_end    − T_air_start)  / divider
```

Step shrinks automatically as the search progresses.

### 5.5.3 Neighbourhood

8 candidate points around current `(T_smoke_end, T_air_end)`:

```
candidates = [
  (T_se,        T_ae − dAir),   // 01
  (T_se,        T_ae + dAir),   // 02
  (T_se − dSmoke, T_ae),        // 10
  (T_se − dSmoke, T_ae − dAir), // 11
  (T_se − dSmoke, T_ae + dAir), // 12
  (T_se + dSmoke, T_ae),        // 20
  (T_se + dSmoke, T_ae − dAir), // 21
  (T_se + dSmoke, T_ae + dAir), // 22
]
```

### 5.5.4 Evaluation

For each candidate `(T_se, T_ae)`:
1. Validate bounds: `T_air_start < T_se < T_smoke_start` and `T_air_start < T_ae < T_smoke_start`
2. Recalculate flame temperature and smoke start temperature (depends on `T_air_end` for preheated air)
3. Compute `α_smoke`, `α_air` at two cross-sections (start and end of HX)
4. Compute `α_overall` at both cross-sections, then log-mean
5. Compute `ΔT_lm`
6. Compute energy flows and criterion score

### 5.5.5 Update rule

Sort all 9 candidates (current + 8 neighbours) by criterion score ascending.  
Move to the candidate with lowest score.

### 5.5.6 Convergence

Stop when:
- `criterion < CRITERIA_THRESHOLD` (e.g. 0.01), OR
- `dSmoke < dT_min AND dAir < dT_min` (e.g. `dT_min = 0.1 K`), OR
- `maxIterations` reached (e.g. 200)

---

## 5.6 HTC at Each Cross-Section (non-CIRCLE_IN_RING)

Two evaluation points used: `(T_smoke_start, T_air_end)` and `(T_smoke_end, T_air_start)`.

At each cross-section, a **representative wall surface temperature** is computed as:
```
T_wall_surface = logMean(T_hot_side, T_cold_side)
```

Then:
```
α_air_at_cross   = α_conv_air(T_air, T_wall) + α_rad_gas(T_air, T_wall, ε, pH2O_before, pCO2_before, L_ray)
α_smoke_at_cross = α_conv_smoke(T_smoke, T_wall) + α_rad_gas(T_smoke, T_wall, ε, pH2O_after, pCO2_after, L_ray)
α_overall_cross  = getAverageAlpha(α_air, α_smoke, L_air, L_smoke, h_wall, λ_wall)
```

---

## 5.7 HTC for CIRCLE_IN_RING

For this geometry, `calculateSurface()` is called at both cross-sections.
It performs the full cylindrical-coordinate HTC calculation including:
- Inner smoke-side: convection + gas radiation
- Annular air-side: forced convection
- Wall conduction through the refractory ring
- Optional outer insulation layer

---

## 5.8 Final Results

```typescript
{
  recuperatorLength_m:     number;   // required HX length [m]
  tAirEnd_K:               number;   // optimised air preheat temperature [K]
  tSmokeEnd_K:             number;   // optimised smoke exit temperature [K]
  tFlame_K:                number;   // adiabatic flame temperature [K]
  tSmokeStart_K:           number;   // smoke entering recuperator [K]
  energyReturnedPercent:   number;   // Q_air / Q_smoke_total × 100
  airEnergyIncrease_W:     number;   // heat transferred to air [W]
  smokeEnergyDecrease_W:   number;   // heat lost by smoke [W]
  alpha: {
    average:               number;   // log-mean overall HTC [W/(m²·K)]
    air:    { start, end, convective: {start, end}, radiation: {start, end} };
    smoke:  { start, end, convective: {start, end}, radiation: {start, end} };
  };
  velocities: {
    airStart_ms, airEnd_ms, smokeStart_ms, smokeEnd_ms;
  };
  areas_m2: {
    air, smoke;
  };
}
```
