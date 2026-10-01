export type XYSeries = {
  name: string;
  data: [number, number][];
  dashStyle?: 'Solid' | 'Dash' | 'ShortDot';
  emphasis?: boolean;
  yAxis?: number;
  unit?: string;
  color?: string;
  /** Dashed / coloured x-ranges of the line, e.g. clamped segments: `[{ value: 600, dashStyle: 'Dash' }, {}]`. */
  zones?: Array<{ value?: number; dashStyle?: 'Solid' | 'Dash' | 'ShortDot'; color?: string }>;
  step?: 'left' | 'center' | 'right';
  showMarkers?: boolean;
};
