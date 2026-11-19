import { GasStream } from './gas-stream.type';
import { CondensedStream } from './condensed-stream.type';

export type ReactionStepInput = {
  gasStreams: GasStream[];
  condensed?: CondensedStream;
  /** Heat removed from the reacting volume (walls) [W] */
  heatLoss_W?: number;
}
