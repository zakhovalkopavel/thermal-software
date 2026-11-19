# CoolProp fluid keys in compound-data

**Parent:** [COMPOUND_DATA_SPEC.md](./COMPOUND_DATA_SPEC.md)

The build reads CoolProp `shared/sources/coolprop/fluids/*.json` (`INFO.NAME`,
`INFO.CAS`) and writes fluid names into `coolprop` on matching records (CAS).
Helmholtz JSON stays in that folder; the backend uses `coolprop[0]` as
`CompoundValue.coolpropKey` for Helmholtz density and NIST IR 8209
`TRANSPORT.conductivity` residual λ.

Report counts: `coolpropFluids`, `coolpropLinked`, `coolpropNoRecord`,
`coolpropAmbiguous`, `coolpropRecords`.

CLI: `--coolprop-dir` (default `shared/sources/coolprop/fluids`), `--no-coolprop`.

Builder modules: `coolprop_links.py` (`attach_coolprop`, `load_coolprop_fluids`),
`constants/coolprop_source.py` (`COOLPROP_FLUIDS_DIR`, `COOLPROP_DATASET`).
