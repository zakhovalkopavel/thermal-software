# Literature References

**Scope:** All thermophysical data, equation coefficients, and transport property correlations
used in compound data files and equation implementations.

**Usage:** Every `EquationValue` in a compound data file must carry a `ref` field set to the
corresponding `RefKey` enum value (see `dto/ref-key.dto.ts`), plus a `page` field where applicable.

```typescript
// Example usage in a compound data file (TypeScript):
import { RefKey } from '../../dto/ref-key.dto';

{
  type: EquationTypeDto.quadratic,
  ref: RefKey.Incropera,  // ← enum value, NOT a raw number
  page: 839,
  vars: { a: 0.00309, b: 7.5930e-5, c: -1.1014e-8 },
  min: 78, max: 1500,
}
```

### Python usage

In Python, references are cited via a `Refs:` line in the **module / class / function docstring**.
For runtime lookups, import `RefKey` from the `references` package (a mirror of the TypeScript enum).

```python
# Module-level citation — in the module docstring:
"""
nasa_thermo.writers — JSON serialisation for NASA species dicts.

Refs: docs/REFERENCES.md  [8] NASA7, [9] Burcat2005, [23] NASA9
"""

# Class-level citation:
@dataclass
class Nasa9Equation:
    """NASA-9 multi-range polynomial equation.

    Refs: docs/REFERENCES.md  [9] Burcat2005, [23] NASA9
    """

# Runtime lookup using RefKey identifiers:
from references import RefKey, REFERENCES_META

#   Refs: RefKey.NASA7, RefKey.Burcat2005   ← use in docstrings

meta = REFERENCES_META[RefKey.NASA7]
print(meta['index'], meta['name'], meta.get('url'))
```

**Never** use raw numbers (`ref: 4`) or free-form strings — always use `RefKey` enum values.  
See [`docs/PYTHON_CODE_STANDARDS.md`](./PYTHON_CODE_STANDARDS.md) § 7 for the full Python citation convention.

---

## Reference List

