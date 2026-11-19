import { CompoundDataInteraction } from './compound-data-interaction.type';

/** `interactions.json` */
export type CompoundDataInteractionsFile = {
  generatedAt: string;
  count: number;
  interactions: CompoundDataInteraction[];
}
