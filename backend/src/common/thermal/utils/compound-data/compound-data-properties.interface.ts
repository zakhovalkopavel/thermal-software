import { CompoundDataPropertyValue } from './compound-data-property-value.interface';

type Values = CompoundDataPropertyValue[];

/** Scalar properties of a record, values in source priority order; SI units */
export interface CompoundDataProperties {
  /** Melting point [K] */
  meltingPoint?: Values;
  /** Normal boiling point [K] */
  boilingPoint?: Values;
  /** Density at room temperature [kg/m3] */
  density?: Values;
  /** Enthalpy of fusion [J/mol] */
  heatOfFusion?: Values;
  /** Standard enthalpy of formation at 298.15 K [J/mol], per phase */
  enthalpyFormation298?: Values;
  /** Standard Gibbs energy of formation at 298.15 K [J/mol], per phase */
  gibbsEnergy298?: Values;
  /** Standard molar entropy at 298.15 K [J/(mol K)], per phase */
  entropy298?: Values;
  /** Isobaric molar heat capacity at 298.15 K [J/(mol K)], per phase */
  heatCapacity298?: Values;
  /** Molar volume of the solid [m3/mol] */
  molarVolume?: Values;
  /** Critical temperature [K] */
  criticalTemperature?: Values;
  /** Critical pressure [Pa] */
  criticalPressure?: Values;
  /** Critical molar volume [m3/mol] */
  criticalVolume?: Values;
  /** Acentric factor [-] */
  acentricFactor?: Values;
  /**
   * Collision diameter σ [m], `potential` per value (Poling5, Magalhaes2013, White3, Itean1961, Mamedov2014,
   * Svehla1995)
   */
  collisionDiameter?: Values;
  /** Well depth ε/k_B [K], `potential` per value; same sources as `collisionDiameter` */
  epsilonToKb?: Values;
  /** Stockmayer polar parameter δ [-] (Itean1961, Svehla1995) */
  stockmayerDelta?: Values;
  /** Dipole moment [C m] (Itean1961) */
  dipoleMoment?: Values;
  /** Corresponding-states ρ* [-] (Svehla1995 ← Boushehri et al. 1987) */
  rhoStar?: Values;
  /** Corresponding-states V0* [-] (Svehla1995 ← Boushehri et al. 1987) */
  V0Star?: Values;
}