| #  | Key (`RefKey`)   | Source |
|----|------------------|--------|
| 1  | `Szargut`        | Szargut, J. — *Termodynamika Techniczna* (Technical Thermodynamics). Wyd. Politechniki Śląskiej, multiple editions. Standard Cp polynomials (linearHyperbolic form: a + bT + d/T²). |
| 2  | `Incropera`      | Incropera, F.P.; DeWitt, D.P.; Bergman, T.L.; Lavine, A.S. — *Fundamentals of Heat and Mass Transfer*, 6th ed. Wiley, 2007. Thermal conductivity and viscosity tables/correlations. URL: https://booksite.elsevier.com/9780750683661/Appendix_C.pdf |
| 3  | `NBS1955`        | Hilsenrath, J. et al. — *Tables of Thermal Properties of Gases*. NBS Circular 564, 1955. URL: https://www.govinfo.gov/content/pkg/GOVPUB-C13-89baf9f9b4a43e5f25820bd51b0f3f11/pdf/GOVPUB-C13-89baf9f9b4a43e5f25820bd51b0f3f11.pdf |
| 4  | `Perry7`         | Perry, R.H.; Green, D.W. (eds.) — *Perry's Chemical Engineers' Handbook*, 7th ed. McGraw-Hill, 1997. Aly–Lee Cp coefficients (Table 2-150) and polynomial Cp data. |
| 5  | `Borgnakke`      | Borgnakke, C.; Sonntag, R.E. — *Thermodynamic and Transport Properties*. Wiley, 1997. URL: https://engineering.wayne.edu/mechanical/pdfs/thermodynamic-_tables-updated.pdf |
| 6  | `Yaws1999`       | Yaws, C.L. — *Chemical Properties Handbook: Physical, Thermodynamic, Environmental, Transport, Safety, and Health Related Properties for Organic and Inorganic Chemicals*. McGraw-Hill, 1999. |
| 7  | `Poling5`        | Poling, B.E.; Prausnitz, J.M.; O'Connell, J.P. — *The Properties of Gases and Liquids*, **5th ed.** McGraw-Hill, 2000. |
| 8  | `NASA7`          | McBride, B.J.; Zehe, M.J.; Gordon, S. — *NASA Glenn Coefficients for Calculating Thermodynamic Properties of Individual Species*. NASA TM-2002-211556, 2002. NASA-7 polynomial coefficients. |
| 9  | `Burcat2005`     | Burcat, A.; Ruscic, B. — *Third Millennium Ideal Gas and Condensed Phase Thermochemical Database for Combustion with Updates from Active Thermochemical Tables*. ANL-05/20, 2005. |
| 10 | `Lemmon2004`     | Lemmon, E.W.; Jacobsen, R.T. — *Viscosity and Thermal Conductivity Equations for Nitrogen, Oxygen, Argon, and Air*. International Journal of Thermophysics, 25(1), 2004. URL: https://trc.nist.gov/refprop/FAQ/NAO.PDF |
| 11 | `Barreiro2019`   | Barreiros, A. et al. — *Thermal conductivity of gases at atmospheric pressure*. Phys. Chem. Res., 2019. URL: https://www.physchemres.org/article_57774_2e932c91424b9180df6a5d3b309c8720.pdf |
| 12 | `Jones2019`      | Jones, J.M.; Mason, P.E.; Williams, A. — *A compilation of data on the radiant emissivity of some materials at high temperatures*. Journal of the Energy Institute, 92(3), pp. 523–534, 2019. ISSN 1743-9671. URL: https://eprints.whiterose.ac.uk/133266/7/emissivity%20manuscript%20revision%20%28final%29.pdf |
| 13 | `Sheindlin1974`  | Шейндлин А.Е. (ed.) — *Излучательные свойства твёрдых материалов. Справочник* (Emissive Properties of Solid Materials. Handbook). Energiya, Moscow, 1974. |
| 14 | `Bentz07`        | Bentz, D.P.; Prasad, K. — *Thermal Performance of Fire Resistive Materials I. Characterization with Respect to Thermal Performance Models*. NISTIR 7401, 2007. URL: https://www.researchgate.net/publication/241211063 |
| 15 | `NIST_Cryo`      | NIST Cryogenic Materials Properties Database. URL: https://trc.nist.gov/cryogenics/materials |
| 16 | `Perry9`         | Perry, R.H.; Green, D.W. (eds.) — *Perry's Chemical Engineers' Handbook*, 9th ed. McGraw-Hill, 2019. DIPPR transport correlations (Eq. 102); Table 2-95 (pp. 2-167–2-173) ideal-gas ΔHf, ΔGf at 298.15 K (DIPPR 801, 2016). |
| 17 | `DIPPR_Doc`      | DIPPR Fit Equations documentation (Chemicals library). URL: https://chemicals.readthedocs.io/chemicals.dippr.html |
| 18 | `WolframAlpha`   | WolframAlpha Online Integral Calculator — used to verify closed-form antiderivatives. URL: https://www.wolframalpha.com/calculators/integral-calculator/ |
| 19 | `Asano2006`      | Asano, K. — *Mass Transfer: From Fundamentals to Modern Industrial Applications*. Wiley-VCH, 2006. Lennard-Jones collision parameters (σ, ε/kB). |
| 20 | `White3`         | White, F.M. — *Viscous Fluid Flow*, 3rd ed. McGraw-Hill, 2006. Sutherland viscosity parameters (μ₀, T₀, S) in Appendix A. |
| 21 | `Mikheev1977`    | Михеев М.А., Михеева И.М. — *Основы теплопередачи* (Fundamentals of Heat Transfer), 2nd ed. Энергия, 1977. Nu correlations for turbulent pipe flow (Mikheev equation); gas radiation heat transfer coefficients. |
| 22 | `Whitaker1972`   | Whitaker, S. — *Forced Convection Heat Transfer Correlations for Flow in Pipes, Past Flat Plates, Single Cylinders, Single Spheres, and for Flow in Packed Beds and Tube Bundles*. AIChE Journal, 18(2), pp. 361–371, 1972. Nu correlations for external and internal forced convection. |
| 23 | `NASA9`          | Burcat, A.; Ruscic, B. — *Third Millennium Ideal Gas and Condensed Phase Thermochemical Database for Combustion with Updates from Active Thermochemical Tables*. ANL-05/20, 2005. NASA-9 polynomial format coefficients for a wide range of species; the database (`backend/data/nasa/nasa9.json`) also contains the McBride, B.J.; Gordon, S. NASA RP-1311 (1996) set ("NASA RP-1311 set" in compound files). URL: https://publications.anl.gov/anlpubs/2005/07/53802.pdf |
| 24 | `CaltechSDT`     | California Institute of Technology Explosion Dynamics Laboratory — *Shock and Detonation Toolbox: Thermodynamic Data*. Caltech, maintained. Contains NASA-7 and NASA-9 coefficient databases. URL: https://shepherd.caltech.edu/EDL/PublicResources/sdt/thermo.html |
| 25 | `BurcatELTE`     | Burcat, A.; Ruscic, B.; Goos, E. — *Extended Third Millennium Thermodynamic Database of New NASA Polynomials with Active Thermochemical Tables update*. Hosted at ELTE (Eötvös Loránd University), updated continuously. URL: https://respecth.elte.hu/burcat.php |
| 26 | `Basu2006`       | Basu, P. — *Combustion and Gasification in Fluidized Beds*. CRC Press (Taylor & Francis), 2006, pp. 45–78. Solid fuel properties: `charcoal-briquette` preset (p. 67). |
| 27 | `VanKrevelen1993` | Van Krevelen, D.W. — *Coal: Typology – Physics – Chemistry – Constitution*, 3rd ed. Elsevier, 1993, pp. 220–250. Solid fuel properties: `charcoal-oak` preset (p. 235). |
| 28 | `Laurendeau1978` | Laurendeau, N.M. — *Heterogeneous Kinetics of Coal Char Gasification and Combustion*. Progress in Energy and Combustion Science, 4(4), pp. 221–270, 1978. Char surface reaction kinetics (`BED_KINETICS`). |
| 29 | `Turns2012`      | Turns, S.R. — *An Introduction to Combustion: Concepts and Applications*, 3rd ed. McGraw-Hill, 2012, pp. 120–145. Gas-phase reaction kinetics (`BED_KINETICS`). |
| 30 | `Higman2008`     | Higman, C.; van der Burgt, M. — *Gasification*, 2nd ed. Gulf Professional Publishing (Elsevier), 2008, pp. 78–95. Boudouard and water-gas reactions (`BED_KINETICS`). |
| 31 | `IUPAC2021`      | Prohaska, T. et al. — *Standard Atomic Weights of the Elements 2021 (IUPAC Technical Report)*. Pure and Applied Chemistry, 94(5), pp. 573–600, 2022. Conventional atomic weights (`ATOMIC_MASS`). URL: https://doi.org/10.1515/pac-2019-0603 |
| 32 | `NISTWebBook`    | Linstrom, P.J.; Mallard, W.G. (eds.) — *NIST Chemistry WebBook*, NIST Standard Reference Database Number 69. National Institute of Standards and Technology, maintained. Reference data for fits (NH3 Sutherland viscosity). URL: https://webbook.nist.gov/chemistry/ |
| 33 | `Ergun1952`      | Ergun, S. — *Fluid Flow through Packed Columns*. Chemical Engineering Progress, 48(2), pp. 89–94, 1952. Packed-bed pressure drop (`AerodynamicsService`). |
| 34 | `Perry8`         | Green, D.W.; Perry, R.H. (eds.) — *Perry's Chemical Engineers' Handbook*, 8th ed. McGraw-Hill, 2008. DIPPR Eq. 102 coefficients: Table 2-312 (vapor viscosity) and Table 2-314 (vapor thermal conductivity) for the fuel gases C2H6 … C3H6. Machine-readable copies of both tables: CalebBell/chemicals, `chemicals/Viscosity/Table 2-312 …tsv` and `chemicals/Thermal Conductivity/Table 2-314 …tsv`. URL: https://github.com/CalebBell/chemicals |
| 35 | `Eakin1963`      | Eakin, B.E.; Ellington, R.T. — *Predicting the Viscosity of Pure Light Hydrocarbons*. Journal of Petroleum Technology, 15(2), pp. 210–214, 1963 (Trans. AIME 228). Table 1: Sutherland constants μ = B·T^1.5/(T + S) [μP, °R] for methane, ethane, propane, n-butane. URL: https://doi.org/10.2118/397-PA |

