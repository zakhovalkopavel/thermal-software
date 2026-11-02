/**
 * Registry key → the compound-data record.
 * The formula is the chemical formula (Hill lookup). The NASA keys pick the
 * isomer when one formula has several records, and skip a NASA-9 key that
 * belongs to a different species (CO2, O2, NO2).
 */
export const GAS_COMPOUND_BINDING = {
  Ar:     { formula: 'Ar',    nasa7Key: 'Ar',              nasa9Key: 'Ar' },
  N2:     { formula: 'N2',    nasa7Key: 'N2',              nasa9Key: 'N2' },
  O2:     { formula: 'O2',    nasa7Key: 'O2' },
  CO2:    { formula: 'CO2',   nasa7Key: 'CO2' },
  CO:     { formula: 'CO',    nasa7Key: 'CO',              nasa9Key: 'CO' },
  H2O:    { formula: 'H2O',   nasa7Key: 'H2O',             nasa9Key: 'H2O' },
  H2:     { formula: 'H2',    nasa7Key: 'H2',              nasa9Key: 'H2' },
  CH4:    { formula: 'CH4',   nasa7Key: 'CH4',             nasa9Key: 'CH4' },
  C2H6:   { formula: 'C2H6',  nasa7Key: 'C2H6',            nasa9Key: 'C2H6' },
  C3H8:   { formula: 'C3H8',  nasa7Key: 'C3H8',            nasa9Key: 'C3H8' },
  C4H10:  { formula: 'C4H10', nasa7Key: 'C4H10,n-butane',  nasa9Key: 'C4H10,n-butane' },
  iC4H10: { formula: 'C4H10', nasa7Key: 'C4H10,isobutane', nasa9Key: 'C4H10,isobutane' },
  C2H2:   { formula: 'C2H2',  nasa7Key: 'C2H2,acetylene',  nasa9Key: 'C2H2,acetylene' },
  C3H4:   { formula: 'C3H4',  nasa7Key: 'C3H4,propyne',    nasa9Key: 'C3H4,propyne' },
  aC3H4:  { formula: 'C3H4',  nasa7Key: 'C3H4,allene',     nasa9Key: 'C3H4,allene' },
  C3H6:   { formula: 'C3H6',  nasa7Key: 'C3H6,propylene',  nasa9Key: 'C3H6,propylene' },
  NH3:    { formula: 'NH3',   nasa7Key: 'NH3',             nasa9Key: 'NH3' },
  SO2:    { formula: 'SO2',   nasa7Key: 'SO2',             nasa9Key: 'SO2' },
  SO3:    { formula: 'SO3',   nasa7Key: 'SO3',             nasa9Key: 'SO3' },
  NO:     { formula: 'NO',    nasa7Key: 'NO',              nasa9Key: 'NO' },
  NO2:    { formula: 'NO2',   nasa7Key: 'NO2' },
} as const;
