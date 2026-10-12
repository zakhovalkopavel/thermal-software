"""
references.ref_key — RefKey: short keys of the literature references.

AUTO-GENERATED from shared/references/references.json by scripts/generate_references.py — do not edit; run `make references-generate`.
Each value maps to a numbered entry in docs/REFERENCES.md and to a key in
``references.references_meta.REFERENCES_META``. Never rename or remove a key.
"""
from __future__ import annotations

from enum import Enum


class RefKey(str, Enum):
    """Short reference keys pointing to docs/REFERENCES.md entries."""

    Szargut         = 'Szargut'  # [1] Szargut — Termodynamika Techniczna (multi)
    Incropera       = 'Incropera'  # [2] Incropera et al. — Fundamentals of Heat and Mass Transfer 6th ed. (2007)
    NBS1955         = 'NBS1955'  # [3] Hilsenrath et al. — NBS Tables of Thermal Properties of Gases (1955)
    Perry7          = 'Perry7'  # [4] Perry's Chemical Engineers' Handbook 7th ed. (1997)
    Borgnakke       = 'Borgnakke'  # [5] Borgnakke & Sonntag — Thermodynamic and Transport Properties (1997)
    Yaws1999        = 'Yaws1999'  # [6] Yaws — Chemical Properties Handbook (1999)
    Poling5         = 'Poling5'  # [7] Poling, Prausnitz, O'Connell — The Properties of Gases and Liquids 5th ed. (2000)
    NASA7           = 'NASA7'  # [8] McBride, Zehe, Gordon — NASA TM-2002-211556 (2002)
    Burcat2005      = 'Burcat2005'  # [9] Burcat & Ruscic — ANL-05/20 (2005)
    Lemmon2004      = 'Lemmon2004'  # [10] Lemmon & Jacobsen — Viscosity and Thermal Conductivity for N2, O2, Ar, Air (2004)
    Barreiro2019    = 'Barreiro2019'  # [11] Barreiros et al. — Thermal conductivity of gases (2019)
    Jones2019       = 'Jones2019'  # [12] Jones, Mason, Williams — Radiant emissivity (2019)
    Sheindlin1974   = 'Sheindlin1974'  # [13] Шейндлин А.Е. (ed.) — Излучательные свойства твёрдых материалов. Справочник, Энергия (1974)
    Bentz07         = 'Bentz07'  # [14] Bentz & Prasad — Thermal Performance of Fire Resistive Materials (2007)
    NIST_Cryo       = 'NIST_Cryo'  # [15] NIST Cryogenic Materials Properties Database (ongoing)
    Perry9          = 'Perry9'  # [16] Perry's Chemical Engineers' Handbook 9th ed. (2019)
    DIPPR_Doc       = 'DIPPR_Doc'  # [17] DIPPR Fit Equations — Chemicals library documentation (ongoing)
    WolframAlpha    = 'WolframAlpha'  # [18] WolframAlpha Online Integral Calculator (ongoing)
    Asano2006       = 'Asano2006'  # [19] Asano — Mass Transfer: From Fundamentals to Modern Industrial Applications (2006)
    White3          = 'White3'  # [20] White — Viscous Fluid Flow 3rd ed. (2006)
    Mikheev1977     = 'Mikheev1977'  # [21] Михеев М.А., Михеева И.М. — Основы теплопередачи, 2-е изд., Энергия (1977)
    Whitaker1972    = 'Whitaker1972'  # [22] Whitaker S. — Forced Convection Heat Transfer Correlations for Flow in Pipes, Past Flat Plates, Single Cylinders, Single Spheres, and for Flow in Packed Beds and Tube Bundles, AIChE J. 18(2) (1972)
    NASA9           = 'NASA9'  # [23] Burcat, A.; Ruscic, B. — Third Millennium Ideal Gas and Condensed Phase Thermochemical Database for Combustion with Updates from Active Thermochemical Tables, ANL-05/20. NASA-9 polynomial coefficients (with the McBride & Gordon NASA RP-1311 set). (2005)
    CaltechSDT      = 'CaltechSDT'  # [24] Caltech EDL — Shock and Detonation Toolbox: Thermodynamic Data (ongoing)
    BurcatELTE      = 'BurcatELTE'  # [25] Burcat, A.; Ruscic, B.; Goos, E. — Extended Third Millennium Thermodynamic Database (ELTE, updated) (ongoing)
    Basu2006        = 'Basu2006'  # [26] Basu, P. — Combustion and Gasification in Fluidized Beds, CRC Press (2006)
    VanKrevelen1993 = 'VanKrevelen1993'  # [27] Van Krevelen, D.W. — Coal: Typology, Physics, Chemistry, Constitution, 3rd ed., Elsevier (1993)
    Laurendeau1978  = 'Laurendeau1978'  # [28] Laurendeau, N.M. — Heterogeneous Kinetics of Coal Char Gasification and Combustion, Prog. Energy Combust. Sci. 4(4) (1978)
    Turns2012       = 'Turns2012'  # [29] Turns, S.R. — An Introduction to Combustion: Concepts and Applications, 3rd ed., McGraw-Hill (2012)
    Higman2008      = 'Higman2008'  # [30] Higman, C.; van der Burgt, M. — Gasification, 2nd ed., Gulf Professional Publishing (2008)
    IUPAC2021       = 'IUPAC2021'  # [31] Prohaska, T. et al. — Standard Atomic Weights of the Elements 2021 (IUPAC Technical Report), Pure Appl. Chem. 94(5) (2022)
    NISTWebBook     = 'NISTWebBook'  # [32] Linstrom, P.J.; Mallard, W.G. (eds.) — NIST Chemistry WebBook, NIST Standard Reference Database 69 (ongoing)
    Ergun1952       = 'Ergun1952'  # [33] Ergun, S. — Fluid Flow through Packed Columns, Chem. Eng. Prog. 48(2) (1952)
    Perry8          = 'Perry8'  # [34] Green, D.W.; Perry, R.H. (eds.) — Perry's Chemical Engineers' Handbook 8th ed., McGraw-Hill (2008)
    Eakin1963       = 'Eakin1963'  # [35] Eakin, B.E.; Ellington, R.T. — Predicting the Viscosity of Pure Light Hydrocarbons, J. Pet. Technol. 15(2), 210–214 (1963)
    NISTJANAF       = 'NISTJANAF'  # [36] Chase, M.W. Jr. — NIST-JANAF Thermochemical Tables, 4th ed., J. Phys. Chem. Ref. Data Monograph 9 (1998)
    CRC95           = 'CRC95'  # [37] Haynes, W.M.; Bruno, T.J.; Lide, D.R. (eds.) — CRC Handbook of Chemistry and Physics, 95th ed., CRC Press (2014)
    Yaws2014        = 'Yaws2014'  # [38] Yaws, C.L. — Thermophysical Properties of Chemicals and Hydrocarbons, 2nd ed., Gulf Professional Publishing (2014)
    Zabransky1996   = 'Zabransky1996'  # [39] Zabransky, M.; Ruzicka, V. Jr.; Majer, V.; Domalski, E.S. — Heat Capacity of Liquids: Critical Review and Recommended Values, J. Phys. Chem. Ref. Data Monograph 6 (1996)
    TRC1994         = 'TRC1994'  # [40] Thermodynamics Research Center — Thermodynamics of Organic Compounds in the Gas State, Vol. II, TRC (1994)
    VDI2010         = 'VDI2010'  # [41] VDI e.V. (ed.) — VDI Heat Atlas, 2nd ed., Springer (2010)
    Magalhaes2013   = 'Magalhaes2013'  # [42] Magalhães, A.L.; Lito, P.F.; Da Silva, F.A.; Silva, C.M. — Simple and Accurate Correlations for Diffusion Coefficients of Solutes in Liquids and Supercritical Fluids, J. Supercrit. Fluids 76 (2013)
