# Plan: Source analysis and pick list for quench and salt-solution data

Status: 🟣 research · Part of [`HEAT_TREATMENT_DATA.md`](HEAT_TREATMENT_DATA.md) (step D1) ·
Serves [`SOLUTION_PROPERTY_ALGORITHM.md`](SOLUTION_PROPERTY_ALGORITHM.md) and
[`SOLUTION_VERIFICATION_EXAMPLES.md`](SOLUTION_VERIFICATION_EXAMPLES.md)

## 1. How this list is used

- It records, per source, **what exactly to pick**, the dataset it goes into, the extraction method and
  the priority. It is the input of step D1 (registration in `references.json` and the adapter catalog).
- Sources are cited by authors, title and year. File names of the local pool are **not** recorded in plans;
  the mapping from files to citations is kept in the untracked local register (`tmp/`).
- Everything picked keeps `ref` and `page`. A value read from a figure is `digitised`; a printed number is
  `measured`; nothing is taken from a source whose content could not be checked on the page image.
- Priorities: **H** blocks a gap in [`HEAT_TREATMENT_DATA.md`](HEAT_TREATMENT_DATA.md) §2.2; **M** useful or
  needed for verification; **L** background or later.
- State: ✅ read and checked · 🟡 partly read · ⚪ not read · 🔴 problem with the file (§4).

## 2. Pool, group A — properties and phase equilibria of solutions

| # | Source | Pick | Goes to | Method | Pri | State |
|---|---|---|---|---|---|---|
| A1 | Conde Engineering (2014), property formulations for aqueous LiCl and CaCl₂ solutions (based on Conde 2004) | solid–liquid coefficients (ice and hydrate lines), vapour-pressure parameters; formulas for density, surface tension, viscosity, conductivity, heat capacity, dilution enthalpy, diffusion; the transition points as examples | `solution-phase-equilibrium`, `quenchant-property` | closed formulas; read garbled formulas on the page image | H | 🟡 equilibria and vapour pressure read, transport and caloric part ⚪ |
| A2 | Handbook table, concentrative properties of aqueous solutions: density, refractive index, freezing-point depression, viscosity at 20 °C, 66 solutes (cites Wolf 1966; Söhnel & Novotný 1985; edition to confirm) | rows for NaCl (to 26 %), CaCl₂ (to 40 %), MgCl₂ (to 30 %), LiCl (to 30 %), NaNO₃ (to 40 %); later NaOH, Na₂CO₃, Na₂SO₄ | `quenchant-property` (ρ, η, freezing depression at 20 °C) and examples | table adapter (clean text layer) | H | 🟡 rows located, not stored |
| A3 | Russian handbook of phase equilibria (book to identify; scanned pages 25–26) | MgCl₂–H₂O diagram with special points (ice + 12-hydrate −33.6 °C, 20.6 %; 6→4 hydrate 116.7 °C, 46.2 %; 4→2 hydrate 181–182 °C, 55.8 %; boiling curve and saturated solution at 193 °C, 55.6 %); CaCl₂–H₂O diagram with special points (eutectic −49.8 °C, 30.5 %; 29.8 °C, 50.2 %; 45.3 °C, 56.5 %; 176 °C, 75.0 %; saturated solution boils at 178 °C, 75.3 %) | `solution-phase-equilibrium` (ice, hydrate and boiling branches) | table of special points = `measured`; branches digitised | H | ✅ viewed; **closes gap G2** (MgCl₂ solubility above 116.7 °C) pending digitisation |
| A4 | Radebe et al. (2026), MgCl₂ solutions as a sub-zero phase-change material | eutectic composition (about 21 wt %), hypereutectic phase boundaries 14–25 wt %, melting and latent-heat values, density of the solid | `solution-phase-equilibrium` (ice side), cross-check of A3 | text and DSC figures | M | 🟡 abstract and conclusions only |
| A5 | Petrash (1959), quenching media (pages 46, 49 in the pool) | NaCl solubility (26.3 % at 0 °C, 26.4 % at 20 °C, 28.2 % at 100 °C); properties of 25 % NaCl at 20 °C (density 1.18 g/cm³, viscosity ≈ 1.6 cP, boiling ≈ 108 °C) | examples; `quenchant-property` as a second basis | printed numbers | M | ✅ viewed |
| A6 | Patents on salt-solution quenching (NaCl and bischofite compositions) | stated concentrations and temperatures: NaCl saturation 26.4 % at 20 °C and 28.9 % at the boiling point ≈ 108 °C (citing a 1987 chemistry handbook); working range 12–26.4 % NaCl; bischofite content 1–85 % and a bath temperature up to 140 °C at 85 % | examples only | printed numbers; claims in patents are not measurements | M | 🟡 numbers read, context of the 140 °C value to confirm |
| A7 | Water tables in the pool: textbook appendix of thermodynamic tables (saturated water, SI) and an appendix of liquid and gas properties (both books to identify) | saturated water temperature and pressure tables; water `ρ, μ, k, cp, σ` | water-layer verification | table adapter | M | ⚪ |
| A8 | Yaws (1999), chemical properties handbook | pure-compound data of salts (melting points, crystal data) only where needed | pure-compound properties | table adapter | L | ⚪ |
| A9 | Table of "saturated solutions" (CSV, provenance unknown) | **nothing** | — | — | — | 🔴 rejected (§4) |

