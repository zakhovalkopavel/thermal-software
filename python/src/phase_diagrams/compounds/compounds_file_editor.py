"""
phase_diagrams.compounds.compounds_file_editor — Add or replace entries of compounds.json in its compact layout.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § New ternary system
"""
from __future__ import annotations

import json
import re

_HEAD_KEYS = ("id", "notation", "formula", "oxideMoles")
_MELTING_KEYS = ("behaviour", "temperature_C", "products", "status")


def format_compound(compound: dict) -> str:
    """One entry as the file writes it: identity on one line, then notes, then melting with one source per line."""
    lines = ["{", "      " + ", ".join(f'"{k}": {_inline(compound[k])}' for k in _HEAD_KEYS if k in compound) + ","]
    for key, value in compound.items():
        if key not in (*_HEAD_KEYS, "melting"):
            lines.append(f'      "{key}": {_inline(value)},')
    melting = compound.get("melting")
    if melting is None:
        lines[-1] = lines[-1].rstrip(",")
    else:
        head = ", ".join(f'"{k}": {_inline(melting[k])}' for k in _MELTING_KEYS if k in melting)
        sources = melting.get("sources", [])
        listed = "[ " + _inline(sources[0]) + " ]" if sources else "[]"
        if len(sources) <= 1 and all(set(s) == {"ref"} for s in sources):
            lines.append(f'      "melting": {{ {head}, "sources": {listed} }}')
        elif len(sources) == 1:
            lines += [f'      "melting": {{ {head},', f'        "sources": {listed} }}']
        else:
            lines += [f'      "melting": {{ {head},', '        "sources": [',
                      ",\n".join("          " + _inline(s) for s in sources), "        ] }"]
    return "\n".join(lines + ["    }"])


def add_compound(text: str, compound: dict) -> str:
    """``text`` of compounds.json with ``compound`` appended to the list."""
    spans = _entry_spans(text)
    if any(json.loads(text[a:b])["id"] == compound["id"] for a, b in spans):
        raise ValueError(f"compound '{compound['id']}' is already in compounds.json")
    if not spans:
        start = _list_start(text)
        end = text.index("]", start)
        return text[:start] + "\n    " + format_compound(compound) + "\n  " + text[end:]
    end = spans[-1][1]
    return text[:end] + ",\n    " + format_compound(compound) + text[end:]


def replace_compound(text: str, compound: dict) -> str:
    """``text`` of compounds.json with the entry of the same id replaced by ``compound``."""
    for start, end in _entry_spans(text):
        if json.loads(text[start:end])["id"] == compound["id"]:
            return text[:start] + format_compound(compound) + text[end:]
    raise ValueError(f"compound '{compound['id']}' is not in compounds.json")


def _inline(value) -> str:
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{json.dumps(k, ensure_ascii=False)}: {_inline(v)}" for k, v in value.items()) + " }" \
            if value else "{}"
    if isinstance(value, list):
        return "[" + ", ".join(_inline(v) for v in value) + "]"
    return json.dumps(value, ensure_ascii=False)


def _list_start(text: str) -> int:
    match = re.search(r'"compounds"\s*:\s*\[', text)
    if match is None:
        raise ValueError("compounds.json has no \"compounds\" list")
    return match.end()


def _entry_spans(text: str) -> list[tuple[int, int]]:
    """(start, end) of each entry object of the ``compounds`` list."""
    decoder = json.JSONDecoder()
    position, spans = _list_start(text), []
    while True:
        while text[position] in " \t\r\n,":
            position += 1
        if text[position] == "]":
            return spans
        _, end = decoder.raw_decode(text, position)
        spans.append((position, end))
        position = end
