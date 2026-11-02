"""
compound_data.constants.book_gas_source — Hand-moved book gas equations the build must keep.

These rows came from local gas compound files into ``shared/processed/compound-data``. They have no
chemicals table parser, so they live in ``shared/sources/book-gas-equations.json`` and are merged
like the transport parameters. File keys stay ``perry7Gas``, ``borgnakkeGas``, ``yaws1999Gas``,
``incroperaGas`` and ``szargutGas``.

Spec: docs/scripts/COMPOUND_DATA_SPEC.md
Refs: docs/REFERENCES.md  [1] Szargut, [2] Incropera, [4] Perry7, [5] Borgnakke, [6] Yaws1999
"""
from __future__ import annotations

from chemicals_tables.table_spec import TableSpec
from references import RefKey

BOOK_GAS_FILE = "shared/sources/book-gas-equations.json"

BOOK_GAS_TABLES: dict[str, TableSpec] = {
    "perry7Gas": TableSpec("Perry's Chemical Engineers' Handbook 7th ed.", "perry7Gas", BOOK_GAS_FILE, RefKey.Perry7),
    "borgnakkeGas": TableSpec(
        "Borgnakke & Sonntag — Thermodynamic and Transport Properties", "borgnakkeGas", BOOK_GAS_FILE, RefKey.Borgnakke,
    ),
    "yaws1999Gas": TableSpec("Yaws — Chemical Properties Handbook", "yaws1999Gas", BOOK_GAS_FILE, RefKey.Yaws1999),
    "incroperaGas": TableSpec(
        "Incropera et al. — Fundamentals of Heat and Mass Transfer 6th ed.", "incroperaGas", BOOK_GAS_FILE,
        RefKey.Incropera,
    ),
    "szargutGas": TableSpec("Szargut — Termodynamika Techniczna", "szargutGas", BOOK_GAS_FILE, RefKey.Szargut),
}
"""Table id in the file (= file key) → spec."""