## 3. Pool, group B — quenching theory and experiments

| # | Source | Pick | Goes to | Method | Pri | State |
|---|---|---|---|---|---|---|
| B1 | Kutateladze (1979), fundamentals of heat-transfer theory, ch. 21 (boiling) | nucleate boiling `α ∼ q^(2/3)` (about 0.6–0.7 power), pressure dependence, critical flux, film boiling (Bromley), bubble departure; single-phase convection chapters | `quenchant-model-parameter` (constants with `ref`) | formulas; text layer of moderate quality, check on page images | H | 🟡 §21.5 located and read, constants not yet taken; **closes gap G6** |
| B2 | Mikheev (1977), fundamentals of heat transfer | same topics as B1 (cross-check); water property tables | cross-check, water layer | formulas and tables; text layer | M | ⚪ |
| B3 | Kutateladze & Borishanskiy (1958), heat-engineering handbook | boiling and convection tables; salt-solution property tables if present | cross-check; property tables | **needs OCR** (no text layer); survey first | M | ⚪ |
| B4 | Kondratiev (1954), regular thermal regime | `Kn(Bi)`, shape factors `K`, regular-regime formulas | support for effective-HTC inverse sizing | **needs OCR**; formulas | M | ⚪ |
| B5 | Maniruzzaman & Sisson (2001), bubble dynamics during quenching of steel | regime definitions, dimensionless groups, film-boiling correlation with radiation | `quenchant-model-parameter`; theory text | formulas; page-image check of garbled ones | H | ✅ read; constants for nucleate boiling are **not** in the paper |
| B6 | Kobasko, heat-transfer fundamentals for quenching in cold fluids (year to confirm) | real versus effective HTC (Table 1, not yet extracted), `k_F` (Table 6), nucleate-boiling HTC by bath temperature (Table 7), Tolubinsky relation | `quenchant-model-parameter` | printed tables; formulas | H | ✅ read; Table 1 ⚪ |
| B7 | Kobasko et al., intensive quenching of tools in water salt solutions (year to confirm) | plot of `q_cr1` versus solution density (NaCl, LiCl), experiments in CaCl₂, NaCl, Na₂CO₃ | `quenchant-model-parameter` (`q_cr1_concentration`) | digitise the plot | H | ✅ read; plot ⚪ |
| B8 | Kobasko (2022), quench hardening of powder materials; Kobasko (2022), contemporary methods of super-strong materials design | `ϑ_I`, `ϑ_II` equations and worked example; `Ω(Bi)` table; Ms versus carbon | `quenchant-model-parameter`; examples | printed tables | H | ✅ read |
| B9 | Kobasko (2022), insulating surface polymeric layer during quenching | polymer-layer model and cloud-point data | polymer quenchants (later) | formulas | L | ⚪ |
| B10 | French & Hamill (1929), hot aqueous solutions for quenching steels | cooling times from 875 °C to 800…200 °C (surface and centre) for water, NaCl, NaOH, oils; cooling-curve figures; hardness versus bath temperature | `quench-cooling-time-table`, `quench-cooling-curve` | printed tables ✅; digitise curves | H | ✅ tables read and checked; curves ⚪ |
| B11 | Grabov, Moskalenko & Grabova (2014), cooling in geo-mineral (bischofite) solutions | cooling times and rates of an Inconel 600 probe from 850 °C in two natural brines, 10 % NaCl and water at 18–20 °C (Table 2); curves (Fig. 2); regular-regime equations for effective HTC | `quench-cooling-curve`, `quench-cooling-time-table` | Table 2 has a column mismatch in text extraction: read from the image | H | 🟡 read; table needs image check |
| B12 | Petrash (1959), quenching media (pages 46, 49) | cooling rate versus centre temperature of a silver sphere Ø 20 mm in 0–20 % NaCl at 20, 40, 60 °C, agitation 25 cm/s (Fig. 17, 19) | `quench-cooling-curve` (rate versus temperature), optimal-concentration evidence | digitise | H | ✅ viewed; ⚪ digitised |
| B13 | Kobasko, Russian monograph on quenching in liquid media (17 scanned pages; title and year to confirm) | surface-temperature curves in water, CaCl₂ solution (ρ = 1280 kg/m³) and oil (Fig. 29); boiling temperature and solubility of NaOH and KOH versus concentration (Fig. 32); critical cooling rates in the martensitic range | `quench-cooling-curve`, `solution-phase-equilibrium` (NaOH, KOH, later) | **needs OCR**; digitise figures | M | 🟡 three pages viewed |
| B14 | Guseynov, Kobasko, Buikis & Mamedov (2006), models with a nonlinear boundary condition for intensive quenching | exact and numerical solutions of the nonlinear-boundary problem | test cases for the thermal solver and the inverse step | formulas | M | ⚪ |
| B15 | Rimshans, Kobasko, Guseynov & Bagirov, intensive quenching processes (year to confirm) | hyperbolic heat equation with nonlinear boundary condition | later, solver research | formulas | L | 🔴 file also holds an unrelated paper (§4) |
| B16 | Liščić (2008), intensive quenching technology; Aronov, Kobasko & Powell (2001), application of intensive quenching; Kobasko (2001), worldwide use of intensive quenching | process parameters, HTC values for IQ-2/IQ-3, examples of parts | examples for the engine | tables | L | ⚪ |
| B17 | Dolinsky et al., cooling intensity of micro- and nanofluids (year to confirm); Korad et al. (2011), improving quench hardening of low-carbon steel | cooling curves of vegetable oils with additives; hardness profiles in brine, water, oil | oil curves, later | digitise | L | ⚪ |
| B18 | Zakharchenko (2014), thesis on accelerated cooling of rail joint bars; effect of contamination on quench oils; Segerberg (2001), heat-treating R&D in Sweden | none for salt solutions; background on oils and process control | — | — | L | ⚪ |
| B19 | Patents on dies and devices (device for salt-solution tank, die quenching) | none beyond A6 | — | — | L | ⚪ |

