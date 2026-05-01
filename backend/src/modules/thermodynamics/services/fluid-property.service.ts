import { BadRequestException, Injectable } from '@nestjs/common';
import { GasPropertiesService } from './gas-properties.service';
import { TransportService } from './transport.service';
import { Species } from '../enums';
import { Common } from '../../../common/thermal';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas';
import { Air } from '../../../common/thermal/compound/gas';
import { AIR_MOLE_COMPOSITION } from '../../../common/thermal/compound/composition';
import { FluidBaseInputDto } from '../dto/fluid-base-input.dto';
import { FluidCpResultDto } from '../dto/fluid-cp-result.dto';
import { FluidViscosityResultDto } from '../dto/fluid-viscosity-result.dto';
import { FluidDensityResultDto } from '../dto/fluid-density-result.dto';
import { FluidThermalConductivityResultDto } from '../dto/fluid-thermal-conductivity-result.dto';
import { FlowRegime } from '../types';
import { FlowGeometry } from '../enums';
import { CorrelationName } from '../enums';
import { CORRELATION_VALIDITY } from '../helpers/correlation-validity.helper';
import {
  FlowModeEntry,
  FluidListEntry,
  GeometryListEntry,
  CorrelationListEntry,
} from '../interfaces/fluid-property.interfaces';

// ── Air molar mass (convenience alias) ───────────────────────────────────────
const AIR_MR = Air.Mr; // 0.028951 kg/mol

/**
 * FluidPropertyService — orchestration layer for individual thermophysical
 * property endpoints under /thermodynamics/fluid/*.
 *
 * SRP: owns the logic for resolving species vs mixture, air/water aliases,
 * and delegating maths to GasPropertiesService and TransportService.
 */
