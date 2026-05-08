# CH07 — DimensionlessNumbersService

**Sources:**
- [`legacy/scripts/recuperator.js`](../../../legacy/scripts/recuperator.js) — Nu: Mills/Gnielinski (pipe); Churchill-Chu (natural); Ranz-Marshall/diffusion (sphere); surface/ray-length for sphere, cylinder, cube
- [`legacy/furnaceCombustion/modules/HeatTransfer.js`](../../../legacy/furnaceCombustion/modules/HeatTransfer.js) — Nu: Gunn correlation (packed bed)
- [`legacy/scripts/src/thermalExchange/fluidDynamics.ts`](../../../legacy/scripts/src/thermalExchange/fluidDynamics.ts) — Re, Gr, Ra (single geometry)
- [`legacy/scripts/src/dto/form.dto.ts`](../../../legacy/scripts/src/dto/form.dto.ts) — FormDto: cylinder, sphere, cube, rectangularPrism, prism

**Target:** `backend/src/modules/thermodynamics/services/dimensionless-numbers.service.ts`
**Controller:** `POST /thermodynamics/dimensionless`, `POST /thermodynamics/body-geometry`

**Geometry enums & body formulas:** [CH08_GEOMETRY.md](CH08_GEOMETRY.md)
— `FlowGeometry`, `BodyGeometry`, `GeometryDims`, `KnownFluid`, hydraulic diameter table, surface/volume/beam-length formulas

**Appendix A — Internal flow:** [CH07_APPENDIX_A_INTERNAL_FLOW.md](CH07_APPENDIX_A_INTERNAL_FLOW.md)
— Pipe/duct/helical/corrugated: Mills, Sieder-Tate, Gnielinski, Dittus-Boelter, Mikheev, Petukhov, Whitaker, Churchill friction factor

**Appendix B — Plates & vertical surfaces:** [CH07_APPENDIX_B_PLATES.md](CH07_APPENDIX_B_PLATES.md)
— Flat plate, vertical plate/cylinder, horizontal plate, inclined plate: Churchill-Ozoe, Churchill-Chu, McAdams, Whitaker

**Appendix C — Cylinders:** [CH07_APPENDIX_C_CYLINDERS.md](CH07_APPENDIX_C_CYLINDERS.md)
— Cylinder crossflow, horizontal cylinder, concentric cylinders: Churchill-Bernstein, Hilpert, Churchill-Chu horizontal, Whitaker, Raithby-Hollands

**Appendix D — Spheres:** [CH07_APPENDIX_D_SPHERES.md](CH07_APPENDIX_D_SPHERES.md)
— Sphere forced/natural, concentric spheres: Ranz-Marshall, diffusion, Whitaker, Churchill sphere, Raithby-Hollands

**Appendix E — Special geometries:** [CH07_APPENDIX_E_SPECIAL.md](CH07_APPENDIX_E_SPECIAL.md)
— Tube banks, cavities, mixed convection, packed bed, phase change, rotating, impinging jets

---

## Two input modes

The service supports **two fully independent input modes** for Nu calculation.

### Mode A — Raw numbers
Caller pre-computes all fluid properties and passes plain numbers.  
Does **not** call `GasPropertiesService`. Fully stateless.

### Mode B — Fluid + conditions
Caller names a known fluid and provides temperature/pressure/flow conditions.  
Service resolves properties via `GasPropertiesService` / `FluidPropertiesService` internally,  
then proceeds identically to Mode A.

The same `NusseltParams` DTO covers both modes — Mode B fields are optional additions.  
If `fluid` is present, Mode B is used; otherwise Mode A is assumed and raw properties are required.

---

## Geometry enums and body formulas

> `FlowGeometry`, `BodyGeometry`, `GeometryDims`, `KnownFluid`, hydraulic diameter table,
> surface area / volume / mean beam length formulas:
> → **[CH08_GEOMETRY.md](CH08_GEOMETRY.md)**

---

## Service interface