## 4. Problems found in the pool

| Problem | Effect | Action |
|---|---|---|
| The table of "saturated solutions" has viscosities incompatible with the handbook table A2 (NaCl ≈ 2.0 vs 1.35 mPa·s; CaCl₂ near 40 %: ≈ 9.0 vs 2.5; MgCl₂ at 30 %: ≈ 7.0 vs 2.8); a second source (A5) gives ≈ 1.6 cP for 25 % NaCl | unusable as a source | rejected; not stored; record in the gap report |
| The file labelled as the NaNO₂ HTC paper (Totten et al.) holds pages of a different paper (HTC data sets and gear-pinion distortion, ASM 2012 conference) | the intended source is missing | acquire the real paper (see §5) |
| The file labelled "intensive quenching processes" is a composite: a leading unrelated deformation-simulation paper, then the Rimshans–Kobasko–Guseynov–Bagirov paper | risk of citing the wrong paper | split pages before registration |
| The geo-mineral brine compositions in B11 do not balance in charge (solution 1: about 5.7 eq/L cations vs 4.8 eq/L anions; solution 2: Mg 128.2 g/L against Cl 187 g/L) | densities of the two brines cannot be used as examples | check on the page image; use only after it balances |
| Kondratiev (1954) and the Kutateladze–Borishanskiy handbook (1958) have no text layer | not searchable | OCR through the extractor |
| Garbled equations in text extraction (Maniruzzaman eqs. 18, 24–29; Kobasko eq. 7) | wrong coefficients if copied | read on the page image; otherwise do not store |
| Text extraction of a cooling-time table gave 6 numeric columns under 5 headers (French & Hamill, Table 2); the Grabov Table 2 has the same kind of mismatch | header lost | validation rule in the plan §7: column count must equal header count |
| Conde's document is a 2014 report; the 2004 journal paper is the usual citation | wrong `RefKey` | register the report as in the pool and the journal paper separately once acquired |

