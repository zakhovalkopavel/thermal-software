"""
chemical_formula.constants.organic_families — Ordered SMARTS patterns of organic functional families.

A record lists every matching family; its file is the first match in this order. The order runs
from specific to general, so ethanol is an alcohol and not an alkane. Carboxylic acids include their
salts (sodium acetate, ammonium oxalate: no metal–carbon bond, so not organometallic); alkenes include
cumulenes (allene C=C=C, ketene C=C=O). ``formula_family`` relies on this order.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
"""
from __future__ import annotations

UNCLASSIFIED = "unclassified"
"""Folder of organic compounds that match no family (or have no SMILES)."""

ORGANIC_FAMILIES: dict[str, str] = {
    "carboxylic-acids": "[CX3](=O)[OX2H1,OX1-]",
    "esters":           "[CX3](=O)[OX2H0][#6]",
    "amides":           "[NX3][CX3](=[OX1])",
    "nitriles":         "[NX1]#[CX2]",
    "nitro":            "[$([NX3](=O)=O),$([NX3+](=O)[O-])]",
    "aldehydes":        "[CX3;!H0](=O)",
    "ketones":          "[#6][CX3](=O)[#6]",
    "phenols":          "[OX2H][c]",
    "alcohols":         "[OX2H][CX4]",
    "amines":           "[NX3;!$(N-C=[O,N,S]);!$(N-[N,O]);!$(N=*)][#6]",
    "ethers":           "[OD2]([#6])[#6]",
    "sulfur":           "[#16]",
    "organosilicon":    "[Si]",
    "organometallic":   "[!#1;!#5;!#6;!#7;!#8;!#9;!#14;!#15;!#16;!#17;!#35;!#53]",
    "halogenated":      "[F,Cl,Br,I]",
    "aromatics":        "a",
    "alkynes":          "[CX2]#[CX2]",
    "alkenes":          "[CX3]=[CX2,CX3]",
    "alkanes":          "[CX4]",
}
