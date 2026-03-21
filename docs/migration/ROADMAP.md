# Migration Roadmap

**Project:** thermal-software  
**Date:** March 2026

This document is the single entry point for all legacy-to-backend migration work.  
See [MODULE_ARCHITECTURE.md](MODULE_ARCHITECTURE.md) for the full boundary and ownership analysis.

---

## Module map

| Legacy source | Target backend module | Spec folder | Status |
|---|---|---|---|
| `legacy/scripts/src/` (interfaces, dto, utils, compounds) | `backend/src/common/thermal/` | recuperator [PHASE 1](recuperator/CHECKLIST.md) | 🟡 Planning |
| `legacy/furnaceCombustion/classes/Thermodynamics.js` + `TransportProperties.js` + `DiffusionCoefficients.js` + `HeatTransfer.js` + `Aerodynamics.js` | `backend/src/modules/thermodynamics/` | [thermodynamics/](thermodynamics/) | 🟡 Planning |
| `legacy/scripts/recuperator.js` (heat transfer sections) + `legacy/scripts/src/thermalExchange/` | `backend/src/modules/recuperator/` | [recuperator/](recuperator/) | 🟡 Planning |
| `legacy/scripts/recuperator.js` (combustion ~575–680) + `legacy/furnaceCombustion/modules/` + `FuelDatabase.js` | `backend/src/modules/combustion/` | [combustion/](combustion/) | 🟡 Planning |
| `legacy/library/processed_data/` + `legacy/python_scripts/` | `python/src/thermophysical/` + `backend/src/modules/thermophysical/` | [thermophysical-library/](thermophysical-library/) | 🟡 Planning |
| `legacy/refractory/` | `backend/src/modules/refractory/` | [STEP_01_REFRACTORY_MODULE.md](STEP_01_REFRACTORY_MODULE.md) | 🔴 Not started |

---

## Dependency graph

```
common/thermal      (no NestJS deps — pure library)
      │
      ▼
ThermodynamicsModule   (wraps common/thermal + adds NASA-7, Sutherland, Chapman-Enskog, Gunn)
      │
      ├──► CombustionModule     (kinetics, flame, layer model)
      │         │
      │         └──► RecuperatorModule  (heat exchanger optimizer)
      │
      └──► RecuperatorModule    (also imports ThermodynamicsModule directly)

ThermophysicalModule   (independent — compound CSV/DB lookup)
```

---

## Implementation sequence

### Stage A — Foundation
1. **`common/thermal` shared library** → `recuperator/CHECKLIST.md` PHASE 1

### Stage B — Core physics (start after Stage A)
2. **`ThermodynamicsModule`** → `thermodynamics/CHECKLIST.md` PHASE 1–7  
   _Unlocks:_ CombustionModule and RecuperatorModule

### Stage C — Application modules (start after Stage B)
3. **`RecuperatorModule`** → `recuperator/CHECKLIST.md` PHASE 2–7  
4. **`CombustionModule` core** (flame temp + products) → `combustion/CHECKLIST.md` PHASE 1–2  
5. **Thermophysical library** → `thermophysical-library/CHECKLIST.md` PHASE 1–3 _(can run in parallel with B)_

### Stage D — Advanced features
6. **`CombustionModule` kinetics + layer model** → `combustion/CHECKLIST.md` PHASE 3–6
7. **DB migration** → `thermophysical-library/CHECKLIST.md` PHASE 4 _(after Stage C verified)_

---

## Status legend

| Symbol | Meaning |
|---|---|
| ✅ | Complete |
| 🟡 | In progress / planning |
| 🔴 | Not started |
| ⏸ | Deferred |
