# Compound Data Pipeline Prerequisites and Output Layout

**Parent index:** [COMPOUND_DATA_SPEC.md](./COMPOUND_DATA_SPEC.md)

---

Done, except the `PROVENANCE.txt` edition fix and `SHA256SUMS` update below.

- Add these files to `shared/sources/compound-data/chemicals/`. They come from the source repository [CalebBell/chemicals](https://github.com/CalebBell/chemicals) at the commit recorded in `PROVENANCE.txt`, and keep their repo paths:
  - `Identifiers/chemical identifiers pubchem small.tsv`
  - `Heat Capacity/PolingDatabank.tsv`
  - `Heat Capacity/Perry_Table_2-153_DIPPR_100.tsv` and `Perry_Table_2-153_DIPPR_114.tsv`
  - `Heat Capacity/TRC Thermodynamics of Organic Compounds in the Gas State.tsv`
  - `Heat Capacity/Zabransky.tsv`
  - `Heat Capacity/webbook_shomate_coefficients.json`
  - `Viscosity/Table 2-312 ...tsv` and `Table 2-313 ...tsv`
  - `Thermal Conductivity/Table 2-314 ...tsv`
  - the 8 `VDI PPDS *.tsv` files in `Viscosity/`, `Thermal Conductivity/`, `Density/`, `Phase Change/`, `Interface/` and `Vapor Pressure/`
  - `dev/data/janaf/janaf_tables_index.csv` (JANAF table → CAS, used to attach the JANAF table ids)
  - `Viscosity/PolingLJ.tsv` and `Viscosity/MagalhaesLJ.tsv` (Lennard-Jones σ and ε/k)
- The NIST-JANAF copy in `shared/sources/compound-data/nist-janaf/` (see [JANAF_PARSER_SPEC.md](JANAF_PARSER_SPEC.md)). Without it the build runs without JANAF ids and logs a warning.
- The NASA sources in `shared/sources/NASA/` (`nasa7-origin.dat`, `nasa9-origin.dat`, `nasa9-new.dat`, see [NASA_THERMO_PARSER_SPEC.md](NASA_THERMO_PARSER_SPEC.md)). Without them the build runs without NASA keys and logs a warning.
- `make compound-data-pubchem` (network, hours the first time) fills `shared/sources/compound-data/pubchem/pubchem-{inorganic,organic,unclassified}.jsonl`. Without them the build runs without PubChem identifiers and logs a warning.
- Update `SHA256SUMS`.
- Change "Perry ... 7th ed." in `PROVENANCE.txt` to the 8th edition (chemicals `heat_capacity.py` lines 822 and 850-854).
- Add `rdkit` to [python/pyproject.toml](../../python/pyproject.toml), rebuild the image, and check that `import rdkit` works on Python 3.14. The `python_packages` volume hides new image packages, so also run `docker-compose run --rm python pip install rdkit==2026.9.1` (or recreate the volume).

---

## Output: `shared/processed/compound-data/`

The build clears the folder first (the `inorganic/` and `organic/` folders and the top-level `.json` files; anything else is kept with a warning), so files of renamed or dropped compounds do not linger.

```
shared/processed/compound-data/
├── index.json          every compound with its file, plus byFormula / byElement / byFamily / byOtherCas
├── units.json          unit of every property, equation result, Mr and temperature
├── sources.json        repository, commit, license, the file keys of ref: [RefKey, line, fileKey], JANAF and NASA links
├── unresolved.json     source rows whose CAS or formula could not be resolved
├── interactions.json   Svehla 1995 transport data of species pairs, with the record ids of both species
├── inorganic/
│   ├── Al/Al2O3-electrocorundum.json, Al/Al-aluminum.json, ...
│   ├── C/CO2-carbon-dioxide.json, C/HCN-hydrogen-cyanide.json, ...   (30 inorganic carbon compounds)
│   ├── N/NH3-ammonia.json, N/N2H4-hydrazine.json, N/HNO3-nitric-acid.json, ...
│   ├── Na/NaHCO3-sodium-bicarbonate.json, ...
│   └── Ti/TiO2-titanium-dioxide.json, Ti/TiF4-..., ...
└── organic/
    ├── alcohols/C2H6O-ethanol.json, ...
    ├── ethers/C2H6O-dimethyl-ether.json, ...
    └── halogenated/CCl4-carbon-tetrachloride.json, C2F6-..., ...
```

The compound files carry no units, no source links and no `generatedAt` (a rebuild only changes files whose data changed). `units.json` lists the unit of every value; the backend types ([compound-data-properties.type.ts](../../backend/src/common/thermal/utils/compound-data/types/property/compound-data-properties.type.ts), [compound-data-equations.type.ts](../../backend/src/common/thermal/utils/compound-data/types/equation/compound-data-equations.type.ts)) document the same units. Each value cites its source row as `ref: [RefKey, line, fileKey]`, and `sources.json` resolves the file key.

### File layout

- **Folder:** `inorganic/<main element>/` or `organic/<first family>/` (`unclassified` when neither the SMILES nor the formula gives a family).
- **One file:** inorganic, every record of one Hill formula; organic, one record.
- **Name:** `<displayFormula>-<name slug>.json` (`dataset_layout.compound_file_name`). The slug is the record name in lowercase ASCII words joined by `-`, Greek letters spelled out (`α` → `alpha`), cut at 80 characters on a word boundary; a name that only repeats the formula is dropped (`Ne.json`). An inorganic file is named after its record with the lowest CAS (numerically), so `TiO2-titanium-dioxide.json` holds five TiO2 CAS numbers. The formula keeps its case, so `CO` and `Co` never meet.
- **Collisions:** paths are compared case-insensitively (macOS and Windows checkouts); colliding files get their CAS (or record id) appended. A full build has none.

### Compound file

`entries` are keyed by CAS (`noCas` for the record without CAS; its record id if one formula ever has two), ordered by CAS. The CAS, Hill formula and elements are not repeated inside an entry. `compoundId` is the public catalogue id: the compound `name` with spaces changed to `_`; when several records share that slug they get `_1`, `_2`, `_3`, … (stable CAS order); a unique name stays unsuffixed. `formula` is written only when it differs from the Hill key (isotopes, charges: `C2D4O`), and null or empty fields are left out. Example `inorganic/Al/Al2O3-electrocorundum.json` (abridged, from a real build):

```json
{
  "class": "inorganic", "group": "Al", "displayFormula": "Al2O3", "hill": "Al2O3", "elements": ["Al", "O"],
  "entries": {
        "1344-28-1": {
          "compoundId": "electrocorundum", "name": "electrocorundum", "Mr": 0.10196, "smiles": "O=[Al]O[Al]=O", "inchikey": "TWNQGVIAIRXVLR-UHFFFAOYSA-N",
          "identifierRef": [1213, "idPubchemSmall"],
          "properties": {
            "meltingPoint": [{"value": 2327.15, "variant": "α", "ref": ["CRC95", 301, "crcConstants"]}],
            "enthalpyFormation298": [{"value": -1675700, "phase": "solid", "variant": "α", "ref": ["CRC95", 1374, "crcStdThermo"]}]
          },
          "equations": {"...": "..."},
          "janaf": ["Al-096", "Al-097", "Al-098", "Al-099", "Al-100", "Al-101"]
        },
        "39377-45-2": {
          "compoundId": "aluminium_oxide", "name": "aluminium oxide", "Mr": 0.10196, "smiles": "[O-2].[O-2].[O-2].[Al+3].[Al+3]", "inchikey": "...",
          "identifierRef": [63145, "idPubchemLarge"],
          "equations": {
            "heatCapacity": {
              "solid": {"def": 0, "values": [
                {"type": "maierKelley", "ref": ["Perry8", 459, "perry151"],
                 "vars": {"a": 22.08, "b": 0.008971, "d": -522500}, "min": 273, "max": 1973, "k": 4.184, "error": 3}]}
            }
          }
        }
  }
}
```

Entry fields: `compoundId` (public catalogue id from the name; equals the `index.json` compounds map key), `cas` and `casRef` (only on records without CAS: the CAS a PubChem formula search found, and its search record, see [PubChem identifiers](#pubchem-identifiers)), `name` (identifier name, else the first source label), `synonyms` (alternate names from the Yaws 1999 synonym appendix; excludes `name`), `Mr` [kg/mol], `smiles` (structure line notation, e.g. `CCO`; used for the organic families), `inchikey` (hashed IUPAC InChI, a lookup key for PubChem and other databases), `pubchemCid` (PubChem compound id; page `sources.json` → `pubchem.compoundUrl`), `families`, `identifierRef`, `otherCas`, `properties`, `equations`, `raw`, `transport` (see [Transport parameters](#transport-parameters)), `janaf`, `nasa7`, `nasa9`, `coolprop`. Compounds that no identifier source knows have no `Mr`, `smiles`, `inchikey`, `pubchemCid` or `identifierRef`. Validated Yaws CAS that were missing from the chemicals/PubChem identifier set are created as new records from the Yaws appendix (and then filled from the property tables).

### units.json

Built by `compound_data.compound_units`: scalar property units come from the `PropertyColumn` of each table spec and of `TRANSPORT_COLUMNS` (the build fails if two columns of one property disagree), equation result units and the `transport` method field units (`sigma` m, `epsilonToKb` K, `TminK` K, ...) from `compound_data/constants/units.py`. Raw rows keep their source unit in `values.unit`.

```json
{
  "$comment": "Units of shared/processed/compound-data (SI). Raw rows keep their source unit in values.unit.",
  "Mr": "kg/mol",
  "temperature": "K",
  "properties": {"acentricFactor": "1", "boilingPoint": "K", "criticalPressure": "Pa", "density": "kg/m3", "...": "..."},
  "equations": {"heatCapacity": "J/(mol K)", "viscosity": "Pa s", "thermalConductivity": "W/(m K)", "...": "..."},
  "transport": {"sigma": "m", "epsilonToKb": "K", "delta": "1", "TminK": "K", "matchTemperatureK": "K", "...": "..."}
}
```

`sources.json` (abridged):

```json
{
  "generatedAt": "...",
  "repository": "https://github.com/CalebBell/chemicals",
  "sourceCommit": "e79047588b30cfabc564c79fb26d760c746877d7",
  "sourceTree": "https://github.com/CalebBell/chemicals/tree/e79047588b30cfabc564c79fb26d760c746877d7",
  "license": "MIT",
  "lineUrl": "{url}#L{line}",
  "files": {
    "perry151": {"name": "Perry 2-151", "path": "chemicals/Heat Capacity/Perrys Table 2-151.tsv", "ref": "Perry8",
                 "url": "https://github.com/CalebBell/chemicals/blob/<commit>/chemicals/Heat%20Capacity/Perrys%20Table%202-151.tsv"}
  },
  "janaf": {
    "ref": "NISTJANAF",
    "repository": "https://github.com/n-takumasa/py-janaf",
    "sourceCommit": "c8ed6be3ba31a61835061091bd3c521270b484ec",
    "dataset": "shared/processed/JANAF/index.json",
    "tableUrl": "https://github.com/n-takumasa/py-janaf/blob/<commit>/src/janaf/data/{id}.txt",
    "nistUrl": "https://janaf.nist.gov/tables/{id}.html"
  },
  "nasa": {
    "nasa7": {"ref": "NASA7", "dataset": "shared/processed/NASA/nasa7.json", "sources": ["shared/sources/NASA/nasa7-origin.dat"]},
    "nasa9": {"ref": "NASA9", "dataset": "shared/processed/NASA/nasa9.json",
              "sources": ["shared/sources/NASA/nasa9-origin.dat", "shared/sources/NASA/nasa9-new.dat"]}
  },
  "pubchem": {
    "api": "https://pubchem.ncbi.nlm.nih.gov/rest/pug",
    "cache": "shared/sources/compound-data/pubchem",
    "compoundUrl": "https://pubchem.ncbi.nlm.nih.gov/compound/{cid}",
    "references": "shared/sources/compound-data/pubchem/pubchem-references.jsonl",
    "ref": "pubchem{refNumber}",
    "refNote": "pubchem151 is refNumber 151 in references (source, refCode). The same refNumber is on the citation in the class file. It is not a key of the main references database."
  }
}
```

With the PubChem files, `files` also has `idPubchemRestInorganic`, `idPubchemRestOrganic` and `idPubchemRestUnclassified`, one per class file that exists (`path` = the file, `url: null`: the files are local, so use `pubchemCid` for a link). With the transport parameters, `files` also has the 7 transport table keys (`path` = `shared/sources/transport-parameters.json`, `url: null`).

Perry files Al2O3 under 39377-45-2 (a PubChem ionic entry) and CRC under 1344-28-1. Both CAS are in the identifier databases, so both entries stay in `inorganic/Al/Al2O3-electrocorundum.json` (named after 1344-28-1, the lower CAS). Both appear in `index.json` `byFormula.Al2O3`, and the report lists them in `sharedFormulas`. The JANAF CAS index gives 1344-28-1 for all six Al2O3 tables, so only that record has `janaf`.

### Links to the source repository

- Every `PropertyValue`, `EquationValue` and `raw` entry has `ref: [RefKey, line, fileKey]`, except a PubChem experimental value, whose `ref` is the string `pubchem` + catalog number (`pubchem151`). The RefKey is the short key of [REFERENCES.md](../REFERENCES.md); the line is 1-based in the source file (for the Shomate JSON, the line of the CAS key). A JANAF melting or boiling point uses the table id as the file key (`[NISTJANAF, line, tableId]`), opened with `sources.json` → `janaf.tableUrl`.
- **Citation location is only `ref`.** Do not write `tableId`, `rowId`, `page`, `pageFirst`, `pageLast` (or similar locators) on the value; `sources.json` resolves the file key, and `line` in `ref` is the row.
- Rows used from other tables are cited the same way: `tcRef` (DIPPR 114 Tc from Yaws) and `rangeRef` (VDI liquid Tm/Tc).
- The identifiers (formula, MW, SMILES) carry `identifierRef: [line, fileKey]` (the identifier databases have no RefKey).
- `sources.json` maps each file key (`TableSpec.key` in `constants/source_tables.py`) to the table name, repo path, RefKey and file URL pinned to the commit in `PROVENANCE.txt`. The row URL is `lineUrl` = `{url}#L{line}`. `pubchem.references` is `pubchem-references.jsonl` and `pubchem.ref` is the form of a PubChem value citation. Those catalog rows are not copied into the main references database.
- Per-row details sit next to `ref`: `variant` (polymorph from a CRC label such as `Aluminum oxide (α)`, or the Perry 2-151 subphase, `glass` for Perry `gls` rows), `error` (Perry %, footnoted cells stay text such as `"1a"`; White ± %), `dataType` and `uncertainty` (Zabransky), `potential`, `basis`, `citation`, `TminK` and `originalRef` (transport parameters; `originalRef` is the RefKey White took the table from).
- The build report keeps the full form (table, label, line, URL) for every conflict and issue.

`ChemicalsSource` builds the URLs as `{repository}/blob/{commit}/{path}#L{line}`, with the path percent-encoded. If `PROVENANCE.txt` has no commit, it falls back to `master` and logs a warning, the same rule as `JanafSource`.

### JANAF table ids

The build parses the NIST-JANAF copy (`shared/sources/compound-data/nist-janaf/`) with the `janaf` package (`parse_janaf_tables`, `read_janaf_source`) and writes the table ids into the records (`janaf`). A crystal–liquid transition of an attached table is also `meltingPoint`, and a liquid–gas transition is `boilingPoint` (kelvin, `ref: [NISTJANAF, line, tableId]`). The polynomials stay in the JANAF dataset. The tables are in `shared/processed/JANAF/` (`make janaf-parse`); `index.json` there maps an id to its file. That dataset uses the same folder layout (main element / organic family, one file per compound, `index.json`, `units.json`, `sources.json`); the class and organic family of a carbon compound come from this dataset's `index.json`, so run `make compound-data-build` before `make janaf-parse`. It also uses the same refs system: each table has `ref: [RefKey, line, tableId]`, resolved by its own `sources.json` ([JANAF_PARSER_SPEC.md](JANAF_PARSER_SPEC.md#refs-and-sourcesjson)).

Matching, per table:
1. **CAS:** the chemicals `dev/data/janaf/janaf_tables_index.csv` row of the table gives a CAS. The CSV has no table id, so rows match tables by (Hill formula, state, name); CSV formulas are normalised to Hill (`H14B10` → `B10H14`), and a JANAF name with a trailing formula group (`Aluminum Bromide ((AlBr3)2)`) also matches the short CSV name. When the CAS is a record with the same Hill formula, the table goes to that record only.
2. **Formula:** otherwise (no CSV row, CAS not in the records, or a CAS record with another formula), the table goes to every record with its Hill formula. A JANAF formula is plain symbol-count pairs, so `Mo1O2.750` is MoO2.75, not an adduct.
3. **New record:** a formula without any record gets one, keyed by the CSV CAS when its tables share one unused CAS, else `formula:<Hill>`. It has the JANAF name and formula, and melting or boiling points when the tables list those transitions.

Ions (`Al1+`, 177 tables) and deuterium species (15 tables) are skipped. The report lists `janafIon`, `janafIsotope`, `janafCasFormulaMismatch` (CSV CAS whose record has another formula, e.g. AlBO2 vs pubchem AlBH2O2), `janafCasRowUnmatched` (CSV rows with no table, e.g. Sodium Carbonate written as CNaO3), `janafSharedFormula` (formula fallback onto several records) and `janafRecordCreated`. The CLI options are `--janaf-dir` and `--no-janaf`.

### NASA species keys

The build parses the NASA sources in `shared/sources/NASA/` with the `nasa_thermo` package (the same files and merge order as `make nasa-parse`: `nasa7-origin.dat`; `nasa9-origin.dat` then `nasa9-new.dat`, the later file wins) and writes only the species keys into the records (`nasa7`, `nasa9`; all phases, e.g. `["H2O", "H2O(L)", "H2O(s)"]`). The low and high temperatures of a polynomial are not used as a melting or boiling point. The species are in `shared/processed/NASA/nasa7.json` / `nasa9.json` (`species[key]`). The backend reads those files.

Matching, per species (`compound_data/nasa_links.py`):
1. **Formula:** the Hill formula of the element slots the parser now reads (`elements`, see [NASA_THERMO_PARSER_SPEC.md](NASA_THERMO_PARSER_SPEC.md)). Records whose name marks them deuterated (`methanol-d3`, `furan-d4`) are not candidates: the chemicals formulas of some of them have H for D. Ions, the electron, D/T species, fractional formulas (`Air`, `Jet-A` stays as C12H23 without a record) and unparsed keys are skipped.
2. **Name:** a key suffix after the comma (`C4H10,isobutane`, `C8H10,ethylbenz`) narrows the candidates to the records whose name or source labels match it: lower-case letters and digits, `n-` dropped, `tr2-` read as `trans-2-`, equal or a prefix of 4+ characters (NASA-7 names are cut at 18 characters: `C8H18(L),n-octa`).
3. **ΔfH°(298.15):** the enthalpy of the fit at 298.15 K (H° = ΔfH° at 298.15 K in both formats; none when 298.15 K is outside the fit) is compared with the record's `enthalpyFormation298` of the same phase (gas; liquid for `(L)`; solid for other condensed keys), any of its values:
   - within `HF_TOLERANCE` (5 kJ/mol): one agreeing record is linked; several only when all are inorganic (one compound under two CAS), else `Ambiguous`;
   - within `HF_TOLERANCE_SINGLE` (20 kJ/mol; older NASA-7 and CRC values differ that much): the closest record, when the candidates are inorganic or there is only one;
   - otherwise `HfMismatch`, never linked.
4. **No ΔfH° to compare:** inorganic candidates are linked unless the key is a numbered duplicate (`Fe(a)#2`); an organic record only when it is the single name match or the single record of the formula, else `Unchecked`.

The check matters because `nasa9-new.dat` replaces some `nasa9-origin.dat` keys with other species: NASA-9 `CO2` (+49.6 kJ/mol), `O2` (singlet) and `C6H6` (fulvene) are reported as `nasa9HfMismatch` and stay off carbon dioxide, oxygen and benzene, matching the comments in the backend gas compounds.

The report has, per dataset (`nasa7…` / `nasa9…`), the counts `Species`, `Skipped`, `Linked` (species linked), `LinkedUnchecked` (linked without a ΔfH° check), `Records`, and the sections `NoRecord` (formula without record: radicals, Mo oligomers), `Ambiguous` (with the agreeing ids), `HfMismatch` (NASA and record values) and `Unchecked`. The CLI options are `--nasa-dir` and `--no-nasa`.

### PubChem identifiers

The chemicals identifier files are a partial PubChem sample: 3,976 CAS numbers of the tables are missing (methane, biphenyl, Al4C3), so their rows went to `unresolved.json` ("formula not found") or became records without `Mr`/`smiles`. PubChem is slow to query, so it is a separate second step with its own package (`pubchem`) and local files; the build never goes online. The fetch step, its requests, throttling and file format are in [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md).

- **Step 1** (`make compound-data-build`): the build uses whatever the PubChem files hold and writes `tmp/reports/python/compound-data/missing-cas.txt`, the CAS numbers no chemicals identifier file has (one per line, `#` header; independent of the PubChem files, so `--retry` can re-query).
- **Step 2** (`make compound-data-pubchem`): looks those CAS numbers up in PubChem, and searches the records without a CAS (`formula:…`, 162) by their Hill formula. It does not rebuild the compound data; run `make compound-data-build` when the new files should be read. The results go to `shared/sources/compound-data/pubchem/pubchem-{inorganic,organic,unclassified}.jsonl`: one line per query, with the full property answer, the experimental properties of its CIDs and, for a formula search, the CAS section of the found compound. On-demand searches (`make pubchem-search Q="CaAl2O4"`, `pd-new PUBCHEM=1`, the query list) write to the same files.
- **Statuses:** `ok` (one compound, or several with one Hill formula), `ambiguous` (different formulas), `charged` (only an ion, Perry's Mg 22537-22-0 → `Mg+2`) and `notFound`; only `ok` is used. See [PUBCHEM_SPEC.md](PUBCHEM_SPEC.md#statuses).
- **Build:** `ok` records are the last identifier source (after the chemicals files), with `identifierRef: [line, "idPubchemRestInorganic"]` (the line and key of the class file; `idPubchemRestOrganic`, `idPubchemRestUnclassified`) and `pubchemCid`. When a CAS has several lines, the newest wins. Experimental melting points, boiling points and densities are loaded and copied onto the record (see [PubChem experimental values](#pubchem-experimental-values)). A PubChem identity can contradict a row's own formula, and the detach rule then handles it: Perry's Al 3303-34-2 is L-alanyl-L-leucine in PubChem, so the Perry row becomes `formula:Al` and the unidentified rule moves it onto 7429-90-5. CLI options `--pubchem-dir` and `--no-pubchem`; without the files the build logs a warning.
- **Records without CAS** (`pubchem_formula_links.py`): an `ok` formula search `formula:<Hill>` adds `cas` (the CAS most sources give on the compound's PubChem page), `casRef: [line, "idPubchemRest<Class>"]` and `pubchemCid` to the record, which keeps its `formula:` id and its `noCas` entry (no re-keying, no merging). Runs after the JANAF and NASA steps, so the records JANAF creates (`formula:AlF` …) are included. Not added, and reported:
  - `pubchemCasExists`: the found CAS is already a record or a moved CAS (`record`, `recordFormula`). Either the compound is in the data twice, or that record has a wrong formula: 21548-73-2 is Ag2HS (protonated identifier formula) where PubChem has Ag2S, and 13595-82-9 is AlF3 in the sources where PubChem has AlF;
  - `pubchemFormulaSearchAmbiguous` / `pubchemFormulaSearchNotFound` (with the candidates).

  The counts `pubchemFormulaCas`, `pubchemFormulaCidOnly` (found compound without a CAS section), `pubchemCasExists`, `pubchemFormulaSearch<Status>` and `pubchemFormulaNotFetched` go to the report. The PubChem files are read once (`pubchem_sources.py` `read_pubchem_sources`, with the experimental bodies) for the CAS identifiers, the formula links and the experimental values. The report counts `pubchemProperties` (values copied) and `pubchemPropertiesSkipped` (a melting, boiling or density citation that had no convertible number).

### PubChem experimental values

Melting point, boiling point and density from the class-file experimental sections are copied onto the compound. The value is in the dataset unit (K, kg/m³). °C and °F are converted; g/cm³ and g/mL are converted to kg/m³. A temperature printed beside a density, a boiling point at a reduced pressure, and a decomposition or sublimation note are not copied. Other headings (solubility, vapor pressure, logP, …) stay in the PubChem files only.

The citation is the string `pubchem` + `refNumber` from that citation, for example `pubchem151`. It is not added to `shared/references/references.json` and it does not appear in the record's `refs` list.

To find `pubchem151`:

1. Open `shared/sources/compound-data/pubchem/pubchem-references.jsonl` and take the line whose `refNumber` is 151. `source` is the work; `refCode` is its catalog code. `sources.json` → `pubchem.references` is that file, and `pubchem.ref` is the form `pubchem{refNumber}`.
2. The same `refNumber` is on the citation in `pubchem-inorganic.jsonl` or `pubchem-organic.jsonl` (the record of the compound's CAS, or `formula:<Hill>`), under `experimental` → `values` → `citation`. `text` is the original printed string; `values` are the parsed number and unit; `refPage` is the page when the citation had one.

### PubChem query list

`shared/sources/pubchem-queries.txt` lists 551 formulas without a compound-data record (aluminates, silicates, borates, double salts, hydrates), one per line, with names and CAS numbers after `#`. They were taken once from the former library tables (`legacy/library`), which are not read any more. The formulas with fractional counts and one unreadable formula were left out. `make pubchem-search QUERY_FILE=shared/sources/pubchem-queries.txt` searches them by formula into the PubChem files (about an hour at PubChem's pace; stored searches are reused). A found CID and CAS are candidates for new records, not automatic ones; the CAS numbers in the comments were scraped from PubChem synonyms without a formula check, so compare them with what the search finds.

The comparison that produced the list also checked the 234 CAS numbers of those tables against the compound data, using PubChem's answer for each CAS as the referee:

- the compound data has protonated identifier formulas for Fe3O4 1317-61-9 (Fe3H8O4), Li2O 12057-24-8 (HLi2O), MnSO4 7785-87-7 (H2MnO4S) and ZrF4 13842-94-9 (F2Zr);
- the old tables were wrong for TiN 7440-31-5 (tin), CaO2 1305-62-0 and BaO2 17194-00-2 (the hydroxides);
- 30 of their CAS numbers are not in the compound data, and many of them belong to another compound in PubChem (CrN 262-76-0 is corrin, NiS 516-12-1 N-iodosuccinimide).

### Equations

- `equations.<property>.<phase>` has the backend `{def, values}` shape, so a value can go straight to `Common.equation(type).calculate(T, vars, min, max, k)`.
- `def` is the first entry, in source priority order, whose type the backend implements. The priority order is Perry, then Poling, then VDI, then CRC. A type listed in `PLANNED_EQUATION_TYPES` never becomes `def`; the set is empty now, so `def` is the first entry.
- `ref` is the source row tuple, not the backend `RefKey`; the backend loader takes `ref[0]`. The other extra keys (`variant`, `error`, `dataType`, `uncertainty`, `tcRef`, `rangeRef`, and `raw` for molten density) are provenance only.
- `index.json` `equationTypes` lists every `type` used, and whether each one is `implemented` or `planned` (all `implemented` now).

### Records

- No values are averaged. Every source row is kept; `variant` tells polymorphs apart where the source names them.
- Records without a CAS get the id `formula:<F>`. Records whose formula can't be resolved go to `unresolved.json`.
- **Identity overrides:** `IDENTITY_OVERRIDES` (keyed by file key and line, each with a cited reason) gives CAS, formula, `variant` and SMILES to the rows that have neither CAS nor formula:
  - Poling 367 "hydrogen, normal" and 368 "deuterium, normal" (chemicals pseudo-CAS 2099474000-00-0 and 2099437000-00-0, which fail the CAS check digit) → 1333-74-0 H2 and 7782-39-0 D2 with `variant: "normal"` (3:1 ortho/para; Cpg 28.83 vs 28.84 and 29.2 vs 29.19 J/(mol K) of the plain rows);
  - Zabransky 2 "Pentaethoxyuranium" (CASRN `None`, not in PubChem) → `formula:C10H25O5U`, U(OC2H5)5, with SMILES for pentaethoxyuranium (U with five ethoxy ligands) for the family.
- **Detach rule:** a row with its own formula (Perry 2-151, CRC heat of fusion) whose formula contradicts its CAS goes to `formula:<F>` instead, with the conflict reported (`resolution: "detached"`). Contradiction means other elements, or counts that are not proportional (`AlCl3·6H2O` vs pubchem `AlCl3H2O`). The CAS formula is the override, else the identifier formula, else the first source formula of that CAS. Proportional formulas (As2S3 / As4S6) and unparseable ones ("Pcl3") keep the CAS.
- **Unidentified rule:** a record without identifier moves onto the single identified record with the same Hill formula, when the formula is inorganic, has no carbon and no isotopes or charge (on both sides: `D2` never joins hydrogen). Unidentified means a CAS that no identifier source knows (and no override; Perry files many elements and salts under CAS numbers of nothing, Mg under 22537-22-0), or no CAS at all (detached rows such as Perry's Al, the Perry monatomic gases `formula:Ne`, `formula:Sn`). A moved CAS goes to the target's `otherCas` and to `index.json` `byOtherCas`. An unknown CAS is not wrong by itself (the identifier sources miss real compounds), so organic and carbon-containing formulas (isomers: biphenyl/acenaphthene, C4F10) and formulas with zero or several identified records are kept and reported (`unknownCasKept` / `noCasKept`, with the candidates).
- `Mr` is left out when the formula is overridden, because the identifier MW belongs to the wrong formula.
- Isotopes (`[18O]`, `D`, `T`) count as their element.
- `FORMULA_OVERRIDES` is keyed by CAS, and each override has a cited reason, e.g. `12004-39-6 -> Al2TiO5` (CRC name "Aluminum titanate", pubchem synonym "al2tio5"; pubchem's own formula is Al2O7Ti2).

### Index file

`index.json` holds:
- `generatedAt`, `count` and `equationTypes`;
- `compounds`, keyed by public `compoundId` (name with spaces as `_`; `_1`/`_2`/… when names collide), one entry per compound with `compoundId` (same as the map key), its location (`file`, `hill`, `entry`: the record is at `file` → `entries[entry]`), `cas` (primary CAS when known, else a PubChem formula-search CAS), `displayFormula`, `formula` when it differs from `hill`, name, class, group, families, refs (with `NISTJANAF` when it has JANAF ids, `NASA7` / `NASA9` when it has NASA keys, `CoolProp` when it has CoolProp keys), which properties and equation phases it has, the properties of its `transport` block, `janaf`, `nasa7`, `nasa9`, `coolprop` and `otherCas`; null and empty fields are left out;
- the lookups `byFormula`, `byElement` (sorted keys), `byFamily`, `byCas` (primary CAS → compoundId) and `byOtherCas` (moved CAS → compoundId).

It holds no property values.

### Report

`tmp/reports/python/compound-data/report.json` is a working file, not part of `shared/`. It lists:
- `counts`;
- `formulaConflicts` (overrides, detached rows, proportional or unparseable source formulas) and `sharedFormulas` (inorganic formulas under more than one CAS);
- `unknownCasMoved` / `noCasMoved` (source id, CAS, formula, name, target id) and `unknownCasKept` / `noCasKept` (with the identified candidates), see the unidentified rule;
- `identityOverride` (rows given an identity by `IDENTITY_OVERRIDES`, with the reason);
- `classOverridden` (carbon compounds classed by `CLASS_OVERRIDES`, with the reason and the bond rule's answer as `bondRule`) and `classFromFormula` (carbon compounds without a usable SMILES, classed by the formula rule: CAS, formula, name, class);
- `familyFromFormula` (organic records whose family comes from `formula_family`: CAS, formula, name, family);
- `pubchemNotFound`, `pubchemAmbiguous` (with candidates) and `pubchemCharged`, and the counts `casMissing` (the CAS numbers in `missing-cas.txt`, next to the report), `casResolvedPubchem`, `pubchemOk`, `pubchemNotFetched` (CAS missing from the cache: run `make compound-data-pubchem`);
- `perryNoRange`, Perry rows without a range;
- `noRange`, coefficient rows without Tmin/Tmax (7 Poling rows, stored with `min/max = null`);
- `vdiLiquidNoRange`, VDI liquid rows whose CAS has no VDI Tm/Tc row (stored with `min/max = null`);
- `zabranskyNoCas` (Pentaethoxyuranium, given an identity by `IDENTITY_OVERRIDES`) and `zabranskySplineSplit`;
- `equationIssues`: non-positive or non-finite values at `min`, `max` or 298.15 K, `maxAtOrAboveTc` for `dipprN114` and `zabranskyQuasiPolynomial`, and formulas that cannot be evaluated. Zeros at T ≥ Tc are expected for `ppds12` and `dipprN106` and are not reported;
- `checks`: one check point per equation (mid-range, else 298.15 K) with the `evaluate_equation` value, for checking the backend methods against the Python reference;
- `transportMixtureSkipped` (Mamedov benzene mixture rows), `transportInteractionNoRecord` (a pair species whose CAS has no record), `transportUnknownTable`, and the counts `transportEntries`, `transportRecords` (records with a `transport` block) and `transportInteractions`;
- the JANAF sections listed in [JANAF table ids](#janaf-table-ids) and the NASA sections listed in [NASA species keys](#nasa-species-keys).

---
