"""
phase_diagrams.builders.ternary_structure_editor — Apply the structure edits of a curves config to a ternary file: move, rename or re-date points, set keys, append boundary curves, isotherms and inversions.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Ternary structure edits
"""
from __future__ import annotations

import copy
import json
import re

from phase_diagrams.builders.node_label_resolver import resolve_node_labels
from phase_diagrams.config.curves_config import CurvesConfig
from phase_diagrams.models.ternary_calibration import TernaryCalibration

_ATLAS_REF = "slag-atlas-1995"
_NUMBER = re.compile(r'[^,\]\}\s]+')


def edit_ternary_structure(text: str, config: CurvesConfig) -> tuple[str, list[str]]:
    """Apply ``config.edits`` and append the config entries marked ``new``; returns the new text and a log.

    An edit addresses one entry by a dotted ``path`` (object keys, list indexes,
    or an ``id`` for list elements that have one; ``""`` is the root). ``set``
    maps dotted keys below the entry to values; a missing last key is added.
    Setting ``id`` on an invariant renames it in every boundary-curve path.
    ``pixel`` (stored coordinates) moves a point: an entry with ``liquid_wt``
    gets the composition at that pixel and its atlas source the pixel; an entry
    with ``wt`` gets ``wt`` and ``pixel``. Pixels are rounded to whole pixels.
    ``new`` curves, isotherms and inversions are appended with ``polyline_wt``
    null (the filler fills them); an existing match is an error.
    Node labels in the written ``set`` values and entries (notes) are replaced by
    the invariant id at that pixel after all edits, else the stored pixel
    (``resolve_node_labels``), so the system file never refers to the node map.
    Raises ValueError for unknown paths or node labels, or a write that would
    change anything other than the requested keys.
    """
    system = json.loads(text)
    expected = copy.deepcopy(system)
    calibration = TernaryCalibration.from_system(system, config.pixel_origin)
    components = list(system["components"])
    log: list[str] = []
    invariants = _final_invariant_pixels(system, config)

    def resolved(value, where: str):
        return resolve_node_labels(value, config.nodes, invariants, f"{config.name}: {where}", log)

    def composition(pixel: tuple[float, float]) -> dict[str, float]:
        wt = calibration.to_wt(*calibration.stored_to_page(*pixel))
        a, b = round(wt[components[0]], 1), round(wt[components[1]], 1)
        return {components[0]: a + 0.0, components[1]: b + 0.0, components[2]: round(100.0 - a - b, 1) + 0.0}

    for edit in config.edits:
        path = _index_path(expected, edit["path"], config.name)
        entry = _resolve(expected, path, config.name)
        changes = resolved(dict(edit["set"]), f"edit {edit['path'] or '(root)'}")
        if edit["pixel"] is not None:
            pixel = [round(edit["pixel"][0]), round(edit["pixel"][1])]
            if "liquid_wt" in entry:
                atlas = next((i for i, s in enumerate(entry.get("sources", [])) if s.get("ref") == _ATLAS_REF), None)
                if atlas is None:
                    raise ValueError(f"{config.name}: {edit['path']} has no {_ATLAS_REF} source for the pixel")
                changes.update({"liquid_wt": composition(pixel), f"sources.{atlas}.pixel": pixel})
            elif "wt" in entry:
                changes.update({"wt": composition(pixel), "pixel": pixel})
            else:
                raise ValueError(f"{config.name}: {edit['path']} has neither liquid_wt nor wt for the pixel")
        old_id = entry.get("id")
        for key, value in changes.items():
            text = _set_key(text, expected, path, key, value, config.name)
        log.append(f"edit {edit['path'] or '(root)'}: " + ", ".join(f"{k} → {json.dumps(v, ensure_ascii=False)}" for k, v in changes.items()))
        new_id = changes.get("id")
        if new_id is not None and new_id != old_id and path.startswith("invariantPoints."):
            for index, curve in enumerate(expected.get("boundaryCurves", [])):
                if old_id in curve.get("path", []):
                    path = [new_id if p == old_id else p for p in curve["path"]]
                    text = _set_key(text, expected, f"boundaryCurves.{index}", "path", path, config.name)
                    log.append(f"boundary curve {curve['fields']}: path id {old_id} → {new_id}")

    appended = (
        ("boundaryCurves", config.curves, lambda e: {"fields": e["fields"], "path": e["path"]},
         lambda c, e: c.get("fields") == e["fields"] and c.get("path") == e["path"]),
        ("isotherms", config.isotherms,
         lambda e: {"field": e["field"], "temperature_C": e["temperature_C"], **({"part": e["part"]} if e["part"] > 1 else {})},
         lambda c, e: c.get("field") == e["field"] and c.get("temperature_C") == e["temperature_C"] and c.get("part", 1) == e["part"]),
        ("inversions", config.inversions, lambda e: {"phase": e["phase"], "change": e["change"], "temperature_C": e["temperature_C"], "source": e["source"]},
         lambda c, e: c.get("phase") == e["phase"] and c.get("change") == e["change"]),
    )
    for key, entries, make, same in appended:
        for entry in entries:
            if not entry["new"]:
                continue
            if any(same(c, entry) for c in expected.get(key, [])):
                raise ValueError(f"{config.name}: new {key} entry {make(entry)} already exists")
            value = make(entry)
            if key != "inversions":
                value["polyline_wt"] = None
            if entry["notes"]:
                value["notes"] = entry["notes"]
            value = resolved(value, f"new {key} entry {make(entry)}")
            text = _append(text, key, value)
            expected.setdefault(key, []).append(value)
            log.append(f"new {key} entry: " + json.dumps({k: v for k, v in value.items() if k != "polyline_wt"}, ensure_ascii=False))

    if json.loads(text) != expected:
        raise ValueError(f"{config.name}: structure edit changed more than the requested keys; file left unchanged")
    return text, log


