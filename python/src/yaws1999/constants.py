"""
yaws1999.constants — Source path and output layout for Yaws Chemical Properties Handbook (1999).

The DjVu lives under ``shared/sources/compound-data/`` (visible in the python
container). Final tables go to ``shared/processed/yaws1999/tables/`` (one
slug-named JSON per handbook table) plus root ``index.json``. Freeform finals
are flat under ``chapters/`` / ``front-matter/`` / ``appendix/`` (one version
each). Staging page JSON is retired from processed after consolidation into
``reports/yaws1999/intermediates/``; OCR quant/dpi variants go to
``reports/yaws1999/variants/`` only. Page dumps / debug JSON live under
``reports/yaws1999/``. OCR engine is chosen by page-ocr (``PAGE_OCR_*``);
see ``parse_tables.parse_yaws1999``.

Printed page ≈ DjVu page − ``PAGE_OFFSET`` (Table 1-1 starts on DjVu page 10 = printed 1).
"""
from __future__ import annotations

from pathlib import Path

SOURCE_DJVU = Path("shared/sources/compound-data/Chemical properties handbook (Yaws 1999).djvu")
PROCESSED_DIR = Path("shared/processed/yaws1999")
# Container cwd is /app; compose mounts ./tmp/reports/python → /app/reports.
REPORT_DIR = Path("reports/yaws1999")
PAGES_DIR = REPORT_DIR / "pages"
DEBUG_DIR = REPORT_DIR / "debug"

PAGE_OFFSET = 9
"""DjVu page − printed page for the body tables (Table 1-1 on DjVu 10 = printed 1)."""

REF_KEY = "Yaws1999"
SOURCE_NAME = "Yaws — Chemical Properties Handbook"
SOURCE_YEAR = "1999"

# Known OCR / typographical CAS errors in the handbook tables (wrong → official).
# Applied when parsing rows and when compound-data reads processed JSON.
# Durable copy (with names / reasons): ``shared/processed/yaws1999/appendix/CAS_Corrections.json``.
# Table-matched CAS missing from the printed appendix index:
#   ``shared/processed/yaws1999/appendix/CAS_TableMatched_Index.json``.
# Table-only create allow-list: ``shared/processed/yaws1999/appendix/CAS_TableOnly_Create.json``.
#
# How to extend (see ``scripts/fix_yaws1999_table_cas.py``):
#   1. Table CAS missing from the appendix → look up the same name in the CAS index.
#   2. Verify table CAS + appendix candidate(s) via PubChem/NIST/….
#   3. Auto-fix the table only when the table CAS is not found and one appendix
#      CAS is confirmed. If both are found (isomers/mixtures), review manually.
#   4. Refresh ``appendix/CAS_Corrections.json`` when pairs change.
CAS_TYPO_FIXES: dict[str, str] = {
    "72-02-5": "75-02-5",       # vinyl fluoride (72-02-5 is unassigned)
    "75-05-08": "75-05-8",      # acetonitrile (extra OCR digit)
    "13756-19-0": "13765-19-0", # calcium chromate (transposed digits)
    # Appendix CAS index rows that failed the check digit (user-verified official CAS)
    "76-47-4": "77-47-4",       # hexachlorocyclopentadiene
    "92-54-4": "92-52-4",       # biphenyl
    "103-03-2": "108-03-2",     # 1-nitropropane
    "121-71-5": "121-17-5",     # 4-chloro-3-nitrobenzotrifluoride
    "156-43-3": "156-43-4",     # p-phenetidine
    "544-55-2": "544-25-2",     # 1,3,5-cycloheptatriene
    "606-95-7": "6812-39-1",    # 1-cyclopentylhexadecane
    "624-58-6": "624-48-6",     # dimethyl maleate
    "627-98-7": "627-98-5",     # 5-methyl-1-hexanol
    "2278-87-9": "20278-87-9",  # 3,3,4-trimethylheptane
    "2278-88-0": "20278-88-0",  # 3,4,4-trimethylheptane
    "2278-89-1": "20278-89-1",  # 3,4,5-trimethylheptane
    "6758-23-5": "6785-23-5",   # 1-cyclopentylundecane
    "6892-38-0": "6812-38-0",   # 1-cyclohexylhexadecane
    "7064-93-2": "764-93-2",    # 1-decyne
    "13436-39-3": "13463-39-3", # nickel carbonyl
    "15896-91-0": "52896-91-0", # 3-ethyl-4-methylheptane (1→5 OCR; PubChem CID 521415)
    "2902-96-7": "1712-64-7",   # isopropyl nitrate (2902-96-7 is 2-nitropropanol in PubChem)
    "10059-13-9": "7289-44-3",  # methyl-undecyl-sulfide (10059-13-9 is 2-methylundecane-2-thiol in PubChem)
    "295-48-7": "1795-21-7",    # 1-cyclopentyldecane (PubChem CID 137211); 295-48-7 is cyclopentadecane
}


