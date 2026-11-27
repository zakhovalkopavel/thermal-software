import type { MaterialMineralogy } from '../types/material-mineralogy.type';

/**
 * Typical XRD / grade mineralogy for mix-library materials that do not yet carry
 * an inline `mineralogy` field. Merged in `ALL_MATERIALS` (entry wins if both set).
 */
export const MATERIAL_MINERALOGY: Readonly<Record<string, MaterialMineralogy>> = {
  // --- oxides ---
  alumina_calcined: {
    phases: [{ phaseId: 'corundum', wt: 99.0 }],
    source: 'Typical calcined alumina grade; impurities as amorphous remainder',
  },
  alumina_reactive: {
    phases: [{ phaseId: 'corundum', wt: 99.0 }],
    source: 'Typical reactive alumina grade; impurities as amorphous remainder',
  },
  magnesia_dead_burned: {
    phases: [{ phaseId: 'periclase', wt: 97.0 }],
    source: 'Dead-burned magnesia; CaO/SiO2 impurities as amorphous remainder',
  },
  magnesia_fused: {
    phases: [{ phaseId: 'periclase', wt: 98.5 }],
    source: 'Fused magnesia grade',
  },
  spinel_synthetic: {
    phases: [{ phaseId: 'spinel', wt: 100 }],
    source: 'Stoichiometric synthetic MgAl2O4 spinel',
  },
  zirconia_stabilized: {
    phases: [
      { phaseId: 'baddeleyite', wt: 94.5 },
      { phaseId: 'yttria', wt: 5.5 },
    ],
    source: 'Y-TZP / FSZ grade approximated as ZrO2 + Y2O3',
  },
  lanthanum_oxide: {
    phases: [{ phaseId: 'lanthana', wt: 99.5 }],
    source: 'Technical La2O3',
  },
  cerium_oxide: {
    phases: [{ phaseId: 'ceria', wt: 99.0 }],
    source: 'Technical CeO2',
  },
  iron_oxide_fe2o3: {
    phases: [{ phaseId: 'hematite', wt: 99.0 }],
    source: 'Technical Fe2O3',
  },
  chromium_oxide: {
    phases: [{ phaseId: 'eskolaite', wt: 99.0 }],
    source: 'Technical Cr2O3',
  },
  manganese_dioxide: {
    phases: [{ phaseId: 'pyrolusite', wt: 98.0 }],
    source: 'Technical MnO2',
  },
  manganese_monoxide: {
    phases: [{ phaseId: 'manganosite', wt: 98.5 }],
    source: 'Technical MnO',
  },
  manganese_sesquioxide: {
    phases: [{ phaseId: 'bixbyite', wt: 98.0 }],
    source: 'Technical Mn2O3',
  },
  rutile: {
    phases: [{ phaseId: 'rutile', wt: 98.0 }],
    source: 'Natural / synthetic rutile',
  },
  ilmenite: {
    phases: [{ phaseId: 'ilmenite', wt: 100 }],
    source: 'Stoichiometric FeTiO3 ilmenite',
  },
  boric_oxide: {
    phases: [],
    source: 'B2O3 glass former; no crystalline XRD phases',
  },
  chromite: {
    phases: [
      { phaseId: 'chromite', wt: 55 },
      { phaseId: 'spinel', wt: 20 },
    ],
    source: 'Typical chromite ore (chromite + spinel; silicates as amorphous)',
  },
  sodium_aluminate: {
    phases: [{ phaseId: 'sodium_aluminate', wt: 84 }],
    source: 'Technical NaAlO2 limited by Al2O3 assay',
  },
  beta_alumina: {
    phases: [{ phaseId: 'beta_alumina', wt: 96 }],
    source: 'β-alumina approximated as Na2O·11Al2O3',
  },
  silica_gel: {
    phases: [],
    source: 'Amorphous silica gel',
  },

  // --- silicates ---
  chamotte_low_alumina: {
    phases: [
      { phaseId: 'mullite', wt: 30 },
      { phaseId: 'quartz', wt: 20 },
    ],
    source: 'Low-alumina fireclay chamotte (mullite + quartz; rest glass)',
  },
  chamotte_high_alumina: {
    phases: [
      { phaseId: 'mullite', wt: 55 },
      { phaseId: 'corundum', wt: 10 },
      { phaseId: 'quartz', wt: 5 },
    ],
    source: 'High-alumina / bauxitic chamotte',
  },
  zircon: {
    phases: [{ phaseId: 'zircon', wt: 100 }],
    source: 'Natural zircon ZrSiO4',
  },
  wollastonite: {
    phases: [{ phaseId: 'wollastonite', wt: 100 }],
    source: 'Natural wollastonite',
  },
  cordierite: {
    phases: [{ phaseId: 'cordierite', wt: 100 }],
    source: 'Synthetic cordierite',
  },
  nepheline_syenite: {
    phases: [
      { phaseId: 'nepheline', wt: 40 },
      { phaseId: 'microcline', wt: 20 },
      { phaseId: 'albite', wt: 10 },
    ],
    source: 'Typical nepheline syenite XRD',
  },
  anorthite: {
    phases: [{ phaseId: 'anorthite', wt: 100 }],
    source: 'Synthetic / natural anorthite',
  },
  mica: {
    phases: [{ phaseId: 'muscovite', wt: 70 }],
    source: 'Muscovite mica flake (partial; rest amorphous)',
  },
  dolomite: {
    phases: [{ phaseId: 'dolomite', wt: 100 }],
    source: 'Natural dolomite',
  },
  sodium_silicate: {
    phases: [],
    source: 'Sodium silicate glass former',
  },
  potassium_silicate: {
    phases: [],
    source: 'Potassium silicate glass former',
  },

  // --- binders ---
  cac_ca70: {
    phases: [
      { phaseId: 'calcium_monoaluminate', wt: 50 },
      { phaseId: 'grossite', wt: 25 },
      { phaseId: 'corundum', wt: 10 },
    ],
    source: 'Typical CA-70 calcium aluminate cement XRD',
  },
  cac_ca80: {
    phases: [
      { phaseId: 'calcium_monoaluminate', wt: 30 },
      { phaseId: 'grossite', wt: 25 },
      { phaseId: 'corundum', wt: 30 },
    ],
    source: 'Typical CA-80 calcium aluminate cement XRD',
  },
  fondu: {
    phases: [
      { phaseId: 'calcium_monoaluminate', wt: 40 },
      { phaseId: 'mayenite', wt: 15 },
      { phaseId: 'gehlenite', wt: 10 },
      { phaseId: 'hematite', wt: 10 },
    ],
    source: 'Typical ciment fondu XRD (CA + C12A7 + gehlenite + Fe oxides)',
  },
  cement_pc: {
    phases: [
      { phaseId: 'hatrurite', wt: 50 },
      { phaseId: 'larnite', wt: 15 },
      { phaseId: 'tricalcium_aluminate', wt: 6 },
      { phaseId: 'hematite', wt: 2 },
    ],
    source: 'Typical OPC clinker mineralogy (C3S/C2S/C3A; ferrite as hematite proxy)',
  },

  // --- clays (metakaolin when library H2O is too low for kaolinite) ---
  kaolinite: {
    phases: [{ phaseId: 'kaolinite', wt: 95 }],
    source: 'Washed kaolin',
  },
  bentonite: {
    phases: [
      { phaseId: 'montmorillonite', wt: 50 },
      { phaseId: 'quartz', wt: 15 },
    ],
    source: 'Sodium bentonite (smectite + quartz; rest amorphous)',
  },
  fireclay: {
    phases: [
      { phaseId: 'metakaolin', wt: 45 },
      { phaseId: 'quartz', wt: 25 },
    ],
    source: 'Typical fireclay (metakaolin + quartz; low stored H2O)',
  },
  ball_clay: {
    phases: [
      { phaseId: 'metakaolin', wt: 35 },
      { phaseId: 'quartz', wt: 25 },
      { phaseId: 'illite', wt: 15 },
    ],
    source: 'Typical ball clay',
  },
  stoneware_clay: {
    phases: [
      { phaseId: 'metakaolin', wt: 25 },
      { phaseId: 'quartz', wt: 35 },
      { phaseId: 'illite', wt: 15 },
    ],
    source: 'Typical stoneware clay',
  },
  porcelain_clay_mix: {
    phases: [
      { phaseId: 'metakaolin', wt: 40 },
      { phaseId: 'quartz', wt: 25 },
      { phaseId: 'microcline', wt: 15 },
    ],
    source: 'Porcelain body (metakaolin + quartz + feldspar)',
  },
  earthenware_clay: {
    phases: [
      { phaseId: 'metakaolin', wt: 18 },
      { phaseId: 'quartz', wt: 30 },
      { phaseId: 'illite', wt: 10 },
    ],
    source: 'Earthenware body; carbonates left in amorphous / LOI remainder',
  },
  red_clay: {
    phases: [
      { phaseId: 'metakaolin', wt: 20 },
      { phaseId: 'quartz', wt: 35 },
      { phaseId: 'hematite', wt: 8 },
      { phaseId: 'illite', wt: 10 },
    ],
    source: 'Red clay with hematite',
  },
  yellow_clay: {
    phases: [
      { phaseId: 'metakaolin', wt: 20 },
      { phaseId: 'quartz', wt: 30 },
      { phaseId: 'illite', wt: 12 },
    ],
    source: 'Yellow clay (organic / Fe in amorphous remainder)',
  },
  raku_clay: {
    phases: [
      { phaseId: 'metakaolin', wt: 20 },
      { phaseId: 'quartz', wt: 25 },
    ],
    source: 'Raku body; grog treated as amorphous / inert remainder',
  },

  // --- carbides / nitrides (inert primary phase) ---
  silicon_carbide: {
    phases: [{ phaseId: 'sic', wt: 98.5 }],
    source: 'SiC grit; oxide impurities react as amorphous remainder',
  },
  titanium_carbide: {
    phases: [{ phaseId: 'tic', wt: 98.5 }],
    source: 'TiC powder',
  },
  chromium_carbide: {
    phases: [{ phaseId: 'cr3c2', wt: 98.0 }],
    source: 'Cr3C2 powder',
  },
  boron_carbide: {
    phases: [{ phaseId: 'b4c', wt: 98.5 }],
    source: 'B4C powder',
  },
  graphite: {
    phases: [{ phaseId: 'graphite', wt: 99.5 }],
    source: 'Flake graphite',
  },
  aluminum_nitride: {
    phases: [{ phaseId: 'aln', wt: 99.0 }],
    source: 'AlN powder',
  },
  boron_nitride_hbn: {
    phases: [{ phaseId: 'bn', wt: 99.0 }],
    source: 'h-BN powder',
  },
  titanium_nitride: {
    phases: [{ phaseId: 'tin', wt: 98.5 }],
    source: 'TiN powder',
  },
  silicon_nitride: {
    phases: [{ phaseId: 'si3n4', wt: 100 }],
    source: 'Si3N4 powder',
  },
  silicon_oxynitride: {
    phases: [{ phaseId: 'sinoite', wt: 100 }],
    source: 'Si2N2O (sinoite) powder',
  },
  aluminum_oxynitride: {
    phases: [
      { phaseId: 'corundum', wt: 64.3 },
      { phaseId: 'aln', wt: 35.7 },
    ],
    source: 'AlON approximated as Al2O3 + AlN mixture',
  },
};
