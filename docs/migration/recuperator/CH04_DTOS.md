# CH04 — DTOs

## `RecuperatorInputDto`

```typescript
export class RecuperatorInputDto {
  @IsNumber() @Min(100) @Max(1750) tSmokeStartC: number;
  @IsNumber() @Min(100) @Max(1000) tSmokeEndC: number;
  @IsNumber() @Min(0)   @Max(50)   tAirStartC: number;
  @IsNumber() @Min(100) @Max(1000) tAirEndC: number;
  @IsInt()    @Min(1)   @Max(10)   nPasses: number;
  @IsBoolean()                      smokeTurbulence: boolean;
  @IsInt()    @Min(1)   @Max(20)   nAir: number;
  @IsInt()    @Min(1)   @Max(20)   nSmoke: number;
  @IsNumber() @Min(5)   @Max(200)  d0mm: number;
  @IsNumber() @Min(1)   @Max(100)  h0mm: number;
  @IsNumber() @Min(0.1) @Max(500)  fPowerKW: number;
  @IsNumber() @Min(1.0) @Max(2.0)  kExcessAir: number;
  @IsNumber() @Min(0.1) @Max(10)   wantedRecuperatorLength: number;
  @IsEnum(HoleForm)                 holeForm: HoleForm;
  @IsNumber() @Min(0)   @Max(0.5)  wH2Om: number;
  @IsInt()    @Min(10)  @Max(500)  maxIterations: number;
  @IsEnum(FurnaceForm)              furnaceForm: FurnaceForm;
  @IsNumber() @Min(0)              furnaceInternalSize_a_CM: number;
  @IsNumber() @Min(0)              furnaceInternalSize_b_CM: number;
  @IsNumber() @Min(0)              furnaceInternalSize_c_CM: number;
  @IsNumber() @Min(0)              generatorSurfaceDm2: number;
  @IsNumber() @Min(0)              generatorHeatFluxDm2: number;
  @IsNumber() @Min(0)              airPreheat: number;
  @ValidateNested({ each: true }) @Type(() => FurnaceLayerDto)
  layers: FurnaceLayerDto[];
  // Combustion products passed in from CombustionModule result (or computed inline for standalone use)
  @IsOptional() @ValidateNested() @Type(() => CombustionProductsDto)
  combustionProducts?: CombustionProductsDto;
}
```

## `FurnaceLayerDto`

```typescript
export class FurnaceLayerDto {
  @IsEnum(MaterialType) material: MaterialType;
  @IsNumber() @Min(0) @Max(500) h: number;  // mm
}
```

## `RecuperatorResultDto`

```typescript
export class RecuperatorResultDto {
  tSmokeStartC: number;   tSmokeEndC: number;   tAirEndC: number;
  tFlameRealC: number;    maxFlameTc: number;
  recuperatorLength: number;        // m
  energyReturnedPercents: number;
  sAirCm2: number;        sSmokeCm2: number;
  dAirEquivalentCm: number;         dSmokeEquivalentCm: number;
  wAirStart: number;      wAirEnd: number;
  wSmokeStart: number;    wSmokeEnd: number;
  airEnergyIncrease: number;        smokeEnergyDecrease: number;
  smokeTotalEnergy: number;         mPerHour: number;
  tFurnaceInnerC: number;           tFurnaceOuterC: number;
  sInnerDm2: number;      sOuterDm2: number;
  furnaceTotalHeatLoss: number;
  furnaceHeatFluxInnerDensity: number;
  alphaInnerTotal: number;          alphaInnerRadiation: number;
  alphaInnerConvection: number;     alphaOuter: number;
  totalLayersThicknessMM: number;
  tGasEndC: number;       tGasAverageC: number;
  betweenLayers: Array<{ name: string; tCelsius: number }>;
}
```

## `CombustionProductsDto` (from CombustionModule)

```typescript
// Imported from backend/src/modules/combustion/dto/combustion-products.dto.ts
export class CombustionProductsDto {
  tFlameK: number;
  massFlowKgS: number;
  weightFractions: Partial<Composition>;   // N2, O2, CO2, H2O, CO, H2
  pH2O: number;   // partial pressure fractions
  pCO2: number;
}
```

