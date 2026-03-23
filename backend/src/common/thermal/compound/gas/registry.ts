import { CompoundValue } from '../../interfaces/compound-value.interface';
import { N2  } from './n2';
import { O2  } from './o2';
import { CO2 } from './co2';
import { CO  } from './co';
import { H2O } from './h2o';
import { H2  } from './h2';
import { CH4 } from './ch4';
import { NH3 } from './nh3';

/**
 * Central registry mapping species chemical formula → CompoundValue.
 * Shared by all services — avoids per-service duplication of mapping tables.
 */
export const GAS_REGISTRY: Record<string, CompoundValue> = {
  N2,
  O2,
  CO2,
  CO,
  H2O,
  H2,
  CH4,
  NH3,
};

