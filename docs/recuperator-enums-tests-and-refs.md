# Recuperator Enums, Registration, Tests, and References

**Parent index:** [RECUPERATOR_SPEC.md](./RECUPERATOR_SPEC.md)

---

## 8. `HoleForm` and `FurnaceForm` Enums

```typescript
// enums/hole-form.enum.ts
export enum HoleForm {
  CIRCLE_IN_RING = 'circle_in_ring',
  CIRCLE         = 'circle',
  SQUARE         = 'square',
  TRIANGLE       = 'triangle',
}

// enums/furnace-form.enum.ts
export enum FurnaceForm {
  SPHERE   = 'sphere',
  CYLINDER = 'cylinder',
  CUBE     = 'cube',
}
```

---

## 9. Module Registration

```typescript
// recuperator.module.ts
@Module({
  imports: [ThermodynamicsModule, RefractoryModule],
  controllers: [RecuperatorController],
  providers: [
    RecuperatorService,
    FurnaceMultilayerService,
    CombustionService,
    RecuperatorMaterialService,
    RecuperatorGeometryService,
  ],
  exports: [RecuperatorService, FurnaceMultilayerService, CombustionService],
})
export class RecuperatorModule {}
```

Register `RecuperatorModule` in `AppModule`.

---

## 10. Default Values

The following defaults mirror the legacy HTML form defaults and should be applied
when optional fields are absent:

| Field | Default |
|---|---|
| `holeForm` | `circle_in_ring` |
| `d0_mm` | 60 |
| `h0_mm` | 15 |
| `nAir` | 5 |
| `nSmoke` | 4 |
| `nPasses` | 1 |
| `smokeTurbulence` | false |
| `tAirStart_C` | 20 |
| `kExcessAir` | 1.3 |
| `wH2O_massFraction` | 0.0 |
| `fPower_kW` | 5 |
| `wantedRecuperatorLength_m` | 0.6 |
| `maxIterations` | 500 |
| `furnaceW_m_s` | 19 |
| `form` (furnace) | `cylinder` |
| `tAmbient_C` | 20 |

---

## 11. Helper Functions to Implement Locally

These small helpers exist in the legacy JS and are simple enough to implement as
private methods or utility functions within the service files:

| Legacy function | Target | Notes |
|---|---|---|
| `getLogarithmicAverage(x1,x2)` | shared util | `(x1−x2)/ln(x1/x2)`, returns `x` when `x1===x2` |
| `surfaceFunction(form,a,b,c,h)` | `RecuperatorGeometryService` | sphere/cylinder/cube surface area |
| `getRayLength(form,a,b,c)` | `RecuperatorGeometryService` | Mean beam length 3.6V/S |
| `getFormDimensions(form,a,b,c,h)` | `RecuperatorGeometryService` | `{lSurface, dSurface}` for natural convection |
| `getEquivalentDiameter(S)` | `RecuperatorGeometryService` | `sqrt(4S/π)` |
| `celsiusFromKelvin(T)` | — | Standard — use `T − 273.15` |
| `kelvinFromCelsius(T)` | — | Standard — use `T + 273.15` |

---

## 12. Test Specification

Tests should be placed under `backend/test/unit/modules/recuperator/`.

### Required test cases

| Test file | Scenarios |
|---|---|
| `recuperator-material.service.spec.ts` | λ at reference temperatures for each material; ε at reference temperatures; boundary clamping (T < T_min, T > T_max) |
| `combustion.service.spec.ts` | Flame temperature for λ=1.0 air at 20°C, 5 kW (cross-check legacy HTML default); λ=1.3; λ=0.8 (sub-stoichiometric) |
| `recuperator-geometry.service.spec.ts` | Area and perimeter for each `holeForm`; `circle_in_ring` nPasses=2 |
| `recuperator.service.spec.ts` | Full calculate() with legacy default inputs → smoke/air outlet temperatures, recuperator length within ±5% of legacy JS output |
| `furnace-multilayer.service.spec.ts` | Single-layer chamotte cylinder; multi-layer with 3 materials; outer temperature below 150°C uses simplified alpha |

---

## 13. References

- Legacy source: `legacy/scripts/recuperator.js` (2 450 lines)
- Legacy HTML: `legacy/recuperator.html`
- Hottel–Mikheev gas emissivity correlation: Михеев М.А., Михеева И.М. — Основы теплопередачи, 2-е изд., Энергия, 1977.
- Air Nusselt correlations: Gnielinski, Dittus-Boelter, natural convection per Churchill-Chu (ISO 9300 range).
- Existing backend Nusselt implementation: `DimensionlessNumbersService.nusselt()` covers all required correlations.
- `RadiationService.gasRadiationHTC()` directly implements the Hottel–Mikheev correlation already used in legacy JS lines 1120–1145.