def correct_cas(cas: str | None) -> str | None:
    """Return the official CAS when ``cas`` is a known handbook typo; else unchanged."""
    if cas is None:
        return None
    text = str(cas).strip()
    return CAS_TYPO_FIXES.get(text, text)


# Table-row name OCR typos → spelling from the CAS / synonym appendix (same compound).
# Only when the appendix name is the correct one; do not pull worse appendix spellings
# onto the table (e.g. keep table CHLOROBENZENE over appendix CHLORBENZENE).
# Durable copy: ``shared/processed/yaws1999/appendix/Name_Corrections.json``.
NAME_TYPO_FIXES: dict[str, str] = {
    # Glyph / letter OCR
    "PENTAEYRTHRITOL TETRANITRATE": "PENTAERYTHRITOL TETRANITRATE",
    "DICHLOROFILUOROMETHANE": "DICHLOROFLUOROMETHANE",
    "CHLOROFILUOROMETHANE": "CHLOROFLUOROMETHANE",
    "HEXAMETHYLCYLOTRISILOXANE": "HEXAMETHYLCYCLOTRISILOXANE",
    "HEXAMETHYLCYCLOTRISILIOXANE": "HEXAMETHYLCYCLOTRISILOXANE",
    "TETRADECLAMINE": "TETRADECYLAMINE",
    "DIMETHYL DISULFJDE": "DIMETHYL DISULFIDE",
    "DIETHYLENE GLYCOL ETHYL ETHER ACET": "DIETHYLENE GLYCOL ETHYL ETHER ACETATE",
    # Same-Hill appendix label forms (n- / di- / ethene→ethylene). Same Hill is
    # expected for many real isomers; these pairs are naming variants, not isomer swaps.
    "1-BUTYLNAPHTHALENE": "1-n-BUTYLNAPHTHALENE",
    "BUTYL-DISULFIDE": "DIBUTYL-DISULFIDE",
    "BUTYL DISULFIDE": "DIBUTYL-DISULFIDE",
    "BUTY DISULFIDE": "DIBUTYL-DISULFIDE",
    "ETHYL DISULFIDE": "DIETHYL DISULFIDE",
    "METHYL DISULFIDE": "DIMETHYL DISULFIDE",
    "PENTYL-DISULFIDE": "DIPENTYL-DISULFIDE",
    "PROPYL-DISULFIDE": "DIPROPYL-DISULFIDE",
    "HEXYL-DISULFIDE": "DIHEXYL DISULFIDE",
    "HEXYL-PROPYL-SULFIDE": "1-(PROPYLTHIO)HEXANE",
    "TRICHLOROETHENE": "TRICHLOROETHYLENE",
    "PENTYLBENZENE": "n-PENTYLBENZENE",
    "HEPTADECANE": "n-HEPTADECANE",
    "PENTADECANE": "n-PENTADECANE",
    "TETRADECANE": "n-TETRADECANE",
    "HEXADECANE": "n-HEXADECANE",
    "NONADECANE": "n-NONADECANE",
    "OCTADECANE": "n-OCTADECANE",
    "TRIDECANE": "n-TRIDECANE",
    "EICOSANE": "n-EICOSANE",
    "UNDECANE": "n-UNDECANE",
    "UNDECYL ALCOHOL": "HENDECYL ALCOHOL",
    "4,4'-DICHLORODIPHENYLTRICHLOROETHANE": "DICHLORODIPHENYLTRICHLOROETHANE (DDT)",
    # Appendix joins (OCR / parenthetical synonyms → printed CAS-index spelling)
    "8-HYDROXQYUINOLINE": "8-HYDROXYQUINOLINE",
    "8-HYDROXQUINOLINE": "8-HYDROXYQUINOLINE",
    "ACETYLENE(ETHYNE)": "ACETYLENE",
    "1-BUTEN-3-YNE(VINYLACETYLENE)": "VINYLACETYLENE",
    "PROPYNE(METHYLACETYLENE)": "PROPYNE",
    "PUTYL-OCTYL-SULFIDE": "BUTYL-OCTYL-SULFIDE",
    "\\alpha-ETHYLANILINE": "o-ETHYLANILINE",
    "\\alpha-TERPHENYL": "o-TERPHENYL",
    "\\phi-TERPHENYL": "p-TERPHENYL",
    "n-NONAIOC ACID": "n-NONANOIC ACID",
    "sec- BUTYL ALCOHOL": "sec-BUTYL ALCOHOL",
    "trans-CROTONIC ACID 45,9341": "trans-CROTONIC ACID",
    "cis-DECAHYDRONANPHTALENE": "cis-DECAHYDRONAPHTHALENE",
    "cis-DECAHYDRONAPHTALENE": "cis-DECAHYDRONAPHTHALENE",
    "DIIIODOMETHANE": "DIIODOMETHANE",
    "COLUMBIUM FLUORIDE": "NIOBIUM(V) FLUORIDE",
    "(3-TRIFLOROMETHYL)PHENYLUREA": "(3-TRICHLOROMETHYL)PHENYLUREA",
    "3-(3-(TRIFLOROMETHYL)PHENYL)-1,1-DIMETHYLUREA": "FLUOMETURON",
    "3-PHENYL-1-METHYLUREA": "1-METHYL-3-PHENYLUREA",
    "FLUCHORALIN": "FLUCHLORALIN",
    "METHYL-CHLOROPYRIFOS": "CHLORPYRIFOS-METHYL",
    "MONOINURON": "MONOLINURON",
    # 20-1 NAME+CAS renames (synonym-mode OCR spellings are NOT mapped — table keeps original)
    "(2-FLOROPHENYL)UREA": "1-(2-FLUOROPHENYL)UREA",
    "(3-FLOROPHENYL)UREA": "1-(3-FLUOROPHENYL)UREA",
    "(4-FLOROPHENYL)UREA": "1-(4-FLUOROPHENYL)UREA",
    "(4-PHENNOXYPHENYL)UREA": "1-(4-PHENOXYPHENYL)UREA",
    "1,2-DIBROMO-3-CHLOROETHANE": "1,2-DIBROMO-1-CHLOROETHANE",
    "2,2',4,4',5,5'-HEXACHLOROBIPHENYL": "2,2',4,4',5,5'-HEXACHLOROBIPHENYL (PCB 153)",
    "2,2',4,4',6,6'-HEXACHLOROBIPHENYL": "2,2',4,4',6,6'-HEXACHLOROBIPHENYL (PCB 155)",
    "2,2',4,5,5'-PENTACHLOROBIPHENYL": "2,2',4,5,5'-PENTACHLOROBIPHENYL (PCB 101)",
    "2,2'-DICHLOROBIPHENYL": "2,2'-DICHLOROBIPHENYL (PCB 4)",
    "2,4,4'-TRICHLOROBIPHENYL": "2,4,4'-TRICHLOROBIPHENYL (PCB 28)",
    "3-(3,5-METHYLPHENYL)-1,1-DIMETHYLUREA": "3-(3,5-DIMETHYLPHENYL)-1,1-DIMETHYLUREA",
    "3-(3-CHLORO-4-BROMOPHENYL)-1-METHYL-1-METHOXYU": "CHLORBROMURON",
    "3-CHLORO-4-BROMOBENZENE": "1-BROMO-2-CHLORO-4-NITROBENZENE",
    "3-PHENYL-1-CYCLEPROPYLUREA": "1-CYCLOPROPYL-3-PHENYLUREA",
    "3-PHENYLCYCLOPENTYLUREA": "1-CYCLOPENTYL-3-PHENYLUREA",
    "9-METHYLANTHRANCENE": "9-METHYLANTHRACENE",
    "ANTHRACENCE-9-CARBOXYLIC ACID": "ANTHRACENE-9-CARBOXYLIC ACID",
    "CHLOREONEB": "CHLORONEB",
    "PEATACHLOROBENZENE": "PENTACHLOROBENZENE",
    "n-PENTYL PHENYLCARBAMATE": "PENTYL PHENYLCARBAMATE",
    # no_match joins (OCR / solvent-suffix / naming variant → appendix or curated)
    "(3-CHLORO-4-METHOXYLPHENYL)UREA": "1-(3-CHLORO-4-METHOXYPHENYL)UREA",
    "(3-METHYL-4-FLOROPHENYL)UREA": "1-(4-FLUORO-3-METHYLPHENYL)UREA",

    "2-NORBORNENE ----- ----- in heptane": "2-NORBORNENE",
    "FORMANILIDE ----- ----- in CCl4": "FORMANILIDE",
    "PENTAERYTHRITOL TETRANITRATE ----- ----- in dioxane": "PENTAERYTHRITOL TETRANITRATE",
    "PROPYL DISULFIDE": "DIPROPYL-DISULFIDE",
    "SALICYLIC ACID ----- ----- in dioxane": "SALICYLIC ACID",
    "o-CHLOROBENZOIC ACID ----- ----- in dioxane": "o-CHLOROBENZOIC ACID",
    "ITACONIC ACID ----- ----- in dioxane": "ITACONIC ACID",
    "p-CUMYLPHENOL '212.291": "p-CUMYLPHENOL",
    "1,3,5,7-CYCLOCTATETRAENE": "1,3,5,7-CYCLOOCTATETRAENE",
    "1-FLUOPROPANE": "1-FLUOROPROPANE",
    "2,2-DIMETHYPROPANE": "2,2-DIMETHYLPROPANE",
    "2,6-DIETHYLHANILINE": "2,6-DIETHYLANILINE",
    "2-FLUOPROPANE": "2-FLUOROPROPANE",
    "3-METHOXPROPIONITRILE": "3-METHOXYPROPIONITRILE",
    "24DIMETHYL3ISOPROPYLPENTANE": "2,4-DIMETHYL-3-ISOPROPYLPENTANE",
    "3ETHYL-224TRIMETHYLPENTANE": "3-ETHYL-2,2,4-TRIMETHYLPENTANE",
    "ALLYAMINE": "ALLYLAMINE",
    "DIETHYLENE GLYCOL MONOBUTYL EHTER": "DIETHYLENE GLYCOL MONOBUTYL ETHER",
    "N,N-DIETHYHLANILINE": "N,N-DIETHYLANILINE",
    "N,N-DIETHYLHANILINE": "N,N-DIETHYLANILINE",
    "N,N-DIETHYLHLANILINE": "N,N-DIETHYLANILINE",
    "N,N-DIETYHLANILINE": "N,N-DIETHYLANILINE",
    "N,N-DIETYLHLANILINE": "N,N-DIETHYLANILINE",
}