def _final_invariant_pixels(system: dict, config: CurvesConfig) -> dict[str, tuple[float, float]]:
    """Invariant id → atlas pixel (stored coordinates) after every edit's ``pixel`` and ``id``."""
    scratch = copy.deepcopy(system)
    for edit in config.edits:
        path = _index_path(scratch, edit["path"], config.name)
        if not path.startswith("invariantPoints."):
            continue
        entry = _resolve(scratch, path, config.name)
        if edit["pixel"] is not None:
            entry["_pixel"] = [round(edit["pixel"][0]), round(edit["pixel"][1])]
        if "id" in edit["set"]:
            entry["id"] = edit["set"]["id"]
    out = {}
    for point in scratch.get("invariantPoints", []):
        pixel = point.get("_pixel") or next(
            (s.get("pixel") for s in point.get("sources", []) if s.get("ref") == _ATLAS_REF and s.get("pixel")), None)
        if pixel is not None:
            out[point["id"]] = (float(pixel[0]), float(pixel[1]))
    return out


def _index_path(data, path: str, name: str) -> str:
    """``path`` with every list element given by ``id`` replaced by its index."""
    node = data
    parts = []
    for part in path.split(".") if path else []:
        if isinstance(node, list):
            index = int(part) if part.isdigit() and int(part) < len(node) else next(
                (i for i, e in enumerate(node) if isinstance(e, dict) and e.get("id") == part), None)
            if index is None:
                raise ValueError(f"{name}: path '{path}': no element '{part}'")
            node = node[index]
            parts.append(str(index))
        elif isinstance(node, dict) and part in node:
            node = node[part]
            parts.append(part)
        else:
            raise ValueError(f"{name}: path '{path}': no key '{part}'")
    return ".".join(parts)


def _resolve(data, path: str, name: str):
    """The value at a dotted path of keys and list indexes (``""`` = root)."""
    node = data
    for part in path.split(".") if path else []:
        if isinstance(node, list):
            if not part.isdigit() or int(part) >= len(node):
                raise ValueError(f"{name}: path '{path}': no element '{part}'")
            node = node[int(part)]
        elif isinstance(node, dict) and part in node:
            node = node[part]
        else:
            raise ValueError(f"{name}: path '{path}': no key '{part}'")
    return node


