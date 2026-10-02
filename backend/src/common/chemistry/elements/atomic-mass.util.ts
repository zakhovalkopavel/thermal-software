import { CHEMISTRY } from '../constants/chemistry.constants';
import { ChemicalElement } from './chemical-element.interface';
import { PERIODIC_TABLE } from './periodic-table.data';

/** Molar mass of an element [kg/mol]; throws for unknown symbols and elements without a standard atomic weight */
export function atomicMass(symbol: string): number {
  const element: ChemicalElement | undefined = (PERIODIC_TABLE as Record<string, ChemicalElement>)[symbol];
  if (!element) throw new Error(`Unknown chemical element: ${symbol}`);
  if (element.atomicWeight === null) throw new Error(`Element ${symbol} has no standard atomic weight`);
  return element.atomicWeight / CHEMISTRY.GRAMS_PER_KILOGRAM;
}
