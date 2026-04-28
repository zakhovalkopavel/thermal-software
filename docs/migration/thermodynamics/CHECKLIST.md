# Thermodynamics Module — Implementation Checklist

Track each item with `[x]` when done.  
**Prerequisite:** `common/thermal` shared library (recuperator PHASE 1) must be complete first.

---

## PHASE 1 — Scaffolding

- [ ] Create `backend/src/modules/thermodynamics/` directory structure (see CH02)
- [ ] Create `Species` enum
- [ ] Create `GasMixtureInputDto`, `GasPropertiesResultDto`

---

## PHASE 2 — `common/thermal` shared library ✅ COMPLETE

- [x] Add `nasa7 = "nasa7"` to `common/thermal/dto/equation-type.dto.ts`
- [x] Create `common/thermal/type/nasa7-equation.ts` — `Nasa7Coeffs { a1…a7 }`, `Nasa7Equation { low, high, Tswitch }` (named fields, not arrays)
- [x] Create `common/thermal/utils/nasa7-equation-method.ts` — implements `Equation<Nasa7Equation>` + `enthalpy`, `entropy`, `gibbsEnergy`
- [x] Add `nasa7` case to `Common.equation()` dispatch
- [x] Add `nasa9 = "nasa9"` to `common/thermal/dto/equation-type.dto.ts`
- [x] Create `common/thermal/type/nasa9-equation.ts` — `Nasa9Coeffs { a1…a9 }`, `Nasa9Range { Tmin, Tmax, coeffs }`, `Nasa9Equation { ranges }` (modern variable-range format)
- [x] Create `common/thermal/utils/nasa9-equation-method.ts` — implements `Equation<Nasa9Equation>` + `enthalpy`, `entropy`, `gibbsEnergy`
- [x] Add `nasa9` case to `Common.equation()` dispatch
- [x] Add `nasa9?: Nasa9Equation` top-level field to `CompoundValue` interface
- [x] Add `RefKey.NASA9` to `enum/ref-key.enum.ts` and `REFERENCES_META` in `dto/ref-key.dto.ts` (index 23, NASA RP-1311)
- [x] Full-precision NASA TM-2002-211556 coefficients for N2, O2, CO2, CO, H2O, H2, CH4 (ref NASA7)
- [x] NH3 NASA-7 coefficients from Burcat2005 (ANL-05/20)
- [x] `nasa7` field is top-level in `CompoundValue` — **not** inside `heatCapacity.values[]`
- [x] All 8 gas compounds complete: N2, O2, CO2, CO, H2O, H2, CH4, NH3 (see CH04 table)
- [x] `GAS_REGISTRY` in `registry.ts`
- [x] `CompoundPropertyResolver` with `PreferredApprox` (index or RefKey)
- [x] `RefKey` enum in `enum/ref-key.enum.ts`; `REFERENCES_META` in `dto/ref-key.dto.ts`
- [x] `gaussLegendre20` in `common/utils/gauss-legendre.util.ts` (SRP); re-exported from `numeric.util.ts`
- [x] `dippr-equation-102-method.ts` uses `gaussLegendre20` for numerical integral
- [x] `aly-lee-equation-method.ts` uses exact analytic antiderivative (WolframAlpha verified)
- [ ] **Unit tests** — see PHASE 2 tests section below

---

### PHASE 2 — Unit tests