```typescript
@Injectable()
export class DimensionlessNumbersService {

  // ── Dimensionless numbers — Mode A (raw) ──────────────────────────────
  reynolds(rho: number, w: number, L: number, mu: number): number
  reynoldsKinematic(w: number, L: number, nu: number): number
  prandtl(mu: number, Cp_J_kgK: number, lambda: number): number
  grashof(T_hot_K: number, T_cold_K: number, L: number, nu: number): number
  rayleigh(T_hot_K: number, T_cold_K: number, L: number, nu: number, Pr: number): number

  // ── Main Nu calculator — accepts both modes ────────────────────────────
  nusselt(params: NusseltParams): NusseltResult

  hFromNusselt(Nu: number, lambda: number, L: number): number

  // ── Flow channel geometry ──────────────────────────────────────────────
  hydraulicDiameter(area: number, perimeter: number): number
  channelArea(geometry: FlowGeometry, dims: GeometryDims): number
  channelPerimeter(geometry: FlowGeometry, dims: GeometryDims): number
  characteristicLength(geometry: FlowGeometry, dims: GeometryDims): number

  // ── Body geometry ──────────────────────────────────────────────────────
  bodyArea(geometry: BodyGeometry, dims: GeometryDims, insulationH?: number): number
  bodyVolume(geometry: BodyGeometry, dims: GeometryDims): number
  meanBeamLength(geometry: BodyGeometry, dims: GeometryDims): number
}
```

---

## `NusseltParams`, `NusseltResult`, `CorrelationName`

### `CorrelationName` — complete catalog

Full formula, validity bounds, and paper citations for each name are in the appendixes.

```typescript
export type CorrelationName =
  // ── Pipe / internal flow  →  Appendix A ────────────────────────────────
  | 'mills'                     | 'sieder_tate_laminar'
  | 'fully_developed_uniform_T' | 'fully_developed_uniform_q'
  | 'transitional'              | 'gnielinski'           | 'gnielinski_v2'
  | 'dittus_boelter'            | 'sieder_tate_turbulent'
  | 'mikheev'                   | 'petukhov'             | 'whitaker_pipe'
  | 'seban_mclaughlin'          | 'webb_eckert_goldstein'| 'isachenko_roughness'

  // ── Plates & vertical surfaces  →  Appendix B ──────────────────────────
  | 'flat_plate_laminar'        | 'flat_plate_turbulent' | 'flat_plate_mixed'
  | 'churchill_ozoe'            | 'whitaker_flat_plate'
  | 'churchill_chu'             | 'churchill_chu_laminar'| 'churchill_chu_all_ra'
  | 'mcadams_hot_up'            | 'mcadams_hot_down'
  | 'churchill_inclined'

  // ── Cylinders  →  Appendix C ───────────────────────────────────────────
  | 'churchill_bernstein'       | 'hilpert'              | 'whitaker_cylinder'
  | 'morgan'                    | 'churchill_chu_horizontal'
  | 'raithby_hollands_cylinders'

  // ── Spheres  →  Appendix D ─────────────────────────────────────────────
  | 'sphere_ranz_marshall'      | 'sphere_diffusion'     | 'whitaker_sphere'
  | 'churchill_sphere_natural'
  | 'raithby_hollands_spheres'

  // ── Special geometries  →  Appendix E ──────────────────────────────────
  | 'zukauskas'                 | 'whitaker_tube_bank'
  | 'hollands'                  | 'globe_dropkin'        | 'macgregor_emery'
  | 'mixed_power_sum'
  | 'gunn'                      | 'wakao_funazkri'       | 'whitaker_packed_bed'
  | 'nusselt_condensation'      | 'chen_condensation'
  | 'dorfman_disk'              | 'bjorklund_kays'
  | 'martin_jet_single'         | 'martin_jet_array'
```

---

## `NusseltParams`

