# CH03 — Service Decomposition

> `CombustionService` is **not part of this module**. It belongs to `backend/src/modules/combustion/`.  
> This module receives pre-computed flame temperature and combustion products from `CombustionModule`.

---

## 3.1 `AirPropertiesService`

**Source:** `recuperator.js` ~830–1010; `legacy/scripts/src/compound/gas/air.ts`

```typescript
thermalConductivity(t: number): number          // via FluidConditionCompound(Air)
heatCapacityIsobaric(t: number): number         // via FluidConditionCompound(Air)
dynamicViscosity(t: number): number             // empirical: 1.717*(t/273)^0.693*1e-5
density(t: number, p?: number): number          // p·Mr/(R·t)
kinematicViscosity(t: number): number
prandtlNumber(t: number): number
reynoldsNumber(t: number, w: number, l: number): number
grashofNumber(tHot: number, tCold: number, d: number): number
nusseltNumber(params: NusseltParams): NusseltResult
convectionAlpha(...): number
naturalConvectionAlpha(...): number
```

**Nusselt flow regime (from `airNusseltNumber`, lines ~950–1010):**
- `Re < 2300` → Mills laminar: `3.66 + (0.065·Re·Pr·d/l) / (1 + 0.4·(Re·Pr·d/l)^(2/3))`
- `2300–10000` → Gnielinski transient
- `Re > 10000` → Gnielinski turbulent `(f/8)·(Re−1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3)−1))`
- `w === 0` → natural convection

---

## 3.2 `GasCompositionService`

**Source:** `recuperator.js` ~400–575, superseded by `legacy/scripts/src/compound/gas/`

```typescript
heatCapacity(gas: keyof GasCompounds, t: number, t0?: number): number
systemCapacity(weightPartial: Partial<Composition>, t: number, t0?: number): number
```

- `heatCapacity` constructs `FluidConditionCompound(gasCompound, t, p)` and calls `.heatCapacity(t, t0)`.
- Uses quartic (ref.6) as default for all gases except CO (AlyLee ref.4).
- Does **not** use `recuperator.js` inline cubic table.

---

## 3.3 `RadiationService`

**Source:** `recuperator.js` ~1100–1150

```typescript
gasRadiationEmissivity(pH2O: number, pCO2: number, l: number, t: number): number
getRadiationAlpha(Tg: number, Ts: number, Es: number, pH2O: number, pCO2: number, l: number): number
fullRadiationAlpha(t1: number, t2: number, emissivity1?: number, emissivity2?: number): number
```

Hottel correlation:
```
pSum = pCO2 + pH2O
k = (0.78 + 1.6·pH2O − 0.1·pSum^(l/2)) · (1 − 0.37·t/1000)
E = 1 − exp(−k · (pSum·l)^0.5)
```

---

## 3.4 `GeometryService`

**Source:** `recuperator.js` ~680–760, ~1800–1840

```typescript
getPerimeter(a, holeForm, type, nAir, nSmoke, h?): number
getArea(a, holeForm, type, nAir, nSmoke, h?, airDepth?, nPasses?): number
getEquivalentDiameter(area): number
surfaceFunction(form, a, b?, c?, h?): number
getFormDimensions(form, a, b?, c?, h?): { lSurface, dSurface }
getRayLength(form, a, b?, c?): number
```

Enums: `HoleForm` (circle | square | triangle | circle_in_ring), `FurnaceForm` (sphere | cylinder | cube).

---

## 3.5 `ThermalInsulationService`

**Source:** `recuperator.js` ~1010–1100

```typescript
getLambda(t: number): number                                         // basalt fiber LYTX-312
getAverageLambda(t1: number, t2: number): number
getAlphaForNaturalLowTempCooling(tRoom, tSurface): number           // 9.8 + 0.07*(tSurf−tRoom), t<150°C
getMaxSurfaceTemperature(params: SurfaceTempParams): number          // iterative, max 20 iter
getMaxThermalLoss(tCold, tHot, tRoom, alpha, h, area): number
```

---

## 3.6 `HeatTransferService`

**Source:** `recuperator.js` ~1100–1120, ~1640–1800

```typescript
logarithmicAverage(x1, x2): number
getTemperatureExpansion(tStart, tEnd): number
getAverageAlpha(a1, a2, perimeter1, perimeter2, h1, lambda1, h2?, lambda2?, ...): number
calculateSurface(params: SurfaceCalcParams): SurfaceResult
fullGasAlpha(Tg, Ts, Es, pH2O, pCO2, l, d, w?, isTurbulence?): AlphaComponents
```

`SurfaceResult`:
```typescript
{
  alpha: { side1, side2, side3, side23, average };
  t1, t2, tSurface1, tSurface2, tSurface3, tSurface4: number;
  flux: number;
}
```

`calculateSurface` handles: two-side heat transfer, optional insulation, `infinityIsSurface3` coaxial mode, iterative surface temp (max 20 iter).

---

## 3.7 `MaterialService`

**Source:** `recuperator.js` ~1840–2000

```typescript
getLambda(material: MaterialType, t: number): number
getEmissivity(material: MaterialType, t: number): number
```

Holds `Map<MaterialType, RecuperatorMaterialData>`, clamps `t` to `[tMin, tMax]`. Data objects in `data/materials/`.

---

## 3.8 `FurnaceService`

**Source:** `recuperator.js` ~2000–2350

```typescript
heatFluxFurnace(params: FurnaceHeatFluxParams): FurnaceHeatFluxResult
heatFluxFurnaceMultiLayer(params: FurnaceMultiLayerParams): FurnaceMultiLayerResult
```

**Bug fix:** `step` parameter renamed to `maxIterations`; derive `stepSize = h / maxIterations` internally.

`FurnaceMultiLayerResult`:
```typescript
{
  tInner, tOuter, sInner, sOuter: number;
  betweenInsulation: Array<{ name: string; t: number; tCelsius: number }>;
  fluxOuter, fluxInner: number;
  alphaInner: AlphaComponents;
  alphaOuter: number;
  tGasEnd, tGasAverage: number;
}
```

`furnaceFluxInnerRecursion` is a private helper (not exported).

---

## 3.9 `RecuperatorOptimizerService`

**Source:** `recuperator.js` ~1260–1580

```typescript
calculate(input: RecuperatorInputDto): RecuperatorResultDto
```

**Algorithm:**
1. Init from DTO (replaces DOM `setParams()` / `autosetParams()`).
2. 8-neighbor iterative grid search on `[tSmokeEnd, tAirEnd]`.
3. `calculateCriteria` evaluates alpha + energy balance → scalar error.
4. Stop when `criteria < threshold` or `dT < dTmin`.

Depends on: `AirPropertiesService`, `GasCompositionService`, `RadiationService`, `HeatTransferService`, `ThermalInsulationService`, `GeometryService`.  
Receives combustion products composition from `CombustionModule` via injected service (inter-module import).

