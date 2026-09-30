import { CompoundValue } from '../../interfaces/compound-value.interface';
import { N2  } from './n2';
import { O2  } from './o2';
import { Ar  } from './ar';
import { CO2 } from './co2';
import { CO  } from './co';
import { H2O } from './h2o';
import { H2  } from './h2';
import { CH4 } from './ch4';
import { C2H6 } from './c2h6';
import { C3H8 } from './c3h8';
import { C4H10 } from './c4h10';
import { iC4H10 } from './ic4h10';
import { C2H2 } from './c2h2';
import { C3H4 } from './c3h4';
import { aC3H4 } from './ac3h4';
import { C3H6 } from './c3h6';
import { NH3 } from './nh3';
import { SO2 } from './so2';
import { SO3 } from './so3';
import { NO  } from './no';
import { NO2 } from './no2';

/**
 * Central registry mapping species chemical formula → CompoundValue.
 * Shared by all services — avoids per-service duplication of mapping tables.
 */
export const GAS_REGISTRY: Record<string, CompoundValue> = {
  Ar,
  N2,
  O2,
  CO2,
  CO,
  H2O,
  H2,
  CH4,
  C2H6,
  C3H8,
  C4H10,
  iC4H10,
  C2H2,
  C3H4,
  aC3H4,
  C3H6,
  NH3,
  SO2,
  SO3,
  NO,
  NO2,
};
