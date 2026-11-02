import { CompoundDataInteraction } from './compound-data-interaction.interface';

/** `interactions.json` */
export interface CompoundDataInteractionsFile {
  generatedAt: string;
  count: number;
  interactions: CompoundDataInteraction[];
}
