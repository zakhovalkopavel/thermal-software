# RECUPERATOR SPEC — 06 Furnace Algorithm

**Module:** `backend/src/modules/thermal-exchange/`  
**Service:** `MultilayerWallService` (standalone — also used by recuperator outer insulation)  
**Reference:** legacy `heatFluxFurnaceMultyLayer()`, `heatFluxFurnace()` · lines 2037–2127, 2194–2320 of `recuperator.js`

---

## 6.1 Purpose

Compute heat transfer through a **multilayer cylindrical/spherical/cubic furnace wall** from hot combustion gases to the ambient environment.

Outputs:
- Inner surface temperature `T_inner` [K]
- Outer surface temperature `T_outer` [K]
- Temperature at each layer boundary [K]
- Heat flux density at inner and outer surfaces [W/m²]
- Total energy loss through the wall [W]

---

## 6.2 Wall Geometry (`WallGeometry` enum)

Defined in `thermal-exchange/enums/wall-geometry.enum.ts`. Used for both furnace walls and recuperator outer insulation.

| Key | Description |
|---|---|
| `FLAT` | Flat/planar wall |
| `CYLINDER` | Cylindrical furnace (horizontal axis) |
| `SPHERE` | Spherical furnace |

---

## 6.3 Wall Layers

The wall consists of `N` concentric/planar layers (inside to outside):

```typescript
// Defined in thermal-exchange/dto/layer.dto.ts
interface LayerDto {
  material: WallMaterialKey;   // RefractoryThermalMaterial | MetalMaterial
  thicknessMm: number;
}
```

Total wall thickness `H = Σ h_i`.

---

## 6.4 Geometry Functions

For each form, two functions are required:

### 6.4.1 `surfaceFunction(form, a, b, c, x)` → surface area [m²]

Surface area at radial depth `x` from the inner surface:

| Form | S(x) |
|---|---|
| `CYLINDER` | `2π(a/2 + x)·L` where L is furnace length |
| `SPHERE` | `4π(a/2 + x)²` |
| `CUBE` | `6·(a + 2x)²` |

### 6.4.2 `getFormDimensions(form, a, b, c, x)` → `{dSurface, lSurface}`

Used for natural convection and radiation at the outer surface.

---

## 6.5 Algorithm: Binary Search on Inner Surface Temperature

### 6.5.1 Overview

The algorithm finds `T_inner` such that:
```
Q_inner (from gas to inner surface) = Q_outer (from outer surface to ambient)
```

### 6.5.2 Binary search bounds

```
T_inner_min = T_ambient
T_inner_max = T_flame
T_inner     = logMean(T_inner_min, T_inner_max)
```

### 6.5.3 Iteration loop (up to 50 steps)

**Step A — Inner heat flux from gas to wall:**

```
α_inner = fullGasAlpha(T_flame, T_inner, ε_inner, pH2O, pCO2, d_surface, L_ray, w_smoke)
Q_inner = α_inner.total × (T_flame − T_inner) × S_inner
```

Where `fullGasAlpha = α_convection + α_radiation_gas`.

**Step B — Temperature traverse through layers (finite difference):**

Divide total thickness H into `N_steps = 50` sub-steps.  
Walk outward from `T_inner`:

```
FOR each sub-step (x_prev → x_curr):
  λ = MultilayerWallService.getLambda(layer_material_at_x, T_current)  // dispatches to RefractoryThermalService or MetalThermalService
  S_avg = (S(x_curr) + S(x_prev)) / 2
  ΔT = Q_inner × Δx / (S_avg × λ)
  T_current -= ΔT
  IF T_current < T_ambient: break early
```

Record temperature at each layer boundary `T_between[i]`.

After traversal: `T_outer = T_current`.

**Step C — Outer heat flux from outer surface to ambient:**

```
α_outer = getFullNaturalConvectionAlpha(T_room, T_outer, L_surf, d_surf, ε_outer)
Q_outer = α_outer × (T_outer − T_room) × S_outer
```

Where `getFullNaturalConvectionAlpha` applies:
- If `T_outer ≤ 423 K`: `α = 9.8 + 0.07 × (T_outer − T_room)`
- Else: `α = α_natural_conv + α_solid_radiation`

**Step D — Convergence check:**

```
error = 2 × |Q_inner − Q_outer| / (Q_inner + Q_outer)
IF error ≤ 0.001: CONVERGED
```

**Binary search update:**
- If `T_current < T_ambient` (wall too cold): raise `T_inner_min`
- If `Q_inner > Q_outer`: raise `T_inner_min`
- If `Q_inner < Q_outer`: lower `T_inner_max`

---

## 6.6 Gas HTC Inside Furnace (`fullGasAlpha`)

```
α_total = α_convection + α_radiation_gas
```

**Convection:** Delegate to `DimensionlessCalculationService.nusselt()` using smoke velocity `w`, diameter `d_surface`.

**Gas radiation:** Delegate to `RadiationService.gasRadiationHTC(T_flame, T_inner, ε, pH2O, pCO2, L_ray)`.

---

## 6.7 Multi-Layer Variant: Iterative Gas End Temperature

In the full multilayer furnace (`heatFluxFurnaceMultyLayer`), the flame does not maintain constant temperature — the gas cools as it transfers heat to the wall.

The algorithm iterates to find `T_gas_end` such that:
```
Q_flux = α_inner × (T_gas_avg − T_inner) × S_inner
T_gas_avg = logMean(T_flame, T_gas_end)
ΔT_gas = Q_flux / (cp_smoke × m_smoke)
T_gas_end = T_flame − ΔT_gas
```

Converges when `|T_gas_end_new − T_gas_end_old| < 0.5 K` (up to 50 recursions).

---

## 6.8 Outputs (`FurnaceResult`)

```typescript
{
  tInner_K:              number;   // inner wall surface temperature [K]
  tOuter_K:              number;   // outer surface temperature [K]
  tGasEnd_K:             number;   // gas temperature after furnace [K]
  tGasAverage_K:         number;   // log-mean gas temperature [K]
  betweenLayers: Array<{
    name:      string;             // "Layer_0_to_1", etc.
    tCelsius:  number;
  }>;
  fluxInner_W:           number;   // heat entering from flame side [W]
  fluxOuter_W:           number;   // heat leaving outer surface [W]
  fluxInnerDensity_Wm2:  number;   // flux per unit inner area [W/m²]
  sInner_m2:             number;   // inner surface area [m²]
  sOuter_m2:             number;   // outer surface area [m²]
  alphaInner: AlphaResult;         // { total, convection, radiation }
  alphaOuter_Wm2K:       number;   // outer surface HTC [W/(m²·K)]
}
```