## 5. Sources to acquire

| # | Needed source | For | Why |
|---|---|---|---|
| U1 | Original Pitzer parameter papers: a high-temperature set for Na–Ca–Cl–SO₄ (to 250 °C) and the set used for Mg; identify the publication of the latter | water activity, boiling point | coefficients must be traced to the paper (rule 1 of the algorithm) |
| U2 | Laliberté & Cooper (2004), Laliberté (2007), Laliberté (2009) | density, viscosity, heat capacity | authoritative ranges and uncertainty |
| U3 | Conde (2004), journal paper | citation of A1 | |
| U4 | Melinder, secondary-fluid property tables (brines of NaCl, CaCl₂, MgCl₂) | thermal conductivity, density, viscosity, heat capacity within brine range | no other conductivity source to saturation |
| U5 | CRC-type tables: solubility of salts versus temperature to 100 °C and above; surface tension of aqueous electrolytes; vapour pressure of saturated solutions; boiling-point elevation | solubility, surface tension | gaps G3, G5 |
| U6 | Primary or handbook source of 1 atm boiling points of CaCl₂ and MgCl₂ solutions (Russian reference books were found by search; authors and edition to be identified) | verification of boiling points | independent examples |
| U7 | Data for the nitrates: NaNO₃ (partly in A2), Ca(NO₃)₂, Mg(NO₃)₂ — density, viscosity, solubility, boiling | first-solutions list | gap G4 |
| U8 | Totten, Lozano & Canale, HTC during quenching of Inconel and AISI 304 cylinders in NaNO₂ solutions | nitrite quenchant, HTC | the pool file is wrong |
| U9 | Original works behind the boiling constants: Rohsenow (1952), Zuber (1958), Tolubinsky; Labuntsov | confirm B1 constants | gap G6 |
| U10 | ISO 9950 and ASTM D6200 (probe and bath definition for cooling-curve tests) | conditions of cooling curves | HEAT_TREATMENT_DATA §4.1 |
| U11 | Measured thermal conductivity and surface tension of NaCl, CaCl₂, MgCl₂ solutions at high concentration and temperature | gap G5 | no source in the pool |

## 6. Order of work

1. Register B-group and A-group sources marked **H** (D1); fix the problems of §4 first.
2. A3 digitisation (MgCl₂ and CaCl₂ branches) and A2 rows into datasets.
3. B1 constants and B6–B8 tables into `quenchant-model-parameter`.
4. A1 remaining formulas.
5. Cooling curves B10–B12 (digitise) and the reconstruction step.
6. Acquire U1–U5, U8; re-run the gap report.
