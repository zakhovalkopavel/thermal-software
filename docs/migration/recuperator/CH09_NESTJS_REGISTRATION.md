# CH09 — NestJS Registration

## `RecuperatorModule`

```typescript
@Module({
  imports: [
    ThermodynamicsModule,   // GasPropertiesService, HeatTransferCorrelationsService
    CombustionModule,       // CombustionService → CombustionProductsDto
  ],
  controllers: [RecuperatorController],
  providers: [
    AirPropertiesService,
    GasCompositionService,
    RadiationService,
    GeometryService,
    ThermalInsulationService,
    HeatTransferService,
    MaterialService,
    FurnaceService,
    RecuperatorOptimizerService,
  ],
  exports: [
    AirPropertiesService,
    GasCompositionService,
    MaterialService,
  ],
})
export class RecuperatorModule {}
```

> `GasCompositionService` stays in this module — it wraps `common/thermal` compound objects
> using the recuperator-specific polynomial Cp framework. It is distinct from `GasPropertiesService`
> in `ThermodynamicsModule` which provides the full mixture facade (μ, λ, D, ρ, Pr).

## `AppModule` update

```typescript
imports: [
  ThermodynamicsModule,   // first — no cross-module dependencies
  CombustionModule,       // imports ThermodynamicsModule
  RecuperatorModule,      // imports ThermodynamicsModule + CombustionModule
  ThermophysicalModule,   // independent
],
```
