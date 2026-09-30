export type PureGasRequest = {
  mode: 'single' | 'range';
  gases: string[];
  temperatures_K: number[];
  P_Pa: number;
};
