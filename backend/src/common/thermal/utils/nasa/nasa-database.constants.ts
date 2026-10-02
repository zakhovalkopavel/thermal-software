import * as path from 'path';

/**
 * NASA thermodynamic databases in `backend/data/nasa/`, produced by the NASA thermo parser
 * (`make nasa-parse`, see docs/scripts/NASA_THERMO_PARSER_SPEC.md):
 *   nasa7.json — ref NASA7 (NASA SP-273 / TM-2002-211556 via CaltechSDT, 7 coefficients)
 *   nasa9.json — ref NASA9 (NASA RP-1311 + Burcat & Ruscic ANL-05/20, 9 coefficients)
 * Compounds reference a species by its exact key (`nasa7Key` / `nasa9Key`).
 */
export const NASA_DATABASE = {
  /** Data directory relative to the backend root */
  DATA_DIR:   path.join('data', 'nasa'),
  NASA7_FILE: 'nasa7.json',
  NASA9_FILE: 'nasa9.json',
} as const;
