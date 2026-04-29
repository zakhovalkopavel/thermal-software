# NASA Thermodynamic Database Parser — Specification

## Purpose

Produce two standalone JSON files from the raw NASA thermodynamic text databases:

| Output file | Source file(s)                                           | Format |
|---|----------------------------------------------------------|---|
| `shared/processed/nasa7.json` | `shared/sources/NASA/nasa7-origin.dat`                   | NASA SP-273 (1971) — 7-coefficient |
| `shared/processed/nasa9.json` | `shared/sources/NASA/nasa9-origin.dat` + `nasa9-new.dat` | NASA RP-1311 (1996) — 9-coefficient |

The JSON files are:
- Directly usable for thermodynamic calculations
- Shaped to match the TypeScript types `Nasa7Equation` and `Nasa9Equation` in
  `backend/src/common/thermal/type/`
- Suitable for creating new `CompoundValue` entities in the gas compound files

---

## Implementation layout

```
python/
  src/
    nasa_thermo/              ← importable package (library)
      __init__.py             ← public API re-exports
      nasa7_coeffs.py         ← Nasa7Coeffs dataclass
      nasa7_equation.py       ← Nasa7Equation dataclass
      nasa7_species.py        ← Nasa7Species dataclass
      nasa9_coeffs.py         ← Nasa9Coeffs dataclass
      nasa9_range.py          ← Nasa9Range dataclass
      nasa9_equation.py       ← Nasa9Equation dataclass
      nasa9_species.py        ← Nasa9Species dataclass
      utils.py                ← parse_e / parse_d / slice_e15
      parsers/
        nasa7.py              ← parse_nasa7(path, …) → dict[str, Nasa7Species]
        nasa9.py              ← parse_nasa9(paths, …) → dict[str, Nasa9Species]
      writers.py              ← write_nasa7_json / write_nasa9_json
    scripts/
      parse_nasa_thermo.py    ← CLI entry point (thin wrapper)
  tests/
    nasa_thermo/              ← NASA parser unit tests
      test_utils.py
      test_models.py
      test_nasa7_parser.py
      test_nasa9_parser.py
      test_writers.py
    ocr/                      ← OCR module tests
```

## Running the parser

### Via Makefile (recommended)

```bash
# Parse both databases
make nasa-parse

# Parse NASA-7 only
make nasa-parse-nasa7

# Parse NASA-9 only
make nasa-parse-nasa9

# Gaseous species only
make nasa-parse-gaseous
```

### Directly in Docker

```bash
# From project root
docker compose run --rm python python src/scripts/parse_nasa_thermo.py \
  --nasa7 shared/sources/NASA/nasa7-origin.dat \
  --nasa9 shared/sources/NASA/nasa9-origin.dat shared/sources/NASA/nasa9-new.dat \
  --out-dir shared/processed
```

`--nasa9` accepts one or more files; entries from later files overwrite earlier ones by
species name key (later file wins — allows `nasa9-new.dat` to supersede `nasa9-origin.dat`
for updated species).

---

## Input format reference

### NASA-7 (SP-273, 1971)  — `nasa7-origin.dat`

**File structure:**

```
THERMO
<Tlow> <Tmid> <Thigh>            ← global default temperature splits, F10.3 each
<species block> ...               ← one block per species, always 4 lines
END
```

**Species block — 4 fixed-width lines, each 80 characters:**

```
Line 1:  cols  1-18  species name (A18)
         cols 19-24  date / reference code (A6)
         cols 25-44  4×(element symbol A2 + count F3.0) — chemical formula
         col  45     phase: G=gas, S=solid, L=liquid (A1)
         cols 46-55  Tmin (F10.3)
         cols 56-65  Tmax (F10.3)
         cols 66-79  molecular weight [g/mol] (F14.5) — may be blank
         col  80     record counter = "1"

Line 2:  cols  1-75  a1,a2,a3,a4,a5  HIGH range (5E15.8)   ← Tswitch→Tmax
         col  80     record counter = "2"

Line 3:  cols  1-75  a6,a7 HIGH range, then a1,a2,a3 LOW range (5E15.8)
         col  80     record counter = "3"

Line 4:  cols  1-60  a4,a5,a6,a7 LOW range (4E15.8)
         cols 61-75  Hf°/R (E15.8) — optional, sometimes blank or zero
         col  80     record counter = "4"
```

