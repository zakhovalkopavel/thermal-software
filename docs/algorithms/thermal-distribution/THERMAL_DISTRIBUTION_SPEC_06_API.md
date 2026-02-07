# THERMAL DISTRIBUTION SPEC — TypeScript API (EN)

```ts
export type AverageComputationMode = 'analytical' | 'gauss' | 'auto';

export interface AverageOptions {
  mode: AverageComputationMode;
  gaussNodes?: 8 | 16 | 32 | 64;
}

export type Geometry =
  'slab' | 'cylinder' | 'sphere' |
  'prism' | 'ngonal_prism' | 'ring' | 'torus' |
  'cone' | 'frustum' | 'pyramid' | 'frustum_pyramid' |
  'auto';

export interface ShapeInput {
  geometry: Geometry;
  // baselines
  thickness?: number; diameter?: number; radius?: number; Lmin?: number;
  V?: number; S?: number; // for Lc=V/S
  // cones/frustums
  height?: number; baseRadius?: number; topRadius?: number;
  // pyramids
  baseA?: number; baseB?: number; topA?: number; topB?: number;
}

export type RDistMode = 'true_dimension' | 'V_over_S';

export type ProfileMethod =
  'spectral' | 'power_heuristic' | 'power_spectral_anchored' | 'product_solution';

export interface ProductSolutionOptions {
  mode: 'auto' | 'manual';
  directions?: Array<'x'|'y'|'z'|'r'|'theta'>; // cones/frustums → ['r','z']; pyramids → ['x','y','z']
  perpScale?: 'avg' | 'area_weighted'; // default: 'area_weighted' for variable cross-sections
}

export interface ProfileOptions {
  Tc: number; Ts: number; h?: number; k?: number; Bi?: number;
  shape: ShapeInput; rDistMode: RDistMode; method: ProfileMethod;
  productSolution?: ProductSolutionOptions; avg: AverageOptions;
  spectralModes?: 1 | 2 | 3; newtonMaxIter?: number; newtonTol?: number;
  useBlendedLambda1?: boolean; useNewtonForL1?: boolean;
  nOverride?: number; anchorX1?: number; anchorX2?: number;
  anchorLS?: boolean; anchorLSWeight?: 'uniform'|'x'|'x2'; anchorGridN?: number;
}

export function temperatureAtDepth(d: number, opts: ProfileOptions): number;
export function temperatureProfileAtDepths(depths: number[], opts: ProfileOptions): number[];
export function averageTemperature(opts: ProfileOptions): number;
export function computeBi(opts: ProfileOptions): number; // Bi = (h/k)*(V/S)
export function computeCharacteristicLengths(
  shape: ShapeInput, rDistMode: RDistMode
): { Rdist: number; Rbi: number; };
```
