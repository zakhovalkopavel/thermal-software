# Chapter 12: References and Traceability

**Part V: Reference**

---

## Primary References

### Lakatos 1976

> **Lakatos, T.; Johansson, L-G.; Simmingskőld, B.**
> *"Updated factors for calculation of viscosity"*
> August 1976. (Internal communication / supplement to *Glasteknik Tidskrift*)

This 1976 document pools viscosity data from four prior publications by the same group:

1. Lakatos, T.; Johansson, L-G.; Simmingskőld, B.
   *"Viscosity-temperature relations in the glass system SiO₂–Al₂O₃–Na₂O–K₂O–CaO–MgO in the compositional range of technical glasses."*
   *Glass Technology* 13(3):88–95, June 1972.

2. Lakatos, T.; Johansson, L-G.; Simmingskőld, B.
   *"The effect of some components on the viscosity of glass."*
   *Glasteknik Tidskrift* 27(2):25–28, 1972.

3. Lakatos, T.; Johansson, L-G.; Simmingskőld, B.
   *"Influence of Li₂O and B₂O₃ on viscosity in soda-lime-silica glass."*
   *Glasteknik Tidskrift* 30(1):7–8, 1975.

4. Lakatos, T.; Johansson, L-G.; Simmingskőld, B.
   *"Viscosity, liquidus temperature and hydrolytical resistance in the SiO₂–Al₂O₃–Na₂O–K₂O–CaO–MgO system."*
   *Glasteknik Tidskrift* 31(2):31–35, 1976.

### Fluegel 2007