# Appendix / synonym index names that are worse OCR than the tables — fix the index.
APPENDIX_NAME_FIXES: dict[str, str] = {
    "2,4-DICHLOROPHENOXACETIC ACID": "2,4-DICHLOROPHENOXYACETIC ACID",
    "8-HYDROXQYUINOLINE": "8-HYDROXYQUINOLINE",
    "8-HYDROXQYQUINOLINE": "8-HYDROXYQUINOLINE",
    "CHLORBENZENE": "CHLOROBENZENE",
    "DUODECANE": "DODECANE",
    "LUTECIUM": "LUTETIUM",
    "HEPTADECYL-PROPYL-SULFIDE ----- CSes CARBON SELENOSULFIDE": "CARBON SELENOSULFIDE",
    "N,N-DIETYHLANILINE": "N,N-DIETHYLANILINE",
}


def correct_name(name: str | None) -> str | None:
    """Return the appendix spelling when ``name`` is a known table OCR typo; else unchanged."""
    if name is None:
        return None
    text = str(name).strip()
    return NAME_TYPO_FIXES.get(text, text)


def correct_appendix_name(name: str | None) -> str | None:
    """Return a cleaned appendix/synonym label when the index OCR is worse than the tables."""
    if name is None:
        return None
    text = str(name).strip()
    return APPENDIX_NAME_FIXES.get(text, text)


