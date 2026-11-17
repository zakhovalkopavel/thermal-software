#!/usr/bin/env python3
"""Recompute name-based ``compoundId`` on existing processed compound-data.

Rules: compound name with spaces → ``_``; unique name stays unsuffixed; colliding names
get ``_1``, ``_2``, ``_3``, … in CAS/entry order. Re-keys ``index.json`` compounds and
lookups; updates entry files and ``interactions.json`` ids.
"""
from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

_SPACE = re.compile(r"\s+")


def _slug(name: str) -> str:
    return _SPACE.sub("_", name.strip())


def _cas_sort_key(cas: str | None, fallback: str) -> tuple:
    if not cas or cas.startswith("formula:") or cas == "noCas":
        return (1, (), fallback)
    try:
        return (0, tuple(int(part) for part in cas.split("-")), fallback)
    except ValueError:
        return (1, (), fallback)


def inject(out_dir: Path) -> tuple[int, int]:
    index_path = out_dir / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8"))
    old_compounds: dict[str, dict] = index["compounds"]

    # Collect (old_key, meta, stem) with a stable sort key for suffix assignment.
    rows = []
    for old_key, meta in old_compounds.items():
        name = meta.get("name") or meta.get("displayFormula") or meta.get("hill") or old_key
        stem = _slug(str(name)) or _slug(old_key.replace(":", "_"))
        cas = meta.get("cas") if meta.get("entry") != "noCas" else None
        if meta.get("entry") not in (None, "noCas") and not cas:
            # Legacy index keyed by CAS: entry key is the CAS.
            cas = meta["entry"] if re.match(r"^\d+-\d+-\d+$", str(meta["entry"])) else None
        if re.match(r"^\d+-\d+-\d+$", old_key):
            cas = cas or old_key
        rows.append((old_key, meta, stem, _cas_sort_key(cas, old_key)))

    by_stem: dict[str, list] = defaultdict(list)
    for row in sorted(rows, key=lambda item: (item[2], item[3])):
        by_stem[row[2]].append(row)

    old_to_new: dict[str, str] = {}
    for stem, members in by_stem.items():
        if len(members) == 1:
            old_to_new[members[0][0]] = stem
        else:
            for i, (old_key, *_rest) in enumerate(members, start=1):
                old_to_new[old_key] = f"{stem}_{i}"

    loaded: dict[str, dict] = {}
    new_compounds: dict[str, dict] = {}
    by_formula: dict[str, list[str]] = defaultdict(list)
    by_element: dict[str, list[str]] = defaultdict(list)
    by_family: dict[str, list[str]] = defaultdict(list)
    by_cas: dict[str, str] = {}
    by_other_cas: dict[str, str] = {}

    for old_key, meta in old_compounds.items():
        compound_id = old_to_new[old_key]
        entry_key = meta["entry"]
        rel = meta["file"]
        if rel not in loaded:
            loaded[rel] = json.loads((out_dir / rel).read_text(encoding="utf-8"))
        file_data = loaded[rel]
        entry = file_data["entries"][entry_key]
        entry = {"compoundId": compound_id, **{k: v for k, v in entry.items() if k != "compoundId"}}
        file_data["entries"][entry_key] = entry

        cas = meta.get("cas")
        if not cas and entry_key not in (None, "noCas") and re.match(r"^\d+-\d+-\d+$", str(entry_key)):
            cas = entry_key
        if not cas and re.match(r"^\d+-\d+-\d+$", old_key):
            cas = old_key

        new_meta = {
            "compoundId": compound_id,
            **{k: v for k, v in meta.items() if k != "compoundId"},
        }
        if cas and not new_meta.get("cas"):
            new_meta["cas"] = cas
        new_compounds[compound_id] = new_meta

        by_formula[meta["hill"]].append(compound_id)
        # Rebuild element/family from previous lists is awkward; remap old ids in existing maps below.

        if cas:
            by_cas[cas] = compound_id
        for other in meta.get("otherCas") or []:
            by_other_cas[other] = compound_id

    def remap_list_map(src: dict) -> dict:
        out: dict[str, list[str]] = {}
        for key, ids in src.items():
            out[key] = [old_to_new.get(i, i) for i in ids]
        return dict(sorted(out.items()))

    # Prefer freshly built byFormula from hills; keep element/family via remap of previous maps.
    index["compounds"] = dict(sorted(new_compounds.items()))
    index["count"] = len(new_compounds)
    index["byFormula"] = {k: sorted(v, key=lambda cid: new_compounds[cid].get("entry") or cid)
                          for k, v in sorted(by_formula.items())}
    index["byElement"] = remap_list_map(index.get("byElement") or {})
    index["byFamily"] = remap_list_map(index.get("byFamily") or {})
    index["byCas"] = dict(sorted(by_cas.items()))
    # Remap previous byOtherCas through old_to_new values, then merge with rebuilt.
    remapped_other = {
        cas: old_to_new.get(rid, rid) for cas, rid in (index.get("byOtherCas") or {}).items()
    }
    remapped_other.update(by_other_cas)
    index["byOtherCas"] = dict(sorted(remapped_other.items()))

    for rel, data in loaded.items():
        (out_dir / rel).write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    interactions_path = out_dir / "interactions.json"
    if interactions_path.is_file():
        interactions = json.loads(interactions_path.read_text(encoding="utf-8"))
        for row in interactions.get("interactions") or []:
            ids = row.get("ids")
            if not ids:
                continue
            row["ids"] = [old_to_new.get(i, i) if i else i for i in ids]
        interactions_path.write_text(
            json.dumps(interactions, indent=2, ensure_ascii=False) + "\n", encoding="utf-8",
        )

    index_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return len(new_compounds), len(loaded)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("shared/processed/compound-data"),
        help="Processed compound-data directory",
    )
    args = parser.parse_args()
    n_entries, n_files = inject(args.out_dir.resolve())
    print(f"Assigned name-based compoundId to {n_entries} compounds across {n_files} files → {args.out_dir}")


if __name__ == "__main__":
    main()
