export enum Species {
  // ── Noble gases ───────────────────────────────────────────────────────
  Ar  = 'Ar',

  // ── Common combustion gases ──────────────────────────────────────────
  N2  = 'N2',
  O2  = 'O2',
  CO2 = 'CO2',
  CO  = 'CO',
  H2O = 'H2O',
  H2  = 'H2',
  CH4 = 'CH4',

  // ── Fuel gases (keys follow combustion-mechanism names for isomers) ──
  C2H6   = 'C2H6',    // ethane
  C3H8   = 'C3H8',    // propane
  C4H10  = 'C4H10',   // n-butane
  iC4H10 = 'iC4H10',  // isobutane
  C2H2   = 'C2H2',    // acetylene
  C3H4   = 'C3H4',    // propyne (methylacetylene)
  aC3H4  = 'aC3H4',   // propadiene (allene)
  C3H6   = 'C3H6',    // propylene

  // ── Sulfur compounds ─────────────────────────────────────────────────
  SO2 = 'SO2',
  SO3 = 'SO3',

  // ── Nitrogen oxides ──────────────────────────────────────────────────
  NO  = 'NO',
  NO2 = 'NO2',
  NH3 = 'NH3',
}
