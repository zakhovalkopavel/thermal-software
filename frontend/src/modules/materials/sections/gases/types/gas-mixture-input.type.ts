export type GasMixtureInput = {
  composition: Record<string, number>;
  T_K: number;
  P_atm?: number;
  fractionType?: 'mole' | 'mass';
};