# Table name → formula when the row has no CAS (verified PubChem name lookup).
# Prefer CAS-keyed ``APPENDIX_FORMULA_FIXES`` when a CAS is known.
NAME_FORMULA_FIXES: dict[str, str] = {
    "3,5-DICHLOROANILINE": "C6H5Cl2N",
    "3-(3-CHLORO-4-METHYLPHENYL)-1-METHYLUREA": "C9H11ClN2O",
    "3-(TRICHLOROMETHYL)ANILINE": "C7H6Cl3N",
    "ALACHLOR": "C14H20ClNO2",
    "BORINE CARBONYL": "BH3CO",
    "ASULAM": "C8H10N2O4S",
    "BUTYRANILIDE": "C10H13NO",
    "CARBARYL": "C12H11NO2",
    "CARBON SELENOSULFIDE": "CSSe",
    "CHLORAMBEN": "C7H5Cl2NO2",
    "CHLORPYRIFOS-METHYL": "C7H7Cl3NO3PS",
    "COLUMBIUM FLUORIDE": "F5Nb",
    "DIIIODOMETHANE": "CH2I2",
    "DIIODOMETHANE": "CH2I2",
    "DIMETHOATE": "C5H12NO3PS2",
    "FLUCHLORALIN": "C12H13ClF3N3O4",
    "FLUOMETURON": "C10H11F3N2O",
    "1-METHYL-3-PHENYLUREA": "C8H10N2O",
    "METHOXYCHLOR": "C16H15Cl3O2",
    "METHYL PARATHION": "C8H10NO5PS",
    "METHYL-CHLOROPYRIFOS": "C7H7Cl3NO3PS",
    "MONOLINURON": "C9H11ClN2O2",
    "MONOINURON": "C9H11ClN2O2",
    "NIOBIUM(V) FLUORIDE": "F5Nb",
    "PARAQUAT": "C12H14N2+2",
    "PENTACHLOROPHENOL": "C6HCl5O",
    "PHENYLUREA": "C7H8N2O",
    "(3-TRICLOROMETHYL)PHENYLUREA": "C8H7Cl3N2O",
    "(3-TRIFLOROMETHYL)PHENYLUREA": "C8H7Cl3N2O",
    "(3-CHLORO-4-METHOXYLPHENYL)UREA": "C8H9ClN2O2",
    "1-(3-CHLORO-4-METHOXYPHENYL)UREA": "C8H9ClN2O2",
    "(3-METHYL-4-FLOROPHENYL)UREA": "C8H9FN2O",
    "1-(4-FLUORO-3-METHYLPHENYL)UREA": "C8H9FN2O",
    "PENTABORANE": "B5H9",
    "TRIFLURALIN": "C13H16F3N3O4",
}


