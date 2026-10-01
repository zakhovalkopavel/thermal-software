export type ConvertCompositionResult = {
  input: Record<string, number>;
  output: Record<string, number>;
  direction: 'wt_to_mol' | 'mol_to_wt';
};
