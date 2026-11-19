import { BadRequestException, Injectable } from '@nestjs/common';
import { GasPropertiesService } from './gas-properties.service';
import { TransportService } from './transport.service';
import { CompoundFluidPropsService } from './compound-fluid-props.service';
import { Species, CorrelationName } from '../enums';
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
import { GEOMETRY_LIST } from '../data/geometry-list.data';
import {
  FlowModeEntry,
  FluidListEntry,
  GeometryListEntry,
  CorrelationListEntry,
} from '../interfaces/fluid-property.interfaces';
import { GasDensity } from '../utils/density/gas-density';

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
    const r    = this.transport.viscosityMixResult(mole, T, P);
    const rho  = GasDensity.forMixture(mole, T, P);
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
    if (named) {
      return {
        rho_kg_m3: GasDensity.forCompound(named.compound, T, P),
        molecularWeight_kg_mol: named.compound.Mr, T_K: T, P_Pa: P,
      };
    }
    const mole = this._requireComposition(dto.composition);
    return {
      rho_kg_m3: GasDensity.forMixture(mole, T, P),
      molecularWeight_kg_mol: this.gasProps.molecularWeight(mole), T_K: T, P_Pa: P,
    };
  }

  // ── Thermal conductivity ──────────────────────────────────────────────────

  getThermalConductivity(dto: FluidBaseInputDto): FluidThermalConductivityResultDto {
    this._validateNoCompositionConflict(dto);
    const T = this._requireT(dto.T_fluid_K);
    const P = dto.P_Pa ?? STANDARD_CONDITIONS.PRESSURE_PA;
    const named = this._resolveNamedCompound(dto);
    if (named) {
      const props = this.compoundFluidProps.resolve(named.compound, T, P);
      return { lambda: props.lambda, T_K: T, validity: props.lambdaValidity, mixtureValidity: props.mixtureValidity };
    }
    const mole = this._requireComposition(dto.composition);
    const cpBySp = Object.fromEntries(
      (Object.keys(mole) as Species[]).map(sp => [sp, this.gasProps.cpSpecies(sp, T)]),
    ) as Partial<Record<Species, number>>;
    const r = this.transport.thermalConductivityMixResult(mole, T, cpBySp, P);
    return { lambda: r.value, T_K: T, validity: r.validity, mixtureValidity: r.mixtureValidity };
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
    return [...GEOMETRY_LIST];
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