---

## Adding a New Reference

1. Append a new row with the next sequential integer.
2. Choose a descriptive key in `PascalCase` (e.g. `Author` or `AuthorYYYY`), unique in the enum.
3. Add the key to the `RefKey` enum **and** `REFERENCES_META` constant in `dto/ref-key.dto.ts`.
4. Include: author(s), title, edition/year, publisher, URL if freely available, and what data type it supplies.
5. **Never renumber or rename existing entries** — all `ref:` fields in compound files depend on the stability of this list.

---

## TODO — free-text citations not yet registered

These modules cite sources in comments / string fields (`Source:`, `Reference:`, `reference:`,
"Author (year)") that have no `RefKey`. Register each source (enum, `REFERENCES_META`, Python mirror,
this table) and replace the free text with the key (+ page).

- [ ] **`Perry9` conductivity entries** (Ar, N2, NH3, NO, SO2, SO3, Air; `page` 324–330) carry the same
  DIPPR 102 coefficients as `Perry8` Table 2-314 — confirm the edition and page against the book.
- [ ] **Nu correlations** — `backend/src/modules/thermodynamics/helpers/nu-formulas/*.nu.ts`
  (pipe-duct, flat-plate, cylinder, sphere, tube-bank, natural-convection, special) and
  `helpers/nu-coefficients.helper.ts`: Churchill (–Bernstein, –Chu), Hilpert, Zukauskas, Gunn 1978
  (used by the combustion bed model), Wakao & Funazkri, Martin, McAdams, Raithby & Hollands, etc.
