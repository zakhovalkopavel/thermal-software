#!/usr/bin/env python3
"""
generate_references.py — Generate the RefKey code and the reference table from one JSON file.

Source
------
  shared/references/references.json — every literature reference: index, key, name, year, url?, citation

Generated (do not edit by hand)
-------------------------------
  backend/src/common/thermal/enum/ref-key.enum.ts  — RefKey enum
  backend/src/common/thermal/dto/ref-key.dto.ts    — REFERENCES_META (index, name, year, url)
  python/src/references/ref_key.py                 — RefKey (str, Enum)
  python/src/references/references_meta.py         — REFERENCES_META
  docs/REFERENCES.md                               — the table between the references:start/end markers

Rules checked: indexes run 1..N in file order, keys are unique identifiers, name / year / citation
are non-empty, url (optional) is http(s). Renaming or removing an existing key is not detectable
here and is forbidden (compound data files and code depend on the keys).

Usage
-----
  make references-generate   # rewrite the generated files
  make references-check      # exit 1 when a generated file differs from the JSON
  python3 scripts/generate_references.py [--check] [--root DIR]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any, Callable

SOURCE = "shared/references/references.json"
TS_ENUM = "backend/src/common/thermal/enum/ref-key.enum.ts"
TS_META = "backend/src/common/thermal/dto/ref-key.dto.ts"
PY_ENUM = "python/src/references/ref_key.py"
PY_META = "python/src/references/references_meta.py"
DOC = "docs/REFERENCES.md"
DOC_START, DOC_END = "<!-- references:start -->", "<!-- references:end -->"

FIELDS = {"index", "key", "name", "year", "url", "citation"}
KEY = re.compile(r"^[A-Za-z][A-Za-z0-9_]*$")
NOTICE = f"AUTO-GENERATED from {SOURCE} by scripts/generate_references.py — do not edit; run `make references-generate`."


def load(root: Path) -> list[dict[str, Any]]:
    """References of the JSON file, validated."""
    refs = json.loads((root / SOURCE).read_text(encoding="utf-8"))["references"]
    errors: list[str] = []
    seen: set[str] = set()
    for position, ref in enumerate(refs, start=1):
        label = f"entry {position} ({ref.get('key', '?')})"
        if set(ref) - FIELDS:
            errors.append(f"{label}: unknown fields {sorted(set(ref) - FIELDS)}")
        if ref.get("index") != position:
            errors.append(f"{label}: index {ref.get('index')} — expected {position} (sequential, file order)")
        key = ref.get("key", "")
        if not KEY.match(key):
            errors.append(f"{label}: key must be an identifier")
        if key in seen:
            errors.append(f"{label}: duplicate key")
        seen.add(key)
        for field in ("name", "year", "citation"):
            if not isinstance(ref.get(field), str) or not ref[field].strip():
                errors.append(f"{label}: {field} must be a non-empty string")
        if "url" in ref and not re.match(r"^https?://\S+$", str(ref["url"])):
            errors.append(f"{label}: url must be http(s)")
    if errors:
        raise SystemExit(f"{SOURCE}:\n  " + "\n  ".join(errors))
    return refs


def _str(text: str) -> str:
    """Single-quoted TS / Python literal; double quotes when the text has an apostrophe only."""
    if "'" in text and '"' not in text:
        return f'"{text}"'
    return "'" + text.replace("\\", "\\\\").replace("'", "\\'") + "'"


def _meta_fields(ref: dict[str, Any], quote_keys: bool) -> list[str]:
    q = (lambda k: f"'{k}'") if quote_keys else (lambda k: k)
    fields = [f"{q('index')}: {ref['index']}", f"{q('name')}: {_str(ref['name'])}", f"{q('year')}: {_str(ref['year'])}"]
    if "url" in ref:
        fields.append(f"{q('url')}: {_str(ref['url'])}")
    return fields


def _label(ref: dict[str, Any]) -> str:
    return f"[{ref['index']}] {ref['name']} ({ref['year']})"


def ts_enum(refs: list[dict[str, Any]]) -> str:
    lines = [
        f"// {NOTICE}",
        "/**",
        " * Short reference keys used in every EquationValue.ref field.",
        " * Each key maps to a numbered entry in docs/REFERENCES.md.",
        " *",
        " * Never rename or remove an existing key — compound data files depend on stability.",
        f" * Add new keys at the end of {SOURCE}.",
        " */",
        "export enum RefKey {",
    ]
    for ref in refs:
        lines.append(f"  /** {_label(ref).replace('*/', '*∕')} */")
        lines.append(f"  {ref['key']} = '{ref['key']}',")
    lines.append("}")
    return "\n".join(lines) + "\n"


def ts_meta(refs: list[dict[str, Any]]) -> str:
    width = max(len(f"[RefKey.{r['key']}]:") for r in refs)
    lines = [
        f"// {NOTICE}",
        "import { RefKey } from '../enum/ref-key.enum';",
        "",
        "/**",
        " * Machine-readable metadata for every reference.",
        " * Fields match the columns in docs/REFERENCES.md.",
        " */",
        "export const REFERENCES_META: Record<RefKey, {",
        "  index: number;",
        "  name: string;",
        "  year: string;",
        "  url?: string;",
        "}> = {",
    ]
    for ref in refs:
        key = "[RefKey." + ref["key"] + "]:"
        lines.append(f"  {key:<{width}} {{ {', '.join(_meta_fields(ref, False))} }},")
    lines.append("};")
    return "\n".join(lines) + "\n"


def py_enum(refs: list[dict[str, Any]]) -> str:
    width = max(len(r["key"]) for r in refs)
    lines = [
        '"""',
        "references.ref_key — RefKey: short keys of the literature references.",
        "",
        f"{NOTICE}",
        "Each value maps to a numbered entry in docs/REFERENCES.md and to a key in",
        "``references.references_meta.REFERENCES_META``. Never rename or remove a key.",
        '"""',
        "from __future__ import annotations",
        "",
        "from enum import Enum",
        "",
        "",
        "class RefKey(str, Enum):",
        '    """Short reference keys pointing to docs/REFERENCES.md entries."""',
        "",
    ]
    for ref in refs:
        lines.append(f"    {ref['key']:<{width}} = '{ref['key']}'  # {_label(ref)}")
    return "\n".join(lines) + "\n"


