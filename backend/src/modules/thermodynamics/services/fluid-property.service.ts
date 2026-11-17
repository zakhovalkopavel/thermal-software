import { BadRequestException, Injectable } from '@nestjs/common';
import { GasPropertiesService } from './gas-properties.service';
import { TransportService } from './transport.service';
import { CompoundFluidPropsService } from './compound-fluid-props.service';
import { Species, FlowGeometry, CorrelationName } from '../enums';
import { PHYSICAL_CONSTANTS, STANDARD_CONDITIONS } from '../../../common/thermal';
import { FLUID_REGISTRY } from '../../../common/thermal/compound/gas';
import { CompoundValue } from '../../../common/thermal/interfaces/compound-value.interface';
import { CompoundValueBuilder } from '../../../common/thermal/utils/compound-data';
import { FluidBaseInputDto } from '../dto/fluid/fluid-base-input.dto';
import { FluidCpResultDto } from '../dto/fluid/fluid-cp-result.dto';
import { FluidViscosityResultDto } from '../dto/fluid/fluid-viscosity-result.dto';
import { FluidDensityResultDto } from '../dto/fluid/fluid-density-result.dto';
import { FluidThermalConductivityResultDto } from '../dto/fluid/fluid-thermal-conductivity-result.dto';
import { FlowRegime, KnownFluids } from '../types';
import { CORRELATION_VALIDITY } from '../constants/correlation-validity.constants';
import {
  FlowModeEntry,
  FluidListEntry,
  GeometryListEntry,
  CorrelationListEntry,
} from '../interfaces/fluid-property.interfaces';

/**
 * FluidPropertyService — orchestration for /thermodynamics/fluid/*.
 *
 * Named fluids resolve to a `CompoundValue` (registry species or composition
 * compounds such as air). Missing equation buckets fall back to
 * `compound.composition` as a mole-fraction mixture — no fluid-specific branches.
 */
@Injectable()
export class FluidPropertyService {
  constructor(
    private readonly gasProps: GasPropertiesService,
    private readonly transport: TransportService,
    private readonly compoundFluidProps: CompoundFluidPropsService,
  ) {}

  // ── Cp ────────────────────────────────────────────────────────────────────

