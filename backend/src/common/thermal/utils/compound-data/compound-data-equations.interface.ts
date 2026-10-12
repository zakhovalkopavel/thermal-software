import { CompoundDataEquationList } from './compound-data-equation-list.interface';
import { CompoundDataPhase } from './compound-data-phase.type';

type ByPhase = Partial<Record<CompoundDataPhase, CompoundDataEquationList>>;

/** Temperature-dependent properties of a record, keyed by phase; T [K], results in SI units */
export interface CompoundDataEquations {
  /** Isobaric molar heat capacity Cp [J/(mol K)] */
  heatCapacity?: ByPhase;
  /** Dynamic viscosity μ [Pa s] */
  viscosity?: ByPhase;
  /** Thermal conductivity λ [W/(m K)] */
  thermalConductivity?: ByPhase;
  /** Density ρ [kg/m3] */
  density?: ByPhase;
  /** Enthalpy of vaporization ΔHvap [J/mol] */
  enthalpyVaporization?: ByPhase;
  /** Surface tension σ [N/m] */
  surfaceTension?: ByPhase;
  /** Saturated vapor pressure Psat [Pa] */
  vaporPressure?: ByPhase;
}
