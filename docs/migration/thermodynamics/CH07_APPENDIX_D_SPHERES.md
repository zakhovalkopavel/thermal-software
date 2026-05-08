# CH07 Appendix D — Sphere Correlations

**Back:** [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md)

Covers `FlowGeometry` values: `SPHERE_FORCED`, `SPHERE_NATURAL`, `CONCENTRIC_SPHERES`.

---

## SPHERE_FORCED — forced convection

> ⚠️ `sphere_ranz_marshall` and `sphere_diffusion` are two distinct correlations used in
> the same legacy function branch. Verbatim from
> [`recuperator.js:835`](../../../legacy/scripts/recuperator.js#L835)–[`:843`](../../../legacy/scripts/recuperator.js#L843).
> Coefficients must not be changed.

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `sphere_ranz_marshall` *(default, isDiffusion=false)* | `Nu = 2 + 0.4·Re^0.5·Pr^(1/3)` | any Re, any Pr | [recuperator.js:841](../../../legacy/scripts/recuperator.js#L841); Ranz & Marshall (1952) |
| `sphere_diffusion` *(isDiffusion=true)* | `Nu = 2 + 0.17·Re^(2/3)` | any Re | [recuperator.js:838](../../../legacy/scripts/recuperator.js#L838); Russian literature — source TBD |
| `whitaker_sphere` | full form with (μ/μ_s)^0.25 — see §W4 below | 3.5 ≤ Re ≤ 7.6×10⁴, 0.71 ≤ Pr ≤ 380 | Whitaker (1972) |

**Selection logic:**
```
isDiffusion = false → sphere_ranz_marshall   [Leg default]
isDiffusion = true  → sphere_diffusion       [Leg branch]
```
`whitaker_sphere` available as named alternative via `preferredCorrelation`.

### Attribution note

`Nu = 2 + 0.4·Re^0.5·Pr^(1/3)` is **Ranz-Marshall** (1952).  
`Nu = 2 + (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25` is **Whitaker** (1972).  
These are distinct — the legacy code correctly uses Ranz-Marshall.

---

## SPHERE_NATURAL — natural convection

| Correlation | Formula | Validity | Source |
|---|---|---|---|
| `churchill_sphere_natural` *(only option)* | `Nu = 2 + 0.589·Ra_D^(1/4) / (1+(0.469/Pr)^(9/16))^(4/9)` | Ra ≤ 10¹¹, Pr ≥ 0.7 | Churchill (1983); Incropera §9.9 — see §A8 |

The "2" is the pure-conduction limit (Nu → 2 as Ra → 0).

**Pr-group constant:** **0.469** (sphere) — distinct from 0.492 (vertical plate) and
0.559 (horizontal cylinder). Do not interchange.

---

## CONCENTRIC_SPHERES — natural convection

**Raithby–Hollands** — Incropera §9.7:

```
k_eff/k = 0.74·(Pr/(0.861+Pr))^(1/4)·Ra_δ^(1/4)
          / (1−(r_i/r_o)^(−5/7))^(5/4)

q = k_eff·4π·r_i·r_o/(r_o−r_i)·ΔT   [W]
```

`δ = r_o − r_i`, `Ra_δ = g·β·ΔT·δ³/(ν·α)`.

**`CorrelationName`:** `'raithby_hollands_spheres'`

---

## §A8 — Churchill (1983): Sphere, natural convection

**Paper:** S.W. Churchill, "Free convection around immersed bodies," in
*Heat Exchanger Design Handbook*, Section 2.5.7, Hemisphere Publishing, 1983.
Reproduced in Incropera §9.9 as Eq.(9.35).

```
Nu_D = 2 +  0.589·Ra_D^(1/4) / [ 1 + (0.469/Pr)^(9/16) ]^(4/9)
```

**Validity:** Ra_D ≤ 10¹¹, Pr ≥ 0.7.

The "2" arises from the pure conduction limit (sphere in infinite medium at zero flow).

**`CorrelationName`:** `'churchill_sphere_natural'`  **`FlowGeometry`:** `SPHERE_NATURAL`

---

## §W4 — Whitaker (1972): Single sphere, external forced flow

**Paper:** Whitaker (1972) AIChE — Eq.(9), page 366.

```
Nu_D = 2 + (0.4·Re_D^(1/2) + 0.06·Re_D^(2/3))·Pr^0.4·(μ/μ_s)^(1/4)
```

**Validity:** 3.5 ≤ Re_D ≤ 7.6×10⁴, 0.71 ≤ Pr ≤ 380, 1.0 ≤ (μ/μ_s) ≤ 3.2.

Properties at free-stream temperature. μ_s at surface temperature.

**vs Ranz-Marshall (Leg default):**
- `Nu = 2 + 0.4·Re^0.5·Pr^(1/3)` → Ranz-Marshall (1952) — no viscosity correction, Pr^(1/3)
- `Nu = 2 + (0.4·Re^0.5 + 0.06·Re^(2/3))·Pr^0.4·(μ/μ_s)^0.25` → Whitaker (1972) — better for liquids (Pr > 5)

For gases (Pr ≈ 0.7) and Re < 300 both give similar results.

**`CorrelationName`:** `'whitaker_sphere'`  **`FlowGeometry`:** `SPHERE_FORCED`