```typescript
export interface NusseltParams {
  geometry: FlowGeometry;

  // ── Mode A: raw fluid properties (all required if fluid is absent) ─────
  rho_kg_m3?: number;       // density
  mu_Pa_s?: number;         // dynamic viscosity at film temperature
  mu_s_Pa_s?: number;       // dynamic viscosity at wall/surface temperature (for μ/μ_s correction)
  Cp_J_kgK?: number;        // specific heat
  lambda_W_mK?: number;     // thermal conductivity
  w_m_s?: number;           // flow velocity (0 = natural convection)

  // ── Mode B: fluid by name + conditions ────────────────────────────────
  fluid?: KnownFluid;
  composition?: Record<string, number>;  // mole fractions, required when fluid='gas_mix'
  T_fluid_K?: number;       // bulk fluid temperature
  T_surface_K?: number;     // surface / wall temperature
  P_Pa?: number;            // pressure (default 101325)

  // ── Geometry ──────────────────────────────────────────────────────────
  dims?: GeometryDims;

  // ── Pre-computed dimensionless numbers (override auto-compute) ─────────
  Re?: number;
  Pr?: number;
  Gr?: number;
  Ra?: number;

  // ── Control ───────────────────────────────────────────────────────────
  forceRegime?: 'laminar' | 'turbulent' | 'transitional';
  preferredCorrelation?: CorrelationName;  // validated against geometry/regime/range; see selector logic
  compareAll?: boolean;                    // populate allCorrelations in result
  isDiffusion?: boolean;                   // sphere: false→Ranz-Marshall [Leg 841], true→diffusion [Leg 839]
  isHeating?: boolean;                     // Dittus-Boelter n exponent: true→0.4, false→0.3
}
```

---

### `NusseltResult`

```typescript
export interface NusseltResult {
  Nu: number;
  h_W_m2K?: number;                          // only if lambda and L are determinable
  correlation: CorrelationName;
  regime: 'laminar' | 'turbulent' | 'transitional' | 'natural' | 'mixed';
  isNatural: boolean;

  // ── Preferred correlation feedback ────────────────────────────────────
  preferredRequested?: CorrelationName;      // echoes preferredCorrelation if given
  preferredUsed: boolean;                    // true if preferred was valid and used
  preferredRejectedReason?: string;          // why preferred was not used (if applicable)

  // ── Range validation ──────────────────────────────────────────────────
  warning?: string;                          // out-of-range notice for the selected correlation
  rangeValid: boolean;                       // false if any input is outside correlation bounds

  // ── Comparison ────────────────────────────────────────────────────────
  allCorrelations?: Partial<Record<CorrelationName, {
    Nu: number;
    rangeValid: boolean;
    warning?: string;
  }>>;
}
```

---

## Preferred-correlation selector logic

This logic runs inside `nusselt()` whenever `preferredCorrelation` is supplied.

```
1. Resolve regime (laminar / turbulent / transitional / natural) from Re, Ra, Gr
   (or compute from fluid properties if Mode B).

2. Look up the validity table for (geometry, preferredCorrelation):
     a. Does this correlation exist for this geometry?           → if no: REJECT (reason: "not applicable to geometry")
     b. Is the current regime within the correlation's range?    → if no: REJECT (reason: "regime outside range")
     c. Are Re/Pr/Ra within the numeric validity bounds?         → if no: REJECT (reason: "Re/Pr/Ra out of bounds: <detail>")

3. If NOT rejected:
     → use preferred; set preferredUsed = true

4. If rejected:
     → run best-equation selector (see below) to pick fallback
     → set preferredUsed = false
     → set preferredRejectedReason = reason string
     → set warning if fallback is also marginal
```

### Best-equation selector

The fallback (and default when no `preferredCorrelation` is given) runs the following rules **in priority order**:

#### Internal pipe / duct (PIPE_CIRCULAR and D_h-variants)
```
isNatural  → 'churchill_chu'     (vertical cylinder, legacy logic preserved — [Leg 922–968])
laminar    → 'mills'             ([Leg 871])
transient  → Re < 3000 ? 'transitional' : 'gnielinski'   ([Leg 967])
turbulent  → 'gnielinski'        ([Leg 968])
```

#### External cylinder crossflow
```
always     → 'churchill_bernstein'   (valid all Re·Pr^0.5 > 0.2; Churchill & Bernstein 1977)
fallback   → 'hilpert'               (if Re in [0.4, 4e5] and Pr ≥ 0.7)
```

