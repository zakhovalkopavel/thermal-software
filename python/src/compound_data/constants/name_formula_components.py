"""
compound_data.constants.name_formula_components — Lexicons for English name → formula.

Cations: every element H–Cf (plus ammonium / uranyl).
Anions: ``INORGANIC_ANIONS`` (legacy + common salts) and ``ORGANIC_ANIONS``
(carboxylates, sulfonates, …); ``ANIONS`` is their concatenation for the parser.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class Cation:
    """Metal or complex cation stem in a systematic name."""

    symbol: str
    names: tuple[str, ...]
    default_valence: int | None  # None → Roman numeral required
    valences: tuple[int, ...]


@dataclass(frozen=True)
class Anion:
    """Anion family: charge and formula fragment (no outer count)."""

    family: str
    names: tuple[str, ...]
    fragment: str  # e.g. Cl, SO4, O, C2H3O2
    charge: int  # negative
    # Special binary builders: carbide / boride stoichiometry.
    binary_rule: str | None = None


HYDRATE_PREFIXES: dict[str, int] = {
    "monohydrate": 1,
    "dihydrate": 2,
    "trihydrate": 3,
    "tetrahydrate": 4,
    "pentahydrate": 5,
    "hexahydrate": 6,
    "heptahydrate": 7,
    "octahydrate": 8,
    "nonahydrate": 9,
    "decahydrate": 10,
    "undecahydrate": 11,
    "dodecahydrate": 12,
    "octadecahydrate": 18,
}

MULTIPLICATIVE_PREFIXES: dict[str, int] = {
    "mono": 1,
    "di": 2,
    "tri": 3,
    "tetra": 4,
    "penta": 5,
    "hexa": 6,
    "hepta": 7,
    "octa": 8,
    "nona": 9,
    "deca": 10,
    "sesqui": 3,  # sesquioxide → M2O3
}

ROMAN_VALENCE: dict[str, int] = {
    "i": 1, "ii": 2, "iii": 3, "iv": 4, "v": 5, "vi": 6, "vii": 7, "viii": 8,
}

# ---------------------------------------------------------------------------
# Cations — elements H (Z=1) through Cf (Z=98), then complex cations.
# default_valence None ⇒ Roman numeral required when parsing salts.
# ---------------------------------------------------------------------------
CATIONS: tuple[Cation, ...] = (
    # Period 1
    Cation("H", ("hydrogen",), 1, (1,)),
    # Period 2
    Cation("He", ("helium",), None, ()),
    Cation("Li", ("lithium",), 1, (1,)),
    Cation("Be", ("beryllium",), 2, (2,)),
    Cation("B", ("boron",), 3, (3,)),
    Cation("C", ("carbon",), 4, (2, 4)),
    Cation("N", ("nitrogen",), None, (3, 5)),
    Cation("O", ("oxygen",), None, (2,)),
    Cation("F", ("fluorine",), None, (1,)),
    Cation("Ne", ("neon",), None, ()),
    # Period 3
    Cation("Na", ("sodium",), 1, (1,)),
    Cation("Mg", ("magnesium",), 2, (2,)),
    Cation("Al", ("aluminum", "aluminium"), 3, (3,)),
    Cation("Si", ("silicon",), 4, (4,)),
    Cation("P", ("phosphorus",), None, (3, 5)),
    Cation("S", ("sulfur", "sulphur"), None, (2, 4, 6)),
    Cation("Cl", ("chlorine",), None, (1, 3, 5, 7)),
    Cation("Ar", ("argon",), None, ()),
    # Period 4
    Cation("K", ("potassium",), 1, (1,)),
    Cation("Ca", ("calcium",), 2, (2,)),
    Cation("Sc", ("scandium",), 3, (3,)),
    Cation("Ti", ("titanium",), 4, (3, 4)),
    Cation("V", ("vanadium",), None, (2, 3, 4, 5)),
    Cation("Cr", ("chromium",), None, (2, 3, 6)),
    Cation("Mn", ("manganese",), None, (2, 3, 4, 6, 7)),
    Cation("Fe", ("iron",), None, (2, 3)),
    Cation("Co", ("cobalt",), None, (2, 3)),
    Cation("Ni", ("nickel",), 2, (2, 3)),
    Cation("Cu", ("copper",), None, (1, 2)),
    Cation("Zn", ("zinc",), 2, (2,)),
    Cation("Ga", ("gallium",), 3, (3,)),
    Cation("Ge", ("germanium",), 4, (2, 4)),
    Cation("As", ("arsenic",), None, (3, 5)),
    Cation("Se", ("selenium",), None, (2, 4, 6)),
    Cation("Br", ("bromine",), None, (1, 3, 5)),
    Cation("Kr", ("krypton",), None, ()),
    # Period 5
    Cation("Rb", ("rubidium",), 1, (1,)),
    Cation("Sr", ("strontium",), 2, (2,)),
    Cation("Y", ("yttrium",), 3, (3,)),
    Cation("Zr", ("zirconium",), 4, (4,)),
    Cation("Nb", ("niobium", "columbium"), 5, (3, 4, 5)),
    Cation("Mo", ("molybdenum",), None, (4, 5, 6)),
    Cation("Tc", ("technetium",), None, (4, 7)),
    Cation("Ru", ("ruthenium",), None, (3, 4, 8)),
    Cation("Rh", ("rhodium",), None, (3, 4)),
    Cation("Pd", ("palladium",), None, (2, 4)),
    Cation("Ag", ("silver",), 1, (1, 2)),
    Cation("Cd", ("cadmium",), 2, (2,)),
    Cation("In", ("indium",), 3, (1, 3)),
    Cation("Sn", ("tin",), None, (2, 4)),
    Cation("Sb", ("antimony",), None, (3, 5)),
    Cation("Te", ("tellurium",), None, (2, 4, 6)),
    Cation("I", ("iodine",), None, (1, 3, 5, 7)),
    Cation("Xe", ("xenon",), None, (2, 4, 6)),
    # Period 6
    Cation("Cs", ("cesium", "caesium"), 1, (1,)),
    Cation("Ba", ("barium",), 2, (2,)),
    Cation("La", ("lanthanum",), 3, (3,)),
    Cation("Ce", ("cerium",), None, (3, 4)),
    Cation("Pr", ("praseodymium",), 3, (3, 4)),
    Cation("Nd", ("neodymium",), 3, (3,)),
    Cation("Pm", ("promethium",), 3, (3,)),
    Cation("Sm", ("samarium",), 3, (2, 3)),
    Cation("Eu", ("europium",), None, (2, 3)),
    Cation("Gd", ("gadolinium",), 3, (3,)),
    Cation("Tb", ("terbium",), 3, (3, 4)),
    Cation("Dy", ("dysprosium",), 3, (3,)),
    Cation("Ho", ("holmium",), 3, (3,)),
    Cation("Er", ("erbium",), 3, (3,)),
    Cation("Tm", ("thulium",), 3, (3,)),
    Cation("Yb", ("ytterbium",), None, (2, 3)),
    Cation("Lu", ("lutetium",), 3, (3,)),
    Cation("Hf", ("hafnium",), 4, (4,)),
    Cation("Ta", ("tantalum",), 5, (5,)),
    Cation("W", ("tungsten", "wolfram"), None, (4, 5, 6)),
    Cation("Re", ("rhenium",), None, (4, 6, 7)),
    Cation("Os", ("osmium",), None, (4, 6, 8)),
    Cation("Ir", ("iridium",), None, (3, 4)),
    Cation("Pt", ("platinum",), None, (2, 4)),
    Cation("Au", ("gold",), None, (1, 3)),
    Cation("Hg", ("mercury",), None, (1, 2)),
    Cation("Tl", ("thallium",), None, (1, 3)),
    Cation("Pb", ("lead",), None, (2, 4)),
    Cation("Bi", ("bismuth",), 3, (3, 5)),
    Cation("Po", ("polonium",), None, (2, 4)),
    Cation("At", ("astatine",), None, (1,)),
    Cation("Rn", ("radon",), None, ()),
    # Period 7 through Cf (Z=98)
    Cation("Fr", ("francium",), 1, (1,)),
    Cation("Ra", ("radium",), 2, (2,)),
    Cation("Ac", ("actinium",), 3, (3,)),
    Cation("Th", ("thorium",), 4, (4,)),
    Cation("Pa", ("protactinium",), 5, (4, 5)),
    Cation("U", ("uranium",), None, (3, 4, 5, 6)),
    Cation("Np", ("neptunium",), None, (4, 5, 6)),
    Cation("Pu", ("plutonium",), None, (3, 4, 5, 6)),
    Cation("Am", ("americium",), None, (3, 4)),
    Cation("Cm", ("curium",), 3, (3, 4)),
    Cation("Bk", ("berkelium",), 3, (3, 4)),
    Cation("Cf", ("californium",), 3, (3, 4)),
    # Complex cations (not bare elements)
    Cation("NH4", ("ammonium",), 1, (1,)),
    Cation("UO2", ("uranyl",), 2, (2,)),
)

# ---------------------------------------------------------------------------
# Inorganic anions — legacy (processor_config + compound_names) + common salts.
# Longer / more specific names must appear before shorter overlapping ones.
# ---------------------------------------------------------------------------
INORGANIC_ANIONS: tuple[Anion, ...] = (
    # Legacy phosphate family
    Anion("hexametaphosphate", ("hexametaphosphate",), "P6O18", -6),
    Anion("trimetaphosphate", ("trimetaphosphate",), "P3O9", -3),
    Anion("pyrophosphate", ("pyrophosphate",), "P2O7", -4),
    Anion("metaphosphate", ("metaphosphate",), "PO3", -1),
    Anion("polyphosphate", ("polyphosphate",), "PO3", -1),
    Anion("phosphate", ("phosphate", "orthophosphate"), "PO4", -3),
    Anion("hydrogenphosphate", ("hydrogenphosphate", "hydrogen phosphate"), "HPO4", -2),
    Anion("dihydrogenphosphate", ("dihydrogenphosphate", "dihydrogen phosphate"), "H2PO4", -1),
    Anion("ferrocyanide", ("ferrocyanide",), "Fe(CN)6", -4),
    # Legacy sulfate / sulfur oxyanions
    Anion("pyrosulfate", ("pyrosulfate", "pyrosulphate"), "S2O7", -2),
    Anion("thiosulfate", ("thiosulfate", "thiosulphate"), "S2O3", -2),
    Anion("persulfate", ("persulfate", "persulphate", "peroxydisulfate"), "S2O8", -2),
    Anion(
        "hydrogen sulfate",
        ("hydrogen sulfate", "hydrogen sulphate", "bisulfate", "bisulphate"),
        "HSO4",
        -1,
    ),
    Anion("sulfate", ("sulfate", "sulphate"), "SO4", -2),
    Anion("sulfite", ("sulfite", "sulphite"), "SO3", -2),
    Anion("disulfide", ("disulfide", "disulphide"), "S2", -2),
    Anion("sulfide", ("sulfide", "sulphide"), "S", -2),
    # Legacy borates / borides
    Anion("tetraborate", ("tetraborate",), "B4O7", -2),
    Anion("metaborate", ("metaborate",), "BO2", -1),
    Anion("borate", ("borate", "orthoborate"), "BO3", -3),
    Anion("hexaboride", ("hexaboride",), "B6", -2, binary_rule="boride"),
    Anion("diboride", ("diboride",), "B2", -2, binary_rule="boride"),
    Anion("boride", ("boride",), "B", -3, binary_rule="boride"),
    # Carbonate / nitrogen
    Anion("bicarbonate", ("bicarbonate", "hydrogen carbonate"), "HCO3", -1),
    Anion("carbonate", ("carbonate",), "CO3", -2),
    Anion("nitrate", ("nitrate",), "NO3", -1),
    Anion("nitrite", ("nitrite",), "NO2", -1),
    Anion("nitride", ("nitride",), "N", -3),
    # Carbide / oxide / hydride / halide
    Anion("carbide", ("carbide",), "C", -4, binary_rule="carbide"),
    Anion(
        "oxide",
        ("oxide", "dioxide", "trioxide", "tetroxide", "pentoxide", "monoxide", "sesquioxide"),
        "O",
        -2,
    ),
    Anion("peroxide", ("peroxide",), "O2", -2),
    Anion("superoxide", ("superoxide",), "O2", -1),
    Anion("hydroxide", ("hydroxide",), "OH", -1),
    Anion("hydride", ("hydride",), "H", -1),
    Anion("chloride", ("chloride",), "Cl", -1),
    Anion("fluoride", ("fluoride",), "F", -1),
    Anion("bromide", ("bromide",), "Br", -1),
    Anion("iodide", ("iodide",), "I", -1),
    # Silicates / aluminate
    Anion("orthosilicate", ("orthosilicate",), "SiO4", -4),
    Anion("metasilicate", ("metasilicate",), "SiO3", -2),
    Anion("silicate", ("silicate",), "SiO3", -2),
    Anion("aluminate", ("aluminate", "metaaluminate"), "AlO2", -1),
    # Halogen oxyanions
    Anion("perchlorate", ("perchlorate",), "ClO4", -1),
    Anion("chlorate", ("chlorate",), "ClO3", -1),
    Anion("chlorite", ("chlorite",), "ClO2", -1),
    Anion("hypochlorite", ("hypochlorite",), "ClO", -1),
    Anion("perbromate", ("perbromate",), "BrO4", -1),
    Anion("bromate", ("bromate",), "BrO3", -1),
    Anion("bromite", ("bromite",), "BrO2", -1),
    Anion("hypobromite", ("hypobromite",), "BrO", -1),
    Anion("periodate", ("periodate",), "IO4", -1),
    Anion("iodate", ("iodate",), "IO3", -1),
    Anion("iodite", ("iodite",), "IO2", -1),
    Anion("hypoiodite", ("hypoiodite",), "IO", -1),
    # Transition-metal oxyanions
    Anion("dichromate", ("dichromate",), "Cr2O7", -2),
    Anion("chromate", ("chromate",), "CrO4", -2),
    Anion("permanganate", ("permanganate",), "MnO4", -1),
    Anion("manganate", ("manganate",), "MnO4", -2),
    Anion("molybdate", ("molybdate",), "MoO4", -2),
    Anion("tungstate", ("tungstate", "wolframate"), "WO4", -2),
    Anion("vanadate", ("vanadate", "orthovanadate"), "VO4", -3),
    Anion("metavanadate", ("metavanadate",), "VO3", -1),
    Anion("niobate", ("niobate",), "NbO3", -1),
    Anion("tantalate", ("tantalate",), "TaO3", -1),
    Anion("titanate", ("titanate",), "TiO3", -2),
    Anion("zirconate", ("zirconate",), "ZrO3", -2),
    Anion("ferrate", ("ferrate",), "FeO4", -2),
    Anion("cobaltate", ("cobaltate",), "CoO2", -1),
    # Pnictogen / chalcogen
    Anion("arsenate", ("arsenate",), "AsO4", -3),
    Anion("arsenite", ("arsenite",), "AsO3", -3),
    Anion("arsenide", ("arsenide",), "As", -3),
    Anion("antimonate", ("antimonate",), "SbO4", -3),
    Anion("antimonide", ("antimonide",), "Sb", -3),
    Anion("bismuthate", ("bismuthate",), "BiO3", -1),
    Anion("phosphide", ("phosphide",), "P", -3),
    Anion("selenate", ("selenate",), "SeO4", -2),
    Anion("selenite", ("selenite",), "SeO3", -2),
    Anion("selenide", ("selenide",), "Se", -2),
    Anion("tellurate", ("tellurate",), "TeO4", -2),
    Anion("tellurite", ("tellurite",), "TeO3", -2),
    Anion("telluride", ("telluride",), "Te", -2),
    # Pseudohalides (treated as inorganic)
    Anion("thiocyanate", ("thiocyanate", "sulfocyanate"), "SCN", -1),
    Anion("cyanate", ("cyanate",), "OCN", -1),
    Anion("cyanide", ("cyanide",), "CN", -1),
    Anion("azide", ("azide",), "N3", -1),
)

# ---------------------------------------------------------------------------
# Organic anions — carboxylates, sulfonates, alkoxides, etc.
# ---------------------------------------------------------------------------
ORGANIC_ANIONS: tuple[Anion, ...] = (
    # Short-chain carboxylates
    Anion("trifluoroacetate", ("trifluoroacetate",), "CF3COO", -1),
    Anion("trichloroacetate", ("trichloroacetate",), "CCl3COO", -1),
    Anion("formate", ("formate",), "CHO2", -1),
    Anion("acetate", ("acetate",), "C2H3O2", -1),
    Anion("propionate", ("propionate", "propanoate"), "C3H5O2", -1),
    Anion("butyrate", ("butyrate", "butanoate"), "C4H7O2", -1),
    Anion("valerate", ("valerate", "pentanoate"), "C5H9O2", -1),
    Anion("caproate", ("caproate", "hexanoate"), "C6H11O2", -1),
    Anion("acrylate", ("acrylate", "propenoate"), "C3H3O2", -1),
    Anion("methacrylate", ("methacrylate",), "C4H5O2", -1),
    # Dicarboxylates
    Anion("oxalate", ("oxalate",), "C2O4", -2),
    Anion("malonate", ("malonate",), "C3H2O4", -2),
    Anion("succinate", ("succinate",), "C4H4O4", -2),
    Anion("glutarate", ("glutarate",), "C5H6O4", -2),
    Anion("adipate", ("adipate",), "C6H8O4", -2),
    Anion("maleate", ("maleate",), "C4H2O4", -2),
    Anion("fumarate", ("fumarate",), "C4H2O4", -2),
    Anion("phthalate", ("phthalate",), "C8H4O4", -2),
    Anion("terephthalate", ("terephthalate",), "C8H4O4", -2),
    Anion("isophthalate", ("isophthalate",), "C8H4O4", -2),
    # Hydroxy / keto acids
    Anion("glycolate", ("glycolate", "hydroxyacetate"), "C2H3O3", -1),
    Anion("lactate", ("lactate",), "C3H5O3", -1),
    Anion("pyruvate", ("pyruvate",), "C3H3O3", -1),
    Anion("malate", ("malate",), "C4H4O5", -2),
    Anion("tartrate", ("tartrate",), "C4H4O6", -2),
    Anion("citrate", ("citrate",), "C6H5O7", -3),
    Anion("gluconate", ("gluconate",), "C6H11O7", -1),
    Anion("ascorbate", ("ascorbate",), "C6H7O6", -1),
    Anion("salicylate", ("salicylate",), "C7H5O3", -1),
    # Aromatic carboxylates / phenolates
    Anion("benzoate", ("benzoate",), "C7H5O2", -1),
    Anion("picrate", ("picrate",), "C6H2N3O7", -1),
    Anion("phenolate", ("phenolate", "phenoxide"), "C6H5O", -1),
    # Fatty-acid carboxylates
    Anion("stearate", ("stearate",), "C18H35O2", -1),
    Anion("palmitate", ("palmitate",), "C16H31O2", -1),
    Anion("oleate", ("oleate",), "C18H33O2", -1),
    Anion("laurate", ("laurate",), "C12H23O2", -1),
    Anion("myristate", ("myristate",), "C14H27O2", -1),
    # Sulfonates / related
    Anion("triflate", ("triflate", "trifluoromethanesulfonate"), "CF3SO3", -1),
    Anion("mesylate", ("mesylate", "methanesulfonate"), "CH3SO3", -1),
    Anion("tosylate", ("tosylate", "p-toluenesulfonate", "toluenesulfonate"), "C7H7SO3", -1),
    Anion("besylate", ("besylate", "benzenesulfonate"), "C6H5SO3", -1),
    Anion("ethanesulfonate", ("ethanesulfonate",), "C2H5SO3", -1),
    # Alkoxides / chelates
    Anion("methoxide", ("methoxide", "methylate"), "CH3O", -1),
    Anion("ethoxide", ("ethoxide", "ethylate"), "C2H5O", -1),
    Anion("isopropoxide", ("isopropoxide", "isopropylate"), "C3H7O", -1),
    Anion("tert-butoxide", ("tert-butoxide", "t-butoxide"), "C4H9O", -1),
    Anion("acetylacetonate", ("acetylacetonate", "acac"), "C5H7O2", -1),
    Anion("edetate", ("edetate", "ethylenediaminetetraacetate"), "C10H12N2O8", -4),
)

# Combined lexicon for name → formula matching (inorganic first, then organic).
ANIONS: tuple[Anion, ...] = INORGANIC_ANIONS + ORGANIC_ANIONS

# Prefer fragments that formula_elements accepts cleanly.
ANION_FRAGMENT_OVERRIDE: dict[str, str] = {
    "acetate": "C2H3O2",
    "formate": "CHO2",
    "trifluoroacetate": "C2F3O2",
    "trichloroacetate": "C2Cl3O2",
    "mesylate": "CH3SO3",
    "triflate": "CF3SO3",
    "tosylate": "C7H7O3S",
    "besylate": "C6H5O3S",
    "ethanesulfonate": "C2H5O3S",
    "methoxide": "CH3O",
    "ethoxide": "C2H5O",
}


def components_payload() -> dict:
    """Serializable lexicon for the review ``components.json``."""
    return {
        "cations": [asdict(c) for c in CATIONS],
        "inorganicAnions": [asdict(a) for a in INORGANIC_ANIONS],
        "organicAnions": [asdict(a) for a in ORGANIC_ANIONS],
        "anions": [asdict(a) for a in ANIONS],
        "hydratePrefixes": dict(HYDRATE_PREFIXES),
        "multiplicativePrefixes": dict(MULTIPLICATIVE_PREFIXES),
        "romanValence": dict(ROMAN_VALENCE),
        "anionFragmentOverride": dict(ANION_FRAGMENT_OVERRIDE),
    }
