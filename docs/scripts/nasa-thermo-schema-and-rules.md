# NASA Thermo JSON Schema and Parsing Rules

**Parent index:** [NASA_THERMO_PARSER_SPEC.md](./NASA_THERMO_PARSER_SPEC.md)

---

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
      "elements": {"N": 2.0},
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
| `elements` | object | Element counts from line 1 cols 25-44, e.g. `{"N": 2.0}`; see [Element slots](#element-slots) |

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
      "elements": {"H": 2.0},
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
| `elements` | object | Element counts from line 2 cols 11-50, e.g. `{"C": 1.0, "H": 4.0}`, `Air` `{"N": 1.56, "O": 0.42, "Ar": 0.01}`; see [Element slots](#element-slots) |

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

### Element slots

Both formats give the formula as fixed-width (symbol A2, count) slots, read by
`nasa_thermo.utils.parse_element_slots`: NASA-7 line 1 cols 25-44 (4 × 5 characters,
`N  2.   0.   0.   0.`), NASA-9 line 2 cols 11-50 (5 × 8 characters, `C   1.00H   4.00`).
Upper-case symbols are title-cased (`AL` → `Al`), empty and zero slots are skipped, and
`E` stays the electron (ions carry an `E` slot). Counts are floats: `Air` has fractional ones.
The compound-data build uses them to match species to compounds by Hill formula
([COMPOUND_DATA_SPEC.md](COMPOUND_DATA_SPEC.md#nasa-species-keys)).

### NASA-9 Hf298

`Hf298` is read from line 2 cols 66-80. Lines are exactly 80 characters, so the slice is
taken without a length guard (an earlier `len(line2) > 80` guard left every `Hf298` at 0.0).

### Duplicate keys across NASA-9 files

`nasa9-new.dat` replaces 158 keys of `nasa9-origin.dat`, and some replacements are other
species: `CO2` (+49.6 kJ/mol), `O2` (singlet), `C6H6` (fulvene). The backend gas compounds
leave those keys out, and the compound-data build rejects them by ΔfH°(298.15).

### NASA-7 Hf298 extraction

The optional `Hf°/R` value at the end of line 4 (cols 61-75) is **not** stored in the
JSON because NASA-7 already encodes enthalpy through coefficient `a6`. If present it is
only used for validation (optional).

---
