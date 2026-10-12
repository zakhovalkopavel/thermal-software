import { CompoundDataRef } from './compound-data-ref.type';

export type CompoundDataTransportMethodName =
  | 'lennardJones'
  | 'stockmayer'
  | 'exp6'
  | 'correspondingStates'
  | 'modifiedEucken'
  | 'experimental'
  | 'theoretical'
  | 'prandtlExtrapolation'
  | 'exponentialRepulsive'
  | 'scaledFrom'
  | 'sameAs'
  | 'literature';

/**
 * One method Svehla 1995 (NASA TM-4647) Table I used for a property, in the printed order.
 * Units: `units.json` → `transport`; text fields are as printed.
 */
export interface CompoundDataTransportMethod {
  method: CompoundDataTransportMethodName;
  /** Collision diameter σ [m] */
  sigma?: number;
  /** Well depth ε/k_B [K] */
  epsilonToKb?: number;
  /** Stockmayer polar parameter δ [-] */
  delta?: number;
  /** Exp-6 steepness α [-] */
  alpha?: number;
  /** Corresponding-states ρ* and V0* [-] (Boushehri et al. 1987) */
  rhoStar?: number;
  V0Star?: number;
  /** Species whose ρ* and V0* were reused */
  rhoV0From?: string;
  /** Collision-integral ratio A* [-] */
  AStar?: number;
  /** Rotational collision number of the modified Eucken correction; absent = no rotational correction */
  Z?: number;
  /** Method limits [K]; absent = no limit */
  TminK?: number;
  TmaxK?: number;
  /** Prandtl number calculated up to this temperature [K], then extrapolated */
  prandtlCalculatedToK?: number;
  /** High-temperature data scaled to the low-temperature data at `matchTemperatureK` */
  scaledToMatch?: boolean;
  ratio?: string;
  ratioFixedAboveK?: number;
  electronPressureAtm?: number;
  /** Interaction the method was taken from (`sameAs`, `scaledFrom`) */
  interaction?: string;
  /** viscosityData, diffusionData, thermalConductivityData, combiningRules, estimated, molecularBeamScattering */
  basis?: string;
  /** Citation as printed, e.g. "Bich, Millat, and Vogel 1990" */
  source?: string;
  AStarSource?: string;
  sigmaEpsilonSource?: string;
  rhoV0Source?: string;
  estimatedFrom?: string;
}

/** How the NASA Lewis transport fit of one property was obtained (Svehla 1995 Table I, one row) */
export interface CompoundDataTransportValue {
  methods: CompoundDataTransportMethod[];
  /** High- and low-temperature data forced to agree here [K] */
  matchTemperatureK?: number;
  ref: CompoundDataRef;
}

/** `CompoundDataRecord.transport`: pure-species rows of Svehla 1995 Table I */
export interface CompoundDataTransport {
  viscosity?: CompoundDataTransportValue[];
  thermalConductivity?: CompoundDataTransportValue[];
}
