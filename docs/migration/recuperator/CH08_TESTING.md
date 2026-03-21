# CH08 — Testing
```
expect(result.tAirEndC).toBeLessThan(result.tSmokeStartC);
expect(result.energyReturnedPercents).toBeLessThan(100);
expect(result.energyReturnedPercents).toBeGreaterThan(0);
expect(result.recuperatorLength).toBeGreaterThan(0);
expect(result.recuperatorLength).toBeFinite();
// Assert:
}
  airPreheat: 0,
  furnaceInternalSize_c_CM: 0, generatorSurfaceDm2: 0, generatorHeatFluxDm2: 0,
  furnaceInternalSize_a_CM: 20, furnaceInternalSize_b_CM: 0,
  furnaceForm: FurnaceForm.sphere, layers: [],
  wH2Om: 0, maxIterations: 100, smokeTurbulence: false, nPasses: 1,
  kExcessAir: 1.3, wantedRecuperatorLength: 1, holeForm: HoleForm.circle,
  nAir: 5, nSmoke: 4, d0mm: 30, h0mm: 20, fPowerKW: 12,
  tSmokeStartC: 1200, tSmokeEndC: 200, tAirStartC: 20, tAirEndC: 800,
input: {
```typescript

Reference: default parameters from `legacy/recuperator.html`.

## Integration test — optimizer

| `furnace.service.spec.ts` | Single-layer wall flux; multi-layer convergence |
| `heat-transfer.service.spec.ts` | `logarithmicAverage` edge cases (x1=x2, zero); `getAverageAlpha` |
| `material.service.spec.ts` | λ and ε at boundary temps for each of the 21 materials |
| `geometry.service.spec.ts` | Circle perimeter, square area, `circle_in_ring` area |
| `radiation.service.spec.ts` | Gas emissivity pure CO2, pure H2O; `fullRadiationAlpha` at equal temps → 0 |
| `gas-composition.service.spec.ts` | N2 capacity at 300K and 1800K; mixture capacity for combustion products |
| `air-properties.service.spec.ts` | λ at 273K, 1273K; Nusselt laminar/turbulent; compare `testData` table from `recuperator.js` lines ~305–340 |
|---|---|
| File | Key cases |

## Unit tests

Test root: `backend/test/unit/recuperator/`


