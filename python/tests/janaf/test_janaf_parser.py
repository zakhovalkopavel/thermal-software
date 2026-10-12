"""Tests for janaf.parsers.janaf_table and janaf.janaf_index."""
from __future__ import annotations

import json
from pathlib import Path

import pytest

from janaf.janaf_index import load_janaf_index
from janaf.parsers.janaf_table import parse_janaf_table, parse_janaf_tables

HEADER = "T(K)\tCp\tS\t-[G-H(Tr)]/T\tH-H(Tr)\tdelta-f H\tdelta-f G\tlog Kf"

AL_001 = "\n".join([
    "Aluminum (Al)\tAl1(ref)",
    HEADER,
    "0\t0.\t0.\t+inf\t-4.539\t0.\t0.\t0.",
    "298.15\t24.209\t28.275\t28.275\t0.\t0.\t0.\t0.",
    "900\t32.308\t58.548\t39.780\t16.890\t0.\t0.\t0.",
    "933.450\t32.959\t59.738\t40.474\t17.982\tCRYSTAL <--> LIQUID",
    "933.450\t31.751\t71.213\t40.474\t28.693\tTRANSITION",
    "1000\t31.751\t73.400\t42.594\t30.806\t0.\t0.\t0.",
]) + "\n"

AL_002 = "\n".join([
    "Aluminum (Al)\tAl1(cr)",
    HEADER,
    "900\t32.308\t58.548\t39.780\t16.890\t0.\t0.\t0.",
    "933.450\t32.959\t59.738\t40.474\t17.982\tCRYSTAL <--> LIQUID",
    "1000\t34.358\t62.055\t41.834\t20.221\t-10.585\t0.760\t-0.040",
]) + "\n"

O_045 = "\n".join([
    "Titanium Oxide (TiO2)\tO2Ti1(cr,l)",
    HEADER,
    "0\t0.000\t0.000\tINFINITE\t-8.636\t-939.870\t-939.870\tINFINITE",
    "298.15\t55.103\t50.292\t50.292\t0.000\t-944.747\t-889.406\t155.820",
    "2130.000\t79.228\t190.133\t126.276\t136.016\tCRYSTAL <--> LIQUID",
    "2130.000\t100.416\t221.563\t126.276\t202.960\tTRANSITION",
    "2200\t100.416\t224.809\t129.360\t209.989\t-883.396\t-551.188\t13.087",
]) + "\n"


def _write(tmp_path: Path, table_id: str, text: str) -> Path:
    path = tmp_path / f"{table_id}.txt"
    path.write_text(text, encoding="utf-8")
    return path


class TestTitle:
    def test_name_formula_phase(self, tmp_path):
        table = parse_janaf_table(_write(tmp_path, "O-045", O_045), "O2Ti, Titanium Oxide (cr,l)")
        assert table.table_id == "O-045"
        assert table.name == "Titanium Oxide"
        assert table.formula == "TiO2"
        assert table.janaf_formula == "O2Ti1"
        assert table.phase == "cr,l"
        assert table.label == "O2Ti, Titanium Oxide (cr,l)"
        assert table.prefix == "O"

    def test_title_without_formula(self, tmp_path):
        text = O_045.replace("Titanium Oxide (TiO2)", "Titanium Oxide", 1)
        table = parse_janaf_table(_write(tmp_path, "O-045", text))
        assert table.name == "Titanium Oxide"
        assert table.formula is None