**Temperature switch:**  
The global `Tmid` from line 2 of the file (typically `1000.0 K`) is used as `Tswitch`
for all species. Individual species may override via their Tmin/Tmax range, but the
split is always global.

**Coefficient layout reconstruction:**

```
HIGH coeffs: a1…a5 from line 2; a6,a7 = first two values of line 3
LOW  coeffs: a1…a3 = last three values of line 3; a4…a7 from line 4
```

**Scientific notation:** `E` notation (`1.23E+04`); parse with Python `float()`.

---

### NASA-9 (RP-1311, 1996) — `nasa9-origin.dat`

**File structure:**

```
<comment lines starting with !>
thermo                                           ← keyword line
<Tglobal_low> <Tglobal_mid> ... <date>          ← global range line (ignored)
<species block> ...
END PRODUCTS
<more species blocks>                            ← reactants section
END REACTANTS
```

**Species block — variable length:**

```
Line 1:  cols  1-24  species name (A24; in practice name ends at first space ~col 15)
         cols 25-80  comments / source reference

Line 2:  col   2     number of temperature intervals N (I1)
         cols  4-9   reference code (A6)
         cols 11-50  5×(element symbol A2 + count F6.2) — chemical formula
         col  52     phase flag: 0=gas, nonzero=condensed (I1)
         cols 53-65  molecular weight [g/mol] (F13.5)
         cols 66-80  Hf° at 298.15 K [J/mol] (F15.3)

Repeated N times (one per temperature interval):

  Line 3:  cols  2-11  Tmin (F10.3)
           cols 12-21  Tmax (F10.3)
           col  23     number of polynomial coefficients (I1; almost always 7)
           cols 24-63  8 T-exponents (8F5.1; always "-2.0 -1.0  0.0  1.0  2.0  3.0  4.0  0.0")
           cols 66-80  H°(298.15)−H°(0) [J/mol] (F15.3)

  Line 4:  cols  1-80  a1,a2,a3,a4,a5 (5D16.8)

  Line 5:  cols  1-32  a6,a7 (2D16.8)
           cols 33-48  16-character gap (spaces — unused field)
           cols 49-64  b1 = integration constant for H (D16.8) → mapped to a8
           cols 65-80  b2 = integration constant for S (D16.8) → mapped to a9
```

**Special case — condensed with single temperature (N=0):**  
Line 2 `N=0`; line 3 contains only one temperature value. No polynomial lines follow.
These entries must be skipped (no polynomial to parse).

**Scientific notation:** `D` notation (`1.23D+04`); replace `D` with `E` then `float()`.

---

### NASA-9 new (Burcat/ANL-05/20) — `nasa9-new.dat`

Same as NASA-9 (1996) with one layout difference on **line 5**:

```
Line 5 (new):  cols  1-80  a6,a7,<zero>,b1,b2 (5D16.8)
                                    ↑
                           explicit zero placeholder replaces the 16-char gap
```

The parser detects this variant by checking whether line 5 contains 4 or 5 whitespace-
separated tokens after stripping. If 5 tokens → new format; if 4 tokens (with gap) or
the gap detection fails → use column-slice fallback.

**File structure differences:**
- No `thermo` / `END PRODUCTS` / `END REACTANTS` markers
- Header is comment lines (`!`) plus two non-`!` prose lines before species data begins
- Species data starts at the first line that matches the species name pattern (non-`!`,
  non-blank, not starting with a digit or space)

---

## JSON output schema

### `nasa7.json`

```json
{
  "source": "NASA SP-273 (1971) — nasa7-origin.dat",
  "ref": "McBride, Zehe, Gordon — NASA TM-2002-211556",
  "generatedAt": "2026-04-28T...",
  "count": 1200,
  "species": {
    "N2": {
      "name": "N2",
      "comment": "J 6/77N  2.   0.   0.   0.",
      "phase": "G",
      "MW": 28.01340,
      "Tmin": 200.0,
      "Tmax": 6000.0,
      "nasa7": {
        "Tswitch": 1000.0,
        "low": {
          "a1":  3.298677000e+00,
          "a2":  1.408240400e-03,
          "a3": -3.963222000e-06,
          "a4":  5.641515000e-09,
          "a5": -2.444854000e-12,
          "a6": -1.020899900e+03,
          "a7":  3.950372000e+00
        },
        "high": {
          "a1":  2.926640000e+00,
          "a2":  1.487976800e-03,
          "a3": -5.684760000e-07,
          "a4":  1.009703800e-10,
          "a5": -6.753351000e-15,
          "a6": -9.227977000e+02,
          "a7":  5.980528000e+00
        }
      }
    }
  }
}
```

