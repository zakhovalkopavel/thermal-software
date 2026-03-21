# CH06 — Material Data Objects

## Interface

```typescript
// data/materials/recuperator-material.interface.ts
export interface RecuperatorMaterialData {
  readonly type: MaterialType;
  readonly lambdaTMin: number;   // K
  readonly lambdaTMax: number;   // K
  readonly lambda: (t: number) => number;       // t in K → W/(m·K)
  readonly emissivityTMin: number;
  readonly emissivityTMax: number;
  readonly emissivity: (t: number) => number;   // t in K → 0–1
}
```

`MaterialService` holds `Map<MaterialType, RecuperatorMaterialData>` and clamps `t` to `[tMin, tMax]`.

> **Future:** Option B encodes these as full `MaterialValue` objects (EquationValue arrays) and moves them to the thermophysical DB. For now, use inline lambda functions (Option A).

---

## Formula table

`tC = t − 273` in all formulas unless noted. `t` = Kelvin.

| Material | λ formula | ε formula |
|---|---|---|
| `chamotte_solid` | `0.7 + 0.00064·tC` | `0.84 − 20·tC·1e-5` |
| `chamotte_1300` | `0.47 + 0.00035·tC` | same as chamotte_solid |
| `chamotte_1000` | `0.35 + 0.00035·tC` | same |
| `chamotte_900` | `0.29 + 0.00023·tC` | same |
| `chamotte_600` | `0.13 + 0.00028·tC` | same |
| `chamotte_400` | `0.1 + 0.00021·tC` | same |
| `mullite_2300` | `1.55 + 0.0002·tC` | `26.186·t^(−0.555)` (K) |
| `quartz_2000` | `0.815 + 0.00067·tC` | `0.9 − 10·tC·1e-5` |
| `quartz_1000` | `0.55 + 0.0003·tC` | same as quartz_2000 |
| `quartz_sand_1` | same as quartz_1000 | same |
| `quartz_sand_05` | same as quartz_1000 | same |
| `quartz_sand_02` | same as quartz_1000 | same |
| `alumina_2500` | `1.9 + 0.0016·tC` | `0.98 − 53·tC·1e-5 + 10.2·tC²·1e-8` |
| `alumina_1300` | `0.84 − 0.00035·tC` | `5.6674·t^(−0.3664)` (K) |
| `alumina_sand_1` | same as alumina_1300 | same as alumina_2500 |
| `alumina_sand_05` | same as alumina_1300 | same as alumina_2500 |
| `alumina_sand_02` | same as alumina_1300 | same as alumina_2500 |
| `silicon_carbide` | `13.73 − 0.004555·tC` | `0.8 + 15.4·tC·1e-5 − 9.01·tC²·1e-8` |
| `basalt_fiber_mat` | `0.139 − 7.97e-5·tC + 1.3e-7·tC² + 2.73e-10·tC³` | `0.92` (constant) |
| `AISI_304` | `9.705 + 0.0176·t − 1.60e-6·t²` (K) | `0.42 + 30·tC·1e-5` |
| `mild_steel` | `6.56e-8·tC³ − 8.34e-5·tC² − 8.06e-4·tC + 49.16` | `0.173 + 68.6·tC·1e-5 − 25.6·tC²·1e-8` |

> Source: `recuperator.js` `getLambda` / `getEmissivity` / `emissivityFunction` (~lines 1840–2000).  
> `emissivityFunction` evaluates `a + 1e-5·b·tC + 1e-8·c·tC² + 1e-10·d·tC³` with t clamped to `[tMin, tMax]`.

---

## Example data file

```typescript
// data/materials/chamotte-solid.data.ts
import { RecuperatorMaterialData } from './recuperator-material.interface';
import { MaterialType } from '../../enums/material-type.enum';

export const ChamotteSolidData: RecuperatorMaterialData = {
  type: MaterialType.chamotte_solid,
  lambdaTMin: 273, lambdaTMax: 1873,
  lambda: (t) => { const tC = t - 273; return 0.7 + 0.00064 * tC; },
  emissivityTMin: 673, emissivityTMax: 1673,
  emissivity: (t) => { const tC = t - 273; return 0.84 + 1e-5 * (-20) * tC; },
};
```