#### External sphere forced
```
isDiffusion=false → 'sphere_ranz_marshall'   ([Leg 841])
isDiffusion=true  → 'sphere_diffusion'       ([Leg 839])
whitaker_sphere available as named alternative when 3.5 ≤ Re ≤ 7.6e4 and 0.71 ≤ Pr ≤ 380
```

#### Vertical plate / cylinder natural
```
Ra < 1e9  → 'churchill_chu_laminar'    ([Leg 819])
Ra ≥ 1e9  → 'churchill_chu_all_ra'    ([Leg 820])
'churchill_chu' = auto-apply above rule (legacy default)
```

#### Horizontal cylinder natural
```
always → 'morgan'  (default, range-table)
'churchill_chu_horizontal' always valid as alternative (all Ra)
```

#### Flat plate
```
Re_L ≤ 5e5            → 'flat_plate_laminar'
Re_L > 5e5            → 'flat_plate_mixed'
all Re, Pr            → 'churchill_ozoe'  (preferred if Pr < 0.05 or Pr > 50)
```

#### Packed bed
```
default               → 'gunn'  (0 ≤ Re ≤ 1e5, 0.35 ≤ ε ≤ 1.0)
Re > 1e5 or ε < 0.35 → 'wakao_funazkri'
```

#### All other geometries: single correlation; best-equation = that correlation.


---

---

## Controller endpoints

```typescript
@Post('dimensionless')
@ApiOperation({ summary: 'Re, Pr, Gr, Ra, Nu, h for any flow geometry — raw or fluid-named input' })
dimensionless(@Body() dto: DimensionlessInputDto): DimensionlessResultDto

@Post('body-geometry')
@ApiOperation({ summary: 'Surface area, volume, mean beam length for any body shape' })
bodyGeometry(@Body() dto: BodyGeometryInputDto): BodyGeometryResultDto
```

### DTOs

```typescript
export class DimensionlessInputDto {
  @IsEnum(FlowGeometry)              geometry: FlowGeometry;

  // Mode A
  @IsOptional() @IsNumber()          rho_kg_m3?: number;
  @IsOptional() @IsNumber()          mu_Pa_s?: number;
  @IsOptional() @IsNumber()          mu_s_Pa_s?: number;
  @IsOptional() @IsNumber()          Cp_J_kgK?: number;
  @IsOptional() @IsNumber()          lambda_W_mK?: number;
  @IsOptional() @IsNumber()          w_m_s?: number;

  // Mode B
  @IsOptional() @IsString()          fluid?: KnownFluid;
  @IsOptional() @IsObject()          composition?: Record<string, number>;
  @IsOptional() @IsNumber()          T_fluid_K?: number;
  @IsOptional() @IsNumber()          T_surface_K?: number;
  @IsOptional() @IsNumber()          P_Pa?: number;

  // Geometry
  @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto)
                                     dims?: GeometryDimsDto;

  // Control
  @IsOptional() @IsEnum(CorrelationName)
                                     preferredCorrelation?: CorrelationName;
  @IsOptional() @IsBoolean()         compareAll?: boolean;
  @IsOptional() @IsEnum(['laminar','turbulent','transitional'])
                                     forceRegime?: string;
  @IsOptional() @IsBoolean()         isDiffusion?: boolean;
  @IsOptional() @IsBoolean()         isHeating?: boolean;
}

export class BodyGeometryInputDto {
  @IsEnum(BodyGeometry)              geometry: BodyGeometry;
  @IsOptional() @IsNumber()          h?: number;
  @ValidateNested() @Type(() => GeometryDimsDto)
                                     dims: GeometryDimsDto;
}

export class BodyGeometryResultDto {
  surface: number;
  volume: number;
  meanBeamLength: number;
  characteristicLength: number;
}
```

---

## Unit tests

