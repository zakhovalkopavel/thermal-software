# Organic Families, Files, References, Tests, and Verification

**Parent index:** [COMPOUND_DATA_SPEC.md](./COMPOUND_DATA_SPEC.md)

---

- `ORGANIC_FAMILIES` is an ordered set of SMARTS patterns, from specific to general: carboxylic-acids, esters, amides, nitriles, nitro, aldehydes, ketones, phenols, alcohols, amines, ethers, sulfur, organosilicon, organometallic, halogenated, aromatics, alkynes, alkenes, alkanes. With the general families first, ethanol would land in alkanes.
- Carboxylic acids include their salts (`[O-]`: sodium acetate, ammonium oxalate; there is no metal–carbon bond, so they are not organometallic). Alkenes include cumulenes (allene C=C=C, ketene C=C=O).
- A record's `families` lists every family that matches. The folder comes from the first match.
- Without a SMILES, or with no match, `chemical_formula.formula_family` gives the family when every structure of the formula would get the same first match:
  - only without N, and without O unless the compound has one carbon and no H, because then none of the O/N families can match;
  - then S → sulfur, Si → organosilicon, an element outside H, B, C, N, O, F, Si, P, S, Cl, Br, I → organometallic, F/Cl/Br/I → halogenated (CCl3F, CF2, C2Cl4F2; CF8S → sulfur);
  - hydrocarbons: CnH2n+2 → alkanes, C2H4 → alkenes, C2H2 → alkynes.
  - These records are listed in the report as `familyFromFormula`. A test checks that `formula_family` agrees with the SMARTS on sample structures.
- The rest (radicals such as CH3, C2H, CHO; diazomethane; guanidine; carbon suboxide) go to `organic/unclassified/`.

---

## Files

### Packages

Five packages under `python/src/`, one export per file. Dependencies point one way: `chemical_formula` ← `chemicals_tables`, `pubchem`, `dataset_layout` ← `compound_data`; `pubchem` needs only `chemical_formula`, `dataset_layout` nothing, and `chemicals_tables` knows nothing of PubChem or the output. The `janaf` package uses `chemical_formula` and `dataset_layout` too; `compound_data` also uses `janaf` and `nasa_thermo` (the parsers of the linked datasets).

- **`chemical_formula/`**, formula parsing and classification:
  - `formula_cleaner.py` `clean_formula`, `formula_elements.py` `formula_elements` (adducts, isotopes, charges; `ELEMENTS`, `ISOTOPES`), `hill_formula.py` `hill_formula`;
  - `formula_text.py` `formula_text` (counts in a given order), `iupac_formula.py` `iupac_formula` with `constants/element_sequence.py` `ELEMENT_SEQUENCE` (Table VI);
  - `main_element.py` `main_element` with `constants/electronegativity.py` `PAULING_ELECTRONEGATIVITY` and `constants/element_groups.py` (`NONMETALS`, `HALOGENS`, `HYDROGENS`), `compound_class.py` `classify_compound`, and `organic_bonds.py` `has_organic_bond` (RDKit, not imported by the package `__init__`);
  - `organic_family.py` `OrganicFamilyClassifier` with `constants/organic_families.py` `ORGANIC_FAMILIES` and `UNCLASSIFIED` (RDKit; not imported by the package `__init__`, so `pubchem` and `janaf` do not load RDKit), and `formula_family.py` `formula_family` (family from the formula alone, no RDKit; used by the merger, the JANAF-only records and the JANAF placement).