@Injectable()
export class FluidPropertyService {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
  ) {}

  // ── Cp ────────────────────────────────────────────────────────────────────

  getCp(dto: FluidBaseInputDto): FluidCpResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);

    if (dto.fluid === 'air') {
      const M        = AIR_MR;
      // Use Air compound's own polynomial correlation (Aly-Lee, Perry 7th) via
      // mixture rule over nominal mole fractions — consistent with all other species.
      const Cp_mol   = this.gasProps.cpMixture(
        AIR_MOLE_COMPOSITION as Partial<Record<Species, number>>,
        T,
      );
      const Cp_J_kgK = Cp_mol / M;
      const Cv_J_kgK = Cp_J_kgK - Common.R / M;
      return { Cp_J_kgK, Cv_J_kgK, gamma: Cp_J_kgK / Cv_J_kgK, molecularWeight_kg_mol: M, species: 'air', T_K: T };
    }

    if (dto.fluid && dto.fluid !== 'gas_mix') {
      const { sp, M } = this._resolveSpecies(dto.fluid);
      const Cp_mol    = this.gasProps.cpSpecies(sp, T);
      const Cp_J_kgK  = Cp_mol / M;
      const Cv_J_kgK  = Cp_J_kgK - Common.R / M;
      return { Cp_J_kgK, Cv_J_kgK, gamma: Cp_J_kgK / Cv_J_kgK, molecularWeight_kg_mol: M, species: sp, T_K: T };
    }

    const mole     = this._requireComposition(dto.composition);
    const M        = this.gasProps.molecularWeight(mole);
    const Cp_mol   = this.gasProps.cpMixture(mole, T);
    const Cp_J_kgK = Cp_mol / M;
    const Cv_J_kgK = Cp_J_kgK - Common.R / M;
    return { Cp_J_kgK, Cv_J_kgK, gamma: Cp_J_kgK / Cv_J_kgK, molecularWeight_kg_mol: M, T_K: T };
  }

  // ── Viscosity ─────────────────────────────────────────────────────────────

  getViscosity(dto: FluidBaseInputDto): FluidViscosityResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);
    const P = dto.P_Pa ?? Common.pAtm;

    let mu: number;
    let M: number;

    if (dto.fluid && dto.fluid !== 'gas_mix') {
      const { sp } = this._resolveSpecies(dto.fluid);
      M  = GAS_REGISTRY[sp]?.Mr ?? AIR_MR;
      mu = this.transport.viscosity(sp, T);
    } else {
      const mole = this._requireComposition(dto.composition);
      M          = this.gasProps.molecularWeight(mole);
      mu         = this.transport.viscosityMix(mole, T);
    }

    const rho     = this.gasProps.density(M, T, P);
    const nu_m2s  = mu / rho;
    return { mu_Pa_s: mu, nu_m2s, rho_kg_m3: rho, T_K: T };
  }

  // ── Density ───────────────────────────────────────────────────────────────

  getDensity(dto: FluidBaseInputDto): FluidDensityResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);
    const P = dto.P_Pa ?? Common.pAtm;

    let M: number;

    if (dto.fluid && dto.fluid !== 'gas_mix') {
      const resolved = this._resolveSpecies(dto.fluid);
      M = resolved.M;
    } else {
      const mole = this._requireComposition(dto.composition);
      M          = this.gasProps.molecularWeight(mole);
    }

    const rho = this.gasProps.density(M, T, P);
    return { rho_kg_m3: rho, molecularWeight_kg_mol: M, T_K: T, P_Pa: P };
  }

  // ── Thermal conductivity ──────────────────────────────────────────────────

  getThermalConductivity(dto: FluidBaseInputDto): FluidThermalConductivityResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);

    let lambda: number;

    if (dto.fluid && dto.fluid !== 'gas_mix') {
      const { sp } = this._resolveSpecies(dto.fluid);
      const Cp_mol = this.gasProps.cpSpecies(sp, T);
      lambda = this.transport.thermalConductivity(sp, T, Cp_mol);
    } else {
      const mole   = this._requireComposition(dto.composition);
      const cpBySp = Object.fromEntries(
        (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T)]),
      ) as Partial<Record<Species, number>>;
      lambda = this.transport.thermalConductivityMix(mole, T, cpBySp);
    }

    return { lambda, T_K: T };
  }

  // ── Flow modes list ───────────────────────────────────────────────────────

  getFlowModes(): FlowModeEntry[] {
    return [
      { key: FlowRegime.LAMINAR,      description: 'Re < 2300 — viscous, ordered flow' },
      { key: FlowRegime.TURBULENT,    description: 'Re > 10000 — chaotic, high mixing' },
      { key: FlowRegime.TRANSITIONAL, description: '2300 ≤ Re ≤ 10000 — mixed regime' },
      { key: FlowRegime.NATURAL,      description: 'Buoyancy-driven, no forced velocity' },
      { key: FlowRegime.MIXED,        description: 'Combined forced + natural convection' },
    ];
  }

  // ── Fluid list ────────────────────────────────────────────────────────────

  getFluidList(): FluidListEntry[] {
    const entries: FluidListEntry[] = Object.entries(GAS_REGISTRY).map(([key, c]) => ({
      key,
      name:       c.name,
      formula:    c.chemicalFormula,
      Mr_kg_mol:  c.Mr,
    }));
    entries.push({ key: 'air',   name: 'Air (dry atmospheric mixture)',   formula: null, Mr_kg_mol: AIR_MR });
    entries.push({ key: 'gas_mix', name: 'Custom gas mixture (supply composition)', formula: null, Mr_kg_mol: null });
    return entries;
  }

  // ── Geometry list ─────────────────────────────────────────────────────────

  getGeometryList(): GeometryListEntry[] {
    return [
      { key: FlowGeometry.PIPE_CIRCULAR,             description: 'Circular pipe (internal flow)',            requiredDims: ['a'],       optionalDims: ['L'] },
      { key: FlowGeometry.PIPE_ANNULUS,              description: 'Annular gap between concentric cylinders', requiredDims: ['a', 'b'],   optionalDims: ['L'] },
      { key: FlowGeometry.DUCT_SQUARE,               description: 'Square duct (internal flow)',              requiredDims: ['a'],       optionalDims: ['L'] },
      { key: FlowGeometry.DUCT_RECTANGULAR,          description: 'Rectangular duct (internal flow)',         requiredDims: ['a', 'b'],  optionalDims: ['L'] },
      { key: FlowGeometry.DUCT_TRIANGULAR,           description: 'Equilateral triangular duct',             requiredDims: ['a'],       optionalDims: ['L'] },
      { key: FlowGeometry.DUCT_TRIANGULAR_SCALENE,   description: 'Scalene triangular duct',                 requiredDims: ['a', 'b', 'c'] },
      { key: FlowGeometry.DUCT_ELLIPTICAL,           description: 'Elliptical duct',                         requiredDims: ['a', 'b'] },
      { key: FlowGeometry.DUCT_TRAPEZOIDAL,          description: 'Trapezoidal duct',                        requiredDims: ['a', 'b', 'c'] },
      { key: FlowGeometry.PARALLEL_PLATES,           description: 'Parallel-plate channel',                  requiredDims: ['a', 'b'] },
      { key: FlowGeometry.HELICAL_COIL,              description: 'Helical coil (internal flow)',            requiredDims: ['D', 'D_c'] },
      { key: FlowGeometry.CORRUGATED_PIPE,           description: 'Corrugated pipe',                         requiredDims: ['a'] },
      { key: FlowGeometry.RIBBED_CHANNEL,            description: 'Ribbed channel',                          requiredDims: ['a', 'b', 'e', 'p'] },
      { key: FlowGeometry.FLAT_PLATE,                description: 'Flat plate (external flow)',              requiredDims: ['c'],       optionalDims: ['a'] },
      { key: FlowGeometry.FLAT_PLATE_ROUGH,          description: 'Rough flat plate (external flow)',        requiredDims: ['c'] },
      { key: FlowGeometry.CYLINDER_CROSSFLOW,        description: 'Cylinder in external crossflow',         requiredDims: ['a'] },
      { key: FlowGeometry.SPHERE_FORCED,             description: 'Sphere in forced external flow',         requiredDims: ['a'] },
      { key: FlowGeometry.TUBE_BANK_INLINE,          description: 'Inline tube bank',                       requiredDims: ['a', 'S_T', 'S_L'] },
      { key: FlowGeometry.TUBE_BANK_STAGGERED,       description: 'Staggered tube bank',                    requiredDims: ['a', 'S_T', 'S_L'] },
      { key: FlowGeometry.CONE_CROSSFLOW,            description: 'Cone in external crossflow',             requiredDims: ['a'] },
      { key: FlowGeometry.ELLIPTICAL_CYLINDER,       description: 'Elliptical cylinder in external flow',   requiredDims: ['a', 'b'] },
      { key: FlowGeometry.VERTICAL_PLATE,            description: 'Vertical plate (natural convection)',    requiredDims: ['b'],       optionalDims: ['a'] },
      { key: FlowGeometry.VERTICAL_CYLINDER,         description: 'Vertical cylinder (natural convection)', requiredDims: ['b'],       optionalDims: ['a'] },
      { key: FlowGeometry.HORIZONTAL_CYLINDER,       description: 'Horizontal cylinder (natural)',          requiredDims: ['a'] },
      { key: FlowGeometry.HORIZONTAL_PLATE_HOT_UP,   description: 'Horizontal plate, hot side up',         requiredDims: ['a', 'b'] },
      { key: FlowGeometry.HORIZONTAL_PLATE_HOT_DOWN, description: 'Horizontal plate, hot side down',       requiredDims: ['a', 'b'] },
      { key: FlowGeometry.INCLINED_PLATE,            description: 'Inclined plate (natural convection)',   requiredDims: ['b'],       optionalDims: ['angle_deg'] },
      { key: FlowGeometry.SPHERE_NATURAL,            description: 'Sphere (natural convection)',            requiredDims: ['a'] },
      { key: FlowGeometry.CONCENTRIC_CYLINDERS,      description: 'Concentric cylinders (natural)',        requiredDims: ['a', 'b'] },
      { key: FlowGeometry.CONCENTRIC_SPHERES,        description: 'Concentric spheres (natural)',          requiredDims: ['a', 'b'] },
      { key: FlowGeometry.HORIZONTAL_CAVITY,         description: 'Horizontal cavity (natural)',           requiredDims: ['a', 'b'] },
      { key: FlowGeometry.VERTICAL_CAVITY,           description: 'Vertical cavity (natural)',             requiredDims: ['a', 'b'] },
      { key: FlowGeometry.MIXED_PIPE_VERTICAL,       description: 'Vertical pipe (mixed convection)',      requiredDims: ['a'] },
      { key: FlowGeometry.MIXED_PLATE_VERTICAL,      description: 'Vertical plate (mixed convection)',     requiredDims: ['b'] },
      { key: FlowGeometry.PACKED_BED,                description: 'Packed bed (sphere particles)',         requiredDims: ['a'],       optionalDims: ['epsilon'] },
      { key: FlowGeometry.PACKED_BED_CYLINDER,       description: 'Packed bed (cylinder particles)',       requiredDims: ['a'],       optionalDims: ['epsilon'] },
      { key: FlowGeometry.FLUIDIZED_BED,             description: 'Fluidized bed',                         requiredDims: ['a'] },
      { key: FlowGeometry.CONDENSATION_VERTICAL_PLATE,  description: 'Condensation on vertical plate',    requiredDims: ['b'] },
      { key: FlowGeometry.CONDENSATION_HORIZONTAL_TUBE, description: 'Condensation on horizontal tube',   requiredDims: ['a'] },
      { key: FlowGeometry.POOL_BOILING,              description: 'Pool boiling',                          requiredDims: [] },
      { key: FlowGeometry.ROTATING_DISK,             description: 'Rotating disk',                         requiredDims: ['a'],       optionalDims: ['omega'] },
      { key: FlowGeometry.ROTATING_CYLINDER,         description: 'Rotating cylinder',                     requiredDims: ['a'],       optionalDims: ['omega'] },
      { key: FlowGeometry.IMPINGING_JET_SINGLE,      description: 'Single impinging jet',                  requiredDims: ['d_jet', 'H', 'r'] },
      { key: FlowGeometry.IMPINGING_JET_ARRAY,       description: 'Array of impinging jets',               requiredDims: ['d_jet', 'H', 'f_jet'] },
    ];
  }

  // ── Correlation list ──────────────────────────────────────────────────────

  getCorrelationList(): CorrelationListEntry[] {
    return (Object.keys(CORRELATION_VALIDITY) as CorrelationName[]).map(name => {
      const v = CORRELATION_VALIDITY[name]!;
      const entry: CorrelationListEntry = { name, geometry: v.geometries };
      /** Replace JS Infinity with the string "Infinity" for JSON serialisation */
      const sanitiseBound = (n: number): number | string =>
        Number.isFinite(n) ? n : 'Infinity';
      if (v.Re) entry.Re = [v.Re[0], sanitiseBound(v.Re[1])];
      if (v.Pr) entry.Pr = [v.Pr[0], sanitiseBound(v.Pr[1])];
      if (v.Ra) entry.Ra = [v.Ra[0], sanitiseBound(v.Ra[1])];
      return entry;
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Throws 400 when a named fluid AND a non-empty composition are both supplied.
   * Composition is only meaningful for `fluid = 'gas_mix'` (or when fluid is absent).
   */
  private _validateNoCompositionConflict(dto: FluidBaseInputDto): void {
    if (
      dto.fluid &&
      dto.fluid !== 'gas_mix' &&
      dto.composition &&
      Object.keys(dto.composition).length > 0
    ) {
      throw new BadRequestException(
        `composition must not be provided when fluid is a named species ('${dto.fluid}'). ` +
        `Set fluid='gas_mix' and supply composition instead.`,
      );
    }
  }

  /** Throws 400 when temperature is missing or ≤ 0 */
  private _requireT(T?: number): number {
    if (T === undefined || T === null)
      throw new BadRequestException('T_fluid_K is required');
    if (T <= 0)
      throw new BadRequestException('T_fluid_K must be > 0 K');
    return T;
  }

  /**
   * Resolve a KnownFluid alias (excluding 'gas_mix' and 'air') to a Species + molar mass.
   * 'air' is handled separately because it is not in GAS_REGISTRY.
   */
  private _resolveSpecies(fluid: string): { sp: Species; M: number } {
    const sp = fluid as Species;
    const compound = GAS_REGISTRY[sp];
    if (!compound) throw new BadRequestException(`Unknown fluid: ${fluid}`);
    return { sp, M: compound.Mr };
  }

  private _requireComposition(composition?: Record<string, number>): Partial<Record<Species, number>> {
    if (!composition || Object.keys(composition).length === 0)
      throw new BadRequestException('composition is required when fluid is gas_mix or absent');
    const sum = Object.values(composition).reduce((acc, v) => acc + v, 0);
    if (sum <= 0)
      throw new BadRequestException('composition fractions must sum to a positive number');
    if (Math.abs(sum - 1) > 1e-6) {
      const normalised: Record<string, number> = {};
      for (const [k, v] of Object.entries(composition)) normalised[k] = v / sum;
      return normalised as Partial<Record<Species, number>>;
    }
    return composition as Partial<Record<Species, number>>;
  }
}