class TestRows:
    def test_infinite_becomes_none(self, tmp_path):
        rows = parse_janaf_table(_write(tmp_path, "O-045", O_045)).rows
        assert rows[0].T == 0.0
        assert rows[0].gef is None
        assert rows[0].logKf is None
        assert rows[0].dfH == pytest.approx(-939.870)

    def test_plus_inf_becomes_none(self, tmp_path):
        rows = parse_janaf_table(_write(tmp_path, "Al-001", AL_001)).rows
        assert rows[0].gef is None

    def test_numeric_row(self, tmp_path):
        row = parse_janaf_table(_write(tmp_path, "O-045", O_045)).rows[1]
        assert row.T == pytest.approx(298.15)
        assert row.Cp == pytest.approx(55.103)
        assert row.dfG == pytest.approx(-889.406)
        assert row.logKf == pytest.approx(155.82)
        assert row.note is None

    def test_transition_rows_keep_values_and_note(self, tmp_path):
        rows = parse_janaf_table(_write(tmp_path, "Al-001", AL_001)).rows
        melt, after = rows[3], rows[4]
        assert melt.note == "CRYSTAL <--> LIQUID"
        assert melt.dH == pytest.approx(17.982)
        assert melt.dfH is None and melt.dfG is None and melt.logKf is None
        assert after.note == "TRANSITION"
        assert after.dH == pytest.approx(28.693)

    def test_empty_cells_become_none(self, tmp_path):
        text = AL_002 + "1100\t36.722\t\t43.827\t23.772\t-10.209\t\t-0.089\n"
        row = parse_janaf_table(_write(tmp_path, "Al-002", text)).rows[-1]
        assert row.S is None
        assert row.gef == pytest.approx(43.827)
        assert row.dfG is None
        assert row.logKf == pytest.approx(-0.089)

    def test_space_separated_tail_is_split(self, tmp_path):
        text = AL_002 + "2400\t139.453\t296.214\t185.829\t264.922\t-1672.963  -905.582 19.709\n"
        row = parse_janaf_table(_write(tmp_path, "Al-096", text)).rows[-1]
        assert row.dfH == pytest.approx(-1672.963)
        assert row.dfG == pytest.approx(-905.582)
        assert row.logKf == pytest.approx(19.709)

    def test_comment_line_skipped(self, tmp_path):
        text = AL_002 + "Note: values above are extrapolated\n"
        rows = parse_janaf_table(_write(tmp_path, "Al-002", text)).rows
        assert len(rows) == 3


class TestTransitions:
    def test_reference_table(self, tmp_path):
        transitions = parse_janaf_table(_write(tmp_path, "Al-001", AL_001)).transitions
        assert [(t.T, t.label) for t in transitions] == [(933.45, "CRYSTAL <--> LIQUID")]

    def test_crystal_table_without_transition_row(self, tmp_path):
        transitions = parse_janaf_table(_write(tmp_path, "Al-002", AL_002)).transitions
        assert [(t.T, t.label) for t in transitions] == [(933.45, "CRYSTAL <--> LIQUID")]

    def test_tio2_melting(self, tmp_path):
        transitions = parse_janaf_table(_write(tmp_path, "O-045", O_045)).transitions
        assert [(t.T, t.label) for t in transitions] == [(2130.0, "CRYSTAL <--> LIQUID")]


class TestDirectory:
    def _setup(self, tmp_path: Path) -> dict[str, str]:
        _write(tmp_path, "Al-001", AL_001)
        _write(tmp_path, "Al-002", AL_002)
        _write(tmp_path, "O-045", O_045)
        return {"O-045": "O2Ti, Titanium Oxide (cr,l)", "Al-001": "Al, Aluminum (ref)", "Al-003": "missing"}

    def test_index_order_then_unindexed(self, tmp_path):
        tables = parse_janaf_tables(tmp_path, self._setup(tmp_path))
        assert [t.table_id for t in tables] == ["O-045", "Al-001", "Al-002"]
        assert tables[2].label is None

    def test_prefix_filter(self, tmp_path):
        tables = parse_janaf_tables(tmp_path, self._setup(tmp_path), prefixes=["Al"])
        assert [t.table_id for t in tables] == ["Al-001", "Al-002"]


class TestIndex:
    def test_load(self, tmp_path):
        path = tmp_path / "janaf.json"
        path.write_text(json.dumps({"display": ["Al, Aluminum (ref)", "Al, Aluminum (cr)"],
                                    "index": ["Al-001", "Al-002"]}))
        assert load_janaf_index(path) == {"Al-001": "Al, Aluminum (ref)", "Al-002": "Al, Aluminum (cr)"}

    def test_length_mismatch(self, tmp_path):
        path = tmp_path / "janaf.json"
        path.write_text(json.dumps({"display": ["a"], "index": ["Al-001", "Al-002"]}))
        with pytest.raises(ValueError):
            load_janaf_index(path)
