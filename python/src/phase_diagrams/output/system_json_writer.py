"""
phase_diagrams.output.system_json_writer — Compact layout of a binary system file.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Output: binary system JSON
Layout reference: shared/processed/phase-diagrams/systems/mgo-sio2.json
"""
from __future__ import annotations

import json

_EXPANDED_OBJECTS = ("source", "nbsCrossCheck", "digitization", "variantChoice")
_BLOCK_ARRAYS = {
    "invariantPoints": ("temperature_C", "sources", "notes"),
    "solidSolutions": ("source", "notes"),
    "unmatchedSourcePoints": ("sources", "notes"),
    "inversions": (),
    "liquidus": ("points",),
}
_NBS_SOURCE_BREAKS = ("reported", "converted_wt", "comparison")
_CRITICAL_POINT_BREAKS = ("read",)


def write_system_json(system: dict) -> str:
    """Serialize ``system`` in the hand-written layout of the binary files (ends with a newline)."""
    lines = ["{"]
    keys = list(system.keys())
    for index, key in enumerate(keys):
        comma = "," if index < len(keys) - 1 else ""
        value = system[key]
        prefix = f"  {_dump(key)}: "
        if key in _EXPANDED_OBJECTS and isinstance(value, dict):
            lines.append(prefix + "{")
            lines.extend(_object_lines(value, "    "))
            lines.append("  }" + comma)
        elif key in _BLOCK_ARRAYS and isinstance(value, list) and value:
            lines.append(prefix + "[")
            for item_index, item in enumerate(value):
                item_comma = "," if item_index < len(value) - 1 else ""
                block = _block(item, "    ", _BLOCK_ARRAYS[key], key)
                block[-1] += item_comma
                lines.extend(block)
            lines.append("  ]" + comma)
        elif key == "liquidImmiscibility" and isinstance(value, dict):
            lines.append(prefix + "{")
            inner = list(value.keys())
            for inner_index, inner_key in enumerate(inner):
                inner_comma = "," if inner_index < len(inner) - 1 else ""
                inner_value = value[inner_key]
                if inner_key == "criticalPoint" and isinstance(inner_value, dict):
                    block = _block(inner_value, "    ", _CRITICAL_POINT_BREAKS, inner_key, label=_dump(inner_key) + ": ")
                    block[-1] += inner_comma
                    lines.extend(block)
                else:
                    lines.append(f"    {_dump(inner_key)}: {_inline(inner_value)}{inner_comma}")
            lines.append("  }" + comma)
        else:
            lines.append(prefix + _inline(value) + comma)
    lines.append("}")
    return "\n".join(lines) + "\n"


def _object_lines(value: dict, indent: str) -> list[str]:
    keys = list(value.keys())
    return [
        f"{indent}{_dump(k)}: {_inline(value[k])}{',' if i < len(keys) - 1 else ''}"
        for i, k in enumerate(keys)
    ]


def _block(item: dict, indent: str, breaks: tuple[str, ...], array_key: str, label: str = "") -> list[str]:
    """Object on one or more lines, a new line before each key in ``breaks``."""
    continuation = indent + "  "
    groups: list[list[str]] = [[]]
    for key in item:
        range_list = key.startswith("range_wt_") and isinstance(item[key], list)
        if (key in breaks or range_list) and groups[-1]:
            groups.append([])
        groups[-1].append(key)
    lines: list[str] = []
    for group_index, group in enumerate(groups):
        parts = []
        for key in group:
            if key == "sources" and array_key in ("invariantPoints", "unmatchedSourcePoints"):
                parts.append(None)
            else:
                parts.append(f"{_dump(key)}: {_inline(item[key])}")
        last_group = group_index == len(groups) - 1
        start = (indent + label + "{ ") if group_index == 0 else continuation
        if None in parts:
            lines.extend(_sources_lines(item["sources"], start, continuation, last_group))
            continue
        text = start + ", ".join(parts)
        text += " }" if last_group else ","
        lines.append(text)
    return lines


def _sources_lines(sources: list[dict], start: str, continuation: str, last_group: bool) -> list[str]:
    closing = " }" if last_group else ","
    if len(sources) == 1 and sources[0].get("ref") != "nsrds-nbs-61-1":
        return [f'{start}"sources": [ {_inline(sources[0])} ]{closing}']
    lines = [f'{start}"sources": [']
    inner = continuation + "  "
    for index, source in enumerate(sources):
        comma = "," if index < len(sources) - 1 else ""
        if source.get("ref") == "nsrds-nbs-61-1":
            block = _block(source, inner, _NBS_SOURCE_BREAKS, "source")
        else:
            block = [f"{inner}{_inline(source)}"]
        block[-1] += comma
        lines.extend(block)
    lines.append(continuation + "]" + closing)
    return lines


def _inline(value) -> str:
    if isinstance(value, dict):
        if not value:
            return "{}"
        return "{ " + ", ".join(f"{_dump(k)}: {_inline(v)}" for k, v in value.items()) + " }"
    if isinstance(value, list):
        if not value:
            return "[]"
        if any(isinstance(v, dict) for v in value):
            return "[ " + ", ".join(_inline(v) for v in value) + " ]"
        return "[" + ", ".join(_inline(v) for v in value) + "]"
    return _dump(value)


def _dump(value) -> str:
    return json.dumps(value, ensure_ascii=False)
