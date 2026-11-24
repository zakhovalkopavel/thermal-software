export type GasMixtureRequest = {
  mode: 'single' | 'range';
  composition: Record<string, number>;
  fractionType: 'mole' | 'mass';
  temperatures_K: number[];
  P_atm: number;
};
