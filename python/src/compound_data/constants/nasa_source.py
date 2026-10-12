"""
compound_data.constants.nasa_source — NASA-7 / NASA-9 files the build links to and the ΔfH° check tolerance.

The keys written to the records (``nasa7``, ``nasa9``) are the species keys of ``NASA7_DATASET`` and
``NASA9_DATASET`` (``make nasa-parse``); ``backend/data/nasa/`` is a copy with the same keys.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [8] NASA7, [23] NASA9
"""
from __future__ import annotations

NASA7_FILE = "nasa7-origin.dat"
NASA9_FILES = ("nasa9-origin.dat", "nasa9-new.dat")  # merged in order, the later file wins (as make nasa-parse)

NASA7_DATASET = "shared/processed/NASA/nasa7.json"
NASA9_DATASET = "shared/processed/NASA/nasa9.json"

HF_TOLERANCE = 5000.0  # [J/mol] |ΔfH°(298.15) NASA − record| accepted as the same species
HF_TOLERANCE_SINGLE = 20000.0  # [J/mol] the same, for an inorganic candidate or the only candidate (old NASA-7 values)
