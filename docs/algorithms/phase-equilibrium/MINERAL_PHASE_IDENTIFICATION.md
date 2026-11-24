# Mineral Phases: Phase Catalog and Raw Material Mineralogy

**Endpoint:** `POST /api/v1/refractory/phase-equilibrium` ([API spec §1](../../api/REFRACTORY_API_SPEC.md)): `afterCooling` and `unreactedOriginalPhases`  
**Calculation:** [FULL_PHASE_EQUILIBRIUM.md](FULL_PHASE_EQUILIBRIUM.md)  
**Data:** `data/phase-diagrams/phase-catalog.data.ts` (`PHASE_CATALOG`), `mineralogy` of each mix component in `data/materials/*.data.ts`  
**Tests:** `backend/test/unit/refractory/data/phase-catalog.spec.ts`, `backend/test/unit/refractory/data/mineralogy-consistency.spec.ts`

---

## Purpose

Mineral phases are no longer guessed from oxide thresholds. The earlier `MineralPhaseService`, removed with its `/mineral-phases` endpoint, used rules such as "mullite only if 1.5 < Al2O3/SiO2 < 3.5" and fixed shares such as "30 % of the excess SiO2 forms cristobalite", which gave no mullite for ordinary fireclays and did not conserve mass. Phases now come from two sources:

- **after firing:** the phase-diagram equilibrium of the matrix and of every transforming original phase;
- **before firing:** the mineralogy of each raw material in the library, which also gives the phases that did not react.

Both use the same phase catalog.

## Phase catalog

One entry per phase (`PhaseCatalogEntry`):

