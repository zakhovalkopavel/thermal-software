#!/usr/bin/env python3
"""
compact_pubchem_references.py — Join duplicate PubChem sources and drop empty experimental lists.

One source is one work or one database. A page, a product number, an access date, and the chemical
looked up in a database are not part of the source. The same journal article is one source when the
difference is an author spelling, ``et al``, or a year present on only one of the lines. A different
year, edition, volume, or report number stays a different source. The earliest ``refNumber`` is kept.
Citations in the class files are pointed at that row; a locator from the old source is written to
``refPage`` when the citation has none. A record whose experimental views are all HTTP 404 with no
values is stored as ``"experimental": []`` with ``experimentalDone``.

Not run by ``make compound-data-pubchem``.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from difflib import SequenceMatcher
from pathlib import Path

from pubchem.constants.pubchem import PUBCHEM_DIR
from pubchem.parsers.experimental_properties import canonicalize_source, normalize_source, preferred_ref_code
from pubchem.pubchem_references import ref_code_order

_DROP = frozenset({"page", "refPage"})
_TRAILING_YEAR = re.compile(r" ((?:19|20)\d{2})$")


def compact_pubchem_references(directory: Path) -> tuple[int, int]:
    """Rewrite the references catalog and the class files. Returns (rows removed, records cleared)."""
    refs_path = directory / "pubchem-references.jsonl"
    rows = [_load(line) for line in _lines(refs_path)]
    groups: dict[str, list[dict]] = defaultdict(list)
    locators: dict[int, str] = {}
    for row in rows:
        source, locator = canonicalize_source(str(row.get("source") or ""))
        row["_canon"] = source
        number = int(row["refNumber"])
        if locator:
            locators[number] = locator
        groups[normalize_source(source)].append(row)
    _merge_same_article(groups)

    survivors: list[dict] = []
    redirect: dict[int, tuple[int, str]] = {}
    removed = 0
    for group in groups.values():
        group.sort(key=lambda row: int(row["refNumber"]))
        keep = group[0]
        code = preferred_ref_code(str(keep["refCode"]), str(keep.get("source") or ""))
        number = int(keep["refNumber"])
        for row in group:
            redirect[int(row["refNumber"])] = (number, code)
        if len(group) > 1:
            removed += len(group) - 1
            dropped = ", ".join(f"{row['refCode']}#{row['refNumber']}" for row in group[1:])
            print(f"join {len(group)} -> {code}#{number}  ({dropped})")
        stored = {key: value for key, value in keep.items() if key not in _DROP and not key.startswith("_")}
        stored["refCode"] = code
        stored["refNumber"] = number
        stored["source"] = keep["_canon"]
        survivors.append(stored)

    _write(refs_path, sorted(survivors, key=ref_code_order))
    cleared = 0
    for path in sorted(directory.glob("pubchem-*.jsonl")):
        if path.name == "pubchem-references.jsonl":
            continue
        cleared += _rewrite_records(path, redirect, locators)
    return removed, cleared


def _same_author(left: str, right: str) -> bool:
    """A one-letter author typo, or ``et al`` present on only one line."""
    if left == right:
        return True
    if SequenceMatcher(None, left, right).ratio() >= 0.9:
        return True
    short, long = (left, right) if len(left) <= len(right) else (right, left)
    if long.startswith(short + " ") or long.startswith(short + " et al"):
        return True
    # "Johanson G et al" and "Johanson G, Dynesius B" are one citation.
    left_name = left.split()
    right_name = right.split()
    if left_name and right_name and left_name[0] == right_name[0]:
        return ("et" in left_name and "al" in left_name) or ("et" in right_name and "al" in right_name)
    return False


def _article_parts(source: str) -> tuple[str, str, str | None] | None:
    """Author, the article without its year, and the year. None when this is not one article."""
    if ";" not in source:
        return None
    author, rest = source.split(";", 1)
    rest_key = normalize_source(rest)
    year = _TRAILING_YEAR.search(rest_key)
    stem = rest_key[:year.start()] if year else rest_key
    if len(stem.split()) < 2:
        return None
    return normalize_source(author), stem, year.group(1) if year else None


def _merge_same_article(groups: dict[str, list[dict]]) -> None:
    """Join an article to the same volume and year. A second year in that volume stays apart."""
    buckets: dict[str, list[tuple[str, str | None, str]]] = defaultdict(list)
    for key, rows in groups.items():
        parts = _article_parts(str(rows[0].get("_canon") or ""))
        if parts is None:
            continue
        author, stem, year = parts
        buckets[stem].append((author, year, key))
    for entries in buckets.values():
        parent = list(range(len(entries)))

        def find(index: int) -> int:
            while parent[index] != index:
                parent[index] = parent[parent[index]]
                index = parent[index]
            return index

        for left in range(len(entries)):
            for right in range(left + 1, len(entries)):
                if not _same_author(entries[left][0], entries[right][0]):
                    continue
                parent[find(right)] = find(left)
        clusters: dict[int, list[int]] = defaultdict(list)
        for index in range(len(entries)):
            clusters[find(index)].append(index)
        for indexes in clusters.values():
            years = {entries[index][1] for index in indexes if entries[index][1]}
            for index in indexes:
                year = entries[index][1]
                if year is None and len(years) != 1:
                    continue
                target_year = year or next(iter(years))
                target = next(entries[other][2] for other in indexes if entries[other][1] == target_year)
                source_key = entries[index][2]
                if source_key == target or source_key not in groups:
                    continue
                groups[target].extend(groups.pop(source_key))
    _merge_shorter_citation(groups)


def _merge_shorter_citation(groups: dict[str, list[dict]]) -> None:
    """``J Chem Eng Data`` with no volume joins the one volume that names the same authors."""
    rows: list[tuple[str, str, str | None, str]] = []
    for key, entries in groups.items():
        parts = _article_parts(str(entries[0].get("_canon") or ""))
        if parts is None:
            continue
        author, stem, year = parts
        rows.append((author, stem, year, key))
    for author, stem, year, key in rows:
        if year is not None or key not in groups:
            continue
        longer = [
            other_key for other_author, other_stem, other_year, other_key in rows
            if other_key != key and other_year and _same_author(author, other_author)
            and other_stem.startswith(stem + " ")
        ]
        targets = set(longer)
        if len(targets) == 1 and key in groups:
            groups[next(iter(targets))].extend(groups.pop(key))


def _rewrite_records(path: Path, redirect: dict[int, tuple[int, str]], locators: dict[int, str]) -> int:
    cleared = 0
    records = []
    for line in _lines(path):
        record = _load(line)
        views = record.get("experimental") or []
        if views and all(_empty_404(view) for view in views):
            record["experimental"] = []
            record["experimentalDone"] = True
            cleared += 1
            views = []
        for view in views:
            for prop in view.get("values") or []:
                for cite in prop.get("citation") or []:
                    number = cite.get("refNumber")
                    if not isinstance(number, int) or number not in redirect:
                        continue
                    new_number, code = redirect[number]
                    cite["refNumber"] = new_number
                    cite["refCode"] = code
                    if not cite.get("refPage") and locators.get(number):
                        cite["refPage"] = locators[number]
        records.append(record)
    _write(path, records)
    return cleared


def _empty_404(view: dict) -> bool:
    return view.get("httpStatus") == 404 and not view.get("values") and "body" not in view


def _lines(path: Path) -> list[str]:
    if not path.is_file():
        return []
    return [line for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _load(line: str) -> dict:
    row = json.loads(line)
    if not isinstance(row, dict):
        raise ValueError("expected a JSON object")
    return row


def _write(path: Path, rows: list[dict]) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    tmp.replace(path)


def _default_dir() -> Path:
    raw = Path(PUBCHEM_DIR)
    if raw.is_dir():
        return raw
    return Path(__file__).resolve().parents[3] / raw


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--dir", type=Path, default=_default_dir(), help="folder of the PubChem class files")
    args = parser.parse_args()
    removed, cleared = compact_pubchem_references(args.dir)
    print(f"removed {removed} duplicate references; cleared {cleared} all-404 experimental lists")


if __name__ == "__main__":
    main()
