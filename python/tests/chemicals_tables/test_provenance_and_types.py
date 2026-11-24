"""Tests for provenance parsing, URL building and the equation type sync with the backend."""
from __future__ import annotations

import logging
import re
from pathlib import Path

import pytest
from chemicals_fixtures import COMMIT, PROVENANCE, REPOSITORY

from chemicals_tables.chemicals_source import ChemicalsSource
from chemicals_tables.constants.equation_type import EquationType
from chemicals_tables.constants.planned_equation_types import PLANNED_EQUATION_TYPES
from chemicals_tables.parsers.provenance import read_chemicals_source

_DTO_CANDIDATES = (
    Path("/app/backend-dto/equation-type.dto.ts"),
    Path(__file__).resolve().parents[3] / "backend/src/common/thermal/dto/equation-type.dto.ts",
)


class TestProvenance:
    def test_reads_repository_and_commit(self, tmp_path):
        path = tmp_path / "PROVENANCE.txt"
        path.write_text(PROVENANCE, encoding="utf-8")
        source = read_chemicals_source(path)
        assert (source.repository, source.commit) == (REPOSITORY, COMMIT)

    def test_strips_git_suffix(self, tmp_path):
        path = tmp_path / "PROVENANCE.txt"
        path.write_text(f"chemicals: {REPOSITORY}.git\ncommit: {COMMIT}\n", encoding="utf-8")
        assert read_chemicals_source(path).repository == REPOSITORY

    def test_falls_back_to_master_with_warning(self, tmp_path, caplog):
        path = tmp_path / "PROVENANCE.txt"
        path.write_text(f"chemicals: {REPOSITORY}\n", encoding="utf-8")
        with caplog.at_level(logging.WARNING):
            source = read_chemicals_source(path)
        assert source.commit is None and source.ref == "master"
        assert "master" in caplog.text
        assert source.file_url("chemicals/x.tsv", 3) == f"{REPOSITORY}/blob/master/chemicals/x.tsv#L3"

    def test_missing_file(self, tmp_path, caplog):
        with caplog.at_level(logging.WARNING):
            source = read_chemicals_source(tmp_path / "missing.txt")
        assert source.repository == REPOSITORY and source.commit is None


class TestUrls:
    def test_percent_encoded_path(self):
        source = ChemicalsSource(REPOSITORY, COMMIT)
        url = source.file_url("chemicals/Reactions/Yaws Hf S0 (g).tsv", 7)
        assert url == f"{REPOSITORY}/blob/{COMMIT}/chemicals/Reactions/Yaws%20Hf%20S0%20%28g%29.tsv#L7"
        assert source.tree_url == f"{REPOSITORY}/tree/{COMMIT}"


class TestTypeSync:
    @pytest.fixture(scope="class")
    def backend_types(self) -> set[str]:
        path = next((p for p in _DTO_CANDIDATES if p.exists()), None)
        if path is None:
            pytest.skip("backend equation-type.dto.ts is not mounted")
        return set(re.findall(r"=\s*'([A-Za-z0-9]+)'", path.read_text(encoding="utf-8")))

    def test_every_type_is_backend_or_planned(self, backend_types):
        for t in EquationType:
            assert (t.value in backend_types) != (t.value in PLANNED_EQUATION_TYPES), t.value

    def test_planned_set_has_only_known_types(self):
        assert PLANNED_EQUATION_TYPES <= {t.value for t in EquationType}

    def test_backend_types_are_all_known(self, backend_types):
        assert backend_types <= {t.value for t in EquationType}