- **`dataset_layout/`**, the folder and file layout shared with the JANAF dataset: `compound_file_name.py` `compound_file_name` / `name_slug`, `unique_file_paths.py` `unique_file_paths` (case-insensitive collisions), `clear_dataset_dir.py` `clear_dataset_dir`.
- **`chemicals_tables/`**, the CalebBell/chemicals tables → source entries:
  - models: `source_link.py` `SourceLink`, `property_value.py` `PropertyValue`, `equation_value.py` `EquationValue` (type, ref, vars, min, max, k, source, raw), `raw_value.py` `RawValue`, `transport_value.py` `TransportValue` (Svehla methods, match temperature), `source_entry.py` `SourceEntry` (one parsed value before merging), `identifier.py` `Identifier`, `table_spec.py` `TableSpec`, `coefficient_spec.py` `CoefficientSpec` (columns mapped to vars, type, k, property, phase, Tmin/Tmax columns, ref), `property_column.py`, `chemicals_source.py` `ChemicalsSource` (whose `file_url(path, line)` percent-encodes the path);
  - constants: `constants/equation_type.py` `EquationType` (a StrEnum with the existing `equation-type.dto.ts` values, including the [new types](#new-equation-types)), `constants/planned_equation_types.py` `PLANNED_EQUATION_TYPES` (types written before the backend implements them; empty now), `constants/source_tables.py` `SOURCE_TABLES`, `constants/coefficient_tables.py` `COEFFICIENT_TABLES` (Poling, Perry 2-153 DIPPR 100/114, 2-312, 2-313, 2-314, TRC), `constants/gas_constant.py` `GAS_CONSTANT`, `constants/identity_overrides.py` `IDENTITY_OVERRIDES`;
  - parsers: `parsers/property_table.py` `parse_property_table`, `parsers/coefficient_table.py` `parse_coefficient_table`, `parsers/perry_151.py` `parse_perry_151` (maierKelley or quadratic per row), `parsers/crc_molten_density.py` `parse_crc_molten_density`, `parsers/shomate_json.py` `parse_shomate_json` (per-phase `ranges`, line of each CAS key), `parsers/zabransky.py` `parse_zabransky` (spline rows per CAS and data type → one piecewise equation; quasi-polynomial rows → single equations), `parsers/vdi_ppds.py` `parse_vdi_ppds` (8 files, liquid ranges from the VDI Tm/Tc rows), `parsers/identifiers.py` `load_identifiers`, `parsers/provenance.py` `read_chemicals_source`, `parsers/tsv_reader.py`, `parsers/number.py` (integers stay integers), `parsers/cas.py`;
  - logic: `source_entries.py` `parse_source_entries` (all parsers + identity overrides), `identity_override.py` `IdentityOverride`, `identity_resolver.py` `apply_identity_overrides`, `label_variant.py` `label_variant` (trailing `(...)` of a source label), `report_issue.py`;
  - `equation_eval.py` `evaluate_equation`, a Python copy of the backend `calculate` formulas for every type. It clamps T to min/max when they are set, then applies `k`. It is used by the tests and the sanity report, and gave the reference values of the backend unit tests.
- **`pubchem/`**, polite PubChem lookups (step 2), independent of the build: client, records, class files and constants, see [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md#files).
- **`compound_data/`**, merge and output (step 1):
  - `builder.py` `build_compound_data` (parse → identifiers → merge → molten-salt equations → checks → JANAF → NASA → CoolProp → NBS gaps → interaction ids; see [COOLPROP_LINKS.md](./COOLPROP_LINKS.md) for CoolProp fields on `BuildResult`);
  - `parsers/transport_parameters.py` `parse_transport_parameters` with `constants/transport_source.py` (`TRANSPORT_TABLES`, `ORIGINAL_REFS`, `TRANSPORT_COLUMNS`, `POTENTIALS`), see [Transport parameters](#transport-parameters);
  - `merger.py` `merge_compounds` (with the detach and unidentified rules), `compound_record.py` `CompoundRecord`, `formula_override.py` with `constants/formula_overrides.py` `FORMULA_OVERRIDES`, `constants/source_priority.py` `SOURCE_PRIORITY`, `class_override.py` `ClassOverride` with `constants/class_overrides.py` `CLASS_OVERRIDES`;
  - `pubchem_sources.py` `PubchemSources`, `read_pubchem_sources` (class files read once, with their tables), `pubchem_identifiers.py` `load_pubchem_identifiers` (class file records → `Identifier`), `pubchem_formula_links.py` `attach_pubchem_formulas` (`cas` of records without CAS), `pubchem_properties.py` `attach_pubchem_properties` (melting point, boiling point, density cited `pubchem` + refNumber), `constants/pubchem_source.py` (`PUBCHEM_TABLES` per class, `MISSING_CAS_FILE`);
  - `janaf_links.py` `attach_janaf`, `parsers/janaf_cas_index.py` `read_janaf_cas_index`, `constants/janaf_cas_index.py` `JANAF_CAS_INDEX`;
  - `nasa_links.py` `attach_nasa`, `nasa7_species`, `nasa9_species` (`NasaSpecies`: key, elements, phase, H°(298.15) of the fit), `constants/nasa_source.py` (file names, datasets, `HF_TOLERANCE`, `HF_TOLERANCE_SINGLE`);
  - `nbs_links.py` `attach_nbs`, `nbs_values`, `constants/nbs_source.py` (`NBS_FILE`, `NBS_PROPERTIES`);
  - `molten_salt_links.py` `attach_molten_salts`, `molten_salt_equations`, `molten_salt_mixtures.py` `read_molten_salt_mixtures`, `write_molten_salt_mixtures`, `constants/molten_salt_source.py` (`MOLTEN_SALT_DIR`, `MOLTEN_SALT_FILES`, `MOLTEN_SALT_R`);
  - `parsers/book_gas_equations.py` `parse_book_gas_equations`, `constants/book_gas_source.py` (`BOOK_GAS_FILE`, `BOOK_GAS_TABLES`); Huber viscosity modules — [VISCOSITY_GAS_HUBER.md](./VISCOSITY_GAS_HUBER.md);
  - `equation_check.py` `check_equations`;
  - `compound_file.py` `CompoundFile`, `compound_files.py` `compound_files` (records → files, see [File layout](#file-layout)), `compound_units.py` `compound_units` with `constants/units.py`;
  - `writers.py` `write_compound_json`, `write_unresolved`, `write_compound_index`, `write_compound_units`, `write_compound_sources`, `write_interactions` and `write_missing_cas`, following the pattern of [janaf/writers.py](../../python/src/janaf/writers.py), with `allow_nan=False`.
- **Equation property names:** heatCapacity, viscosity, thermalConductivity, density, enthalpyVaporization, surfaceTension and vaporPressure. The VDI enthalpy of vaporization, surface tension and vapor pressure are stored under the `liquid` phase.

### CLI and Make

- CLI `python/src/scripts/build_compound_data.py`, with arguments `--source-dir`, `--janaf-dir`, `--no-janaf`, `--nasa-dir` (default `shared/sources/NASA`), `--no-nasa`, CoolProp flags in [COOLPROP_LINKS.md](./COOLPROP_LINKS.md), `--pubchem-dir` (default `shared/sources/compound-data/pubchem`), `--no-pubchem`, `--transport-file` (default `shared/sources/transport-parameters.json`), `--no-transport`, `--nbs-file` (default `shared/sources/NBS/NBS_Tables_with_ErratumValues.csv`), `--no-nbs`, `--molten-dir` (default `shared/sources/NIST-molten-salts`), `--no-molten`, `--molten-out-dir` (default `shared/processed/molten-salt-mixtures`), `--book-gas-file` (default `shared/sources/book-gas-equations.json`), `--no-book-gas`, plus Huber viscosity CLI flags in [VISCOSITY_GAS_HUBER.md](./VISCOSITY_GAS_HUBER.md), `--out-dir` (cleared after a successful build, before writing), `--report-dir` and `-v`.
- CLI `python/src/scripts/fetch_pubchem_identifiers.py` (step 2) and `pubchem_search.py` (on demand), see [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md#running).
- Make file `scripts/make.d/11-compound-data.mk`, with targets `compound-data-build` (step 1), `compound-data-pubchem` (step 2 only), `pubchem-search` and `compound-data-test` (all five test folders).

---

## Reference registration (per docs/PYTHON_CODE_STANDARDS.md section 7)

- **New references:**
  - `[37] CRC95`: Haynes, Bruno, Lide, CRC Handbook of Chemistry and Physics, 95th ed., 2014.
  - `[38] Yaws2014`: Yaws, Thermophysical Properties of Chemicals and Hydrocarbons, 2nd ed., Gulf 2014. This is a different book from `Yaws1999`.
  - `[39] Zabransky1996`: Zabransky, Ruzicka, Majer, Domalski, *Heat Capacity of Liquids: Critical Review and Recommended Values*, AIP 1996.
  - `[40] TRC1994`: *Thermodynamics of Organic Compounds in the Gas State*, TRC/CRC 1994. Chemicals cites Kabo and Roganov, Vol. II; confirm the authors against the book.
  - `[41] VDI2010`: VDI Heat Atlas, 2nd ed., Springer 2010, PPDS coefficients.
  - `[42] Magalhaes2013`: Magalhães, Lito, Da Silva, Silva, J. Supercrit. Fluids 76 (2013) 94–114, Lennard-Jones σ and ε/k from viscosity data (`MagalhaesLJ.tsv`).
  - `[43] Svehla1962` (NASA TR R-132, the original of White Table A-7), `[44] Itean1961` (NASA TN D-481, Stockmayer force constants), `[45] Svehla1995` (NASA TM-4647, Table I) and `[46] Mamedov2014` (Mamedov & Somuncu, Lennard-Jones parameters from second virial coefficients): the transport parameters.
  - `[48] NISTMoltenSalts`: NIST Properties of Molten Salts Database, formerly SRD 27. Liquid density, surface tension and viscosity of a pure salt (`shared/sources/NIST-molten-salts/`).
  - `[49] Hirschfelder1954`: Hirschfelder, Curtiss & Bird, *Molecular Theory of Gases and Liquids* (Wiley, 1954). Lennard-Jones force constants from the CE 407 notes PDF (`hirschfelder1954-lj` in `shared/sources/transport-parameters.json`).
  - `White3` [20]: Tables 1-2, 1-3, A-6 and A-7.
- **Existing references to extend:**
  - `Perry8` [34]: add Tables 2-151, 2-153 (DIPPR 100 and 114) and 2-313.
  - `Poling5` [7]: mention the chemicals copy of the databank and the Lennard-Jones table (Appendix B, `PolingLJ.tsv`).
  - `NISTWebBook` [32]: mention the chemicals Shomate JSON.
- **Where to register:** [shared/references/references.json](../../shared/references/references.json), then `make references-generate` (it writes the backend and Python `RefKey` / `REFERENCES_META` and the [docs/REFERENCES.md](../REFERENCES.md) table).
- Every new row names the machine-readable source, "CalebBell/chemicals, `chemicals/<path>`, URL: https://github.com/CalebBell/chemicals", the same way the `Perry8` row does.
- The backend equation code is unchanged in this step.

---

## Tests (fixtures built from real rows)

One folder per package: `python/tests/chemical_formula/` (formulas, classes, main element, families), `dataset_layout/` (file names, collisions, clearing), `chemicals_tables/` (parsers, provenance, equation types and eval, identity overrides; `chemicals_fixtures.py` is shared with `compound_data/` through its conftest), `pubchem/` (client, results, class files, CAS list) and `compound_data/` (merging, writers, JANAF links, PubChem identifiers).


- **Equation mapping** (checked against the chemicals docstrings and the backend):
  - Perry_151 at 300 K gives 24.124944 through maierKelley with k 4.184.
  - The MnO row goes to quadratic.
  - A row with no range gets no equation.
  - CRC_inorganic(300, 2370.0, 2.687, 239.08) gives 2206.30796 through linear.
  - The Poling docstring example matches quartic with k = R.
  - The Perry 2-312 and 2-314 C3H8 rows reproduce the vars in `c3h8.ts`.
- **New types:** `evaluate_equation` must reproduce the chemicals functions. chemicals isn't a dependency, so the expected values are copied into the fixtures:
  - `EQ114` for ammonia;
  - `TRCCp` for methanal;
  - `Shomate(500, ...) = 35.21836175` for water vapour;
  - Zabransky spline and quasi-polynomial;
  - `EQ101` for formaldehyde;
  - `PPDS9`;
  - `volume_VDI_PPDS(300, 126.19, 313, ...) = 313.0`;
  - `PPDS12`;
  - `EQ106`;
  - `Wagner`;
  - `sutherland` and `powerLaw` for White's air row (μ(400 K) ≈ 2.29e-5 Pa s, y0 at T0, clamping).
- **Ranges:**
  - A Shomate entry with 2 ranges picks the right range.
  - A VDI liquid entry takes Tm/Tc from the cited row.
  - A VDI gas entry has `min/max = null`.
- **Type sync:** every `EquationType` value is either in `equation-type.dto.ts` (the test reads the TS file) or in `PLANNED_EQUATION_TYPES`, never both. Once the backend adds a type, the test forces it out of the planned set (empty now). `compose.yml` mounts `backend/src/common/thermal/dto` read-only at `/app/backend-dto` for this test.
- **Grouping and organic rule:**
  - Main element: Al2O3 → Al, TiO2 → Ti, NH3 / N2H4 → N, H2SO4 → S, MgAl2O4 → Mg, Mo2B → Mo, H2O / OF2 → O, H2 → H (27 cases).
  - Ca and Cl are not read as C.
  - Formula rule: CH4, CCl4, C2F6, C2N2, C3O2, C2O organic; CO2, CS2, CN, CaCO3, CaC2, B4C, NaHCO3, K4Fe(CN)6, C60 inorganic; D counts as H; a structure answer wins, except for elemental carbon.
  - Bond rule (`has_organic_bond`): methane, deuterated methane, CCl4, C2F6, phosgene, tetracyanoethylene, urea, melamine, sodium acetate, cyanuric triazide, cyanogen, carbon suboxide and subsulfide organic; CO2, CO, CS2, NaHCO3, KCN, MgCO3·3H2O, LaC2, calcium oxalate, calcium cyanamide, Ni(CO)4, boron carbide inorganic.
  - Merger: HCN is inorganic by override (reported in `classOverridden` with the bond rule's `true`), a CCl4 row without SMILES is organic, reported in `classFromFormula`, and `halogenated` from its formula (reported in `familyFromFormula`).
- **IUPAC formula** (`iupac_formula`): Table VI order (TiO2, TiI, TiF4, ZnB4O9, Al2SiO5, TiOCl2, SiC, XeF2, NH3, HCl, AlH3, OF2, S2Cl2), halogen oxides and halates (ClO2, HClO4, ClO3F, KClO4, AgBrO3, not CrO2Cl2), oxoacids and acid salts (HNO3, H2SO4, NaHCO3, KH2PO4, HCN, ammonium N2H4O3), hydroxides (NaOH, MgO2H2), D after H.
- **Families:**
  - ethanol is alcohols;
  - benzene is aromatics;
  - acetic acid, sodium acetate and ammonium oxalate are carboxylic-acids;
  - ethyl acetate is esters;
  - methane is alkanes, ethyne alkynes, allene and ketene alkenes, cyanogen nitriles;
  - `formula_family`: CH4, C16H34, CD4 alkanes, C2H4 alkenes, C2H2 alkynes, CCl3F, CF2, CBr, CFO halogenated, CF8S sulfur, organosilicon and organometallic formulas; None for CH3, C2H, CHO, C3H6, amines, acyl chlorides, CHP, diazomethane and B4C; it agrees with the SMARTS on 12 sample structures.
- **Identifiers:** CAS resolution precedence, the 12004-39-6 override and its conflict entry, and Perry formula cleaning (`22 SO2`).
- **Merging:** all values are kept, and `def` follows source priority. Unidentified rule: an inorganic row with unknown CAS moves onto the single identified record (`otherCas`), a detached row (no CAS) too, without `otherCas`; an organic isomer (dimethyl ether vs ethanol), a `D2` row next to hydrogen and a formula without identified record are kept and reported. `pubchemCid` comes from the identifier, `smiles` from an identity override when there is no identifier.
- **Identity overrides** (`chemicals_tables/test_identity_overrides.py`): normal H2 with `variant`, pentaethoxyuranium with SMILES, other rows untouched; CID parsing of the chemicals files (`-1` → none).
- **PubChem** (`pubchem/test_pubchem_result.py`, `test_pubchem_search.py`, `test_pubchem_client.py`): see [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md#tests).
- **PubChem in the build** (`compound_data/test_pubchem_identifiers.py`): table keys per class; `ok` record → `Identifier` (`[line, "idPubchemRestInorganic"]`, compound URL), charged record → none; only `ok` records of missing CAS, with status counts, issues per class table and the tables read; no files; formula links (an `ok` search adds `cas`/`casRef`/`pubchemCid` and keeps the key, a CAS of another record is reported, not-ok and not-fetched searches are counted, a found compound without CAS gives the CID only); the `sources.json` file keys and `pubchem` block; `missing-cas.txt` read back by `read_cas_list`.
- **Writers and index:** compound file paths and the root files, file fields (`class`, `group`, `displayFormula`, `hill`, `elements`, `entries[cas | noCas]`) without meta or `generatedAt`, no `id`/`cas`/`hill`/`elements` or empty fields inside entries, every index entry resolves through `file`/`entry`, `byOtherCas`, sorted `byElement`, no NaN.
- **Layout:** three Bi2O3 CAS in one file named after the lowest CAS, ethanol and dimethyl ether in their own family files, `Ti/TiO2-…` and `N/NH3-…`, and the carbon classes in files: `C/HCN-…`, `Na/NaHCO3-…`, `amides/CH4N2O-urea`, `halogenated/CCl4-…`.
- **Units:** `units.json` content, and every property and equation property of the index has a unit.
- **Repository links:**
  - Every `ref`, `identifierRef`, `tcRef` and `rangeRef` names a file key listed in `sources.json`, with the same RefKey.
  - `sources.json` has `repository`, `sourceCommit`, `sourceTree`, unique file keys and `%20`-encoded URLs pinned to the commit.
  - Provenance parsing reads the repository and commit, and falls back to `master` with a warning.
- **Lennard-Jones** (`chemicals_tables/test_parsers.py`): Poling and Magalhães rows give collisionDiameter 3.758e-10 m (exact after scaling) and epsilonToKb with `potential: "lennardJones"` and `[Poling5, line, "polingLJ"]` / `[Magalhaes2013, line, "magalhaesLJ"]`.
- **Transport parameters** (`compound_data/test_transport_parameters.py`, fixture file with one row per kind): row lines point at the row's `{`; White power law and Sutherland with range, `error` and `originalRef`; Table A-6 from the SI columns without range; A-7, TN D-481 and Mamedov values in SI with `potential` / `basis`, the mixture row reported; Svehla pure rows → `TransportValue` (σ in m, `epsilonToKb`) plus potential properties with `citation` and `TminK`, pairs and electron rows → interactions; interaction ids by CAS and `otherCas` with `transportInteractionNoRecord`; the committed file parses with every table known and valid CAS check digits. `test_writers.py`: the record `transport` block, index `transport`, `interactions.json`, the transport keys in `sources.json` (every ref resolves) and the transport units.
- **NASA keys** (`test_nasa_links.py`): CO2 with a wrong ΔfH° reported and `CO2#2` linked, gas and liquid keys checked against their own phase, an isomer picked by ΔfH°, two agreeing organic records ambiguous, the 20 kJ/mol tolerance for inorganic and single candidates (not for radical isomers), name suffixes (`n-butane` / `isobutane`, truncated `n-octa`, `tr2-butene`), deuterated records skipped, unchecked links (inorganic without ΔfH° yes, numbered duplicates and organic isomers no), ions / electron / D / `Air` / unparsed keys skipped, a formula without record, H°(298.15) of NASA-7 and NASA-9 CH4 fits (−74.6 kJ/mol), record and index fields, refs, the `sources.json` `nasa` block and a missing NASA folder.
- **JANAF ids** (`test_janaf_links.py`): CAS match to one record, formula fallback onto every record, CAS formula mismatch, new records (with the CSV CAS or `formula:<Hill>`), ions and deuterium skipped, `Mo1O2.750`, CSV Hill normalisation, the builder reading a JANAF copy, and the `sources.json` `janaf` block.

---

## Docs

- This spec, plus an entry in [docs/scripts/README.md](README.md); the PubChem step has its own [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md).
- A "Compound data" section in [python/README.md](../../python/README.md), next to the JANAF one, covering source, output and make targets.

---

## Verification

1. `make compound-data-test`.
2. `make compound-data-build` (step 1, offline; writes `missing-cas.txt`).
3. `make compound-data-pubchem` (step 2: the first run takes hours for 3,976 CAS numbers, later runs only query new ones). If it stops with exit code 2, PubChem refused requests or stayed busy: wait and run it again. See [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md#verification). Then `make compound-data-build` to read the new files.
4. Spot-check with `rg --no-ignore`:
   - Al2O3 `1344-28-1` has CRC meltingPoint 2327.15. Al2O3 `39377-45-2` (Perry's CAS) has a Perry solid `maierKelley` with `d: -522500` and `k: 4.184`.
   - MnO has `quadratic`.
   - C3H8 viscosity `dipprN102` equals `c3h8.ts`.
   - Water (`7732-18-5`) has gas `shomate` with 2 ranges (500–1700 and 1700–6000 K) and liquid `shomate` 298–500 K.
   - Methanal has a gas `trcCp` 50–3000 K.
   - Ethanol is in `organic/alcohols/C2H6O-ethanol.json`; TiO2 in `inorganic/Ti/TiO2-titanium-dioxide.json` (`displayFormula` TiO2, `hill` O2Ti), ammonia and hydrazine in `inorganic/N/NH3-ammonia.json` and `N2H4-hydrazine.json`.
   - `inorganic/C/` has 30 files (CO, CO2, CS2, HCN, HNCO, elemental carbon and fullerenes, ...); boron carbide is `inorganic/B/B4C-boron-carbide.json`; CCl4 and C2F6 are in `organic/halogenated/`, methane and ethane in `organic/alkanes/`, acetylene in `organic/alkynes/`, NaHCO3 in `inorganic/Na/`, calcium oxalate in `inorganic/Ca/`; the report has 5 `classOverridden`, 64 `classFromFormula` and 42 `familyFromFormula`, and `organic/unclassified/` holds 30 records (radicals, diazomethane, guanidine).
   - The report lists the 29 Perry rows without a range.
   - Al2O3 `1344-28-1` has `janaf` Al-096..Al-101 (CAS match) and `39377-45-2` has none; TiO2 `13463-67-7` has O-042, O-044, O-045, O-046.
   - `inorganic/Al/Al-aluminum.json` `entries` has only `7429-90-5`, with `otherCas: ["3303-34-2"]` and the Perry solid/liquid Cp; with the PubChem data of 1,207 CAS the report has 23 `unknownCasMoved` and 84 `unknownCasKept` (15,802 records in 15,707 files).
   - Methane `74-82-8` has `collisionDiameter` 3.758e-10 m (Poling) and 3.58484e-10 m (Magalhães); 327 records have Lennard-Jones values.
   - NASA keys: methane `["CH4"]` in both; water `["H2O", "H2O(L)", "H2O(s)"]`; n-butane / isobutane get `C4H10,n-butane` / `C4H10,isobutane`; carbon dioxide has NASA-7 `CO2` and no NASA-9 key, oxygen no NASA-9 key, benzene NASA-9 only `C6H6(L)` (the NASA-9 `CO2`, `O2`, `C6H6` are in `nasa9HfMismatch`). Counts: NASA-7 932 species → 660 records (712 unchecked), NASA-9 1,706 → 1,152 (861 unchecked); 4 / 121 ambiguous, 10 / 369 ΔfH° mismatches.
   - Transport: 423 entries, 64 records with a `transport` block, 45 interactions (19 with a `null` id: electron, ions, H6F6), 4 `transportMixtureSkipped`. Nitrogen `7727-37-9` has gas viscosity `powerLaw` (y0 1.663e-5, n 0.67, 220–1500 K, `error: 3`) and `sutherland` (S 107, 100–1500 K), `transport.viscosity` with `matchTemperatureK: 2200`, and a `correspondingStates` `rhoStar` 0.108; argon has White A-7 σ 3.542e-10 m (`originalRef: Svehla1962`) and Mamedov σ 3.4e-10 m (`basis: secondVirial`).
   - `sources.json` lists 39 file keys (with the 7 transport keys), the `janaf` and the `nasa` blocks; `units.json` has every property of the index; no compound file has `generatedAt`, `units`, `tables` or `source` blocks.
   - A second build leaves no stale files (the output folder is cleared first).
