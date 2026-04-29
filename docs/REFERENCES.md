# Literature References

**Scope:** All thermophysical data, equation coefficients, and transport property correlations
used in compound data files and equation implementations.

**Usage:** Every `EquationValue` in a compound data file must carry a `ref` field set to the
corresponding `RefKey` enum value (see `dto/ref-key.dto.ts`), plus a `page` field where applicable.

```typescript
// Example usage in a compound data file:
import { RefKey } from '../../dto/ref-key.dto';

{
  type: EquationTypeDto.quadratic,
  ref: RefKey.Incropera,  // ← enum value, NOT a raw number
  page: 839,
  vars: { a: 0.00309, b: 7.5930e-5, c: -1.1014e-8 },
  min: 78, max: 1500,
}
```

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
| 16 | `Perry9`         | Perry, R.H.; Green, D.W. (eds.) — *Perry's Chemical Engineers' Handbook*, 9th ed. McGraw-Hill, 2019. DIPPR transport correlations (Eq. 102). |
| 17 | `DIPPR_Doc`      | DIPPR Fit Equations documentation (Chemicals library). URL: https://chemicals.readthedocs.io/chemicals.dippr.html |
| 18 | `WolframAlpha`   | WolframAlpha Online Integral Calculator — used to verify closed-form antiderivatives. URL: https://www.wolframalpha.com/calculators/integral-calculator/ |
| 19 | `Asano2006`      | Asano, K. — *Mass Transfer: From Fundamentals to Modern Industrial Applications*. Wiley-VCH, 2006. Lennard-Jones collision parameters (σ, ε/kB). |
| 20 | `White3`         | White, F.M. — *Viscous Fluid Flow*, 3rd ed. McGraw-Hill, 2006. Sutherland viscosity parameters (μ₀, T₀, S) in Appendix A. |
| 21 | `Mikheev1977`    | Михеев М.А., Михеева И.М. — *Основы теплопередачи* (Fundamentals of Heat Transfer), 2nd ed. Энергия, 1977. Nu correlations for turbulent pipe flow (Mikheev equation); gas radiation heat transfer coefficients. |
| 22 | `Whitaker1972`   | Whitaker, S. — *Forced Convection Heat Transfer Correlations for Flow in Pipes, Past Flat Plates, Single Cylinders, Single Spheres, and for Flow in Packed Beds and Tube Bundles*. AIChE Journal, 18(2), pp. 361–371, 1972. Nu correlations for external and internal forced convection. |
| 23 | `NASA9`          | Burcat, A.; Ruscic, B. — *Third Millennium Ideal Gas and Condensed Phase Thermochemical Database for Combustion with Updates from Active Thermochemical Tables*. ANL-05/20, 2005. NASA-9 polynomial format coefficients for a wide range of species. URL: https://publications.anl.gov/anlpubs/2005/07/53802.pdf |
| 24 | `CaltechSDT`     | California Institute of Technology Explosion Dynamics Laboratory — *Shock and Detonation Toolbox: Thermodynamic Data*. Caltech, maintained. Contains NASA-7 and NASA-9 coefficient databases. URL: https://shepherd.caltech.edu/EDL/PublicResources/sdt/thermo.html |
| 25 | `BurcatELTE`     | Burcat, A.; Ruscic, B.; Goos, E. — *Extended Third Millennium Thermodynamic Database of New NASA Polynomials with Active Thermochemical Tables update*. Hosted at ELTE (Eötvös Loránd University), updated continuously. URL: https://respecth.elte.hu/burcat.php |

---

## Adding a New Reference

1. Append a new row with the next sequential integer.
2. Choose a descriptive key in `PascalCase` (e.g. `Author` or `AuthorYYYY`), unique in the enum.
3. Add the key to the `RefKey` enum **and** `REFERENCES_META` constant in `dto/ref-key.dto.ts`.
4. Include: author(s), title, edition/year, publisher, URL if freely available, and what data type it supplies.
5. **Never renumber or rename existing entries** — all `ref:` fields in compound files depend on the stability of this list.

