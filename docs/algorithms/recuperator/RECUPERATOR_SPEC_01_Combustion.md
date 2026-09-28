# RECUPERATOR SPEC — 01 Combustion

**Module:** `backend/src/modules/combustion/`  
**Service:** `CombustionService`  
**Constants file:** `constants/combustion.constants.ts`

---

## 1.1 Purpose

Compute the **adiabatic flame temperature** `T_flame` [K] and **flue gas composition** for solid/liquid fuel combustion with excess air.

---

## 1.2 Fuel Model

The fuel is modelled as **pure carbon** with a calorific value `Q_fuel` [J/kg].  
All carbon-equivalent reactions are scaled from the carbon mass fraction:

```
m_carbon = Q_fuel / Q_carbon × m_fuel_per_sec   [kg/s]
m_ash    = m_fuel_per_sec − m_carbon             [kg/s]
```

Constants (all in `recuperator.constants.ts`):

| Symbol | Value | Description |
|---|---|---|
| `Q_CARBON` | 32 900 000 J/kg | Heat of complete carbon combustion |
| `Q_CO` | 9 208 333 J/kg | Heat of CO combustion |
| `Q_H2` | 21 000 000 J/kg | Heat of hydrogen combustion |
| `FUEL_CAPACITY` | 1 500 J/(kg·K) | Specific heat of unburned fuel |
| `ASH_CAPACITY` | 1 000 J/(kg·K) | Specific heat of ash |
| `ATMOSPHERIC_PRESSURE` | 101 325 Pa | Standard atmosphere |

---

## 1.3 Stoichiometry

### 1.3.1 Air supply

```
m_air = k × (32 / (pO2 × 12)) × m_carbon
```

Where:
- `k` — excess air ratio (dimensionless, typically 1.3)
- `pO2` — volumetric O₂ fraction in air (0.21)

Mass fractions:
```
m_N2 = m_air × (1 − pO2) × 28 / ((1 − pO2)×28 + 32×pO2)
m_O2 = m_air − m_N2
```

### 1.3.2 Combustion products (carbon)

| Condition | CO₂ fraction `kCO2` | CO fraction `kCO` |
|---|---|---|
| k ≥ 1 (excess air) | 1 | 0 |
| 0.5 < k < 1 | 2k − 1 | 2 − 2k |
| k ≤ 0.5 | 0 | 2k |

### 1.3.3 Water-gas shift (CO + H₂O → CO₂ + H₂)

```
m_H2O  = m_air × w_H2Om               (humidity contribution)
k_H2O  = m_H2O × 12 / (18 × m_carbon)
k_H2   = min(k_H2O, kCO)              if k ≤ 1, else 0
```

After shift:
```
kCO2  += k_H2
kCO   -= k_H2
k_H2O_after = k_H2O − k_H2
```

### 1.3.4 Product masses

```
m_CO2      = 44/12 × m_carbon × kCO2
m_CO       = 28/12 × m_carbon × kCO
m_H2       = 2/12  × m_carbon × k_H2
m_H2O_aft  = 12/12 × m_carbon × k_H2O_after
m_O2_aft   = (k − 1) × m_O2    if k > 1, else 0
m_gas_aft  = m_N2 + m_O2_aft + m_CO2 + m_CO + m_H2O_aft + m_H2
```

### 1.3.5 Mass fractions for cp calculation

```
composition = {
  N2:  m_N2  / m_gas_aft,
  O2:  m_O2_aft / m_gas_aft,
  CO2: m_CO2 / m_gas_aft,
  CO:  m_CO  / m_gas_aft,
  H2O: m_H2O_aft / m_gas_aft,
  H2:  m_H2  / m_gas_aft,
}
```

---

## 1.4 Flame Temperature — Iterative Algorithm

**Available heat** (accounting for generator insulation losses):
```
Q = m_carbon × (kCO × Q_CO + kCO2 × Q_CARBON + k_H2 × Q_H2) − Q_generator_loss
```

**Iteration** (up to `maxIterations = 100`, convergence `|ΔT| < 1 K`):

```
T_flame ← T_0        (initial guess = T_air_end)
LOOP:
  cp_avg = GasPropertiesService.cpMixture(composition, T_flame, T_0)
  dT     = Q / (cp_avg × m_gas_aft)
  T_flame_new = T_0 + dT
  IF |T_flame_new − T_flame| < 1 K → BREAK
  T_flame = T_flame_new
```

`GasPropertiesService.cpMixture` returns J/(mol·K); divide by molecular weight to get J/(kg·K).

---

## 1.5 Smoke Start Temperature

```
T_smoke_start = min(T_flame / FLAME_TO_SMOKE_RATIO, T_SMOKE_START_MAX)
```

Constants:
- `FLAME_TO_SMOKE_RATIO` = 1.33 (furnace efficiency ≈ 75 %)
- `T_SMOKE_START_MAX` = 1750 K

---

## 1.6 Outputs (`CombustionResult`)

```typescript
{
  tFlame_K:        number;     // adiabatic flame temperature [K]
  tSmokeStart_K:   number;     // smoke entering recuperator [K]
  mSmoke_kgs:      number;     // smoke mass flow [kg/s]
  mAir_kgs:        number;     // air mass flow [kg/s]
  mFuel_kgs:       number;     // fuel mass flow [kg/s]
  composition: {
    before: MoleFractions;     // air composition (pre-combustion)
    after:  MoleFractions;     // smoke composition (post-combustion)
  };
  pCO2:  number;               // CO₂ partial pressure (vol fraction)
  pH2O:  number;               // H₂O partial pressure (vol fraction)
}
```