def py_meta(refs: list[dict[str, Any]]) -> str:
    width = max(len(f"RefKey.{r['key']}:") for r in refs)
    lines = [
        '"""',
        "references.references_meta — Machine-readable metadata for every RefKey entry.",
        "",
        f"{NOTICE}",
        '"""',
        "from __future__ import annotations",
        "",
        "from typing import NotRequired, TypedDict",
        "",
        "from references.ref_key import RefKey",
        "",
        "",
        "class ReferenceMeta(TypedDict):",
        '    """Metadata record for one literature reference."""',
        "",
        "    index: int",
        "    name: str",
        "    year: str",
        "    url: NotRequired[str]",
        "",
        "",
        "REFERENCES_META: dict[RefKey, ReferenceMeta] = {",
    ]
    for ref in refs:
        key = "RefKey." + ref["key"] + ":"
        lines.append(f"    {key:<{width}} {{{', '.join(_meta_fields(ref, True))}}},")
    lines.append("}")
    return "\n".join(lines) + "\n"


def doc_table(refs: list[dict[str, Any]], current: str) -> str:
    """``current`` with the table between the markers replaced."""
    if current.count(DOC_START) != 1 or current.count(DOC_END) != 1:
        raise SystemExit(f"{DOC}: needs exactly one {DOC_START} and one {DOC_END}")
    rows = [
        DOC_START,
        f"<!-- {NOTICE} -->",
        "",
        "| #  | Key (`RefKey`)   | Source |",
        "|----|------------------|--------|",
        *(f"| {r['index']:<2} | {'`' + r['key'] + '`':<16} | {r['citation']} |" for r in refs),
        "",
        DOC_END,
    ]
    head, rest = current.split(DOC_START, 1)
    tail = rest.split(DOC_END, 1)[1]
    return head + "\n".join(rows) + tail


def outputs(root: Path, refs: list[dict[str, Any]]) -> dict[str, Callable[[str], str]]:
    """Generated path → function of the current text giving the new text."""
    return {
        TS_ENUM: lambda _: ts_enum(refs),
        TS_META: lambda _: ts_meta(refs),
        PY_ENUM: lambda _: py_enum(refs),
        PY_META: lambda _: py_meta(refs),
        DOC: lambda current: doc_table(refs, current),
    }


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Generate RefKey code and the reference table from references.json.")
    p.add_argument("--check", action="store_true", help="Only report generated files that differ (exit 1)")
    p.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help="Repository root")
    args = p.parse_args(argv)

    refs = load(args.root)
    stale = []
    for rel, render in outputs(args.root, refs).items():
        path = args.root / rel
        current = path.read_text(encoding="utf-8") if path.exists() else ""
        new = render(current)
        if new == current:
            continue
        stale.append(rel)
        if not args.check:
            with path.open("w", encoding="utf-8") as f:
                f.write(new)
    if args.check:
        if stale:
            print("Out of date with " + SOURCE + " (run make references-generate):\n  " + "\n  ".join(stale))
            return 1
        print(f"References up to date ({len(refs)} entries).")
        return 0
    print(f"{len(refs)} references → " + (", ".join(stale) if stale else "no changes"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
