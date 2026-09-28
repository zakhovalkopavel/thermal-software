# RECUPERATOR SPEC — 04 Heat Transfer

**Module:** `backend/src/modules/thermal-exchange/`  
**Services:** `MultilayerWallService`, `RecuperatorHtcService`  
**Reference:** legacy `airConvectionAlpha()`, `getRadiationAlpha()`, `getAverageAlpha()`, `calculateSurface()` · recuperator.js

---

## 4.1 Purpose

Compute the **overall heat transfer coefficient** (HTC) `α_overall` [W/(m²·K)] across the recuperator wall at a given cross-section, accounting for:
1. Forced convection (smoke side)
2. Forced convection (air side)
3. Gas radiation (smoke side)
4. Solid radiation (air side, for `CIRCLE_IN_RING` only)
5. Conductive resistance through wall

---

## 4.2 Convective HTC

Delegate to `DimensionlessCalculationService.nusselt(dto)` which implements:

### 4.2.1 Regime selection

| Regime | Condition | Nusselt correlation |
|---|---|---|
| **Natural convection** | `w = 0` OR `Nu_natural/L > Nu_forced/d` | Churchill–Chu (vertical plate): `Nu = (0.825 + 0.387·Ra^(1/6) / [1+(0.492/Pr)^(9/16)]^(8/27))²` |
| **Laminar** | `Re < 2300` | Mills combined: `Nu = 3.66 + (0.065·Re·Pr·d/L) / (1 + 0.4·(Re·Pr·d/L)^(2/3))` |
| **Transition** | `2300 ≤ Re ≤ 10000` | Gnielinski: `Nu = (f/8)·(Re−1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3)−1))` |
| **Turbulent** | `Re > 10000` | Gnielinski (same) |

Darcy friction factor: `f = (0.79·ln(Re) − 1.64)⁻²`

HTC from Nu:
```
α_conv = Nu × λ_air(T_avg) / d_eq      (forced flow)
α_conv = Nu × λ_air(T_avg) / L          (natural convection)
```

### 4.2.2 Turbulence modifier for smoke

When `smokeTurbulence = true`, the effective `Re` for smoke is doubled:
```
Re_effective = 2 × Re_standard
```

---

## 4.3 Gas Radiation HTC (Hottel–Mikheev)

Reuse `RadiationService.gasRadiationHTC(T_gas_K, T_surface_K, eps_s, pH2O, pCO2, L)`.

The underlying implementation (legacy lines 1120–1137):

```
ε_g(T)  = 1 − exp(−k · √(p_sum · L))
k = (0.78 + 1.6·pH2O − 0.1·p_sum^(L/2)) × (1 − 0.37·T/1000)
p_sum = pCO2 + pH2O

ε_gs_CO2 = ε_g(pCO2=pCO2, pH2O=0,    T=T_surface)
ε_gs_H2O = ε_g(pCO2=0,    pH2O=pH2O,  T=T_surface)
ε_gs     = ε_gs_CO2 × (T_g/T_s)^0.65 + ε_gs_H2O × (T_g/T_s)^0.45

E_eff = (ε_surface + 1) / 2

α_rad = 5.67 × E_eff × (ε_g × (T_g/100)⁴ − ε_gs × (T_s/100)⁴) / (T_g − T_s)
```

---

## 4.4 Solid Radiation HTC

Used for outer surface cooling and in furnace multilayer:

```
α_rad_solid = 5.67 × |ε₁·(T₁/100)⁴ − ε₂·(T₂/100)⁴| / |T₁ − T₂|
```

Reuse `RadiationService.solidRadiationHTC(T1_K, T2_K, e1, e2)`.

---

## 4.5 Total Side HTC

```
α_smoke = α_conv_smoke + α_rad_gas_smoke     [W/(m²·K)]
α_air   = α_conv_air   + α_rad_gas_air       [W/(m²·K)]
```

For `CIRCLE_IN_RING` air side (no direct gas radiation to air since it's in the annulus):
- α_air includes only convection + solid-wall radiation

---

## 4.6 Overall (Wall-Through) HTC

### 4.6.1 Flat wall (SQUARE, CIRCLE, TRIANGLE)

```
α_overall = 1 / (1/α_air + L_air/(L_smoke × α_smoke) + h_wall × L_air / (λ_wall × L_log))
```

Where:
- `L_log = (L_air − L_smoke) / ln(L_air/L_smoke)` — logarithmic mean perimeter
- `h_wall` — wall thickness [m]
- `λ_wall` — wall thermal conductivity [W/(m·K)]

`getAverageAlpha()` from legacy (line 1108):
```
α = 1 / (1/α1 + P1/(P2·α2) + h1·P1/(λ1·P_log) + h2·P1/(λ2·P22))
```

### 4.6.2 Cylindrical wall (CIRCLE_IN_RING)

Same formula but with cylindrical perimeters for smoke (inner) and air (outer annulus).

---

## 4.7 Logarithmic Mean

Used throughout the algorithm for averaging temperatures and dimensions:

```
logMean(x1, x2) = (x1 − x2) / ln(x1 / x2)    if x1 ≠ x2
logMean(x1, x2) = x1                            if x1 = x2
```

Applied to:
- Temperature difference averaging: `ΔT_lm = logMean(T_smoke_start − T_air_end, T_smoke_end − T_air_start)`
- HTC averaging: `α_avg = logMean(α_cross1, α_cross2)`
- Heat capacity averaging

---

## 4.8 Outer Surface Cooling (Natural Convection + Radiation)

For `T_outer ≤ 150 °C` (423 K):
```
α_outer = 9.8 + 0.07 × (T_surface − T_room)      [W/(m²·K)]
```

For `T_outer > 150 °C`:
```
α_outer = α_natural_convection(T_room, T_outer, L, d) + α_solid_radiation(T_outer, T_room, ε)
```

---

## 4.9 Thermal Loss Through Outer Insulation

Iterative computation of outer surface temperature `T_surface` given inner hot gas temperature and outer cooling:

```
α_medium = 1 / (2·d_outer·π / (α_inner·L_inner) + d_outer·h_ins / (λ_ins·d_mid) + 1/α_outer)
T_surface_new = α_medium × (T_hot − T_room) / α_outer + T_room
```

Converges in ≤ 20 iterations.

Thermal energy loss:
```
Q_loss = logMean(λ_hot·ΔT_hot, λ_cold·ΔT_cold) × A_surface / h_ins
```
