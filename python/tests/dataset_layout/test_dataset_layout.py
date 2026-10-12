"""Tests for dataset_layout — compound file names, collision handling, clearing the dataset folder."""
from __future__ import annotations

from dataset_layout.clear_dataset_dir import clear_dataset_dir
from dataset_layout.compound_file_name import MAX_SLUG_LENGTH, compound_file_name, name_slug
from dataset_layout.unique_file_paths import unique_file_paths


class TestFileName:
    def test_formula_and_name(self):
        assert compound_file_name("Al2O3", "Aluminum Oxide") == "Al2O3-aluminum-oxide"
        assert compound_file_name("NH3", "Ammonia") == "NH3-ammonia"

    def test_slug_words(self):
        assert name_slug("mercury(ii) fluoride") == "mercury-ii-fluoride"
        assert name_slug("Barium Hydroxide, Alpha (Ba(OH)2)") == "barium-hydroxide-alpha-ba-oh-2"
        assert name_slug("(2R,3S)-2,3-dibromobutane") == "2r-3s-2-3-dibromobutane"

    def test_greek_and_accents(self):
        assert name_slug("α-alumina") == "alpha-alumina"
        assert name_slug("Aluminum oxide (β)") == "aluminum-oxide-beta"
        assert name_slug("Wüstite") == "wustite"

    def test_name_repeating_formula_or_missing_is_dropped(self):
        assert compound_file_name("Bi2O3", "Bi2O3") == "Bi2O3"
        assert compound_file_name("Ne", None) == "Ne"
        assert compound_file_name("Ne", "") == "Ne"

    def test_long_name_cut_at_word(self):
        slug = name_slug("very-long-name " * 20)
        assert len(slug) <= MAX_SLUG_LENGTH
        assert not slug.endswith("-")


class TestUniquePaths:
    def test_distinct_paths_unchanged(self):
        paths = unique_file_paths({1: ("inorganic/Al", "Al2O3-aluminum-oxide", "1344-28-1"),
                                   2: ("inorganic/Ti", "TiO2-titanium-dioxide", "13463-67-7")})
        assert paths == {1: "inorganic/Al/Al2O3-aluminum-oxide.json", 2: "inorganic/Ti/TiO2-titanium-dioxide.json"}

    def test_collision_appends_tie_breaker(self):
        paths = unique_file_paths({1: ("organic/alcohols", "C2H6O-ethanol", "64-17-5"),
                                   2: ("organic/alcohols", "C2H6O-ethanol", "formula:C2H6O")})
        assert paths == {1: "organic/alcohols/C2H6O-ethanol-64-17-5.json",
                         2: "organic/alcohols/C2H6O-ethanol-formula-c2h6o.json"}

    def test_collision_is_case_insensitive(self):
        paths = unique_file_paths({1: ("inorganic/C", "COS", "a"), 2: ("inorganic/C", "CoS", "b")})
        assert paths == {1: "inorganic/C/COS-a.json", 2: "inorganic/C/CoS-b.json"}


class TestClearDatasetDir:
    def test_removes_dataset_files_only(self, tmp_path):
        (tmp_path / "inorganic" / "Al").mkdir(parents=True)
        (tmp_path / "inorganic" / "Al" / "Al2O3-aluminum-oxide.json").write_text("{}")
        (tmp_path / "organic").mkdir()
        (tmp_path / "Al.json").write_text("{}")
        (tmp_path / "index.json").write_text("{}")
        (tmp_path / "README.md").write_text("keep")
        clear_dataset_dir(tmp_path)
        assert sorted(p.name for p in tmp_path.iterdir()) == ["README.md"]

    def test_creates_missing_dir(self, tmp_path):
        clear_dataset_dir(tmp_path / "new")
        assert (tmp_path / "new").is_dir()
