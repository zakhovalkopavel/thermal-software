"""
phase_diagrams.builders.ternary_start_builder — Starting system file and curves config of a new ternary system.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § New ternary system
"""
from __future__ import annotations

import json

_ATLAS_REF = "slag-atlas-1995"
_CURVE_WIDTH = (1.3, 4.1)
_ISOTHERM_WIDTH = (0.5, 1.55)


def build_ternary_start(
    system_id: str,
    components: list[str],
    figure: dict,
    corners: dict[str, tuple[float, float]],
    corner_components: dict[str, str],
    page_size: tuple[int, int],
    line_px: float,
) -> tuple[str, str]:
    """``(system file text, curves config text)`` for a system with no data yet.

    The system file has the calibration (corner pixels, top/left/right, per
    component), the figure and pages of ``figure`` (an index entry), ``diagram``
    and ``caption`` null (to be read verbatim from a tile), and empty phases,
    invariant points, boundary curves, isotherms and inversions, each array written
    so that appended entries go one per line. The config points at
    ``systems/<system_id>.json`` and proposes stroke widths from the page line width
    (curves 1.3–4.1 ×, isotherms 0.5–1.55 ×, to 0.5 px).
    """
    width, height = page_size
    calibration = {corner_components[c]: [round(corners[c][0], 1), round(corners[c][1], 1)] for c in ("top", "left", "right")}
    source = {"ref": _ATLAS_REF, "figure": figure["figure"], "diagram": None,
              "printedPage": figure["printedPage"], "pdfPage": figure["pdfPage"], "caption": None}
    digitization = {
        "render": f"pdfPage {figure['pdfPage']} at 400 dpi ({width} × {height} px); pixel = full-page coordinates",
        "calibration": calibration,
        "method": "Corners from least-squares fits of the three triangle edges (pd-new). Corner components "
                  + ", ".join(f"{c} {corner_components[c]}" for c in ("top", "left", "right"))
                  + " from the corner labels; verify on the corner tiles.",
        "check": None,
    }
    lines = ["{",
             f'  "system": {json.dumps("-".join(components))},',
             f'  "components": {_inline(components)},',
             '  "units": { "temperature_C": "°C", "liquid_wt": "wt%" },',
             _block("source", source) + ",",
             _block("digitization", digitization) + ",",
             '  "phases": [],']
    arrays = ["invariantPoints", "boundaryCurves", "isotherms", "inversions"]
    lines += [f'  "{key}": [\n  ]' + ("," if i < len(arrays) - 1 else "") for i, key in enumerate(arrays)]
    lines.append("}")
    system_text = "\n".join(lines) + "\n"

    def widths(factors: tuple[float, float]) -> list[float]:
        return [round(f * line_px * 2) / 2 for f in factors]

    config_text = "\n".join([
        "{",
        f'  "systemFile": "systems/{system_id}.json",',
        f'  "pdfPage": {figure["pdfPage"]},',
        '  "pixelOrigin": [0, 0],',
        f'  "strokeWidth_px": {_inline(widths(_CURVE_WIDTH))},',
        f'  "isothermStrokeWidth_px": {_inline(widths(_ISOTHERM_WIDTH))},',
        '  "endpointPixels": {},',
        '  "invariants": [],',
        '  "curves": [],',
        '  "isotherms": []',
        "}",
    ]) + "\n"
    return system_text, config_text


def _block(key: str, value: dict) -> str:
    members = [f"    {json.dumps(k)}: {_inline(v)}" for k, v in value.items()]
    return f"  {json.dumps(key)}: {{\n" + ",\n".join(members) + "\n  }"


def _inline(value) -> str:
    if isinstance(value, dict):
        return "{ " + ", ".join(f"{json.dumps(k)}: {_inline(v)}" for k, v in value.items()) + " }" if value else "{}"
    if isinstance(value, float) and value.is_integer():
        return json.dumps(value)
    return json.dumps(value, ensure_ascii=False)