def correct_name_formula(name: str | None, formula: str | None) -> str | None:
    """Return a curated formula for a table name when known; else unchanged."""
    if formula is None:
        return None
    if name is None:
        return formula
    return NAME_FORMULA_FIXES.get(str(name).strip(), formula)


# Formula overrides keyed by the **corrected** CAS (after ``correct_cas``).
# Applied on appendix index rows and on table rows that carry CAS_No.
# Prefer ``clean_formula`` pattern rules when possible; keep CAS entries for
# rebuild durability and for cases the name-gated OCR path cannot see.
APPENDIX_FORMULA_FIXES: dict[str, str] = {
    "92-52-4": "C12H10",      # biphenyl (OCR C12H1O)
    "75-11-6": "CH2I2",       # diiodomethane (table OCR CHI2I)
    "5951-19-9": "CSSe",      # carbon sulfide selenide (OCR CSeS / CseS)
    "7783-68-8": "F5Nb",      # niobium(V) fluoride (obsolete CbF5)
    "10043-01-3": "Al2(SO4)3",  # aluminum sulfate (conventional; not expanded Al2S3O12)
    # Table 27-1 / appendix OCR glyph fixes (PubChem-confirmed)
    "999-61-1": "C6H10O3",       # 2-hydroxypropyl acrylate (C6H1OO3)
    "133-06-2": "C9H8Cl3NO2S",   # captan (C9H8CI3NO2S)
    "2921-88-2": "C9H11Cl3NO3PS",  # chlorpyrifos (C9H11C3NO3PS)
    "2234-13-1": "C10Cl8",       # octachloronaphthalene (Cl0Cl8)
    "143-50-0": "C10Cl10O",      # chlordecone (Cl0Cl10O)
    "1321-65-9": "C10H5Cl3",     # trichloronaphthalene (Cl0H5Cl3)
    "76-44-8": "C10H5Cl7",       # heptachlor (Cl0H5Cl7)
    "1024-57-3": "C10H5Cl7O",    # heptachlor epoxide (ClOH5Cl7O)
    "57-74-9": "C10H6Cl8",       # chlordane (Cl0H6Cl8)
    "2425-06-1": "C10H9Cl4NO2S",  # captafol (C10H9CI4NO2S)
    "31242-93-0": "C12H4Cl6O",   # chlorinated diphenyl oxide (Cl2H4Cl6O)
    "60-57-1": "C12H8Cl6O",      # dieldrin (C12H8CI60)
    "72-20-8": "C12H8Cl6O",      # endrin (C12H8CI60)
    "101-14-4": "C13H12Cl2N2",   # 4,4'-methylene bis(2-chloroaniline) (Cl3H12Cl2N2)
    "72-43-5": "C16H15Cl3O2",    # methoxychlor (Cl6H15Cl3O2)
    # Verified unmatched name-lookup formula disagrees (table 20-1 / pesticides)
    "626-43-7": "C6H5Cl2N",       # 3,5-dichloroaniline
    "22175-22-0": "C9H11ClN2O",   # 3-(3-chloro-4-methylphenyl)-1-methylurea
    "15972-60-8": "C14H20ClNO2",  # alachlor
    "3337-71-1": "C8H10N2O4S",    # asulam
    "1129-50-6": "C10H13NO",      # butyranilide
    "63-25-2": "C12H11NO2",       # carbaryl (N02 OCR)
    "133-90-4": "C7H5Cl2NO2",     # chloramben free acid
    "60-51-5": "C5H12NO3PS2",     # dimethoate
    "298-00-0": "C8H10NO5PS",     # methyl parathion
    "4685-14-7": "C12H14N2+2",    # paraquat dication
    "87-86-5": "C6HCl5O",         # pentachlorophenol
    "64-10-8": "C7H8N2O",         # phenylurea
    "1582-09-8": "C13H16F3N3O4",  # trifluralin
    "70419-06-6": "C9H20O",      # 2-nonanol (C9H2OO)
    # User formula decisions (table-only / API conflicts)
    "62-74-8": "C2H2FNaO2",      # sodium fluoroacetate (API)
    "16842-03-8": "C4HO4Co",     # cobalt hydrocarbonyl (Yaws; display HCo(CO)4 via compound_data)
    "8022-00-2": "C6H15O3PS2",   # methyl demeton monomer
    "1189-85-1": "C8H18CrO4",    # di-tert-butyl chromate
    "3383-96-8": "C16H20O6P2S3",  # temephos (API; Yaws dropped two S)
    # Unparseable OCR leftovers (user-accepted)
    "12075-68-2": "C6H15Al2Cl3",  # aluminum sesquichloride (drop trailing ETHYL)
    "14096-82-3": "Co(CO)3NO",    # cobalt nitrosyl tricarbonyl (Conc3O4)
    "16962-07-5": "AlB3H12",      # aluminum borohydride (ALB3H12); display Al(BH4)3 in compound_data
    "20816-12-0": "OsO4",         # osmium tetroxide (Oso4)
    "3811-73-2": "C5H4NNaOS",     # sodium pyrithione (C5H5NOSna → API/CD)
    "999-97-3": "C6H19NSi2",      # hexamethyldisilazane (C6H19Nsi2)
    # Accepted CD-hill mismatch fixes (Yaws-side)
    "1002-84-2": "C15H30O2",  # CD-hill mismatch accepted
    "10043-35-3": "H3BO3",  # CD-hill mismatch accepted
    "104-72-3": "C16H26",  # CD-hill mismatch accepted
    "1067-20-5": "C9H20",  # CD-hill mismatch accepted
    "1068-19-5": "C9H20",  # CD-hill mismatch accepted
    "1068-87-7": "C9H20",  # CD-hill mismatch accepted
    "1069-53-0": "C9H20",  # CD-hill mismatch accepted
    "107-08-4": "C3H7I",  # CD-hill mismatch accepted
    "1070-87-7": "C9H20",  # CD-hill mismatch accepted
    "1071-26-7": "C9H20",  # CD-hill mismatch accepted
    "1072-05-5": "C9H20",  # CD-hill mismatch accepted
    "1078-71-3": "C13H20",  # CD-hill mismatch accepted
    "111-84-2": "C9H20",  # CD-hill mismatch accepted
    "112-72-1": "C14H30O",  # CD-hill mismatch accepted
    "112-92-5": "C18H38O",  # CD-hill mismatch accepted
    "1186-53-4": "C9H20",  # CD-hill mismatch accepted
    "122-39-4": "C12H11N",  # CD-hill mismatch accepted
    "123-01-3": "C18H30",  # CD-hill mismatch accepted
    "129-00-0": "C16H10",  # CD-hill mismatch accepted
    "1300-73-8": "C48H66N6",  # CD-hill mismatch accepted
    "1304-82-1": "Bi4Te6",  # CD-hill mismatch accepted
    "1314-24-5": "P2O3",  # CD-hill mismatch accepted
    "1314-80-3": "P2S5",  # CD-hill mismatch accepted
    "1327-53-3": "As2O3",  # CD-hill mismatch accepted
    "13360-61-7": "C15H30",  # CD-hill mismatch accepted
    "1344-28-1": "Al2O3",  # CD-hill mismatch accepted
    "1344-95-2": "CaH6O8Si2",  # calcium silicate umbrella CAS; PubChem hydrate (not CaSiO3/Ca2SiO4)
    "13465-73-1": "SiBr",  # CD-hill mismatch accepted
    "13537-33-2": "SiF",  # CD-hill mismatch accepted
    "144-62-7": "C2H2O4",  # CD-hill mismatch accepted
    "1454-84-8": "C19H40O",  # CD-hill mismatch accepted
    "1454-85-9": "C17H36O",  # CD-hill mismatch accepted
    "156-62-7": "CaCN2H2",  # CD-hill mismatch accepted
    "15869-80-4": "C9H20",  # CD-hill mismatch accepted
    "15869-96-2": "C10H22",  # CD-hill mismatch accepted
    "1603-84-5": "CSeO",  # CD-hill mismatch accepted
    "16747-25-4": "C9H20",  # CD-hill mismatch accepted
    "16747-26-5": "C9H20",  # CD-hill mismatch accepted
    "16747-28-7": "C9H20",  # CD-hill mismatch accepted
    "16747-30-1": "C9H20",  # CD-hill mismatch accepted
    "16747-31-2": "C9H20",  # CD-hill mismatch accepted
    "16747-32-3": "C9H20",  # CD-hill mismatch accepted
    "16747-33-4": "C9H20",  # CD-hill mismatch accepted
    "16747-38-9": "C9H20",  # CD-hill mismatch accepted
    "16752-60-6": "P4O10",  # CD-hill mismatch accepted
    "1678-93-9": "C10H20",  # CD-hill mismatch accepted
    "16789-46-1": "C9H20",  # CD-hill mismatch accepted
    "17702-41-9": "B10",  # CD-hill mismatch accepted
    "1795-18-2": "C20H40",  # CD-hill mismatch accepted
    "1795-21-7": "C15H30",  # CD-hill mismatch accepted
    "18283-93-7": "B4",  # CD-hill mismatch accepted
    "18433-84-6": "B5H11",  # CD-hill mismatch accepted
    "19624-22-7": "B5H9",  # pentaborane; reject wrong API / restore from truncated CD B5
    "206-44-0": "C16H10",  # CD-hill mismatch accepted
    "21651-19-4": "SnO",  # CD-hill mismatch accepted
    "2213-23-2": "C9H20",  # CD-hill mismatch accepted
    "2216-30-0": "C9H20",  # CD-hill mismatch accepted
    "2216-32-2": "C9H20",  # CD-hill mismatch accepted
    "2216-33-3": "C9H20",  # CD-hill mismatch accepted
    "2216-34-4": "C9H20",  # CD-hill mismatch accepted
    "2243-98-3": "C11H20",  # CD-hill mismatch accepted
    "2456-27-1": "C18H38O",  # CD-hill mismatch accepted
    "24567-53-1": "PH2Cl",  # CD-hill mismatch accepted
    "25265-71-8": "C12H28O6",  # CD-hill mismatch accepted
    "25639-42-3": "C7H10O",  # CD-hill mismatch accepted
    "2876-53-1": "C16H20",  # CD-hill mismatch accepted
    "2883-02-5": "C15H30",  # CD-hill mismatch accepted
    "3074-71-3": "C9H20",  # CD-hill mismatch accepted
    "3074-75-7": "C9H20",  # CD-hill mismatch accepted
    "3074-76-8": "C9H20",  # CD-hill mismatch accepted
    "3074-77-9": "C9H20",  # CD-hill mismatch accepted
    "3221-61-2": "C9H20",  # CD-hill mismatch accepted
    "3452-07-1": "C20H40",  # CD-hill mismatch accepted
    "3522-94-9": "C9H20",  # CD-hill mismatch accepted
    "355-25-9": "C4F10",  # CD-hill mismatch accepted
    "36653-82-4": "C16H34O",  # CD-hill mismatch accepted
    "3741-00-2": "C10H20",  # CD-hill mismatch accepted
    "460-19-5": "C2N2",  # CD-hill mismatch accepted
    "4669-01-6": "C20H40",  # CD-hill mismatch accepted
    "507-09-5": "C2H4OS",  # CD-hill mismatch accepted
    "507-16-4": "SOBr2",  # CD-hill mismatch accepted
    "509-14-8": "CN4O8",  # CD-hill mismatch accepted
    "514-10-3": "C20H30O2",  # CD-hill mismatch accepted
    "556-56-9": "C3H5I",  # CD-hill mismatch accepted
    "558-17-8": "C4H9I",  # CD-hill mismatch accepted
    "56-38-2": "C10H14NO5PS",  # CD-hill mismatch accepted
    "57-13-6": "CH4N2O",  # CD-hill mismatch accepted
    "583-60-8": "C7H12O",  # CD-hill mismatch accepted
    "5951-19-9": "CSeS",  # CD-hill mismatch accepted
    "598-29-8": "C3H6I2",  # CD-hill mismatch accepted
    "604-88-6": "C18H30",  # CD-hill mismatch accepted
    "624-83-9": "C2H3NO",  # CD-hill mismatch accepted
    "628-21-7": "C4H8I2",  # CD-hill mismatch accepted
    "629-59-4": "C14H30",  # CD-hill mismatch accepted
    "629-74-3": "C16H30",  # CD-hill mismatch accepted
    "629-78-7": "C17H36",  # CD-hill mismatch accepted
    "629-89-0": "C18H34",  # CD-hill mismatch accepted
    "629-92-5": "C19H40",  # CD-hill mismatch accepted
    "632-51-9": "C26H20",  # CD-hill mismatch accepted
    "64-18-6": "CH2O2",  # CD-hill mismatch accepted
    "6765-39-5": "C17H34",  # CD-hill mismatch accepted
    "680-31-9": "C6H18N3OP",  # CD-hill mismatch accepted
    "7154-79-2": "C9H20",  # CD-hill mismatch accepted
    "7440-03-1": "Nb",  # CD-hill mismatch accepted
    "7440-54-2": "Gd",  # CD-hill mismatch accepted
    "7440-55-3": "Ga",  # CD-hill mismatch accepted
    "7440-69-9": "Bi",  # CD-hill mismatch accepted
    "7440-70-2": "Ca",  # CD-hill mismatch accepted
    "75-30-9": "C3H7I",  # CD-hill mismatch accepted
    "75-75-2": "CH4O3S",  # CD-hill mismatch accepted
    "7727-21-1": "K2S2O8",  # CD-hill mismatch accepted
    "7773-06-0": "N2H6SO3",  # CD-hill mismatch accepted
    "7782-79-8": "HN3",  # CD-hill mismatch accepted
    "7787-53-3": "BeI2",  # CD-hill mismatch accepted
    "7787-58-8": "BiBr3",  # CD-hill mismatch accepted
    "7787-60-2": "BiCl3",  # CD-hill mismatch accepted
    "7789-30-2": "BrF5",  # CD-hill mismatch accepted
    "7789-57-3": "SiBr3",  # CD-hill mismatch accepted
    "7790-29-6": "RbI",  # CD-hill mismatch accepted
    "79-43-6": "C2H2Cl2O2",  # CD-hill mismatch accepted
    "80-05-7": "C15H16O2",  # CD-hill mismatch accepted
    "84-66-2": "C12H14O4",  # CD-hill mismatch accepted
    "84-74-2": "C16H22O4",  # CD-hill mismatch accepted
    "872-05-9": "C10H20",  # CD-hill mismatch accepted
    "90-13-1": "C10H7Cl",  # CD-hill mismatch accepted
    "921-47-1": "C9H20",  # CD-hill mismatch accepted
    "922-28-1": "C9H20",  # CD-hill mismatch accepted
    "926-82-9": "C9H20",  # CD-hill mismatch accepted
}


def correct_appendix_formula(cas: str | None, formula: str | None) -> str | None:
    """Return a curated formula for ``cas`` when known; else unchanged.

    Name kept for appendix call sites; also used for table rows with CAS_No.
    """
    if formula is None:
        return None
    key = correct_cas(cas) or (str(cas).strip() if cas else "")
    return APPENDIX_FORMULA_FIXES.get(key, formula)