- [ ] **Transport / radiation** — `modules/thermodynamics/services/diffusion.service.ts` (Neufeld et al. 1972;
  may be cited as `Poling5`), `transport.service.ts`, `radiation.service.ts`.
- [ ] **Refractory** — `modules/refractory/**`: glass viscosity (Lakatos 1976, Fluegel 2007, Nakamoto,
  Iida, VTF/Arrhenius — `constants/viscosity-parameters.ts`, `utils/glass-viscosity-*.util.ts`),
  packing / PSD (de Larrard etc. — `constants/packing-constants.ts`, `services/packing.service.ts`),
  Hetherington 1964 validation data, Mills 2011, phase equilibrium / eutectics, shrinkage,
  refractoriness, water demand, blend optimizer, Maxwell–Eucken (`services/thermal-performance.service.ts`),
  `constants/calculation-constants.ts` ("Reference: NIST database").
- [ ] **Numerics** — `common/utils/gauss-legendre.util.ts`, `gauss-legendre.constants.ts`,
  `simpson.util.ts` (Abramowitz & Stegun).
- [ ] **Other** — `modules/metals/data/materials/metal-thermal.data.ts`,
  `common/thermal/compound/composition/air.composition.ts`,
  `modules/thermal-distribution/utils/characteristic-length.util.ts`,
  `modules/recuperator/services/*.ts`, `modules/thermal-exchange/services/*.ts` (check each citation).

