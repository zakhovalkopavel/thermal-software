/** `[min, max]`; the backend serialises an open upper bound as the string "Infinity". */
export type CorrelationRange = [number, number | 'Infinity'];
