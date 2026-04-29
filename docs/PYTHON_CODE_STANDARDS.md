# Python Code Standards

**Status:** Mandatory for all Python development.  
**Scope:** Everything under `python/src/`, `python/tests/`, and any Python scripts.

---

## 1. File Naming — `snake_case.py`

Python files use `snake_case` (lowercase with underscores), unlike TypeScript which uses `kebab-case`.

```
✅ CORRECT:
  nasa7_equation.py
  ref_key.py
  references_meta.py
  image_processing.py
  scientific_ocr_processor.py

❌ INCORRECT:
  nasa7-equation.py      # hyphens are not valid Python identifiers
  RefKey.py              # PascalCase file names
  imageProcessing.py     # camelCase file names
```

**Package `__init__.py`** files must include:
- A module-level docstring describing the package purpose.
- A `Refs:` block if the package uses any literature data.
- An explicit `__all__` list of public exports.

---

## 2. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| File name | `snake_case` | `nasa9_equation.py` |
| Package / module | `snake_case` | `nasa_thermo`, `references` |
| Class | `PascalCase` | `Nasa9Equation`, `RefKey` |
| Dataclass | `PascalCase` | `Nasa7Coeffs`, `ReferenceMeta` |
| Function / method | `snake_case` | `parse_nasa9`, `to_dict` |
| Local variable | `snake_case` | `species_count`, `out_path` |
| Module-level constant | `UPPER_SNAKE_CASE` | `REFERENCES_META`, `NASA7_META` |
| Private helper | `_snake_case` | `_write`, `_parse_line` |
| Boolean variable | `snake_case` with verb prefix | `is_valid`, `has_error` |
| Unit suffix | `_unit` suffix | `temp_K`, `density_kgm3` |
| Chemical formula | Standard notation (exception) | `SiO2`, `Al2O3`, `CaO` |

### Class names
```python
# ✅ CORRECT
class Nasa9Equation:     ...
class RefKey(str, Enum): ...
class ReferenceMeta(TypedDict): ...

# ❌ INCORRECT
class nasa9_equation:    ...
class refKey:            ...
class REFERENCE_META:    ...
```

### Functions and variables
```python
# ✅ CORRECT
def parse_nasa9(path: Path) -> dict[str, Nasa9Species]: ...
def to_dict(self) -> dict: ...
species_count = len(species)
out_path = base_dir / "nasa9.json"

# ❌ INCORRECT
def ParseNasa9(path):    ...   # PascalCase
def ToDict(self):        ...
SpeciesCount = 10              # PascalCase variable
```

### Module-level constants
```python
# ✅ CORRECT
NASA9_META = { "source": "...", "ref": "...", "url": "..." }
REFERENCES_META: dict[RefKey, ReferenceMeta] = { ... }

# ❌ INCORRECT
nasa9Meta = { ... }           # camelCase
Nasa9Meta = { ... }           # PascalCase
```

---

## 3. Single Responsibility Principle (SRP)

Each Python module exports **exactly one primary construct**:

| Module type | Exports |
|-------------|---------|
| `*_coeffs.py` | One `@dataclass` for coefficient shape |
| `*_equation.py` | One `@dataclass` for the equation container |
| `*_species.py` | One `@dataclass` for the species record |
| `ref_key.py` | One `Enum` subclass |
| `references_meta.py` | One module-level constant dict + one `TypedDict` |
| `writers.py` / `parsers/*.py` | A cohesive group of closely related functions |
| `utils.py` | Shared low-level helpers that have no better home |

> **Do not mix** dataclasses, constants, and parsers in a single file.  
> A coefficients file must not contain parsing logic.  
> A parser file must not define dataclasses.

---

## 4. Type Hints — Mandatory

All public functions and methods must have complete type annotations.  
Use `from __future__ import annotations` as the **first import** in every file so that
forward references work without string quoting.

```python
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class Nasa9Range:
    """One temperature range of a NASA-9 polynomial."""
    Tmin: float
    Tmax: float
    coeffs: Nasa9Coeffs

    def to_dict(self) -> dict:               # ✅ return type annotated
        return { "Tmin": self.Tmin, ... }


def write_nasa9_json(
    species: dict[str, Nasa9Species],        # ✅ typed parameter
    out_dir: Path,                           # ✅ typed parameter
) -> None:                                   # ✅ typed return
    ...
```

Use `TypedDict` for plain data shapes (equivalent to TypeScript `type`):

```python
# ✅ CORRECT — TypedDict for data shape
class ReferenceMeta(TypedDict):
    index: int
    name: str
    year: str
    url: Optional[str]

# ❌ INCORRECT — plain dict without shape description
meta = { "index": 1, "name": "...", ... }   # no type information
```

---

## 5. Dataclasses for Data Models

Use `@dataclass` for data models (equivalent to TypeScript `type`).  
Use standard classes only when behaviour (non-trivial methods) is the primary purpose.

```python
# ✅ CORRECT — dataclass for a data shape
@dataclass
class Nasa7Coeffs:
    """NASA-7 seven polynomial coefficients for one temperature range."""
    a1: float
    a2: float
    a3: float
    a4: float
    a5: float
    a6: float
    a7: float

    def to_dict(self) -> dict:
        return {"a1": self.a1, "a2": self.a2, ...}

# ❌ INCORRECT — plain class for a pure data shape
class Nasa7Coeffs:
    def __init__(self, a1, a2, a3, a4, a5, a6, a7):
        self.a1 = a1
        ...
```

---

## 6. Module Docstrings

Every module must begin with a docstring using this structure:

