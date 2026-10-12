"""Shared constants, helpers and fixtures for chemicals_tables and compound_data tests.

The conftest of each test folder imports the fixtures (``chem``, ``make_source``); test modules
import the constants and ``tsv``.
"""
from __future__ import annotations

from pathlib import Path
from typing import Callable

import pytest

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.source_tables import SOURCE_TABLES

REPOSITORY = "https://github.com/CalebBell/chemicals"
COMMIT = "e79047588b30cfabc564c79fb26d760c746877d7"
PROVENANCE = (
    f"chemicals: {REPOSITORY}\n"
    f"version:   commit: {COMMIT}  committed: 2026-08-03T11:23:09-06:00\n"
)


def tsv(*lines: list) -> str:
    """Tab-joined lines; ``None`` cells become empty."""
    return "\n".join("\t".join("" if c is None else str(c) for c in line) for line in lines) + "\n"


@pytest.fixture
def chem() -> ChemicalsSource:
    return ChemicalsSource(repository=REPOSITORY, commit=COMMIT)


@pytest.fixture
def make_source(tmp_path: Path) -> Callable[[dict[str, str]], Path]:
    """Write ``{table name: file text}`` at the tables' repo paths plus PROVENANCE.txt."""

    def _make(files: dict[str, str]) -> Path:
        for name, text in files.items():
            path = tmp_path / SOURCE_TABLES[name].path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text, encoding="utf-8")
        (tmp_path / "PROVENANCE.txt").write_text(PROVENANCE, encoding="utf-8")
        return tmp_path

    return _make