- [x] `test/unit/thermal/utils/gauss-legendre.util.spec.ts` — GL20 nodes/weights, known polynomial integrals
- [x] `test/unit/thermal/utils/linear-equation-method.spec.ts`
- [x] `test/unit/thermal/utils/quadratic-equation-method.spec.ts`
- [x] `test/unit/thermal/utils/cubic-equation-method.spec.ts`
- [x] `test/unit/thermal/utils/quartic-equation-method.spec.ts`
- [x] `test/unit/thermal/utils/linear-hyperbolic-equation-method.spec.ts`
- [x] `test/unit/thermal/utils/linear-hyperbolic-logarithmic-equation-method.spec.ts`
- [x] `test/unit/thermal/utils/aly-lee-equation-method.spec.ts` — exact integral verified
- [x] `test/unit/thermal/utils/dippr-equation-102-method.spec.ts` — numerical integral vs reference
- [x] `test/unit/thermal/utils/nasa7-equation-method.spec.ts` — Cp, H, S, G vs NIST; Tswitch continuity
- [ ] `test/unit/thermal/utils/nasa9-equation-method.spec.ts` — Cp, H, S, G vs NIST; range boundary continuity; multi-range calculateAverage
- [x] `test/unit/thermal/utils/compound-property-resolver.spec.ts` — preferred resolution logic
- [x] `test/unit/thermal/compound/gas-compounds.spec.ts` — all 8 species registry, Cp sanity

---

## PHASE 3 — Transport service

- [ ] Port `TransportProperties.js` → `transport.service.ts`
- [ ] Add NH3 Sutherland parameters (σ, T₀, S — from Reid et al.)
- [ ] Implement `viscosity(species, T_K)`
- [ ] Implement `viscosityMix(composition, T_K)` (Wilke rule)
- [ ] Implement `thermalConductivity(species, T_K, Cp_J_molK)` (Eucken)
- [ ] Implement `thermalConductivityMix(composition, T_K)`
- [ ] Unit tests: viscosity of O2 at 300K vs known value; Wilke mix for CO2/N2

---

## PHASE 4 — Diffusion service

- [ ] Port `DiffusionCoefficients.js` → `diffusion.service.ts`
- [ ] Add NH3 Lennard-Jones params (σ=2.900Å, ε/k=558.3K)
- [ ] Implement `binaryDiffusion(A, B, T_K, P_atm)`
- [ ] Implement `effectiveDiffusion(species, composition, T_K, P_atm)`
- [ ] Implement `getAllDiffusionCoefficients(composition, T_K, P_atm)`
- [ ] Unit tests: D_12(O2/N2, 300K, 1atm) ≈ 1.8×10⁻⁵ m²/s

---

## PHASE 5 — Gas properties service (facade)

- [ ] Implement `GasPropertiesService.cpSpecies()` — delegates to `FluidConditionCompound` with compound `def` index
- [ ] Implement `GasPropertiesService.cpSpeciesByIndex()` — uses a specific `values[]` index
- [ ] Implement `GasPropertiesService.cpCompare()` — iterates all `values[]` entries, returns Cp from each
- [ ] Implement `GasPropertiesService.h()` — `Nasa7EquationMethod.enthalpy()` via compound `nasa7` entry
- [ ] Implement `GasPropertiesService.s()` — `Nasa7EquationMethod.entropy()`
- [ ] Implement `GasPropertiesService.g()` — `Nasa7EquationMethod.gibbsEnergy()`
- [ ] Implement `GasPropertiesService.cpMixture()` — mass-fraction weighted
- [ ] Implement `GasPropertiesService.hMixture()` — mole-fraction weighted via NASA-7
- [ ] Implement `GasPropertiesService.density()` — ideal gas
- [ ] Implement `GasPropertiesService.prandtl()` — uses `TransportService`
- [ ] Implement `GasPropertiesService.getMixtureProperties()` — aggregates all
- [ ] Unit tests: N2 Cp at 300K and 1800K; `cpCompare('CO2', 1000)` returns all equation types; `h('CO2', 1000)` vs NIST; mixture ρ at 1000K

---

## PHASE 6 — Dimensionless numbers service

See [CH07_DIMENSIONLESS_NUMBERS.md](CH07_DIMENSIONLESS_NUMBERS.md) for full correlation and formula list.

