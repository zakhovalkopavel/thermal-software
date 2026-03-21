# CH08 — NestJS Registration

## `CombustionModule`

```typescript
@Module({
  imports: [ThermodynamicsModule],   // Nasa7Service, GasPropertiesService, TransportService, DiffusionService, HeatTransferCorrelationsService, AerodynamicsService
  controllers: [CombustionController],
  providers: [
    CombustionService,
    ChemicalKineticsService,
    EquilibriumService,
    FurnaceCombustionService,
  ],
  exports: [
    CombustionService,    // consumed by RecuperatorModule
  ],
})
export class CombustionModule {}
```

## `AppModule` order

```typescript
imports: [
  CombustionModule,    // must be before RecuperatorModule
  RecuperatorModule,
  // ...other modules
],
```

