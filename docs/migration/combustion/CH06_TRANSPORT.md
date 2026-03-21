# CH06 — Transport Properties

> **MOVED** — `TransportProperties.js`, `DiffusionCoefficients.js`, and `Aerodynamics.js`  
> are now specified in **`docs/migration/thermodynamics/`** as `TransportService`,  
> `DiffusionService`, and `AerodynamicsService`.

## Resolution of overlap with `common/thermal`

The audit result is documented in  
[thermodynamics/CH03_SERVICE_DECOMPOSITION.md — TransportService section](../thermodynamics/CH03_SERVICE_DECOMPOSITION.md):

- **Sutherland + Wilke** (from `TransportProperties.js`) → `TransportService` in `ThermodynamicsModule`.  
  Distinct from DIPPR102 in `common/thermal` — different formula, used for mixture viscosity.
- **Chapman-Enskog** (from `DiffusionCoefficients.js`) → `DiffusionService` in `ThermodynamicsModule`.
- **NH3 parameters** missing from both legacy sources — added during ThermodynamicsModule implementation.
