# NASA Thermo Validation, Tests, CLI, and TS Mapping

**Parent index:** [NASA_THERMO_PARSER_SPEC.md](./NASA_THERMO_PARSER_SPEC.md)

---

After parsing each species block, verify:

1. **Range count** — NASA-9: `len(ranges) == N` as declared on line 2.
2. **Range continuity** — NASA-9: `ranges[i].Tmax == ranges[i+1].Tmin` (tolerance ±0.1 K). Log a warning if violated; keep the entry.
3. **Coefficient count** — all 7 coefficients (a1–a7) plus b1, b2 are non-None.
4. **Tswitch match** — NASA-7: `Tmid` from the file header is used consistently.
5. **MW positive** — warn if MW ≤ 0 or null.

Validation failures produce a warning log line; the entry is still written to JSON
unless coefficient parsing failed entirely.

---

## Output

Both JSON files are written to `--out-dir` (default: `shared/processed/`).

File names: `nasa7.json`, `nasa9.json`.

JSON is pretty-printed with `indent=2`.

Exit code `0` on success; `1` if any file could not be written or any species raised
a parsing exception.

---

## Tests

Unit tests live in:

```
python/tests/nasa_thermo/
  __init__.py
  test_utils.py          ← parse_e, parse_d, parse_element_slots, slice_e15
  test_models.py         ← dataclass to_dict serialisation
  test_nasa7_parser.py   ← parse_nasa7() with in-memory fixtures
  test_nasa9_parser.py   ← parse_nasa9() — both origin and Burcat-new formats
  test_writers.py        ← write_nasa7_json / write_nasa9_json
```

All tests use **in-memory string fixtures** — no real NASA datafiles are read.

Run via Makefile:

```bash
make nasa-test         # pytest in python container
make nasa-test-all     # pytest + coverage report
```

Or directly:

```bash
docker compose run --rm python python -m pytest /app/tests/test_nasa_thermo/ -v
```

---

## CLI interface

```
usage: parse_nasa_thermo.py [-h] [--nasa7 FILE] [--nasa9 FILE [FILE ...]]
                             [--out-dir DIR] [--only-gaseous] [--species NAMES]

Parse NASA thermodynamic databases into JSON.

optional arguments:
  --nasa7 FILE          Path to NASA-7 source file
  --nasa9 FILE [...]    One or more NASA-9 source files (merged, later wins)
  --out-dir DIR         Output directory (default: shared/processed)
  --only-gaseous        Skip condensed-phase species (phase != G or phase != 0)
  --species N1,N2,...   Comma-separated list of species names to extract;
                        if omitted, all species are written
  -v, --verbose         Show per-species parse summary
```

If `--nasa7` is omitted, `nasa7.json` is not written.  
If `--nasa9` is omitted, `nasa9.json` is not written.

---

## Console output example

```
[nasa7] Parsed 1032 species, 0 errors, 3 duplicates renamed
[nasa7] Written → shared/processed/nasa7.json

[nasa9] Source 1: nasa9-origin.dat  — 1241 species parsed
[nasa9] Source 2: nasa9-new.dat     — 2381 species parsed, 214 overwrites
[nasa9] Skipped: 48 condensed single-T, 0 errors
[nasa9] Total written: 2538 species
[nasa9] Written → shared/processed/nasa9.json
```

---

## Mapping to TypeScript compound files

The backend reads `shared/processed/NASA/nasa7.json` and `nasa9.json` directly
(`backend/src/common/thermal/utils/nasa/load-nasa-database.util.ts`).
Coefficients are **not** copied into compound files — a compound references the species by its
exact key:

```typescript
// backend/src/common/thermal/compound/gas/n2.ts
export const N2: CompoundValue = {
  // ... other fields ...
  nasa7Key: 'N2',   // nasa7.json → species["N2"]
  nasa9Key: 'N2',   // nasa9.json → species["N2"]
};
```

The `H0` field in a JSON range is not part of `Nasa9Coeffs` — it is metadata for cross-validation
and is ignored by the evaluator.

**Known issue — Source 2 overwrites:** records from `nasa9-new.dat` replace same-named
`nasa9-origin.dat` records. For `CO2`, `O2` and `NO2` the replacement is a different species
(H(298) = +49.6, +94.4 and +351.7 kJ/mol), so those compounds have no `nasa9Key` until the
parser keeps the RP-1311 record.

---

## References

| # | Source |
|---|---|
| NASA SP-273 (1971) | Gordon & McBride — original 7-coefficient format |
| NASA RP-1311 (1996) | McBride & Gordon — 9-coefficient format spec |
| NASA TM-2002-211556 | McBride, Zehe, Gordon — coefficient data for individual species |
| ANL-05/20 (2005, updated 2023) | Burcat, Ruscic, Goos — extended database, nasa9-new.dat. URL: https://publications.anl.gov/anlpubs/2005/07/53802.pdf |

### Source file origins

| Local file | Original URL |
|---|---|
| `nasa7-origin.dat` | https://shepherd.caltech.edu/EDL/PublicResources/sdt/SDToolbox/cti/NASA7/nasa7.dat |
| `nasa9-origin.dat` | https://shepherd.caltech.edu/EDL/PublicResources/sdt/SDToolbox/cti/NASA9/nasa9.dat |
| `nasa9-new.dat`    | https://respecth.elte.hu/burcat/NEWNASA.TXT |
| `nasa-1971-format.txt` | https://shepherd.caltech.edu/EDL/PublicResources/sdt/formats/nasaold.html |
| `nasa-1996-format.txt` | https://shepherd.caltech.edu/EDL/PublicResources/sdt/formats/nasa.html |

Additional source mirrors:

- Caltech SDT Toolbox: https://shepherd.caltech.edu/EDL/PublicResources/sdt/thermo.html
- Burcat database (ELTE): https://respecth.elte.hu/burcat.php

See `docs/REFERENCES.md` entries `NASA7` [8], `Burcat2005` [9], `NASA9` [23].
