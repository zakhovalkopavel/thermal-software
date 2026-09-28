# RECUPERATOR SPEC — 02 Geometry

**Module:** `backend/src/modules/recuperator/`  
**Service:** `RecuperatorGeometryService`  
**Reference:** legacy `getPerimeter()`, `getArea()`, `getSizeByTypeForArea()` · lines 697–754 of `recuperator.js`

---

## 2.1 Purpose

Compute cross-sectional geometry (area, perimeter, equivalent diameter, ray length) for each channel type (smoke / air) based on the selected **hole form**.

---

## 2.2 Hole Forms (`HoleForm` enum)

| Key | Description |
|---|---|
| `SQUARE` | Square-section channels, `n_air` air and `n_smoke` smoke channels in parallel |
| `CIRCLE` | Circular channels |
| `TRIANGLE` | Triangular channels (equilateral) |
| `CIRCLE_IN_RING` | Concentric-pipe geometry: smoke in inner cylinder, air in annular ring |

---

## 2.3 Channel Dimensions

For `SQUARE`, `CIRCLE`, `TRIANGLE`:
- **Nominal dimension** `a` [m] — inner size of the smoke or air channel
- **Wall thickness** `h` [m] — refractory medium thickness between channels

For `CIRCLE_IN_RING`:
- `a` — inner cylinder diameter (smoke channel) [m]
- `h` — wall thickness [m]
- `h0` — air channel radial depth [m]
- `n_passes` — number of air passes (reduces effective air area)

---

## 2.4 Perimeter Formulas

Smoke-side perimeter `L_smoke`, air-side perimeter `L_air`:

| Form | L_air | L_smoke |
|---|---|---|
| `SQUARE` | `4·a · n_air` | `4·a · n_smoke` |
| `CIRCLE` | `π·a · n_air` | `π·a · n_smoke` |
| `TRIANGLE` | `3·a` | `3·(a + 2h)` |
| `CIRCLE_IN_RING` | `π·a` | `π·(a − 2h)` |

---

## 2.5 Cross-Sectional Area Formulas

### 2.5.1 Effective size for area calculation

```
For CIRCLE_IN_RING:
  if type == 'smoke': a_eff = a − 2h
  if type == 'air':   a_eff = sqrt((a + 2·h0)² − a²)

For all others: a_eff = a
```

### 2.5.2 Area per channel (then multiplied by count)

| Form | Single air channel area | Single smoke channel area |
|---|---|---|
| `SQUARE` | `a²` | `a²` |
| `CIRCLE` | `π·a²/4` | `π·a²/4` |
| `TRIANGLE` | `a²·√3/4` | derived (see §2.5.3) |
| `CIRCLE_IN_RING` | `π·a²/4 / n_passes` | `π·a_smoke²/4` |

Total area = single area × count factor:
- `S_air   = area × n_air`
- `S_smoke = area × n_smoke`

### 2.5.3 Triangle smoke area (special case)

The smoke channel surrounds the triangular air channel in an annular region:

```
r_inner = (3/(16π))^0.25 × a
r_outer = r_inner + h
smoke_factor = (π·r_outer² − A_triangle_outer) / A_triangle_air
S_smoke = A_triangle_air × smoke_factor × n_smoke
```

where `A_triangle_outer = (a + 2h)² × √3 / 4`.

---

## 2.6 Equivalent Diameter

Used for Reynolds number and Nusselt number calculations:

```
d_eq = sqrt(4 × S / π)
```

Applied to both smoke and air cross-sections.

---

## 2.7 Radiation Ray Length

Used in Hottel–Mikheev gas radiation formula:

```
For CIRCLE_IN_RING smoke side:  L_ray = 0.9 × d_smoke
For CIRCLE_IN_RING air side:    L_ray = 1.8 × h0
For others (both sides):        L_ray = 0.9 × a
```

---

## 2.8 Outer Surface Diameter

The outer surface dimension used for natural convection cooling:

| Form | `d_surface` formula |
|---|---|
| `TRIANGLE` | `a·(3/(π·16))^0.25 + 4h + 2·h_ins` |
| `CIRCLE_IN_RING` | `a + 2·(h_ins + h0)` |
| `SQUARE`, `CIRCLE` | `⌈√(n_air+n_smoke)⌉ × (a+h) + h + 2·h_ins` |

Where `h_ins` is the thermal insulation outer layer thickness [m].

---

## 2.9 Velocity Calculation

Gas velocity in each channel from mass flow rate:

```
v = m_dot / (ρ × S)           [m/s]

ρ = p / (R_specific × T)      [kg/m³]  (ideal gas)
```

Velocity expands with temperature:

```
v_end = v_start × ρ(T_start) / ρ(T_end) = v_start × T_end / T_start
```

---

## 2.10 Outputs (`ChannelParams`)

```typescript
{
  area_m2:       number;   // cross-sectional flow area [m²]
  perimeter_m:   number;   // wetted perimeter [m]
  dEq_m:         number;   // equivalent diameter [m]
  rayLength_m:   number;   // radiation ray length [m]
  dSurface_m:    number;   // outer surface diameter [m]
}
```