  getCp(dto: FluidBaseInputDto): FluidCpResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);
    const named = this._resolveNamedCompound(dto);

    if (named) {
      const props = this.compoundFluidProps.resolve(named.compound, T);
      const Cv_J_kgK = props.Cp_J_kgK - PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK / props.M;
      return {
        Cp_J_kgK: props.Cp_J_kgK,
        Cv_J_kgK,
        gamma: props.Cp_J_kgK / Cv_J_kgK,
        molecularWeight_kg_mol: props.M,
        species: named.label,
        T_K: T,
        validity: props.cpValidity,
        mixtureValidity: props.mixtureValidity,
      };
    }

    const mole     = this._requireComposition(dto.composition);
    const M        = this.gasProps.molecularWeight(mole);
    const cpResult = this.gasProps.cpMixtureResult(mole, T);
    const Cp_J_kgK = cpResult.value / M;
    const Cv_J_kgK = Cp_J_kgK - PHYSICAL_CONSTANTS.GAS_CONSTANT_J_MOLK / M;
    return {
      Cp_J_kgK, Cv_J_kgK, gamma: Cp_J_kgK / Cv_J_kgK, molecularWeight_kg_mol: M, T_K: T,
      validity: cpResult.validity,
      mixtureValidity: cpResult.mixtureValidity,
    };
  }

  // ── Viscosity ─────────────────────────────────────────────────────────────

  getViscosity(dto: FluidBaseInputDto): FluidViscosityResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);
    const P = dto.P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA;
    const named = this._resolveNamedCompound(dto);

    if (named) {
      const props = this.compoundFluidProps.resolve(named.compound, T, P);
      return {
        mu_Pa_s: props.mu_Pa_s,
        nu_m2s: props.nu_m2s,
        rho_kg_m3: props.rho_kg_m3,
        T_K: T,
        validity: props.muValidity,
        mixtureValidity: props.mixtureValidity,
      };
    }

    const mole = this._requireComposition(dto.composition);
    const M    = this.gasProps.molecularWeight(mole);
    const r    = this.transport.viscosityMixResult(mole, T);
    const rho  = this.gasProps.density(M, T, P);
    return {
      mu_Pa_s: r.value,
      nu_m2s: r.value / rho,
      rho_kg_m3: rho,
      T_K: T,
      validity: r.validity,
      mixtureValidity: r.mixtureValidity,
    };
  }

  // ── Density ───────────────────────────────────────────────────────────────

  getDensity(dto: FluidBaseInputDto): FluidDensityResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);
    const P = dto.P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA;
    const named = this._resolveNamedCompound(dto);

    let M: number;
    if (named) {
      M = named.compound.Mr;
    } else {
      M = this.gasProps.molecularWeight(this._requireComposition(dto.composition));
    }

    const rho = this.gasProps.density(M, T, P);
    return { rho_kg_m3: rho, molecularWeight_kg_mol: M, T_K: T, P_Pa: P };
  }

  // ── Thermal conductivity ──────────────────────────────────────────────────

  getThermalConductivity(dto: FluidBaseInputDto): FluidThermalConductivityResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);
    const named = this._resolveNamedCompound(dto);

    if (named) {
      const props = this.compoundFluidProps.resolve(named.compound, T);
      return {
        lambda: props.lambda,
        T_K: T,
        validity: props.lambdaValidity,
        mixtureValidity: props.mixtureValidity,
      };
    }

    const mole   = this._requireComposition(dto.composition);
    const cpBySp = Object.fromEntries(
      (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T)]),
    ) as Partial<Record<Species, number>>;
    const r = this.transport.thermalConductivityMixResult(mole, T, cpBySp);
    return {
      lambda: r.value,
      T_K: T,
      validity: r.validity,
      mixtureValidity: r.mixtureValidity,
    };
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
    const entries: FluidListEntry[] = Object.entries(FLUID_REGISTRY).map(([key, c]) => ({
      key,
      name:       c.name,
      formula:    c.chemicalFormula,
      Mr_kg_mol:  c.Mr,
    }));
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
      const sanitiseBound = (n: number): number | string =>
        Number.isFinite(n) ? n : 'Infinity';
      if (v.Re) entry.Re = [v.Re[0], sanitiseBound(v.Re[1])];
      if (v.Pr) entry.Pr = [v.Pr[0], sanitiseBound(v.Pr[1])];
      if (v.Ra) entry.Ra = [v.Ra[0], sanitiseBound(v.Ra[1])];
      return entry;
    });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _requireCompound(fluid: string): CompoundValue {
    const compound = FLUID_REGISTRY[fluid];
    if (!compound) throw new BadRequestException(`Unknown fluid: ${fluid}`);
    return compound;
  }

  /**
   * Resolve a pure named fluid from `fluid` (registry) or `compoundId` (catalogue).
   * Returns null when the request is a composition / gas_mix path.
   */
  private _resolveNamedCompound(
    dto: FluidBaseInputDto,
  ): { compound: CompoundValue; label: string } | null {
    if (dto.compoundId) {
      if (dto.fluid && dto.fluid !== 'gas_mix') {
        throw new BadRequestException('Provide either fluid or compoundId, not both');
      }
      try {
        return { compound: CompoundValueBuilder.fromId(dto.compoundId), label: dto.compoundId };
      } catch (error) {
        throw new BadRequestException((error as Error).message);
      }
    }
    const fluid = KnownFluids.normalize(dto.fluid);
    if (fluid && fluid !== 'gas_mix') {
      return { compound: this._requireCompound(fluid), label: fluid };
    }
    return null;
  }

  private _validateNoCompositionConflict(dto: FluidBaseInputDto): void {
    if (dto.compoundId && dto.composition && Object.keys(dto.composition).length > 0) {
      throw new BadRequestException('composition must not be provided when compoundId is set');
    }
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

  private _requireT(T?: number): number {
    if (T === undefined || T === null)
      throw new BadRequestException('T_fluid_K is required');
    if (T <= 0)
      throw new BadRequestException('T_fluid_K must be > 0 K');
    return T;
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
