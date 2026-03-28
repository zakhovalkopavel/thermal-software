/**
 * Spec for unimplemented fluid-property endpoints.
 *
 * These endpoints expose individual thermophysical properties that can be
 * calculated for both pure species (Mode B: species + T) and gas mixtures
 * (Mode B: composition + T).  Each describe block documents the expected
 * request/response shape and can be filled in as the endpoints are
 * implemented.
 *
 * Run inside Docker:
 *   docker compose exec backend npm run test -- thermodynamics-fluid.controller.spec
 */

describe('ThermodynamicsController — fluid property endpoints (unimplemented)', () => {

  // ────────────────────────────────────────────────────────────────────────────
  // POST /thermodynamics/fluid/cp
  // ────────────────────────────────────────────────────────────────────────────
  describe('POST /thermodynamics/fluid/cp', () => {
    /**
     * Returns isobaric heat capacity Cp [J/(kg·K)] and, for gases, also Cv [J/(kg·K)].
     *
     * Request body (FluidCpInputDto — to be created):
     * {
     *   fluid?: KnownFluid,          // pure species key OR 'gas_mix'
     *   composition?: Record<string, number>,  // mole fractions (required if fluid='gas_mix')
     *   T_fluid_K: number,           // bulk temperature [K]
     *   P_Pa?: number,               // pressure [Pa], default 101325
     *   fractionType?: 'mole'|'mass'
     * }
     *
     * Response (FluidCpResultDto — to be created):
     * {
     *   Cp_J_kgK: number,
     *   Cv_J_kgK?: number,           // gases only: Cv = Cp - R/M
     *   gamma?: number,              // Cp/Cv ratio
     *   molecularWeight_kg_mol: number,
     *   species?: string,
     *   T_K: number
     * }
     */
    it.todo('should return Cp for a pure species (N2 at 1000 K)');
    it.todo('should return Cp and Cv for a gas (CO2 at 500 K)');
    it.todo('should return mixture Cp for a given mole composition');
    it.todo('should return 400 when T_K is missing');
    it.todo('should return 400 when fluid and composition are both absent');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /thermodynamics/fluid/viscosity
  // ────────────────────────────────────────────────────────────────────────────
  describe('POST /thermodynamics/fluid/viscosity', () => {
    /**
     * Returns dynamic viscosity μ [Pa·s] and kinematic viscosity ν [m²/s].
     *
     * Request body (FluidViscosityInputDto — to be created):
     * {
     *   fluid?: KnownFluid,
     *   composition?: Record<string, number>,
     *   T_fluid_K: number,
     *   P_Pa?: number
     * }
     *
     * Response (FluidViscosityResultDto — to be created):
     * {
     *   mu_Pa_s: number,             // dynamic viscosity
     *   nu_m2s: number,              // kinematic viscosity = μ/ρ
     *   rho_kg_m3: number,           // density used for ν
     *   T_K: number
     * }
     */
    it.todo('should return μ and ν for N2 at 500 K');
    it.todo('should return mixture μ for a combustion gas composition');
    it.todo('should return 400 when T_K is out of range');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /thermodynamics/fluid/density
  // ────────────────────────────────────────────────────────────────────────────
  describe('POST /thermodynamics/fluid/density', () => {
    /**
     * Returns ideal-gas density ρ [kg/m³] via ρ = P·M / (R·T).
     *
     * Request body (FluidDensityInputDto — to be created):
     * {
     *   fluid?: KnownFluid,
     *   composition?: Record<string, number>,
     *   T_fluid_K: number,
     *   P_Pa?: number                // default 101325
     * }
     *
     * Response (FluidDensityResultDto — to be created):
     * {
     *   rho_kg_m3: number,
     *   molecularWeight_kg_mol: number,
     *   T_K: number,
     *   P_Pa: number
     * }
     */
    it.todo('should return density for O2 at 300 K, 1 atm');
    it.todo('should return density for a mixture at elevated pressure');
    it.todo('should return 400 when T_K ≤ 0');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET /thermodynamics/fluid/flow-modes
  // ────────────────────────────────────────────────────────────────────────────
  describe('GET /thermodynamics/fluid/flow-modes', () => {
    /**
     * Lists all available FlowRegime enum values with descriptions.
     *
     * Response: Array<{ key: string; description: string }>
     * Example:
     * [
     *   { key: 'laminar',      description: 'Re < 2300 — viscous, ordered flow' },
     *   { key: 'turbulent',    description: 'Re > 10000 — chaotic, high mixing' },
     *   { key: 'transitional', description: '2300 ≤ Re ≤ 10000 — mixed regime' },
     *   { key: 'natural',      description: 'Buoyancy-driven, no forced velocity' },
     *   { key: 'mixed',        description: 'Combined forced + natural convection' },
     * ]
     */
    it.todo('should return all FlowRegime values');
    it.todo('should include descriptions for each regime');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // POST /thermodynamics/fluid/thermal-conductivity
  // ────────────────────────────────────────────────────────────────────────────
  describe('POST /thermodynamics/fluid/thermal-conductivity', () => {
    /**
     * Returns thermal conductivity λ [W/(m·K)] via Eucken-type relation.
     *
     * Request body (FluidThermalConductivityInputDto — to be created):
     * {
     *   fluid?: KnownFluid,
     *   composition?: Record<string, number>,
     *   T_fluid_K: number,
     *   P_Pa?: number
     * }
     *
     * Response (FluidThermalConductivityResultDto — to be created):
     * {
     *   lambda: number,
     *   T_K: number
     * }
     */
    it.todo('should return λ for CO2 at 800 K');
    it.todo('should return mixture λ via Mason-Saxena mixing rule');
    it.todo('should return 400 when composition fractions do not sum to 1');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET /thermodynamics/fluid/list
  // ────────────────────────────────────────────────────────────────────────────
  describe('GET /thermodynamics/fluid/list', () => {
    /**
     * Lists all available named fluids (Species enum + convenience aliases).
     *
     * Response: Array<{ key: string; name: string; formula?: string; Mr_kg_mol?: number }>
     * Example:
     * [
     *   { key: 'N2',  name: 'Nitrogen',        formula: 'N2',  Mr_kg_mol: 0.028014 },
     *   { key: 'CO2', name: 'Carbon dioxide',   formula: 'CO2', Mr_kg_mol: 0.044010 },
     *   { key: 'air', name: 'Air (mixture)',    formula: null,  Mr_kg_mol: 0.028964 },
     *   ...
     * ]
     */
    it.todo('should return all Species enum entries');
    it.todo('should include air and water convenience aliases');
    it.todo('should include molecular weight for each entry');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET /thermodynamics/geometry/list
  // ────────────────────────────────────────────────────────────────────────────
  describe('GET /thermodynamics/geometry/list', () => {
    /**
     * Lists all available FlowGeometry enum values with required dimension fields.
     *
     * Response: Array<{
     *   key: string;
     *   description: string;
     *   requiredDims: string[];      // which GeometryDimsDto fields are required
     *   optionalDims?: string[];
     * }>
     */
    it.todo('should return all FlowGeometry entries');
    it.todo('should document required dimension fields for pipe_circular');
    it.todo('should document required dimension fields for tube_bank_inline');
  });

  // ────────────────────────────────────────────────────────────────────────────
  // GET /thermodynamics/correlations
  // ────────────────────────────────────────────────────────────────────────────
  describe('GET /thermodynamics/correlations', () => {
    /**
     * Lists all available Nusselt correlations with their applicable geometry,
     * flow regime, and validity ranges.
     *
     * Response: Array<{
     *   name: CorrelationName;
     *   geometry: FlowGeometry[];
     *   regimes: FlowRegime[];
     *   Re?: [number, number];       // valid Re range
     *   Pr?: [number, number];       // valid Pr range
     *   Ra?: [number, number];       // valid Ra range
     *   source: string;              // literature reference
     * }>
     */
    it.todo('should return all CorrelationName entries');
    it.todo('should include validity ranges for gnielinski');
    it.todo('should include applicable geometry list for each correlation');
    it.todo('should include literature source for each correlation');
  });

});

