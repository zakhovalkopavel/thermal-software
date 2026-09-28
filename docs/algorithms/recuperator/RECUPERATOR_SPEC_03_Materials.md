# RECUPERATOR SPEC — 03 Materials

**Module split:**
- **19 refractory materials** → `backend/src/modules/refractory/services/refractory-thermal.service.ts`
  - Enum: `refractory/enums/refractory-thermal-material.enum.ts`
- **2 metal materials** → `backend/src/modules/metals/services/metal-thermal.service.ts`
  - Enum: `metals/enums/metal-material.enum.ts`

Both services are consumed by `thermal-exchange/services/multilayer-wall.service.ts` via a `WallMaterialKey = RefractoryThermalMaterial | MetalMaterial` union type defined in `thermal-exchange`.

**Reference:** legacy `getLambda()` lines 1960–2035, `getEmissivity()` lines 1850–1957 of `recuperator.js`

> **Why not a single RecuperatorMaterialService?** SRP — refractory ceramics and metals are distinct physical families with different property sources. The `refractory` module already owns ceramic material data; `metals` owns metallic material data. Keeping them there avoids duplication and allows independent reuse.

---

## 3.2 Temperature Argument Conventions

| Property | Input temperature | Valid range clamping |
|---|---|---|
| λ(T) — thermal conductivity | T in **Celsius** (`T_C = T_K − 273`) | No explicit clamping (extrapolation acceptable) |
| ε(T) — emissivity (polynomial form) | T in **Kelvin** | Clamped to `[T_min, T_max]` |
| ε(T) — emissivity (exponential form) | T in **Kelvin** | Clamped to `[T_min, T_max]` |

---

## 3.3 Emissivity Function Forms

### 3.3.1 Polynomial form

```
ε(T) = a + 1e-5·b·T + 1e-8·c·T² + 1e-10·d·T³
T    = clamp(T, T_min, T_max)
```

### 3.3.2 Exponential (power-law) form

```
ε(T) = a · T^b
T    = clamp(T, T_min, T_max)
```

---

## 3.4 Material Registry

### 3.4.1 Chamotte variants (aluminosilicate fire brick)

All chamotte variants share the same emissivity polynomial:  
`ε(T) = 0.84 − 20·1e-5·T` — valid T ∈ [673, 1673] K

| Material key | Description | λ(T_C) [W/(m·K)] |
|---|---|---|
| `CHAMOTTE_SOLID` | Solid fire brick | `0.700 + 6.40e-4 × T_C` |
| `CHAMOTTE_1300` | Light chamotte 1300 kg/m³ | `0.470 + 3.50e-4 × T_C` |
| `CHAMOTTE_1000` | Light chamotte 1000 kg/m³ | `0.350 + 3.50e-4 × T_C` |
| `CHAMOTTE_900` | Light chamotte 900 kg/m³ | `0.290 + 2.30e-4 × T_C` |
| `CHAMOTTE_600` | Light chamotte 600 kg/m³ | `0.130 + 2.80e-4 × T_C` |
| `CHAMOTTE_400` | Light chamotte 400 kg/m³ | `0.100 + 2.10e-4 × T_C` |

### 3.4.2 Mullite

| Material key | Description | λ(T_C) [W/(m·K)] | ε(T) |
|---|---|---|---|
| `MULLITE_2300` | Mullite brick 2300 kg/m³ | `1.55 + 2.00e-4 × T_C` | Power: `26.186 · T^(-0.555)`, T ∈ [600, 2000] K |

### 3.4.3 Quartz / silica brick

All quartz variants: `ε(T) = 0.9 − 10·1e-5·T`, valid T ∈ [673, 1673] K

| Material key | Description | λ(T_C) [W/(m·K)] |
|---|---|---|
| `QUARTZ_2000` | Dense silica brick 2000 kg/m³ | `0.815 + 6.70e-4 × T_C` |
| `QUARTZ_1000` | Silica 1000 kg/m³ | `0.550 + 3.00e-4 × T_C` |
| `QUARTZ_SAND_1` | Quartz sand 1 mm | `0.550 + 3.00e-4 × T_C` |
| `QUARTZ_SAND_05` | Quartz sand 0.5 mm | `0.550 + 3.00e-4 × T_C` |
| `QUARTZ_SAND_02` | Quartz sand 0.2 mm | `0.550 + 3.00e-4 × T_C` |