> **Fluegel, A.**
> *"Glass viscosity calculation based on a global statistical modelling approach"*
> *Glass Technology: European Journal of Glass Science and Technology Part A*, 48(1):13–30, February 2007.
> DOI: [10.1111/j.2040-9969.2007.tb01719.x](https://doi.org/10.1111/j.2040-9969.2007.tb01719.x)

Earlier Fluegel publications cited in this work:

- Fluegel, A. *"Statistical regression modelling of glass properties."* Glass Technol. 45(6):202–212, 2004. (Reference 31 in the 2007 paper)
- Fluegel, A. *"Glass property prediction."* Glass Technol. 46(5):331–339, 2005. (Reference 32 in the 2007 paper)

---

## Standard References

### ASTM C965-96(2012)

> *"Standard Practice for Measuring Viscosity of Glass Above the Softening Point"*
> ASTM International. DOI: [10.1520/C0965-96R12](https://www.astm.org/c0965-96r12.html)

Defines the six fixed viscosity points used in this spec. Temperatures are defined for viscosity levels in **poise** — all have been converted to Pa·s in this spec (subtract 1 from log η).

### VTF Equation Original Papers

- Vogel, H. *"Das Temperaturabhängigkeitsgesetz der Viskosität von Flüssigkeiten."* Physikalische Zeitschrift 22:645–646, 1921.
- Fulcher, G.S. *"Analysis of recent measurements of the viscosity of glasses."* J. Am. Ceram. Soc. 8(6):339–355, 1925.
- Tammann, G.; Hesse, W. *"Die Abhängigkeit der Viskosität von der Temperatur bei unterkühlten Flüssigkeiten."* Z. Anorg. Allg. Chem. 156:245–257, 1926.

---

## Reference Glass Standards

| Label | Full Identification |
|---|---|
| NIST SRM 710A | NIST Standard Reference Material 710A — Soda-lime-silica glass. Reference 39 in Fluegel 2007. |
| NIST SRM 717A | NIST Standard Reference Material 717A — Borosilicate glass. Reference 40 in Fluegel 2007. |
| 711 | Lead crystal glass standard. Reference 41 in Fluegel 2007. |
| 710 | Soda-lime glass standard (older NIST SRM 710). Reference 42 in Fluegel 2007. |
| DGG I | Deutsche Glastechnische Gesellschaft standard glass I. Reference 43 in Fluegel 2007. |
| WGS | Waste Glass Standard. Reference 44 in Fluegel 2007. Complex multi-component composition. |
| CO | Soda-lime-silica container glass. Simple composition included for broad model comparison (not a certified standard). Reference 38 in Fluegel 2007. |

---

## SciGlass Database

The Fluegel 2007 model was calibrated on data from:

> **SciGlass Information System** (now SciGlass 7.8, ITC Inc.)
> A database of glass property data compiled from scientific literature across multiple decades. The Fluegel 2007 model used SciGlass 5.x as the data source.

---

## Traceability Matrix

| CSV File | Chapter(s) using it | Content | Role |
|---|---|---|---|
| `lakatos_ocr/Lakatos_1976.txt` | Ch. 2, 4 | Original paper OCR | Source text, qualitative notes |
| `lakatos_ocr/page_001_table_007.csv` | Ch. 4 | Isokom regression coefficients | **Implementation — primary** |
| `lakatos_ocr/page_002_table_006.csv` | Ch. 2 | VTF direct regression coefficients | Documentation only |
| `lakatos_ocr/page_002_table_007.csv` | Ch. 3, 9 | Standard deviations σ | Confidence estimation |
| `lakatos_ocr/page_003_table_001.csv` | Ch. 10, 11 | 30-glass validation dataset | Test cases |
| `lakatos_ocr/page_004_table_002.csv` | Ch. 10, 11 | 14-glass validation dataset | Test cases |
| `fluegel_2007/fluegel_2007.txt` | Ch. 2, 5 | Original paper OCR | Source text, model description |
| `fluegel_2007/Fluegel_table1.csv` | Ch. 10, 11 | 7 reference glass compositions | Test inputs |
| `fluegel_2007/Fluegel_table2.csv` | Ch. 2 | Model comparison table | Context / background |
| `fluegel_2007/Fluegel_table3.csv` | Ch. 3, 5, 9 | Composition validity bounds | Range validation |
| `fluegel_2007/Fluegel_table4.csv` | Ch. 5 | Coefficients at log η 1.5 Pa·s | **Implementation** |
| `fluegel_2007/Fluegel_table5.csv` | Ch. 5 | Coefficients at log η 6.6 Pa·s | **Implementation** |
| `fluegel_2007/Fluegel_table6.csv` | Ch. 5 | Coefficients at log η 12.0 Pa·s | **Implementation** |
| `fluegel_2007/Fluegel_table12.csv` | Ch. 10, 11 | Experimental vs model temperatures | Test expected values |

---

## Key Implementation Notes (Cross-Reference)

| Risk | Location in spec | Mitigation |
|---|---|---|
| Poise vs Pa·s (10× error) | Ch. 1, 2, 4, 7 | Unit conversion table; validated by LAK-UNIT tests |
| Lakatos encoding (not wt%) | Ch. 2, 4, 6 | Explicit algorithm with worked example in Ch. 4 |
| Fluegel SiO₂ exclusion convention | Ch. 2, 5, 6 | Explicit note: denominator includes SiO₂, value is excluded from regression |
| VTF with 3 exact points (R²=1) | Ch. 7, 9 | Document that confidence comes from σ, not from fit residuals |
| B₂O₃ quadratic term | Ch. 4, 5 | Separate coefficient row `(B₂O₃)²`; worked example D17 tests it |
| Cross-product terms in Fluegel | Ch. 5, 11 | Explicit notation `×`; tested by FLU-CROSS tests |
| WGS glass out-of-range | Ch. 10, 11 | WGS excluded from pass/fail for log η 6.6, 12 levels |

---

## Slag and Fluoride Melt References

### Iida & Guthrie 1988

> **Iida, T., & Guthrie, R. I. L.**
> *The Physical Properties of Liquid Metals.*
> Oxford University Press, 1988.

Provides the foundational derivation of the ideal viscosity η₀ᵢ and pure-component constants (Mᵢ, Tmᵢ, Vmᵢ, Hᵢ) used in the Iida model.

### Nakamoto 2007

> **Nakamoto, H., Kiyose, A., & Tanaka, T.**
> *"A model for estimating the viscosity of multi-component slags containing alkali oxide and calcium fluoride."*
> *ISIJ International*, 47(11):1583–1590, 2007.

Provides the activation energy coefficients eᵢ including the revised CaF₂ value of −108 200 J/mol. Table "Parameters eᵢ for activation energy" is the primary source for the Nakamoto implementation.

### Tanaka 2004

> **Tanaka, T., et al.**
> *"Evaluation of Viscosity of Molten Slag with the Concept of Optical Basicity."*
> *Steel Research International*, 75:238–243, 2004.

Supporting reference for the Nakamoto-Tanaka framework, optical basicity approach.

### Mills / NPL 2011

> **Mills, K. C.**
> *Estimating the Physical Properties of Slags.*
> Southern African Institute of Mining and Metallurgy (SAIMM), 2011.

Provides the Basicity Index α coefficients for the Iida model, the dynamic alumina formula, and the multi-linear liquidus regression (intercept 1225°C, component coefficients).

> **Mills, K. C., Yuan, L., & Li, Z.**
> *"The estimation of the physical properties of slags."*
> *J. Southern African Institute of Mining and Metallurgy*, 111(10):649–658, 2011.

### Slag Atlas

> **Allibert, M., & Verein Deutscher Eisenhüttenleute.**
> *Slag Atlas* (2nd Edition).
> Verlag Stahleisen GmbH, 1995.

Industry standard reference. Chapter 2 compares the Iida, Urbain, and Riboud models with verified constants. Used for cross-checking pure-component data (Mᵢ, Tmᵢ, Vmᵢ, Hᵢ) in the Iida model.

---

**End of Glass Viscosity  Specification**

Return to: [Index](./INDEX.md)

