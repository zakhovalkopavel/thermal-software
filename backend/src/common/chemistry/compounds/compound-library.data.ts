import { ChemicalCompound } from './chemical-compound.interface';

/**
 * Compounds used by the application, keyed by chemical formula (isomers share one entry).
 * Compounds missing here get their molar mass from `molarMass`, calculated from the formula.
 */
export const COMPOUND_LIBRARY = {
  // ── Gases ─────────────────────────────────────────────────────────────────
  Air:    { name: 'Dry air (mixture)',             molarMass_kg_mol: 0.028951 },
  Ar:     { name: 'Argon',                         molarMass_kg_mol: 0.039948 },
  CH4:    { name: 'Methane',                       molarMass_kg_mol: 0.016043 },
  C2H2:   { name: 'Acetylene',                     molarMass_kg_mol: 0.026038 },
  C2H6:   { name: 'Ethane',                        molarMass_kg_mol: 0.030070 },
  C3H4:   { name: 'Propyne / allene',              molarMass_kg_mol: 0.040065 },
  C3H6:   { name: 'Propylene',                     molarMass_kg_mol: 0.042081 },
  C3H8:   { name: 'Propane',                       molarMass_kg_mol: 0.044097 },
  C4H10:  { name: 'n-Butane / isobutane',          molarMass_kg_mol: 0.058124 },
  CO:     { name: 'Carbon monoxide',               molarMass_kg_mol: 0.02801 },
  CO2:    { name: 'Carbon dioxide',                molarMass_kg_mol: 0.04401 },
  H2:     { name: 'Hydrogen',                      molarMass_kg_mol: 0.002016 },
  H2O:    { name: 'Water',                         molarMass_kg_mol: 0.018015 },
  N2:     { name: 'Nitrogen',                      molarMass_kg_mol: 0.028014 },
  NH3:    { name: 'Ammonia',                       molarMass_kg_mol: 0.017031 },
  NO:     { name: 'Nitric oxide',                  molarMass_kg_mol: 0.030006 },
  NO2:    { name: 'Nitrogen dioxide',              molarMass_kg_mol: 0.046 },
  O2:     { name: 'Oxygen',                        molarMass_kg_mol: 0.031999 },
  SO2:    { name: 'Sulfur dioxide',                molarMass_kg_mol: 0.064065 },
  SO3:    { name: 'Sulfur trioxide',               molarMass_kg_mol: 0.080064 },

  // ── Glass-forming / intermediate oxides ───────────────────────────────────
  SiO2:   { name: 'Silica',                        molarMass_kg_mol: 0.06008 },
  Al2O3:  { name: 'Alumina',                       molarMass_kg_mol: 0.10196 },
  B2O3:   { name: 'Boron trioxide',                molarMass_kg_mol: 0.06962 },
  P2O5:   { name: 'Phosphorus pentoxide',          molarMass_kg_mol: 0.14194 },

  // ── Alkali oxides ─────────────────────────────────────────────────────────
  Li2O:   { name: 'Lithium oxide',                 molarMass_kg_mol: 0.02988 },
  Na2O:   { name: 'Sodium oxide',                  molarMass_kg_mol: 0.06198 },
  K2O:    { name: 'Potassium oxide',               molarMass_kg_mol: 0.0942 },
  Rb2O:   { name: 'Rubidium oxide',                molarMass_kg_mol: 0.18694 },
  Cs2O:   { name: 'Caesium oxide',                 molarMass_kg_mol: 0.28181 },

  // ── Alkaline-earth oxides ─────────────────────────────────────────────────
  MgO:    { name: 'Magnesia',                      molarMass_kg_mol: 0.0403 },
  CaO:    { name: 'Lime',                          molarMass_kg_mol: 0.05608 },
  SrO:    { name: 'Strontium oxide',               molarMass_kg_mol: 0.10362 },
  BaO:    { name: 'Barium oxide',                  molarMass_kg_mol: 0.15333 },

  // ── Transition-metal oxides ───────────────────────────────────────────────
  TiO2:   { name: 'Titania',                       molarMass_kg_mol: 0.07987 },
  V2O5:   { name: 'Vanadium pentoxide',            molarMass_kg_mol: 0.18188 },
  Cr2O3:  { name: 'Chromium(III) oxide',           molarMass_kg_mol: 0.15199 },
  MnO:    { name: 'Manganese(II) oxide',           molarMass_kg_mol: 0.07094 },
  MnO2:   { name: 'Manganese dioxide',             molarMass_kg_mol: 0.08694 },
  FeO:    { name: 'Iron(II) oxide',                molarMass_kg_mol: 0.07185 },
  Fe2O3:  { name: 'Iron(III) oxide',               molarMass_kg_mol: 0.15969 },
  Co3O4:  { name: 'Cobalt(II,III) oxide',          molarMass_kg_mol: 0.2408 },
  NiO:    { name: 'Nickel(II) oxide',              molarMass_kg_mol: 0.07469 },
  CuO:    { name: 'Copper(II) oxide',              molarMass_kg_mol: 0.07955 },
  ZnO:    { name: 'Zinc oxide',                    molarMass_kg_mol: 0.08138 },
  Y2O3:   { name: 'Yttria',                        molarMass_kg_mol: 0.22581 },
  ZrO2:   { name: 'Zirconia',                      molarMass_kg_mol: 0.12322 },
  Nb2O5:  { name: 'Niobium pentoxide',             molarMass_kg_mol: 0.26581 },
  MoO3:   { name: 'Molybdenum trioxide',           molarMass_kg_mol: 0.14394 },
  RuO2:   { name: 'Ruthenium dioxide',             molarMass_kg_mol: 0.13307 },
  Rh2O3:  { name: 'Rhodium(III) oxide',            molarMass_kg_mol: 0.25381 },
  PdO:    { name: 'Palladium(II) oxide',           molarMass_kg_mol: 0.12242 },
  Ag2O:   { name: 'Silver oxide',                  molarMass_kg_mol: 0.23174 },
  CdO:    { name: 'Cadmium oxide',                 molarMass_kg_mol: 0.12841 },
  WO3:    { name: 'Tungsten trioxide',             molarMass_kg_mol: 0.23184 },
  ReO2:   { name: 'Rhenium dioxide',               molarMass_kg_mol: 0.21821 },

  // ── Post-transition / main-group oxides ───────────────────────────────────
  Ga2O3:  { name: 'Gallium oxide',                 molarMass_kg_mol: 0.18744 },
  As2O3:  { name: 'Arsenic trioxide',              molarMass_kg_mol: 0.19784 },
  SnO2:   { name: 'Tin dioxide',                   molarMass_kg_mol: 0.15071 },
  Sb2O3:  { name: 'Antimony trioxide',             molarMass_kg_mol: 0.29152 },
  TeO2:   { name: 'Tellurium dioxide',             molarMass_kg_mol: 0.1596 },
  PbO:    { name: 'Lead(II) oxide',                molarMass_kg_mol: 0.2232 },
  Bi2O3:  { name: 'Bismuth oxide',                 molarMass_kg_mol: 0.46596 },

  // ── Rare-earth and actinide oxides ────────────────────────────────────────
  La2O3:  { name: 'Lanthanum oxide',               molarMass_kg_mol: 0.32581 },
  CeO2:   { name: 'Ceria',                         molarMass_kg_mol: 0.17211 },
  Pr2O3:  { name: 'Praseodymium(III) oxide',       molarMass_kg_mol: 0.32981 },
  Nd2O3:  { name: 'Neodymium oxide',               molarMass_kg_mol: 0.33648 },
  Sm2O3:  { name: 'Samarium oxide',                molarMass_kg_mol: 0.34872 },
  Eu2O3:  { name: 'Europium oxide',                molarMass_kg_mol: 0.35193 },
  Gd2O3:  { name: 'Gadolinium oxide',              molarMass_kg_mol: 0.3625 },
  ThO2:   { name: 'Thoria',                        molarMass_kg_mol: 0.26404 },
  UO2:    { name: 'Uranium dioxide',               molarMass_kg_mol: 0.27003 },

  // ── Halides ───────────────────────────────────────────────────────────────
  CaF2:   { name: 'Calcium fluoride',              molarMass_kg_mol: 0.07808 },

  // ── Elemental constituents of glass compositions ──────────────────────────
  F:      { name: 'Fluorine (as F)',               molarMass_kg_mol: 0.019 },
  Cl:     { name: 'Chlorine (as Cl)',              molarMass_kg_mol: 0.03545 },
  Se:     { name: 'Selenium (as Se)',              molarMass_kg_mol: 0.07896 },
  I:      { name: 'Iodine (as I)',                 molarMass_kg_mol: 0.1269 },
} satisfies Record<string, ChemicalCompound>;