| Field | Meaning |
|-------|---------|
| `phaseId` | stable id used by the diagrams and the mineralogy, e.g. `mullite` |
| `name`, `formula` | e.g. `Mullite`, `3Al2O3·2SiO2` |
| `composition` | wt% by key: oxides; `H2O` / `CO2` for precursors; `SiC`, `C`, … for non-oxides. Σ = 100 |
| `meltingPoint_C` | congruent melting, or incongruent melting / decomposition |
| `stableBelow_C` | above it the phase does not survive on its own; see `transformations` |
| `transformations?` | ordered steps `{ fromTemperature_C, products }`, where products are `{ phaseId, wt }[]` or `equilibrium` (the phase-diagram result of the phase's own fired composition) |
| `inert` | true only for carbides, nitrides and graphite; they never react with the matrix |
| `amorphous` | true for glass and metakaolin. Glass never crystallizes ([FULL_PHASE_EQUILIBRIUM.md](FULL_PHASE_EQUILIBRIUM.md) Step 6); metakaolin follows its transformations |
| `source` | required reference (`DataSource`: `kind` = `acers-nist-ped` \| `paper` \| `calphad`, `citation`, `figure?`) |

### Phases of the diagrams

Cement notation: C = CaO, A = Al2O3, S = SiO2, M = MgO, F = Fe2O3.

| Phase | Formula | Melting / limit, °C (≈) | System |
|-------|---------|-------------------------|--------|
| Corundum | Al2O3 | 2054 | AS, CAS, MAS |
| Mullite | 3Al2O3·2SiO2 | ≈ 1890 | AS, KAS, NAS, CAS, MAS |
| Quartz / Tridymite / Cristobalite | SiO2 | stable < 870 / 870–1470 / 1470–1723 | all |
| Lime | CaO | 2613 | CAS, CMS |
| Periclase | MgO | 2825 | MAS, CMS |
| Anorthite | CaO·Al2O3·2SiO2 | 1553 | CAS |
| Gehlenite | 2CaO·Al2O3·SiO2 | 1593 | CAS |
| Wollastonite / Pseudowollastonite | CaO·SiO2 | 1544 | CAS, CMS |
| Rankinite | 3CaO·2SiO2 (C3S2) | ≈ 1464 (incongruent) | CAS, CMS |
| Larnite / C2S | 2CaO·SiO2 | 2130 | CAS, CMS |
| Hatrurite / C3S | 3CaO·SiO2 | ≈ 2070 (incongruent), stable > 1250 | CAS, CMS |
| C3A | 3CaO·Al2O3 | ≈ 1542 (incongruent) | CAS |
| C12A7 (mayenite) | 12CaO·7Al2O3 | ≈ 1415 | CAS |
| CA | CaO·Al2O3 | ≈ 1605 (incongruent) | CAS |
| CA2 (grossite) | CaO·2Al2O3 | ≈ 1765 (incongruent) | CAS |
| CA6 (hibonite) | CaO·6Al2O3 | ≈ 1860 (incongruent) | CAS |
| Spinel | MgO·Al2O3 | 2135 | MAS |
| Forsterite | 2MgO·SiO2 | 1890 | MAS, CMS |
| Enstatite (protoenstatite) | MgO·SiO2 | ≈ 1557 (incongruent) | MAS, CMS |
| Cordierite | 2MgO·2Al2O3·5SiO2 | ≈ 1465 (incongruent) | MAS |
| Sapphirine | 4MgO·5Al2O3·2SiO2 (idealised) | ≈ 1482 (incongruent) | MAS |
| Monticellite | CaO·MgO·SiO2 | ≈ 1498 (incongruent) | CMS |
| Merwinite | 3CaO·MgO·2SiO2 | ≈ 1575 (incongruent) | CMS |
| Akermanite | 2CaO·MgO·2SiO2 | ≈ 1454 | CMS |
| Diopside | CaO·MgO·2SiO2 | 1391 | CMS |
| K-feldspar (sanidine / microcline) | K2O·Al2O3·6SiO2 | ≈ 1150 (incongruent → leucite + liquid) | KAS |
| Leucite | K2O·Al2O3·4SiO2 | 1686 | KAS |
| Kalsilite | K2O·Al2O3·2SiO2 | ≈ 1750 | KAS |
| Potassium silicates | K2O·SiO2, K2O·2SiO2, K2O·4SiO2 | ≈ 976 / 1045 / 770 | KAS |
| Potassium aluminate | K2O·Al2O3 | ≈ 2260 | KAS |
| Albite | Na2O·Al2O3·6SiO2 | 1118 | NAS |
| Nepheline / Carnegieite | Na2O·Al2O3·2SiO2 | 1526 | NAS |
| Sodium silicates | Na2O·SiO2, Na2O·2SiO2 | 1089 / 874 | NAS |
| Sodium aluminate | Na2O·Al2O3 | ≈ 1867 | NAS |
| β-alumina | Na2O·11Al2O3 | ≈ 2000 | NAS |
| Hematite | Fe2O3 | ≈ 1390 °C in air → magnetite (O2 loss) | Fe–O subsystem (below) |
| Magnetite | Fe3O4 | 1597 | Fe–O subsystem |
| Rutile | TiO2 | 1843 | Al2O3–TiO2 subsystem |

### Precursor and inert phases (raw materials only)

**Reactive precursors** (they transform, then take part in the chemistry):

| Phase | Formula | Raw materials | Transformations (≈, references in the catalog) |
|-------|---------|---------------|-----------------------------------------------|
| Kaolinite | Al2O3·2SiO2·2H2O | clays | 550 °C → metakaolin (amorphous); ≥ 980 °C → equilibrium (mullite + SiO2) |
| Illite / Muscovite | K2O·3Al2O3·6SiO2·2H2O | clays, `mica` | ≈ 900 °C → equilibrium |
| Montmorillonite | idealised (Na,Ca)-smectite | `bentonite` | ≈ 700 °C → equilibrium |
| Chlorite (clinochlore) | 5MgO·Al2O3·3SiO2·4H2O | red / earthenware clays | ≈ 800 °C → equilibrium |
| Goethite | Fe2O3·H2O | `yellow_clay`, red clays | 300 °C → hematite |
| Anatase | TiO2 | clays | ≈ 900 °C → rutile |
| Calcite | CaCO3 | clays | 900 °C → lime |
| Dolomite | CaMg(CO3)2 | dolomite, clays | 800 °C → lime + periclase |
| Magnesite | MgCO3 | — | 600 °C → periclase |
| Gibbsite | Al(OH)3 | `aluminum_hydroxide` (not a mix component today) | 300 °C → transition alumina; ≥ 1200 °C → corundum |
| Quartz (raw) | SiO2 | `silica_quartz`, clays, chamotte | practical conversion ≥ 1200 °C → equilibrium (tridymite / cristobalite) |
| C4AF (brownmillerite) | 4CaO·Al2O3·Fe2O3 | `cement_pc`, `fondu` | ≈ 1415 °C → equilibrium (Fe2O3 set aside) |
| Gypsum / Anhydrite | CaSO4·2H2O / CaSO4 | `cement_pc` | 150 °C → anhydrite; SO3 part inert (`unmodelled`) |
| Borax (tincal) | Na2B4O7·10H2O | `borax` | dehydrates to anhydrous Na2B4O7 below ≈ 400 °C; melts ≈ 743 °C → equilibrium (Na2O–B2O3, B2O3 subsystems); the melt is a glass former |
| Sodium metaborate | NaBO2 | `sodium_metaborate` | melts ≈ 966 °C → equilibrium (Na2O–B2O3) |
| Colemanite | 2CaO·3B2O3·5H2O | `calcium_borate` | dehydrates ≈ 400 °C → equilibrium (CaO–B2O3) |

**Phases of the extra-oxide subsystems** (reactive). Every oxide reacts. An ultrafine ZrO2, CeO2 or La2O3 grade dissolves in the matrix through the grain reaction, exactly like alumina. Their equilibria come from the subsystems in [FULL_PHASE_EQUILIBRIUM.md](FULL_PHASE_EQUILIBRIUM.md) Step 5:

| Phase | Formula | Raw materials | Subsystem |
|-------|---------|---------------|-----------|
| Zircon | ZrO2·SiO2 | `zircon` | ZrO2–SiO2, ZrO2–Al2O3–SiO2 |
| Baddeleyite / tetragonal / cubic zirconia | ZrO2 | `zirconia_stabilized`, zircon dissociation | ZrO2–SiO2, ZrO2–Y2O3, ZrO2–CaO, ZrO2–MgO |
| Stabilised zirconia (solid solution) | (Zr,Y)O2−x, (Zr,Ca)O2−x, (Zr,Mg)O2−x | `zirconia_stabilized` | ZrO2–Y2O3, ZrO2–CaO, ZrO2–MgO |
| Yttria / YAG / YAP / YAM | Y2O3, 3Y2O3·5Al2O3, Y2O3·Al2O3, 2Y2O3·Al2O3 | Y2O3 in zirconia and AlN | Y2O3–Al2O3 |
| Eskolaite / (Al,Cr)2O3 solid solution | Cr2O3, (Al,Cr)2O3 | `chromium_oxide`, `chromite` | Al2O3–Cr2O3 |
| Chromite / picrochromite / Mg(Al,Cr)2O4 spinel | (Fe,Mg)(Cr,Al)2O4 | `chromite` | MgO–Al2O3–Cr2O3, FeO–Cr2O3 |
| Hematite / magnetite / wüstite | Fe2O3 / Fe3O4 / FeO | iron oxide, clays, `fondu` | Fe–O in air |
| Hercynite / fayalite | FeO·Al2O3 / 2FeO·SiO2 | `fondu`, `chromite` | FeO–Al2O3–SiO2 |
| Ilmenite | FeO·TiO2 | `ilmenite` | FeO–TiO2 |
| Pyrolusite → bixbyite → hausmannite / manganosite | MnO2 → Mn2O3 → Mn3O4 / MnO | manganese oxides | Mn–O in air |
| Galaxite / tephroite / rhodonite | MnO·Al2O3 / 2MnO·SiO2 / MnO·SiO2 | manganese oxides | MnO–Al2O3–SiO2 |
| B2O3 glass / liquid | B2O3 | `boric_oxide`, borides' oxide traces | B2O3–SiO2 |
| Aluminium borates | 9Al2O3·2B2O3, 2Al2O3·B2O3 | `boric_oxide` with alumina | Al2O3–B2O3 |
| Sodium / calcium borates | NaBO2, Na2B4O7, …; CaB2O4, CaB4O7, … | `borax`, `sodium_metaborate`, `calcium_borate` | Na2O–B2O3, CaO–B2O3 |
| Fluorite / cuspidine | CaF2 / 3CaO·2SiO2·CaF2 | `calcium_fluoride` | CaF2–CaO, CaF2–Al2O3, CaF2–CaO–SiO2, CaF2–CaO–Al2O3 |
| Villiaumite / carobbiite / sellaite | NaF / KF / MgF2 | `sodium_fluoride`, `potassium_fluoride`, `magnesium_fluoride` | no subsystem with a proven source yet: reported unchanged when unreacted, their reacted part is `unmodelled` |
| Lanthana / LaAlO3 / β-La-alumina | La2O3 / LaAlO3 / LaAl11O18 | `lanthanum_oxide` | La2O3–Al2O3 |
| Cerianite / (Zr,Ce)O2 | CeO2 | `cerium_oxide` | CeO2–Al2O3 (air), CeO2–ZrO2 |
| Tialite | Al2O3·TiO2 | rutile with alumina | Al2O3–TiO2 |
| Anhydrite | CaSO4 | `cement_pc` | CaSO4 decomposition in air: only with a proven source, otherwise SO3 is `unmodelled` |

**Inert phases**: reported unchanged and never react with the matrix. Oxidation is not modelled.

| Phase | Raw materials |
|-------|---------------|
| SiC, TiC, B4C, Cr3C2 | carbides |
| Graphite | `graphite`, carbon in carbides |
| Si3N4, h-BN, AlN, TiN, sinoite (Si2N2O), AlON | nitrides |

The oxide impurities of these materials (SiO2, Al2O3, B2O3, Y2O3, …) are not inert. They react like any other oxide.

Cement and binder phases (C3S, C2S, C3A, CA, CA2, C12A7, corundum) are taken from the diagram phases above.

**No data without proof.** Every phase, invariant point, curve and transformation temperature in `data/phase-diagrams/` must have a reference, in one of these forms:
- an ACerS-NIST *Phase Equilibria Diagrams* figure number;
- a peer-reviewed experimental paper;
- a peer-reviewed CALPHAD assessment.

The approximate values in these docs are indicative only; step 2 replaces them with the sourced values. An oxide whose interactions have no proven data (traces of Nd2O3, Pr6O11) is not estimated. It is reported in `unmodelled` with a warning.

**Data issues the mineralogy step must resolve:**
- `raku_clay` stores 15 % `Grog`, a key with no oxides. Two options: replace it in the composition by chamotte oxides (then chamotte phases), or keep it as an inert *Grog* pseudo-phase.
- `silicon_oxynitride` is stored as the elements Si, N and O. It will be matched to sinoite.
- The four fluorides are stored as elements (`calcium_fluoride` `{ Ca: 51.3, F: 48.7 }`). They are converted to compound keys (`{ CaF2: 100 }`, `{ NaF: 100 }`, `{ KF: 100 }`, `{ MgF2: 100 }`), which have the same element masses.

## Raw material mineralogy

Library field on every mix component (`MaterialEntry.mineralogy`, exposed as `MaterialEntryDto.mineralogy`):

```ts
mineralogy: {
  phases: Array<{ phaseId: string; wt: number }>;  // crystalline phases, wt% of the raw material as delivered
  source: string;                                 // reference for the phase contents
}
```

The **amorphous remainder** is not stored. It is calculated as material composition minus the oxides of the listed phases, and reported as *Glass (material name)*; `MaterialEntryDto.mineralogy.amorphous_wt` gives its share. The consistency test checks every mix component: the remainder must be ≥ 0 for every key, within 0.5 wt%.

Glass formers are pure remainder, with `phases: []`: `sodium_silicate`, `potassium_silicate`, `boric_oxide`, `silica_fused` and `microsilica`. Their glass never crystallizes. Below its own solidus it stays glass, which is `unchanged` (rigid) or `softened` depending on its viscosity from `GlassViscosityService`. It turns into liquid only when its own equilibrium, or the equilibrium of the matrix, has liquid at T. Borates and alkali silicates therefore never appear as crystalline NS2, KS2 or aluminium borates when they come from a glass.

## Where the mineral phases are reported

In the `/phase-equilibrium` response:
- `afterCooling.crystals[]` and `afterCooling.glass`, each crystal with its origin (matrix, unreacted unchanged, unreacted transformed). `glass.parts[]` lists each glass (quenched matrix liquid, glass of the matrix, glass of each raw material) with its glass points from `GlassViscosityService`: strain point, glass transition, softening point and working point;
- `unreactedOriginalPhases[]`: per original phase, the original %, unreacted %, the share that did not react, and its state (`unchanged`, `softened`, `transformed`).

## Limits

- Phases are stoichiometric. Solid solutions (alkali feldspars, Fe in mullite, non-stoichiometric spinel) only appear through the flux substitution described in [FULL_PHASE_EQUILIBRIUM.md](FULL_PHASE_EQUILIBRIUM.md) Step 5.
- The mineralogy is typical for a grade, not a measured XRD of a specific lot.
- Transformations are complete at their temperature; their kinetics are not modelled.
- Glass does not devitrify. Glass points depend on the glass model's range: slag-like compositions (Iida, Nakamoto) get none.
