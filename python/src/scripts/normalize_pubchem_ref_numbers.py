#!/usr/bin/env python3
"""
normalize_pubchem_ref_numbers.py — Close gaps in PubChem ``refNumber``.

Joins keep the earliest number and drop the others, so the catalog runs past the last row.
The file is ordered by ``refCode``. This assigns ``refNumber`` 1, 2, 3, … in that order, so the
first line is 1. ``refCode`` and ``source`` stay.

A citation is moved only when its ``refNumber`` and ``refCode`` already name the same catalog
row. Any other citation stops the run before a file is replaced. After the write, the same
check is repeated; a failure restores the files from the ``.prenorm`` copies.

Not run by ``make compound-data-pubchem``.

Spec: docs/scripts/PUBCHEM_SPEC.md
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from pubchem.constants.pubchem import PUBCHEM_DIR, PUBCHEM_REFERENCES_FILE
from pubchem.pubchem_paths import pubchem_files
from pubchem.pubchem_references import ref_code_order

_SHOWN = 8


class NormalizeRefError(ValueError):
    """The catalog and the citations do not name the same sources."""


def normalize_pubchem_ref_numbers(directory: Path) -> int:
    """Renumber the catalog and the class files. Returns how many catalog rows changed number."""
    refs_path = directory / PUBCHEM_REFERENCES_FILE
    class_paths = [path for path in pubchem_files(directory).values() if path.is_file()]
    _refuse_unfinished(refs_path, class_paths)
    rows = [_load(line) for line in _lines(refs_path)]
    by_number = _catalog(rows)
    _require_agreement(class_paths, by_number)
    ordered = sorted(rows, key=ref_code_order)
    mapping = {int(row["refNumber"]): index for index, row in enumerate(ordered, start=1)}
    changed = sum(1 for old, new in mapping.items() if old != new)
    if changed == 0:
        return 0

    updated_rows = [{**row, "refNumber": mapping[int(row["refNumber"])]} for row in rows]
    updated_files = [(path, _renumber_records(_lines(path), mapping)) for path in class_paths]
    written = [(refs_path, sorted(updated_rows, key=ref_code_order)), *updated_files]
    backups = _replace_all(written)
    try:
        _require_agreement(class_paths, _catalog(_read_rows(refs_path)))
    except NormalizeRefError:
        _restore(backups)
        raise
    for backup in backups.values():
        backup.unlink(missing_ok=True)
    return changed


def _catalog(rows: list[dict]) -> dict[int, str]:
    by_number: dict[int, str] = {}
    seen_codes: set[str] = set()
    for row in rows:
        number = int(row["refNumber"])
        code = str(row.get("refCode") or "")
        if number in by_number or not code or code in seen_codes:
            raise NormalizeRefError(f"duplicate or empty ref in the catalog at {number} {code}")
        by_number[number] = code
        seen_codes.add(code)
    return by_number


def _require_agreement(paths: list[Path], by_number: dict[int, str]) -> None:
    problems: list[str] = []
    for path in paths:
        for line_number, line in enumerate(_lines(path), start=1):
            record = _load(line)
            for cite in _citations(record):
                number = cite.get("refNumber")
                code = cite.get("refCode")
                if not isinstance(number, int) or by_number.get(number) != code:
                    problems.append(f"{path.name}:{line_number} refNumber {number} refCode {code}")
                    if len(problems) >= _SHOWN:
                        break
            if len(problems) >= _SHOWN:
                break
        if len(problems) >= _SHOWN:
            break
    if problems:
        raise NormalizeRefError(
            "citations do not match the catalog; nothing was changed:\n" + "\n".join(problems))


def _renumber_records(lines: list[str], mapping: dict[int, int]) -> list[dict]:
    records = []
    for line in lines:
        record = _load(line)
        for cite in _citations(record):
            cite["refNumber"] = mapping[int(cite["refNumber"])]
        records.append(record)
    return records


def _citations(record: dict):
    for view in record.get("experimental") or []:
        for prop in view.get("values") or []:
            yield from prop.get("citation") or []


def _replace_all(written: list[tuple[Path, list[dict]]]) -> dict[Path, Path]:
    temps = [(path, _write_temp(path, rows)) for path, rows in written]
    backups: dict[Path, Path] = {}
    try:
        for path, _temp in temps:
            backup = path.with_name(path.name + ".prenorm")
            shutil.copy2(path, backup)
            backups[path] = backup
        for path, temp in temps:
            temp.replace(path)
    except Exception:
        _restore(backups)
        for _path, temp in temps:
            temp.unlink(missing_ok=True)
        raise
    return backups


def _restore(backups: dict[Path, Path]) -> None:
    for path, backup in backups.items():
        if backup.is_file():
            shutil.copy2(backup, path)


def _refuse_unfinished(refs_path: Path, class_paths: list[Path]) -> None:
    leftovers = [path.with_name(path.name + ".prenorm") for path in [refs_path, *class_paths]]
    found = [path.name for path in leftovers if path.is_file()]
    if found:
        raise NormalizeRefError(
            "a previous run left backup files; restore them before running again: " + ", ".join(found))


def _read_rows(path: Path) -> list[dict]:
    return [_load(line) for line in _lines(path)]


def _lines(path: Path) -> list[str]:
    if not path.is_file():
        return []
    return [line for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def _load(line: str) -> dict:
    row = json.loads(line)
    if not isinstance(row, dict):
        raise ValueError("expected a JSON object")
    return row


def _write_temp(path: Path, rows: list[dict]) -> Path:
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False) + "\n")
    return tmp


def _default_dir() -> Path:
    raw = Path(PUBCHEM_DIR)
    if raw.is_dir():
        return raw
    return Path(__file__).resolve().parents[3] / raw


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--dir", type=Path, default=_default_dir(), help="folder of the PubChem class files")
    args = parser.parse_args()
    changed = normalize_pubchem_ref_numbers(args.dir)
    if changed == 0:
        print("refNumbers already 1..N and every citation matches")
    else:
        print(f"renumbered {changed} references; every citation matches its refCode")


if __name__ == "__main__":
    main()