def _set_key(text: str, data: dict, path: str, key: str, value, name: str) -> str:
    """Set ``key`` (dotted, below the index ``path``) in ``data`` and in ``text``; a missing last key is appended to its object."""
    parts = key.split(".")
    parent_path = ".".join(p for p in [path, *parts[:-1]] if p)
    parent = _resolve(data, parent_path, name)
    span_open = _span(text, parent_path)[0]
    last = parts[-1]
    if isinstance(parent, list):
        if not last.isdigit() or int(last) >= len(parent):
            raise ValueError(f"{name}: path '{parent_path}': no element '{last}'")
        parent[int(last)] = value
        start, end = _member(text, span_open, int(last))
        return text[:start] + _inline(value) + text[end:]
    if not isinstance(parent, dict):
        raise ValueError(f"{name}: path '{parent_path}' is not an object")
    exists = last in parent
    parent[last] = value
    if exists:
        start, end = _member(text, span_open, last)
        return text[:start] + _inline(value) + text[end:]
    members = list(_members(text, span_open))
    if not members:
        return text[:span_open + 1] + f' {json.dumps(last)}: {_inline(value)} ' + text[span_open + 1:]
    key_start, _, value_end = members[-1][1:]
    line_start = text.rfind("\n", 0, key_start) + 1
    indent = text[line_start:key_start]
    separator = f",\n{indent}" if indent.strip() == "" and line_start > span_open else ", "
    return text[:value_end] + f"{separator}{json.dumps(last)}: {_inline(value)}" + text[value_end:]


def _append(text: str, key: str, value: dict) -> str:
    """Append ``value`` to the top-level array ``key``, one entry per line like the previous one."""
    open_index = _span(text, "")[0]
    member = next((m for m in _members(text, open_index) if m[0] == key), None)
    if member is None:
        raise ValueError(f"no '{key}' array in system file")
    elements = list(_members(text, member[2]))
    if not elements:
        return text[:member[2] + 1] + f" {_inline(value)} " + text[member[2] + 1:]
    last_start, last_end = elements[-1][2], elements[-1][3]
    line_start = text.rfind("\n", 0, last_start) + 1
    indent = text[line_start:last_start]
    separator = f",\n{indent}" if indent.strip() == "" else ", "
    return text[:last_end] + separator + _inline(value) + text[last_end:]


def _inline(value) -> str:
    """One-line JSON in the dataset style: ``{ "key": value, … }``."""
    if isinstance(value, dict):
        if not value:
            return "{}"
        return "{ " + ", ".join(f"{json.dumps(k)}: {_inline(v)}" for k, v in value.items()) + " }"
    if isinstance(value, list) and any(isinstance(v, dict) for v in value):
        return "[ " + ", ".join(_inline(v) for v in value) + " ]"
    return json.dumps(value, ensure_ascii=False)


def _span(text: str, path: str) -> tuple[int, int]:
    """Start and end (exclusive) of the value at an index ``path`` in ``text``."""
    start = _skip(text, 0)
    end = _value_end(text, start)
    for part in path.split(".") if path else []:
        start, end = _member(text, start, int(part) if text[start] == "[" else part)
    return start, end


def _member(text: str, open_index: int, key: str | int) -> tuple[int, int]:
    for member in _members(text, open_index):
        if member[0] == key:
            return member[2], member[3]
    raise ValueError(f"no member '{key}' at offset {open_index}")


def _members(text: str, open_index: int):
    """``(key or index, key start, value start, value end)`` for each member of the object or array at ``open_index``."""
    is_object = text[open_index] == "{"
    index = _skip(text, open_index + 1)
    count = 0
    while text[index] not in "]}":
        key_start = index
        if is_object:
            key_end = _string_end(text, index)
            key = json.loads(text[index:key_end])
            index = _skip(text, _skip(text, key_end) + 1)
        else:
            key = count
        value_end = _value_end(text, index)
        yield key, key_start, index, value_end
        count += 1
        index = _skip(text, value_end)
        if text[index] == ",":
            index = _skip(text, index + 1)


def _skip(text: str, index: int) -> int:
    while text[index] in " \t\r\n":
        index += 1
    return index


def _string_end(text: str, index: int) -> int:
    index += 1
    while text[index] != '"':
        index += 2 if text[index] == "\\" else 1
    return index + 1


def _value_end(text: str, index: int) -> int:
    char = text[index]
    if char == '"':
        return _string_end(text, index)
    if char in "[{":
        depth = 0
        while True:
            char = text[index]
            if char == '"':
                index = _string_end(text, index)
                continue
            if char in "[{":
                depth += 1
            elif char in "]}":
                depth -= 1
                if depth == 0:
                    return index + 1
            index += 1
    return _NUMBER.match(text, index).end()