| Test | Expected |
|---|---|
| `reynolds(1.2, 10, 0.05, 1.8e-5)` | 33333 |
| `prandtl(1.8e-5, 1005, 0.026)` | 0.697 |
| `hydraulicDiameter(0.05×0.1, 2×(0.05+0.1))` | 0.0667 m |
| `channelArea(DUCT_SQUARE, {a:0.05})` | 0.0025 m² |
| `channelArea(PIPE_ANNULUS, {a:0.02, b:0.05})` | π/4·(0.05²−0.02²) |
| Mode A: `nusselt(PIPE_CIRCULAR, Re=1000, Pr=0.7, D=0.05, L=1)` | mills, laminar |
| Mode A: `nusselt(PIPE_CIRCULAR, Re=15000, Pr=0.7)` | gnielinski, turbulent |
| Mode B: `nusselt({geometry:PIPE_CIRCULAR, fluid:'air', T_fluid_K:600, T_surface_K:400, w_m_s:5, dims:{a:0.05,c:1}})` | gnielinski or mills depending on Re |
| `nusselt(DUCT_SQUARE, a=0.05, Re=10000, Pr=0.7)` | via D_h → gnielinski |
| `nusselt(PACKED_BED, Re=100, Pr=0.7, ε=0.4)` | gunn |
| `nusselt(VERTICAL_CYLINDER, Ra=1e8, Pr=0.7)` | churchill_chu_laminar |
| `nusselt(SPHERE_NATURAL, Ra=1e6, Pr=0.7)` | churchill_sphere_natural |
| `nusselt(HORIZONTAL_PLATE_HOT_UP, Ra=1e6, Pr=0.7)` | mcadams_hot_up (0.54·Ra^0.25) |
| `nusselt(INCLINED_PLATE, Ra=1e8, Pr=0.7, angle_deg=45)` | churchill_chu with g_eff |
| `bodyArea(SPHERE, {a:0.1}, 0)` | 0.1257 m² |
| `bodyArea(CYLINDER, {a:0.1, b:0.3}, 0.05)` | with insulation |
| `bodyArea(TRUNCATED_CONE, {a:0.1, b:0.05, c:0.2}, 0)` | lateral + bases |
| `meanBeamLength(CUBE, {a:0.2})` | 0.12 m |
| `meanBeamLength(CYLINDER, {a:0.1, b:0.3})` | 3.6·0.1·0.3/(0.2+0.6) |
| `bodyVolume(SPHERE, {a:0.1})` | 4/3·π·0.1³ |
| Preferred valid: `preferredCorrelation:'whitaker_sphere', Re=5000, Pr=0.7` | whitaker_sphere used, preferredUsed=true |
| Preferred invalid: `preferredCorrelation:'whitaker_sphere', Re=1e6, Pr=0.7` | sphere_ranz_marshall used, preferredUsed=false, reason in preferredRejectedReason |
| `compareAll=true` on CYLINDER_CROSSFLOW | allCorrelations has churchill_bernstein, hilpert, whitaker_cylinder |

---

## See also

- [CH08_GEOMETRY.md](CH08_GEOMETRY.md) — `FlowGeometry`, `BodyGeometry`, `GeometryDims`, hydraulic diameter table, surface/volume/beam-length formulas
- [CH07_APPENDIX_A_INTERNAL_FLOW.md](CH07_APPENDIX_A_INTERNAL_FLOW.md) — pipe/duct/helical/corrugated correlations
- [CH07_APPENDIX_B_PLATES.md](CH07_APPENDIX_B_PLATES.md) — flat plate, vertical/horizontal/inclined plate correlations
- [CH07_APPENDIX_C_CYLINDERS.md](CH07_APPENDIX_C_CYLINDERS.md) — cylinder crossflow, horizontal cylinder, concentric cylinders
- [CH07_APPENDIX_D_SPHERES.md](CH07_APPENDIX_D_SPHERES.md) — sphere forced/natural, concentric spheres
- [CH07_APPENDIX_E_SPECIAL.md](CH07_APPENDIX_E_SPECIAL.md) — tube banks, cavities, mixed convection, packed bed, phase change, rotating, impinging jets
