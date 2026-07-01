# RECUPERATOR SPEC — 08 Bibliography

---

## Primary References

1. **Mikheev M. A., Mikheeva I. M.**  
   *Osnovy teploperedachi* (Fundamentals of Heat Transfer), 2nd ed.  
   Energiya, Moscow, 1977.  
   — Source for logarithmic mean temperature difference, overall HTC formula, natural convection correlations

2. **Gnielinski V.**  
   "New equations for heat and mass transfer in turbulent pipe and channel flow"  
   *International Chemical Engineering*, 16(2):359–368, 1976.  
   — Source for `Nu = (f/8)·(Re−1000)·Pr / (1 + 12.7·√(f/8)·(Pr^(2/3)−1))` used in recuperator.js

3. **Hottel H. C., Sarofim A. F.**  
   *Radiative Transfer*. McGraw-Hill, New York, 1967.  
   — Source for Hottel–Mikheev gas emissivity correlation used in `gasRadiationEmissivity()`

4. **Churchill S. W., Chu H. H. S.**  
   "Correlating equations for laminar and turbulent free convection from a vertical plate"  
   *International Journal of Heat and Mass Transfer*, 18:1323–1329, 1975.  
   — Source for natural convection correlation used in `airNaturalConvectionAlpha()`

5. **Mills A. F.**  
   *Heat Transfer*, 2nd ed. Prentice Hall, 1999.  
   — Source for combined entrance-effects laminar Nusselt number:  
     `Nu = 3.66 + (0.065·Re·Pr·d/L) / (1 + 0.4·(Re·Pr·d/L)^(2/3))`

6. **Dittus F. W., Boelter L. M. K.**  
   "Heat transfer in automobile radiators of the tubular type"  
   *University of California Publications in Engineering*, 2:443–461, 1930.  
   — Source for turbulent HTC correlation (`0.023·Re^0.8·Pr^n`)

---

## Legacy Source

7. **recuperator.js** — `/opt/thermal-software/legacy/scripts/recuperator.js`  
   Original JavaScript implementation of all algorithms. ~2450 lines.  
   Authored internally. This spec is a direct transcription and formalisation of that code.

8. **recuperator.html** — `/opt/thermal-software/legacy/recuperator.html`  
   UI definition with material lists, input fields, and result display.  
   Source for the 21 material keys and their display names.

---

## Material Property Sources

| Material family | Property source |
|---|---|
| Chamotte fire brick | Ref. [1], Table A-2 |
| Mullite brick | Manufacturer data (interpolated from legacy JS) |
| Quartz / silica brick | Ref. [1], Table A-2 |
| Alumina (dense) | Manufacturer data (Korund, interpolated) |
| Silicon carbide | Manufacturer data (interpolated) |
| Basalt fibre mat | Product data sheet LYTX-312 |
| AISI 304 stainless | NIST / ASM Handbook Vol. 2 |
| Mild steel / iron | Ref. [1], Table A-1 |