### Enums and DTOs
- [ ] Create `enums/flow-geometry.enum.ts` — all `FlowGeometry` variants: internal (pipe, annulus, ducts, helical coil, corrugated/ribbed), external forced (flat plate, cylinder, sphere, tube banks, cone, elliptical cylinder), natural (vertical/horizontal/inclined/cavity/concentric), mixed, packed/fluidized beds, phase change, rotating, impinging jets
- [ ] Create `enums/body-geometry.enum.ts` — all `BodyGeometry` variants (sphere, cylinder, cube, prism, cone, truncated cone, hollow cylinder, ellipsoid, hemispherical dome)
- [ ] Create `interfaces/geometry-dims.interface.ts` — `{ a, b, c, L, epsilon, S_T, S_L, angle_deg }`
- [ ] Create `dto/dimensionless-input.dto.ts`, `dto/dimensionless-result.dto.ts`
- [ ] Create `dto/body-geometry-input.dto.ts`, `dto/body-geometry-result.dto.ts`

### Primary dimensionless numbers
- [ ] `reynolds`, `reynoldsKinematic`
- [ ] `prandtl`
- [ ] `grashof`, `rayleigh`
- [ ] `hFromNusselt`

### Flow channel geometry helpers
- [ ] `hydraulicDiameter(area, perimeter)`
- [ ] `channelArea(geometry, dims)` — all `FlowGeometry` cross-section variants
- [ ] `channelPerimeter(geometry, dims)`
- [ ] `characteristicLength(geometry, dims)`

### Nusselt dispatcher — `nusselt(params): NusseltResult`

**Internal forced (all D_h-based variants delegate to PIPE_CIRCULAR):**
- [ ] `PIPE_CIRCULAR` — Mills (laminar), Sieder-Tate (laminar μ-correction), Gnielinski (transitional/turbulent), Dittus-Boelter, Petukhov, Russian textbook `0.021` — from `recuperator.js` + [I7] §8
- [ ] `PIPE_ANNULUS` — D_h = D_o − D_i → PIPE_CIRCULAR
- [ ] `DUCT_SQUARE`, `DUCT_RECTANGULAR`, `DUCT_TRIANGULAR`, `DUCT_TRIANGULAR_SCALENE`, `DUCT_ELLIPTICAL`, `DUCT_TRAPEZOIDAL`, `PARALLEL_PLATES` — D_h = 4A/P → PIPE_CIRCULAR
- [ ] `HELICAL_COIL` — Seban & McLaughlin (turbulent), critical Re shift by Schmidt (1967); [VDI] L1.3
- [ ] `CORRUGATED_PIPE` / `RIBBED_CHANNEL` — Webb-Eckert-Goldstein roughness function; [I7] §8.7, [VDI] G8

**External forced:**
- [ ] `FLAT_PLATE` — Churchill–Ozoe (all Re/Pr), laminar avg (0.664), turbulent avg (0.037), mixed; [I7] §7.2
- [ ] `FLAT_PLATE_ROUGH` — VDI F2 roughness correlation
- [ ] `CYLINDER_CROSSFLOW` — Churchill–Bernstein (primary); Hilpert with C/m table (5 Re ranges); [I7] §7.4
- [ ] `ELLIPTICAL_CYLINDER` — Owen (1952) C/m table; [VDI] F5
- [ ] `SPHERE_FORCED` — Whitaker with μ/μ_s correction; [I7] §7.4
- [ ] `CONE_CROSSFLOW` — Yuge (1960) / VDI F6 approximation
- [ ] `TUBE_BANK_INLINE` / `TUBE_BANK_STAGGERED` — Zukauskas with C₁/C₂/m table (4 Re ranges) + row correction C₂; [I7] §7.5

