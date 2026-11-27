# Technical plans

Technical plans behind [`../PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md). Each plan is self-contained
(goal, design, work breakdown with acceptance, docs/tests obligations, risks).

| # | Roadmap phase | Plan | Status |
|---|---|---|---|
| 1 | Source-extractor as the one door to every source | [`SOURCE_EXTRACTOR_MIGRATION.md`](SOURCE_EXTRACTOR_MIGRATION.md) | 🟡 design accepted |
| 2 | Database with versioned datasets | [`DATABASE_AND_VERSIONING.md`](DATABASE_AND_VERSIONING.md) | 🔵 planned |
| 3 | Remaining legacy gap (recuperator `λ(T)`) | [`LEGACY_GAPS_CLOSURE.md`](LEGACY_GAPS_CLOSURE.md) | 🔵 planned |
| 4 | Heat-treatment data through the extractor | [`HEAT_TREATMENT_DATA.md`](HEAT_TREATMENT_DATA.md) | 🟣 research / data risk |
| 4a | Quench source analysis and pick list | [`QUENCH_SOURCE_PICKLIST.md`](QUENCH_SOURCE_PICKLIST.md) | 🟣 research |
| 4b | Algorithm for predicting salt-solution properties | [`SOLUTION_PROPERTY_ALGORITHM.md`](SOLUTION_PROPERTY_ALGORITHM.md) | 🟣 research |
| 4c | Verification examples taken from sources | [`SOLUTION_VERIFICATION_EXAMPLES.md`](SOLUTION_VERIFICATION_EXAMPLES.md) | 🟣 research |
| 5 | Quench and heat-treatment engine | [`QUENCH_ENGINE.md`](QUENCH_ENGINE.md) | 🔵 planned |
| 6–8 | Plan to 3D, geometry, fields, properties, furnaces | [`GEOMETRY_FIELDS_PROPERTIES.md`](GEOMETRY_FIELDS_PROPERTIES.md) | 🔵 planned |

Dependencies: 1 → 2 → (3, 4) → 5 → 6 → 7 → 8; phase 4 also needs phase 1; phase 3 persistence work needs
phase 2 (database module).
