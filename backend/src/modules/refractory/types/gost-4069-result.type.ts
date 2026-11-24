/** GOST 4069 Russian standard result. */
export type GOST4069Result = {
  standard: 'GOST_4069';

  /** GOST cone equivalent */
  coneEquivalent: number;

  /** Refractoriness temperature (°C) */
  refractorinessTemperature_C: number;

  /** Test cone melting point (°C) */
  testConeMeltingPoint_C: number;

  /** Description */
  description: string;
};
