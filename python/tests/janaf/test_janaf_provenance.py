"""Tests for janaf.parsers.provenance and janaf.janaf_source."""
from __future__ import annotations

from janaf.janaf_source import JanafSource
from janaf.parsers.provenance import read_janaf_source

PROVENANCE = """\
py-janaf: https://github.com/n-takumasa/py-janaf.git
ref: main  commit: c8ed6be3ba31a61835061091bd3c521270b484ec  committed: 2026-10-01T12:51:43+09:00
NIST originals: https://janaf.nist.gov/tables/<ID>.txt
downloaded: 2026-10-12T12:23:38Z
"""


class TestReadJanafSource:
    def test_repository_and_commit(self, tmp_path):
        path = tmp_path / "PROVENANCE.txt"
        path.write_text(PROVENANCE)
        source = read_janaf_source(path)
        assert source.repository == "https://github.com/n-takumasa/py-janaf"
        assert source.commit == "c8ed6be3ba31a61835061091bd3c521270b484ec"

    def test_missing_file_falls_back(self, tmp_path):
        source = read_janaf_source(tmp_path / "absent.txt")
        assert source.repository == "https://github.com/n-takumasa/py-janaf"
        assert source.commit is None

    def test_none_path_falls_back(self):
        assert read_janaf_source(None).commit is None

    def test_no_commit_line(self, tmp_path):
        path = tmp_path / "PROVENANCE.txt"
        path.write_text("py-janaf: https://github.com/someone/py-janaf.git\n")
        source = read_janaf_source(path)
        assert source.repository == "https://github.com/someone/py-janaf"
        assert source.commit is None


class TestJanafSource:
    def test_file_url_pinned(self):
        source = JanafSource("https://github.com/n-takumasa/py-janaf", "abc1234")
        assert source.file_url("Al-101") == (
            "https://github.com/n-takumasa/py-janaf/blob/abc1234/src/janaf/data/Al-101.txt"
        )

    def test_nist_url(self):
        assert JanafSource("x").nist_url("O-045") == "https://janaf.nist.gov/tables/O-045.html"