**Top-level fields:**

| Field | Type | Description |
|---|---|---|
| `source` | string | Human-readable source description |
| `ref` | string | Bibliographic reference |
| `generatedAt` | string | ISO-8601 timestamp of generation |
| `count` | number | Total number of species in the file |
| `species` | object | Map keyed by species name string |

**Per-species fields:**

| Field | Type | Description |
|---|---|---|
| `name` | string | Exact species name as in source file |
| `comment` | string | Full comment from line 1 (trimmed) |
| `phase` | `"G"` \| `"S"` \| `"L"` | Phase flag from col 45 |
| `MW` | number \| null | Molecular weight [g/mol]; null if blank |
| `Tmin` | number | Lower bound of the valid range [K] |
| `Tmax` | number | Upper bound of the valid range [K] |
| `nasa7` | object | NASA-7 equation — matches `Nasa7Equation` TypeScript type |
| `nasa7.Tswitch` | number | Temperature split between low/high ranges [K] |
| `nasa7.low` | object | Low-range coefficients `a1…a7` — matches `Nasa7Coeffs` |
| `nasa7.high` | object | High-range coefficients `a1…a7` — matches `Nasa7Coeffs` |

---

### `nasa9.json`

```json
{
  "source": "NASA RP-1311 (1996) + Burcat/Ruscic ANL-05/20 (2023)",
  "ref": "Burcat, A.; Ruscic, B. — ANL-05/20 (2005) — NASA-9 polynomial coefficients",
  "url": "https://publications.anl.gov/anlpubs/2005/07/53802.pdf",
  "generatedAt": "2026-04-28T...",
  "count": 2300,
  "species": {
    "H2": {
      "name": "H2",
      "comment": "Hydrogen Reference Element  HF298=0.0  CODATA",
      "refCode": "T 2/17",
      "phase": "gas",
      "MW": 2.01588,
      "Hf298": 0.0,
      "nasa9": {
        "ranges": [
          {
            "Tmin": 50.0,
            "Tmax": 200.0,
            "H0": 8448.714,
            "coeffs": {
              "a1": -5.763604770e+02,
              "a2":  2.697512013e+01,
              "a3":  3.061406851e+00,
              "a4":  4.086457340e-03,
              "a5": -2.178913420e-05,
              "a6":  6.362062140e-08,
              "a7": -7.785708500e-11,
              "a8": -1.146914723e+03,
              "a9": -2.303405278e+00
            }
          },
          {
            "Tmin": 200.0,
            "Tmax": 1000.0,
            "H0": 8448.714,
            "coeffs": { "a1": -3.994306020e+03, "...": "..." }
          },
          {
            "Tmin": 1000.0,
            "Tmax": 6000.0,
            "H0": 8448.714,
            "coeffs": { "a1": 6.082027600e+05, "...": "..." }
          }
        ]
      }
    }
  }
}
```

**Top-level fields:** same as `nasa7.json` plus `url`.

**Per-species fields:**

| Field | Type | Description |
|---|---|---|
| `name` | string | Exact species name as in source file (trimmed) |
| `comment` | string | Comment portion of line 1 (cols 25–80, trimmed) |
| `refCode` | string | Reference code from line 2 cols 4–9 (trimmed) |
| `phase` | `"gas"` \| `"condensed"` | Derived from phase flag (0 = gas) |
| `MW` | number \| null | Molecular weight [g/mol] |
| `Hf298` | number | Enthalpy of formation at 298.15 K [J/mol] |
| `nasa9` | object | NASA-9 equation — matches `Nasa9Equation` TypeScript type |
| `nasa9.ranges[]` | array | Ordered temperature ranges (Tmax[i] = Tmin[i+1]) |
| `nasa9.ranges[].Tmin` | number | Range lower bound [K] |
| `nasa9.ranges[].Tmax` | number | Range upper bound [K] |
| `nasa9.ranges[].H0` | number | H°(298.15)−H°(0) [J/mol] from line 3 col 66-80 |
| `nasa9.ranges[].coeffs` | object | Coefficients `a1…a9` — matches `Nasa9Coeffs` |
| `nasa9.ranges[].coeffs.a1…a7` | number | Polynomial coefficients |
| `nasa9.ranges[].coeffs.a8` | number | Integration constant b1 — encodes Hf° |
| `nasa9.ranges[].coeffs.a9` | number | Integration constant b2 — encodes S° |

