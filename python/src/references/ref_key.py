"""
references.ref_key — Python mirror of the TypeScript RefKey enum.

Each value maps to a numbered entry in docs/REFERENCES.md and to a key in
``references.references_meta.REFERENCES_META``.

Rules
-----
  - Use AuthorYYYY or well-known acronym pattern (same as TypeScript RefKey).
  - Never rename or remove an existing key — downstream code depends on stability.
  - Add new keys at the bottom; update docs/REFERENCES.md in the same commit.

Source of truth: backend/src/common/thermal/enum/ref-key.enum.ts
"""
from __future__ import annotations

from enum import Enum


class RefKey(str, Enum):
    """Short reference keys pointing to docs/REFERENCES.md entries."""

    Szargut       = 'Szargut'       # [1]  Szargut — Termodynamika Techniczna
    Incropera     = 'Incropera'     # [2]  Incropera et al. — Heat and Mass Transfer 6th ed.
    NBS1955       = 'NBS1955'       # [3]  Hilsenrath et al. — NBS Circular 564 (1955)
    Perry7        = 'Perry7'        # [4]  Perry's Chemical Engineers' Handbook 7th ed. (1997)
    Borgnakke     = 'Borgnakke'     # [5]  Borgnakke & Sonntag — Thermodynamic Tables
    Yaws1999      = 'Yaws1999'      # [6]  Yaws — Chemical Properties Handbook (1999)
    Poling5       = 'Poling5'       # [7]  Poling, Prausnitz, O'Connell — Gases & Liquids 5th ed.
    NASA7         = 'NASA7'         # [8]  McBride, Zehe, Gordon — NASA TM-2002-211556
    Burcat2005    = 'Burcat2005'    # [9]  Burcat & Ruscic — ANL-05/20 (2005)
    Lemmon2004    = 'Lemmon2004'    # [10] Lemmon & Jacobsen — Int. J. Thermophysics 25(1), 2004
    Barreiro2019  = 'Barreiro2019'  # [11] Barreiros et al. — Phys. Chem. Res. (2019)
    Jones2019     = 'Jones2019'     # [12] Jones, Mason, Williams — J. Energy Inst. 92(3), 2019
    Sheindlin1974 = 'Sheindlin1974' # [13] Шейндлин А.Е. (ed.) — Излучательные свойства (1974)
    Bentz07       = 'Bentz07'       # [14] Bentz & Prasad — NISTIR 7401 (2007)
    NIST_Cryo     = 'NIST_Cryo'     # [15] NIST Cryogenic Materials Properties Database
    Perry9        = 'Perry9'        # [16] Perry's Chemical Engineers' Handbook 9th ed. (2019)
    DIPPR_Doc     = 'DIPPR_Doc'     # [17] DIPPR Fit Equations — Chemicals library docs
    WolframAlpha  = 'WolframAlpha'  # [18] WolframAlpha Online Integral Calculator
    Asano2006     = 'Asano2006'     # [19] Asano — Mass Transfer (2006)
    White3        = 'White3'        # [20] White — Viscous Fluid Flow 3rd ed. (2006)
    Mikheev1977   = 'Mikheev1977'   # [21] Михеев М.А., Михеева И.М. — Основы теплопередачи, 2-е изд. (1977)
    Whitaker1972  = 'Whitaker1972'  # [22] Whitaker S. — Forced Convection Heat Transfer Correlations (1972)
    NASA9         = 'NASA9'         # [23] Burcat & Ruscic — ANL-05/20 (2005) — NASA-9 polynomial coefficients
    CaltechSDT    = 'CaltechSDT'    # [24] Caltech EDL — Shock and Detonation Toolbox: Thermodynamic Data
    BurcatELTE    = 'BurcatELTE'    # [25] Burcat, Ruscic, Goos — Extended Thermodynamic Database (ELTE)