### 3.4.4 Alumina (Al₂O₃)

Dense alumina emissivity: `ε(T) = 0.98 − 53·1e-5·T + 10.2·1e-8·T²`, valid T ∈ [300, 1800] K

| Material key | Description | λ(T_C) [W/(m·K)] | ε(T) |
|---|---|---|---|
| `ALUMINA_2500` | Dense corundum 2500 kg/m³ | `1.90 + 1.60e-3 × T_C` | Dense alumina polynomial |
| `ALUMINA_1300` | Lightweight alumina 1300 kg/m³ | `0.84 − 3.50e-4 × T_C` | Power: `5.6674 · T^(-0.3664)`, T ∈ [600, 2000] K |
| `ALUMINA_SAND_1` | Alumina sand 1 mm | `0.84 − 3.50e-4 × T_C` | Dense alumina polynomial |
| `ALUMINA_SAND_05` | Alumina sand 0.5 mm | `0.84 − 3.50e-4 × T_C` | Dense alumina polynomial |
| `ALUMINA_SAND_02` | Alumina sand 0.2 mm | `0.84 − 3.50e-4 × T_C` | Dense alumina polynomial |

### 3.4.5 Silicon carbide (SiC)

| Material key | λ(T_C) [W/(m·K)] | ε(T) |
|---|---|---|
| `SILICON_CARBIDE` | `13.73 − 4.555e-3 × T_C` | `0.8 + 15.4·1e-5·T − 9.01·1e-8·T²`, T ∈ [400, 1850] K |

### 3.4.6 Thermal insulation (basalt fibre mat)

| Material key | λ(T_C) [W/(m·K)] | ε(T) |
|---|---|---|
| `BASALT_FIBER_MAT` | `0.139 − 7.97e-5·T_C + 1.3e-7·T_C² + 2.73e-10·T_C³` | `0.92` (constant), T ∈ [300, 400] K |

### 3.4.7 Metals

| Material key | Description | λ(T_K) [W/(m·K)] | ε(T) |
|---|---|---|---|
| `AISI_304` | Stainless steel 304 | `9.705 + 1.76e-2·T_K − 1.60e-6·T_K²` | `0.42 + 30·1e-5·T`, T ∈ [600, 1400] K |
| `MILD_STEEL` | Mild steel / iron | `6.56e-8·T_C³ − 8.34e-5·T_C² − 8.06e-4·T_C + 49.16` | `0.173 + 68.6·1e-5·T − 25.6·1e-8·T²`, T ∈ [100, 1050] K |

> **Note for AISI_304:** `getLambda()` uses **T in Kelvin** (not Celsius) — this is an explicit exception to the general T_C convention.

---

## 3.5 Refractory Service Interface (`RefractoryThermalService`)

```typescript
@Injectable()
export class RefractoryThermalService {
  /** Thermal conductivity [W/(m·K)] — T_K in Kelvin */
  lambda(material: RefractoryThermalMaterial, T_K: number): number;

  /** Thermal emissivity [−] — T_K in Kelvin, clamped internally */
  emissivity(material: RefractoryThermalMaterial, T_K: number): number;
}
```

## 3.6 Metal Service Interface (`MetalThermalService`)

```typescript
@Injectable()
export class MetalThermalService {
  /** Thermal conductivity [W/(m·K)] — T_K in Kelvin */
  lambda(material: MetalMaterial, T_K: number): number;

  /** Thermal emissivity [−] — T_K in Kelvin, clamped internally */
  emissivity(material: MetalMaterial, T_K: number): number;

  /** Combined result DTO for GET endpoint */
  getThermalProperties(dto: MetalThermalQueryDto): MetalThermalResultDto;
}
```

Both throw `NotFoundException` for unknown material keys.
