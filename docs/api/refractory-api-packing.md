# Blend Optimization

**Parent index:** [REFRACTORY_API_SPEC.md](./REFRACTORY_API_SPEC.md)

---

### `POST /blend-optimization`

Optimizes mass fractions of particle size fractions to best match a target PSD curve (Andreasen or Funk-Dinger).

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0, "dMax_mm": 10.0, "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 1.0, "dMax_mm": 5.0,  "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 0.1, "dMax_mm": 1.0,  "isFixed": false, "density_kgm3": 2700 },
    { "dMin_mm": 0.0, "dMax_mm": 0.1,  "isFixed": false, "density_kgm3": 2700 }
  ],
  "options": {
    "targetQ": 0.26,
    "method": "Andreasen"
  }
}
```

**Fields — `fractions[]`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dMin_mm` | number | ✅ | Lower sieve size in mm |
| `dMax_mm` | number | ✅ | Upper sieve size in mm |
| `isFixed` | boolean | ❌ | If true, mass fraction is fixed (not optimized) |
| `massFraction` | number | ❌ | Fixed mass fraction (required if `isFixed: true`) |
| `density_kgm3` | number | ❌ | Particle density in kg/m³ |

**Fields — `options`:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetQ` | number | ✅ | Distribution modulus q (0.2–0.4) |
| `method` | string | ❌ | `"Andreasen"` (default) or `"FunkDinger"` |

---

## 3. PSD — Andreasen

### `POST /psd/andreasen`

Calculates ideal mass fractions per Andreasen continuous distribution: `P(D) = (D/Dmax)^q`

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0,  "dMax_mm": 10.0, "isFixed": false },
    { "dMin_mm": 1.0,  "dMax_mm": 5.0,  "isFixed": false },
    { "dMin_mm": 0.1,  "dMax_mm": 1.0,  "isFixed": false },
    { "dMin_mm": 0.01, "dMax_mm": 0.1,  "isFixed": false }
  ],
  "q": 0.26
}
```

**Response:**
```json
{
  "method": "Andreasen",
  "q": 0.26,
  "Dmin_mm": 0.01,
  "Dmax_mm": 10.0,
  "massFractions": [0.312, 0.285, 0.248, 0.155],
  "massFractionsRoundedPercent": [31, 29, 25, 15]
}
```

---

## 4. PSD — Funk-Dinger

### `POST /psd/funk-dinger`

Modified Andreasen with non-zero Dmin: `P(D) = (D^q − Dmin^q) / (Dmax^q − Dmin^q)`  
Recommended `Dmin_mm = 0.001` for realistic fine particle packing.

**Request body:**
```json
{
  "fractions": [
    { "dMin_mm": 5.0,  "dMax_mm": 10.0 },
    { "dMin_mm": 1.0,  "dMax_mm": 5.0  },
    { "dMin_mm": 0.1,  "dMax_mm": 1.0  },
    { "dMin_mm": 0.01, "dMax_mm": 0.1  }
  ],
  "q": 0.26,
  "Dmin_mm": 0.001
}
```

**Response:** Same shape as Andreasen, `"method": "FunkDinger"`.

---

## 5. Packing — CPM

### `POST /packing/cpm`

Compressible Packing Model (de Larrard 1999). Accounts for wall effects and compaction.

