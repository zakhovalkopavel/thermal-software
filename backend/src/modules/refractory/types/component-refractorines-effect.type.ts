/** Component contribution to refractoriness. */
export type ComponentRefractorinesEffect = {
  /** Component name */
  component: string;

  /** Weight percentage */
  percentage: number;

  /** Effect value (K) */
  effect: number;

  /** Contribution to total (K) */
  contribution: number;

  /** Component category */
  category: 'network-former' | 'network-modifier' | 'flux' | 'destabilizer';
};
