# Compound Data Specification (CalebBell/chemicals tables)

**Status:** Implemented (`python/src/chemical_formula/`, `chemicals_tables/`, `pubchem/`, `dataset_layout/`, `compound_data/`, see [Packages](#packages)). The backend implements every equation type the dataset writes (see [New equation types](#new-equation-types)).
**Purpose:** Merge the CalebBell/chemicals data tables copied into `shared/sources/compound-data/chemicals/` into JSON datasets, one small file per compound. Inorganic compounds are placed by their main element and organic compounds by functional family, with an `index.json` linking them and a `units.json` listing the units. Every coefficient row is stored as a ready-to-use backend `EquationValue`.

Sources: CRC 95th ed., Perry 8th ed., Poling 5th ed., Yaws 2014, TRC 1994, Zabransky 1996, NIST WebBook Shomate and VDI Heat Atlas PPDS, plus the hand-transcribed transport parameters of White (Viscous Fluid Flow 3e), NASA TN D-481, Mamedov & Somuncu 2014 and Svehla 1995 (see [Transport parameters](#transport-parameters)).

The build also parses the NIST-JANAF copy with the `janaf` package and lists the matching table ids in each record (see [JANAF table ids](#janaf-table-ids)).

The JSON format is described by the backend interfaces in [utils/compound-data/](../../backend/src/common/thermal/utils/compound-data/index.ts); the unit of every value is in `units.json`.

---

## Topic index

| Doc | Contents |
|-----|----------|
| [compound-data-equations-and-flow.md](./compound-data-equations-and-flow.md) | Decisions, equation mapping, new types, scalars, transport |
| [compound-data-pipeline-and-output.md](./compound-data-pipeline-and-output.md) | Prerequisites and processed output layout |
| [compound-data-families-tests-and-refs.md](./compound-data-families-tests-and-refs.md) | Families, files, RefKey, tests, docs, verification |

