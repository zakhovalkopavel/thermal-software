"""
phase_diagrams.validation.dataset_validator — Consistency checks over the whole dataset folder (PD001–PD018).

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Validation
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from phase_diagrams.config.source_registry import SourceRegistry
from phase_diagrams.constants.boundary_arrows import BOUNDARY_ARROWS
from phase_diagrams.figures.formula_molar_mass import formula_molar_mass
from phase_diagrams.constants.status_tolerance import STATUS_TOLERANCE
from phase_diagrams.models.validation_issue import ValidationIssue
from phase_diagrams.validation.inferred_temperature_check import inferred_temperature_problem

_ATLAS = "slag-atlas-1995"
_NBS = "nsrds-nbs-61-1"
_MELTING = re.compile(r"^(?P<phase>[\w-]+) melting point$")
_LIQUIDUS_UNITS = re.compile(r"wt% (?P<component>\w+)")


def validate_dataset(dataset_dir: Path | str) -> list[ValidationIssue]:
    """All issues found; errors make the dataset invalid, warnings do not."""
    dataset = Path(dataset_dir)
    issues: list[ValidationIssue] = []

    def add(code: str, level: str, file: str, message: str) -> None:
        issues.append(ValidationIssue(code, level, file, message))

    parsed: dict[str, object] = {}
    for path in sorted([*dataset.glob("*.json"), *dataset.glob("systems/*.json"), *dataset.glob("configs/*.json")]):
        relative = str(path.relative_to(dataset))
        try:
            parsed[relative] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            add("PD001", "error", relative, f"invalid JSON: {exc}")
    if "sources.json" not in parsed or "compounds.json" not in parsed:
        return issues

    registry = SourceRegistry(dataset)
    compounds = {c["id"]: c for c in parsed["compounds.json"].get("compounds", [])}
    status_keys = set(registry.status_keys)
    systems = {name: data for name, data in parsed.items() if name.startswith("systems/")}

    owners: dict[str, str] = {}
    all_points: dict[str, dict] = {}
    for name, system in systems.items():
        for point in system.get("invariantPoints", []):
            if point["id"] in owners:
                add("PD003", "error", name, f"invariant id '{point['id']}' also in {owners[point['id']]}")
            else:
                owners[point["id"]] = name
                all_points[point["id"]] = point

    figures = {f["figure"]: f for f in registry.figures(_ATLAS)}
    for figure in figures.values():
        _check_pages(add, registry, "sources.json", _ATLAS, figure, f"figure {figure['figure']}")

    for name, system in systems.items():
        points = {p["id"]: p for p in system.get("invariantPoints", [])}
        _check_phases(add, name, system, compounds)
        for point in system.get("invariantPoints", []):
            for key in ("liquid_wt", "secondLiquid_wt"):
                values = point.get(key)
                if values is not None and abs(sum(values.values()) - 100.0) > 0.1 + 1e-9:
                    add("PD002", "error", name, f"{point['id']}.{key} sums to {sum(values.values()):.2f}")
            _check_status(add, name, point, status_keys)
            for source in point.get("sources", []):
                if source.get("ref") == _ATLAS and "pixel" not in source:
                    add("PD009", "warning", name, f"{point['id']}: atlas source ({source.get('figure')}) without pixel")
        _check_liquidus(add, name, system, points, compounds)
        for path_name, node in _walk(system):
            status = node.get("status")
            if status is not None and status not in status_keys:
                add("PD006", "error", name, f"{path_name}: status '{status}' not in statusLegend")
            if node.get("ref") == "recalled" or status == "recalled":
                add("PD010", "warning", name, f"{path_name}: recalled value")
            if node.get("ref") == _ATLAS and "figure" in node:
                figure = figures.get(node["figure"])
                if figure is None:
                    add("PD008", "error", name, f"{path_name}: {node['figure']} not listed in sources.json")
                else:
                    for key in ("printedPage", "pdfPage"):
                        if key in node and node[key] != figure[key]:
                            add("PD008", "error", name, f"{path_name}: {node['figure']} {key} {node[key]} ≠ {figure[key]}")
            if node.get("ref") in registry.data["sources"]:
                _check_pages(add, registry, name, node["ref"], node, path_name)
        for curve in system.get("boundaryCurves", []):
            for point_id in curve.get("path", []):
                if point_id not in owners:
                    add("PD011", "error", name, f"boundary curve {curve.get('fields')}: path id '{point_id}' not found")
        _check_arrows(add, name, system, all_points)
        _check_inferred(add, name, system)
        empty = sum(1 for c in [*system.get("boundaryCurves", []), *system.get("isotherms", [])] if c.get("polyline_wt") is None)
        if empty:
            add("PD012", "warning", name, f"{empty} polyline_wt still null")
    return issues


def _walk(node, path: str = ""):
    if isinstance(node, dict):
        yield path or "/", node
        for key, value in node.items():
            yield from _walk(value, f"{path}/{key}")
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from _walk(value, f"{path}[{index}]")


def _check_pages(add, registry: SourceRegistry, file: str, ref: str, node: dict, where: str) -> None:
    if "printedPage" not in node or "pdfPage" not in node:
        return
    try:
        offset = registry.page_offset(ref)
    except ValueError:
        return
    if node["pdfPage"] - node["printedPage"] != offset:
        add("PD013", "error", file, f"{where}: pdfPage {node['pdfPage']} − printedPage {node['printedPage']} ≠ {offset} ({ref})")


def _check_phases(add, name: str, system: dict, compounds: dict) -> None:
    used = set(system.get("phases", []))
    for point in system.get("invariantPoints", []):
        used |= set(point.get("phases", []))
    used |= {b["phase"] for b in system.get("liquidus", [])}
    for curve in system.get("boundaryCurves", []):
        used |= set(curve.get("fields", []))
    used |= {i["field"] for i in system.get("isotherms", []) if "field" in i}
    used.discard(None)
    for phase in sorted(used - set(compounds)):
        add("PD004", "error", name, f"phase '{phase}' not in compounds.json")


def _check_arrows(add, name: str, system: dict, all_points: dict) -> None:
    """PD014 form of ``arrows``; PD015 arrow against the end temperatures; PD016 arrow pattern at each point."""
    sides: dict[str, list[str | None]] = {}
    for curve in system.get("boundaryCurves", []):
        path, arrows = list(curve.get("path", [])), curve.get("arrows")
        label = f"boundary curve {curve.get('fields')} {'→'.join(path)}"
        segments: list[tuple[str, str | None]] = list(zip(path, path[1:]))
        if arrows is None:
            for a, b in segments or [(p, None) for p in path]:
                sides.setdefault(a, []).append(None)
                if b is not None:
                    sides.setdefault(b, []).append(None)
            continue
        lengths = {len(path) - 1, len(path)} - {0}
        if not isinstance(arrows, list) or len(arrows) not in lengths or any(a not in BOUNDARY_ARROWS for a in arrows):
            add("PD014", "error", name, f"{label}: arrows must give one of {' '.join(BOUNDARY_ARROWS)} per path segment "
                                        "(plus one for an open end)")
            continue
        segments += [(path[-1], None)] * (len(arrows) - len(segments))
        for (a, b), arrow in zip(segments, arrows):
            if arrow in (">", "<") and b is not None:
                high, low = (a, b) if arrow == ">" else (b, a)
                t_high, t_low = (all_points.get(p, {}).get("temperature_C") for p in (high, low))
                if t_high is not None and t_low is not None and t_high <= t_low:
                    add("PD015", "warning", name, f"{label}: arrow points from {high} ({t_high:g} °C) to {low} ({t_low:g} °C), "
                                                  "the temperature does not fall")
            at_a, at_b = {">": ("out", "in"), "<": ("in", "out"), "<>": ("out", "out")}.get(arrow, (None, None))
            sides.setdefault(a, []).append(at_a)
            if b is not None:
                sides.setdefault(b, []).append(at_b)
    for point_id, found in sides.items():
        point = all_points.get(point_id, {})
        known = [d for d in found if d]
        into, away = known.count("in"), known.count("out")
        kind, reaction = point.get("type"), point.get("reaction")
        problem = None
        if kind == "ternary" and reaction == "eutectic" and away:
            problem = "eutectic with an arrow pointing away"
        elif kind == "binary" and reaction == "eutectic" and into:
            problem = "binary eutectic with an arrow pointing into it"
        elif kind == "saddle" and into:
            problem = "saddle with an arrow pointing into it"
        elif kind == "ternary" and reaction == "peritectic" and len(known) == len(found) and not (into and away):
            problem = "peritectic needs arrows both into and away from it"
        if problem:
            add("PD016", "warning", name, f"{point_id}: {problem} ({into} in, {away} away)")


def _check_inferred(add, name: str, system: dict) -> None:
    """PD017 arithmetic of an inferred isotherm temperature; PD018 its anchors are printed isotherms of the field."""
    isotherms = system.get("isotherms", [])
    printed = {(i.get("field"), i.get("temperature_C")) for i in isotherms if "inferred" not in i}
    for isotherm in isotherms:
        if "inferred" not in isotherm:
            continue
        label = f"isotherm {isotherm.get('field')} {isotherm.get('temperature_C')}"
        problem = inferred_temperature_problem(isotherm.get("temperature_C"), isotherm["inferred"])
        if problem:
            add("PD017", "error", name, f"{label}: {problem}")
            continue
        missing = [a for a in isotherm["inferred"]["from"] if (isotherm.get("field"), a) not in printed]
        if missing:
            add("PD018", "warning", name, f"{label}: inferred from {', '.join(f'{a:g}' for a in missing)} °C, "
                                          "which is not a printed isotherm of the field")


def _check_status(add, name: str, point: dict, status_keys: set[str]) -> None:
    status = point.get("status")
    nbs = [s for s in point.get("sources", []) if s.get("ref") == _NBS]
    within = [s for s in nbs if _within_tolerance(point, s)]
    if status == "confirmed" and not within:
        add("PD007", "error", name, f"{point['id']}: confirmed without an NBS source within tolerance")
    if status == "conflict":
        if nbs and within:
            add("PD007", "error", name, f"{point['id']}: conflict but NBS entry {within[0].get('entry')} is within tolerance")
        if not nbs and len(point.get("sources", [])) < 2:
            add("PD007", "error", name, f"{point['id']}: conflict needs NBS sources or two disagreeing sources")


def _within_tolerance(point: dict, source: dict) -> bool:
    reported = source.get("reported", {})
    converted = source.get("converted_wt") or {}
    temperature = point.get("temperature_C")
    if temperature is None or reported.get("temperature_C") is None or not converted:
        return False
    liquid = point.get("liquid_wt", {})
    delta_wt = max(abs(converted.get(c, 0.0) - liquid.get(c, 0.0)) for c in set(converted) | set(liquid))
    delta_t = abs(reported["temperature_C"] - temperature)
    return delta_t <= STATUS_TOLERANCE["temperature_C"] and delta_wt <= STATUS_TOLERANCE["composition_wt"] + 1e-9


def _check_liquidus(add, name: str, system: dict, points: dict, compounds: dict) -> None:
    branches = system.get("liquidus", [])
    if not branches:
        return
    match = _LIQUIDUS_UNITS.search(system.get("units", {}).get("liquidus", ""))
    if match is None:
        add("PD005", "error", name, "units.liquidus does not name the x component")
        return
    x_name = match.group("component")
    for branch in branches:
        label = f"liquidus {branch.get('phase')} {branch.get('from')}→{branch.get('to')}"
        values = branch.get("points", [])
        if any(b[0] < a[0] for a, b in zip(values, values[1:])):
            add("PD005", "error", name, f"{label}: points not sorted by composition")
        if not values:
            add("PD005", "error", name, f"{label}: no points")
            continue
        for ref, point in ((branch.get("from"), values[0]), (branch.get("to"), values[-1])):
            expected = _reference_point(ref, points, compounds, x_name)
            if expected is None:
                add("PD005", "error", name, f"{label}: unknown reference '{ref}'")
                continue
            composition, temperature = expected
            if composition is not None and abs(point[0] - composition) > 0.05:
                add("PD005", "error", name, f"{label}: {ref} at {point[0]} wt% {x_name}, expected {composition}")
            if temperature is not None and point[1] != temperature:
                add("PD005", "error", name, f"{label}: {ref} at {point[1]} °C, expected {temperature}")


def _reference_point(ref: str, points: dict, compounds: dict, x_name: str) -> tuple[float | None, float | None] | None:
    """(composition, temperature) a liquidus end must have; ``None`` parts are not checked."""
    if ref in points:
        point = points[ref]
        return point["liquid_wt"].get(x_name), point["temperature_C"]
    melting = _MELTING.match(ref or "")
    if melting is None or melting.group("phase") not in compounds:
        return None
    oxides = compounds[melting.group("phase")].get("oxideMoles", {})
    if not oxides or any(formula_molar_mass(oxide) is None for oxide in oxides):
        return None
    masses = {oxide: moles * formula_molar_mass(oxide) for oxide, moles in oxides.items()}
    return 100.0 * masses.get(x_name, 0.0) / sum(masses.values()), None
