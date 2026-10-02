import { GasStream } from './gas-stream.interface';
import { CondensedStream } from './condensed-stream.interface';

export interface ReactionStepInput {
  gasStreams: GasStream[];
  condensed?: CondensedStream;
  /** Heat removed from the reacting volume (walls) [W] */
  heatLoss_W?: number;
}