**Request body:**
```json
{
  "massFractions": [0.31, 0.28, 0.25, 0.16],
  "densities_kgm3": [2700, 2700, 2700, 2700],
  "diameters_mm": [7.5, 3.0, 0.55, 0.055],
  "compactionPressure_MPa": 10
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `massFractions` | number[] | ✅ | Mass fraction of each fraction (must sum to 1) |
| `densities_kgm3` | number[] | ✅ | Density of each fraction in kg/m³ |
| `diameters_mm` | number[] | ✅ | Representative diameter of each fraction in mm |
| `compactionPressure_MPa` | number | ❌ | Applied compaction pressure (default: 0) |

**Response:**
```json
{
  "packingFraction": 0.748,
  "porosity": 0.252,
  "bulkDensity_kgm3": 2017,
  "method": "CPM"
}
```

---

## 6. Packing — Furnas

### `POST /packing/furnas`

Furnas model for multi-component packing (Furnas 1931). Simpler than CPM, no compaction.

**Request body:** Same schema as CPM, `compactionPressure_MPa` ignored.

---

## 7. Participation

### `POST /participation`

Reacted mass fraction of each size fraction during a firing. It uses the same shrinking-core grain reaction as §1 ([`FULL_PHASE_EQUILIBRIUM.md`](../algorithms/phase-equilibrium/FULL_PHASE_EQUILIBRIUM.md) Step 2):
- `δ(T, t) = δ_ref · √(t / t_ref) · exp(−E / (2R) · (1/T − 1/T_ref))`
- `X = 1 − (1 − 2δ/d)³`, and `X = 1` when 2δ ≥ d.

**Request body** (`ParticipationDto`):
```json
{
  "fractions": [
    { "materialId": "alumina_tabular", "dMin_mm": 5.0, "dMax_mm": 10.0, "massFraction": 0.31 },
    { "materialId": "alumina_tabular", "dMin_mm": 1.0, "dMax_mm": 5.0,  "massFraction": 0.28 },
    { "dMin_mm": 0.1, "dMax_mm": 1.0,  "massFraction": 0.25 },
    { "dMin_mm": 0.0, "dMax_mm": 0.1,  "d50_mm": 0.05, "massFraction": 0.16 }
  ],
  "temperature": 1450,
  "holdTime_hours": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fractions[]` | `ParticipationFractionDto[]` | ✅ | Size fractions |
| `fractions[].dMin_mm`, `dMax_mm` | number | ✅ | Sieve limits, mm |
| `fractions[].d50_mm` | number | ❌ | Representative diameter, mm; default `(dMin_mm + dMax_mm) / 2` |
| `fractions[].massFraction` | number | ✅ | 0–1 |
| `fractions[].materialId` | string | ❌ | Library id; E = its `activationEnergy_Jmol`, otherwise `GRAIN_REACTION_CONSTANTS.defaultActivationEnergy_Jmol` |
| `temperature` | number | ❌ | °C, 500–2000; default the reference 1450 °C |
| `holdTime_hours` | number | ❌ | h, 0.1–100; default 2 |

At the reference temperature, E has no effect and δ = δ_ref = 0.1 mm.

**Response** (`ParticipationResultDto`):
```json
{
  "totalParticipation": 0.4221,
  "participationFactors": [
    { "fractionIndex": 0, "dMin_mm": 5.0, "dMax_mm": 10.0, "dMean_mm": 7.5, "massFraction": 0.31,
      "penetrationDepth_mm": 0.1, "participationFactor": 0.0779, "effectiveParticipation": 0.0241 }
  ],
  "normalizedParticipation": [
    { "fractionIndex": 0, "normalizedParticipation": 0.0572 }
  ]
}
```

| Field | Description |
|-------|-------------|
| `dMean_mm` | diameter used: `d50_mm`, or `(dMin_mm + dMax_mm) / 2` |
| `penetrationDepth_mm` | δ(T, t) of the fraction's material |
| `participationFactor` | X, reacted mass fraction of the fraction (0–1) |
| `effectiveParticipation` | X · `massFraction` |
| `totalParticipation` | Σ effective: reacted mass fraction of the whole mix |
| `normalizedParticipation` | share of the reacted mass coming from each fraction |

---

## 8. Water Demand

### `POST /water-demand`

Calculates water demand as % by mass: `waterDemand = workabilityFactor × (1 − φ) × 100`

| Workability | Factor | Typical use |
|-------------|--------|-------------|
| `FIRM` | 0.38 | Vibration-intensive placement |
| `STANDARD` | 0.42 | Balanced flow and strength (default) |
| `FLOWABLE` | 0.50 | Self-flowing castables |

**Request body:**
```json
{
  "packingFraction": 0.74,
  "workability": "STANDARD"
}
```

**Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `packingFraction` | number | ✅ | Packing fraction φ (0–1) |
| `workability` | string | ❌ | `FIRM`, `STANDARD` (default), or `FLOWABLE` |

**Response:**
```json
{ "waterDemand_pct": 10.9 }
```

---

## 9. Water Demand Range

### `POST /water-demand/range`

Returns min (FIRM), typical (STANDARD), max (FLOWABLE) water demand for a packing fraction.

**Request body:**
```json
{ "packingFraction": 0.74 }
```

**Response:**
```json
{
  "min": 9.88,
  "typical": 10.92,
  "max": 13.0
}
```

---