---

## Parsing rules

### Species name key

The map key in the JSON `species` object is the **trimmed species name from line 1**,
with leading/trailing whitespace removed. When merging multiple NASA-9 files, later
files overwrite earlier entries with the same key.

### Duplicate species names

When the same name appears more than once in a single file, append a numeric suffix:
`N2`, `N2#2`, `N2#3`, etc. Log a warning for each duplicate.

### Skipped entries

The following must be silently skipped (no entry in JSON, counted in a `skipped` log
summary):

- Lines starting with `!` (comments)
- The `thermo` keyword line and the global temperature range line
- `END PRODUCTS`, `END REACTANTS`, `END` lines
- NASA-9 species with `N=0` (single-temperature condensed phase — no polynomial)
- Any block where coefficient parsing raises an exception (log as error, continue)

### Number parsing

- NASA-7 uses `E` notation → Python `float()` directly
- NASA-9 uses `D` notation → `str.replace('D', 'E', 1)` then `float()`
- All coefficients stored as Python `float` → JSON number (full double precision)
- JSON numbers must **not** use Python `float` scientific notation default; use
  `json.dumps(..., allow_nan=False)` with no special float formatting — the standard
  Python JSON encoder writes doubles with sufficient precision

### NASA-9 line-5 detection

```python
tokens = line5.split()
if len(tokens) == 5:
    # new format (Burcat): a6, a7, zero_placeholder, b1(=a8), b2(=a9)
    a6, a7, _, b1, b2 = [parse_d(t) for t in tokens]
elif len(tokens) == 4:
    # origin format: a6, a7, b1, b2 (gap was whitespace-only)
    a6, a7, b1, b2 = [parse_d(t) for t in tokens]
else:
    # fallback: column-slice per spec (2D16.8 + 16x + 2D16.8)
    a6 = parse_d(line5[0:16]);  a7 = parse_d(line5[16:32])
    b1 = parse_d(line5[48:64]); b2 = parse_d(line5[64:80])
```

### NASA-9 species name boundary

The species name occupies the first 24 characters of line 1. However, the actual name
ends at the first internal whitespace sequence. The remainder of the 80-character line
is the comment field. Example:

```
"H2  Hydrogen Reference Element  HF298=0.0  CODATA"
 ↑↑  ↑
 name  comment starts here
```

Parse as: `name = line1[:24].split()[0]`, `comment = line1[24:].strip()`

### NASA-7 Hf298 extraction

The optional `Hf°/R` value at the end of line 4 (cols 61-75) is **not** stored in the
JSON because NASA-7 already encodes enthalpy through coefficient `a6`. If present it is
only used for validation (optional).

---

## Validation

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
  test_utils.py          ← parse_e, parse_d, slice_e15
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

After generating the JSON, add a compound's `nasa9` field by copying from the JSON:

```typescript
// backend/src/common/thermal/compound/gas/n2.ts
import { RefKey } from '../../enum/ref-key.enum';
import type { CompoundValue } from '../../interfaces/compound-value.interface';

export const N2: CompoundValue = {
  // ... other fields ...

  // Sourced from shared/processed/nasa9.json → species["N2"]
  nasa9: {
    ranges: [
      { Tmin: 200, Tmax: 1000, coeffs: { a1: ..., a2: ..., ..., a8: ..., a9: ... } },
      { Tmin: 1000, Tmax: 6000, coeffs: { a1: ..., ... } },
    ],
  },
};
```

The `H0` field in the JSON range is **not** part of `Nasa9Coeffs` — it is metadata
for reference and cross-validation only. Do not copy it into the TypeScript compound.

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