**Natural convection:**
- [ ] `VERTICAL_PLATE` / `VERTICAL_CYLINDER` — Churchill–Chu all-Ra + laminar-only form; cylinder validity check D/L ≥ 35/Gr^0.25; [I7] §9.6
- [ ] `INCLINED_PLATE` — Churchill–Chu with g_eff = g·cos(θ); horizontal correlations for θ > 60°; [I7] §9.8
- [ ] `HORIZONTAL_CYLINDER` — Morgan table (7 Ra ranges) + Churchill–Chu alternative; [I7] §9.6
- [ ] `HORIZONTAL_PLATE_HOT_UP` / `HOT_DOWN` — 0.54·Ra^(1/4), 0.15·Ra^(1/3), 0.27·Ra^(1/4); L_c = A/P; [I7] §9.7
- [ ] `SPHERE_NATURAL` — Churchill; [I7] §9.9
- [ ] `CONCENTRIC_CYLINDERS` — Raithby–Hollands k_eff; [I7] §9.7
- [ ] `CONCENTRIC_SPHERES` — Raithby–Hollands spheres; [I7] §9.7
- [ ] `HORIZONTAL_CAVITY` — Hollands et al. + Globe–Dropkin; [I7] §9.9
- [ ] `VERTICAL_CAVITY` — MacGregor–Emery (4 aspect-ratio ranges); [I7] §9.9

**Mixed convection:**
- [ ] `MIXED_PIPE_VERTICAL` — `(Nu_forced^n ± Nu_natural^n)^(1/n)`, n=3; Gr/Re² threshold; [I7] §9.10
- [ ] `MIXED_PLATE_VERTICAL` — combined form aiding/opposing; [C5] §15-2

**Packed / porous:**
- [ ] `PACKED_BED` — Gunn (primary, from `HeatTransfer.js`); Wakao–Funazkri (secondary)
- [ ] `PACKED_BED_CYLINDER` — D_eq = 6V_p/S_p → Gunn
- [ ] `FLUIDIZED_BED` — Wen & Yu (Re_mf); Molerus & Wirth (heat transfer); [VDI] L3.4

**Phase change:**
- [ ] `CONDENSATION_VERTICAL_PLATE` — Nusselt laminar film + Chen turbulent; h_fg' correction; [I7] §10.6
- [ ] `CONDENSATION_HORIZONTAL_TUBE` — Nusselt horizontal tube; [I7] §10.6
- [ ] `POOL_BOILING` — Rohsenow nucleate; [I7] §10.3 (stub initially)

**Rotating / special:**
- [ ] `ROTATING_DISK` — Dorfman laminar + turbulent; [VDI] H4
- [ ] `ROTATING_CYLINDER` — Bjorklund & Kays (Taylor–Couette); [VDI] H5
- [ ] `IMPINGING_JET_SINGLE` — Martin (1977); [VDI] G8
- [ ] `IMPINGING_JET_ARRAY` — Martin (1977) array; [VDI] G8

### Body geometry methods
- [ ] `bodyArea(geometry, dims, insulationH)` — all `BodyGeometry` variants with insulation offset
- [ ] `bodyVolume(geometry, dims)` — all `BodyGeometry` variants
- [ ] `meanBeamLength(geometry, dims)` — Hottel; `3.6·V/S` fallback for non-tabulated shapes

### Controller endpoints
- [ ] `POST /thermodynamics/dimensionless` — Re, Pr, Gr, Ra, Nu, h
- [ ] `POST /thermodynamics/body-geometry` — surface, volume, meanBeamLength, characteristicLength

### Tests
- [ ] Unit tests per geometry correlation (see CH07 test table)
- [ ] Unit tests for body area, volume, meanBeamLength for all 10 BodyGeometry variants
- [ ] Edge cases: Re=0 (natural convection fallback), Ra=0, insulation h=0

---

## PHASE 7 — Aerodynamics service

- [ ] Port `Aerodynamics.js` → `aerodynamics.service.ts`
- [ ] Implement `pressureDrop` (Ergun equation)
- [ ] Implement `superficialVelocity`
- [ ] Unit tests

---

## PHASE 8 — Module wiring

- [ ] `ThermodynamicsModule` providers + full exports
- [ ] `ThermodynamicsController` — `POST /thermodynamics/properties` (dev/debug)
- [ ] Register in `AppModule`

---

## PHASE 9 — Cleanup

- [ ] No `console.log` in any service
- [ ] All coefficient values cite source (NASA TM-4513, Reid et al., etc.)
- [ ] Update `docs/migration/IMPLEMENTATION_STATUS.md`

