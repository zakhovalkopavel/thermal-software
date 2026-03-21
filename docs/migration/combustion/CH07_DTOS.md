# CH07 — DTOs

## `CombustionInputDto`

```typescript
export class CombustionInputDto {
  @IsNumber() @Min(0)   @Max(2.0)  kExcessAir: number;
  @IsNumber() @Min(0.1)            mPerSecond: number;       // kg/s fuel flow
  @IsNumber() @Min(200) @Max(2000) tAirK: number;            // preheated air temp K
  @IsEnum(FuelType)                fuelType: FuelType;
  @IsNumber() @Min(0)   @Max(0.5)  wH2Om: number;            // moisture fraction
  @IsOptional() @IsNumber()        fuelQ?: number;            // J/kg, override LHV
  @IsOptional() @IsInt()           maxIterations?: number;
}
```

## `CombustionProductsDto`

Exported from this module — imported by `RecuperatorModule`.

```typescript
export class CombustionProductsDto {
  tFlameK: number;
  massFlowKgS: number;
  weightFractions: Partial<Composition>;   // N2, O2, CO2, H2O, CO, H2
  pH2O: number;    // partial pressure fraction
  pCO2: number;
}
```

## `FlameCalcParamsDto`

Internal — mirrors `FlameCalcParams` from `recuperator.js` ~lines 580–590.

## `LayerCombustionResultDto`

Output from `FurnaceCombustionService` per layer:

```typescript
export class LayerCombustionResultDto {
  layerIndex: number;
  tK: number;
  composition: Partial<Composition>;
  heatReleaseW: number;
  burnoutFraction: number;
}
```

