# NASA Thermo Parser Layout, Running, and Input Format

**Parent index:** [NASA_THERMO_PARSER_SPEC.md](./NASA_THERMO_PARSER_SPEC.md)

---

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
      utils.py                ← parse_e / parse_d / parse_element_slots / slice_e15
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
