# Phase-Diagram Extraction — NSRDS-NBS 61

Part of the [phase-diagram extraction specification](README.md).

## NSRDS-NBS 61



### Text index

- `pdftotext -layout` of the whole PDF into `nbs/nsrds-nbs-61-1.txt`; page breaks (`\f`)
give the PDF page; printed page = PDF page − 8 (`sources.json` page mapping).
- `nbs_text_normalizer` fixes recurrent OCR noise of the text layer before parsing:

  | Raw                                                       | Normalized |
  | --------------------------------------------------------- | ---------- |
  | `Si0 2`, `Si0,`, `SiO,`, `SiO.`                           | `SiO2`     |
  | `YlgO`, `MgoO`                                            | `MgO`      |
  | `AI,O,`, `Al,O,`, `Al,0,`, `A1,0,`                        | `Al2O3`    |
  | `Ca0`                                                     | `CaO`      |
  | `K,0`, `K 2O`, `K,O`                                      | `K2O`      |
  | `Na,O`, `Na,0`                                            | `Na2O`     |
  | `:t`, `±o`, `=` before a number in the uncertainty column | `±`        |

- Entry line: entry number (4 digits), system (components joined by `-`), composition
(one value for binaries, `a-b-c` for ternaries, optional `APP`), temperature with optional
uncertainty or `APP`, reference numbers. Lines that look like entries but do not parse go
to `nsrds-nbs-61-1.unparsed.txt`.



### Conversion and comparison

- Composition basis: mol%. Binaries: the value is mol% of the first-named component of the
NBS system (which may differ from the order of `components`). Ternaries: values in the
order of the NBS system name.
- wt% via `formula_molar_mass`: the molar mass of any oxide formula from `ATOMIC_MASS`
(CaO 56.077, MgO 40.304, SiO2 60.084, Al2O3 101.961, Na2O 61.979, K2O 94.196,
TiO2 79.866 g/mol), so a new system needs no table entry. A formula without a fixed
composition (FeOx) has none: conversion raises, compound matching skips it.
- ΔT = T(NBS) − T(atlas); Δ = largest absolute difference over the oxides, in wt%.
- Each comparison is written as an NBS source of the invariant (`reported`,
`converted_wt`, `originalReference`, `comparison` text, as in `al2o3-mgo.json`).
- `nbs-suggest` lists every entry whose normalized system contains exactly the given
components, with converted wt% and temperature, for choosing entries in the config.



### Status


| Condition                                                                    | Status      |
| ---------------------------------------------------------------------------- | ----------- |
| No NBS entry chosen                                                          | `extracted` |
| At least one chosen entry within tolerance (abs(ΔT) ≤ 10 °C and Δ ≤ 1.5 wt%) | `confirmed` |
| Entries chosen, none within tolerance                                        | `conflict`  |


Approximate (`APP`) entries are compared like the others and marked "(approximate value)".
Liquidus branches are always `extracted`.
