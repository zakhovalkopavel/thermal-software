# CH06 — NestJS Registration

## `ThermodynamicsModule`

```typescript
@Module({
  imports: [],
  controllers: [ThermodynamicsController],
  providers: [
    GasPropertiesService,          // Cp, H, S, G, cpCompare — all via common/thermal framework
    TransportService,              // Sutherland μ, Wilke mixing, Eucken λ
    DiffusionService,              // Chapman-Enskog D_ij
    DimensionlessNumbersService,   // Re, Pr, Nu, Gr, Ra — all geometries — API-exposed
    AerodynamicsService,           // Ergun pressure drop
  ],
  exports: [
    GasPropertiesService,
    TransportService,
    DiffusionService,
    DimensionlessNumbersService,
    AerodynamicsService,
  ],
})
export class ThermodynamicsModule {}
```

All services are exported — `CombustionModule` and `RecuperatorModule` both import this module.

## `AppModule` order

```typescript
imports: [
  ThermodynamicsModule,    // first — no dependencies
  CombustionModule,        // imports ThermodynamicsModule
  RecuperatorModule,       // imports ThermodynamicsModule + CombustionModule
  ThermophysicalModule,    // independent
],
```