```
"""
<package>.<module> — <one-line purpose>.

<Optional extended description.>

<Optional sections: Sub-modules / Spec / Notes>

Refs
----
  docs/REFERENCES.md  [N] RefKeyName, [N] RefKeyName
"""
```

Examples:

```python
"""
nasa_thermo.nasa9_equation — NASA-9 multi-range polynomial equation.

Refs
----
  docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
"""
```

```python
"""
nasa_thermo — NASA thermodynamic database parser package.

Sub-modules
-----------
  nasa_thermo.nasa9_equation — Nasa9Equation dataclass
  ...

Refs
----
  docs/REFERENCES.md  [8] NASA7, [9] Burcat2005, [23] NASA9
"""
```

---

## 7. Literature References — `Refs:` Convention

Python uses a **docstring citation** convention (unlike TypeScript's inline `ref: RefKey.Xxx` field).

### Rule: every module or function that uses data from a published source must cite it.

**Module-level citation** — in the module docstring:
```python
"""
nasa_thermo.writers — JSON serialisation for NASA species dicts.

Refs: docs/REFERENCES.md  [8] NASA7, [9] Burcat2005, [23] NASA9,
      [24] CaltechSDT, [25] BurcatELTE
"""
```

**Class-level citation** — in the class docstring:
```python
@dataclass
class Nasa9Equation:
    """NASA-9 equation: N ordered temperature ranges.

    Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
    """
```

**Function-level citation** — in the function docstring when data originates there:
```python
def sutherland_viscosity(T_K: float, mu0: float, T0: float, S: float) -> float:
    """Sutherland's law viscosity.

    Refs: docs/REFERENCES.md  [20] White3
    """
```

### Using `RefKey` identifiers at runtime

When a Python module needs to look up reference metadata at runtime (e.g. to annotate
output files or validate sources), import `RefKey` from the `references` package:

```python
from references import RefKey, REFERENCES_META

# Cite in a docstring using RefKey identifiers:
#   Refs: RefKey.NASA7, RefKey.Burcat2005

# Look up metadata at runtime:
meta = REFERENCES_META[RefKey.NASA7]
print(meta['index'], meta['name'], meta.get('url'))
```

### Format rules

| Context | Format |
|---------|--------|
| Module / class / function docstring | `Refs: docs/REFERENCES.md  [N] KeyName, [N] KeyName` |
| Runtime import / inline comment | `RefKey.KeyName` (enum member) |
| New ref not yet in `docs/REFERENCES.md` | **Add it first** — see _Adding a New Reference_ in `REFERENCES.md` |

**Never** use:
- Raw integers as reference identifiers (`ref: 4` — use `RefKey.Perry7`).
- Free-form author strings without a `RefKey` entry.
- Omitting citations for coefficient data taken from a published source.

---

## 8. Package Structure

```
python/src/
├── <package>/                  # one package = one cohesive domain
│   ├── __init__.py             # exports + package docstring + __all__
│   ├── <model>_coeffs.py       # dataclass — coefficient shape
│   ├── <model>_equation.py     # dataclass — equation container
│   ├── <model>_species.py      # dataclass — species record
│   ├── parsers/                # sub-package for parsing logic
│   │   ├── __init__.py
│   │   └── <format>.py
│   ├── writers.py              # serialisation helpers
│   └── utils.py                # low-level helpers
├── references/                 # mirror of TypeScript RefKey + REFERENCES_META
│   ├── __init__.py
│   ├── ref_key.py              # RefKey enum
│   └── references_meta.py      # REFERENCES_META dict + ReferenceMeta TypedDict
└── scripts/                    # runnable entry-point scripts (not importable packages)
    └── <verb>_<noun>.py        # e.g. parse_nasa_thermo.py, enrich_database.py
```

---

## 9. Import Order

Follow [PEP 8](https://peps.python.org/pep-0008/#imports) import order, enforced by `isort`:

```python
from __future__ import annotations   # 1. future imports (always first)

import json                           # 2. stdlib
import logging
from pathlib import Path

import numpy as np                    # 3. third-party
import pandas as pd

from references import RefKey         # 4. project-local (absolute)
from nasa_thermo.nasa9_coeffs import Nasa9Coeffs
```

---

## 10. Tests

All tests run **inside Docker** — never on the host.

```bash
# Run all Python tests inside the python container:
docker compose exec python pytest /app/tests/

# Single test file:
docker compose exec python pytest /app/tests/test_nasa_thermo.py -v

# With coverage:
docker compose exec python pytest /app/tests/ --cov=src --cov-report=term-missing
```

Test files are placed in `python/tests/` and named `test_<module>.py`.

---

## Quick Checklist

Before committing any Python file, verify:

- [ ] File name is `snake_case.py`
- [ ] Module has a docstring (`"""<package>.<module> — purpose."""`)
- [ ] `from __future__ import annotations` is the first import
- [ ] All public functions/methods have type annotations
- [ ] Data shapes use `@dataclass` or `TypedDict`, not plain dicts or classes
- [ ] Module-level constants use `UPPER_SNAKE_CASE`
- [ ] Classes use `PascalCase`, functions/variables use `snake_case`
- [ ] Every module/class/function using literature data has a `Refs:` citation
- [ ] `Refs:` entries point to `docs/REFERENCES.md` keys — never raw author strings or integers
- [ ] `from references import RefKey` used for any runtime reference lookup
- [ ] New references added to `docs/REFERENCES.md` **before** use
- [ ] Tests run **inside Docker**, not on the host
- [ ] File exports exactly one primary construct (SRP)

