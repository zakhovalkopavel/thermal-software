"""
phase_diagrams.rendering.ternary_overlay_renderer — Review PNG of a ternary: fields filled in semi-transparent colours, boundaries and isotherms in their own colours.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Review outputs
"""
from __future__ import annotations

import colorsys

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

from phase_diagrams.models.line_scale import LineScale
from phase_diagrams.models.traced_curve import TracedCurve

_LINES = {
    "boundary": ((0, 60, 220), 3, "Field boundaries"),
    "isotherm": ((225, 30, 0), 2, "Isotherms (°C)"),
    "inversion": ((0, 140, 60), 2, "Polymorph (inversion) lines"),
    "immiscibility": ((200, 0, 200), 3, "Two-liquid boundary"),
}
_DIVIDERS = ("boundary", "inversion", "immiscibility")
_BARRIER_PX = 3
_FILL_ALPHA = 85
_SEED_SEARCH_PX = 6
_DIRECTION_SPAN_PX = 15.0
_LABEL_GAP_PX = 3
_STEEP_COS = 0.26
_LABEL_PLACES = (0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8)
_NAME_STEP_PX = 6
_NAME_SEARCH_PX = 60
_MARGIN_PX = 60
_FONT_PX = 22
_MIN_FONT_PX = 10
_TEXT_STROKE_PX = 2
_LEGEND_PAD_PX = 10
_LEGEND_SWATCH_PX = 50
_LEGEND_TEXT_PX = 60
_LEGEND_LEADING_PX = 8
_TEXT = (20, 20, 20)
_FONT = "DejaVuSans.ttf"
_PALETTE = [
    (230, 25, 75), (60, 180, 75), (255, 225, 25), (0, 130, 200), (245, 130, 48), (145, 30, 180),
    (70, 240, 240), (240, 50, 230), (210, 245, 60), (250, 190, 212), (0, 128, 128), (220, 190, 255),
    (170, 110, 40), (255, 250, 200), (128, 0, 0), (170, 255, 195), (128, 128, 0), (255, 215, 180),
    (0, 0, 128), (128, 128, 128),
]


def render_ternary_overlay(
    image: np.ndarray,
    box: tuple[float, float, float, float],
    curves: list[TracedCurve],
    fields: list[dict],
    corners: list[tuple[float, float]],
    margin: int | None = None,
    font_px: int | None = None,
    scale: LineScale | None = None,
) -> tuple[Image.Image, list[str]]:
    """Crop ``box`` (page pixels, plus ``margin``) and draw the fields and curves; returns the image and a log.

    The triangle edges and the curves of kind boundary, inversion and immiscibility
    divide the triangle into regions. Each field ``{"name", "legend", "ring", "seed"}``
    (page pixels) colours the region containing its seed; without a seed, the interior point
    of its ring polygon farthest from the ring is used. A seed on no region, or in a
    region already coloured by another field, is logged (missing divider or wrong ring).
    The name is written in the field, the legend text (default: the name) in the legend.
    Every isotherm piece gets its temperature written above it, along the curve (bottom
    to top along a steep piece), at its middle or the nearest place clear of field names
    and earlier labels; a field name still covering a label moves to the nearest free
    point of its region (up to 60 px from the seed).
    ``info["pageOrigin"]`` ("x0,y0") is the page pixel of the top-left corner.
    ``margin`` defaults to 60 px and ``font_px`` to 22 px; these, the line widths,
    the legend layout and the search distances are for the reference line width,
    scaled by ``scale``, so the overlay looks the same at any render resolution.
    """
    s = scale or LineScale()
    margin = s.count(_MARGIN_PX) if margin is None else margin
    font_px = s.count(_FONT_PX) if font_px is None else font_px
    stroke = s.count(_TEXT_STROKE_PX)
    x0 = max(0, int(box[0]) - margin)
    y0 = max(0, int(box[1]) - margin)
    x1 = min(image.shape[1], int(box[2]) + margin)
    y1 = min(image.shape[0], int(box[3]) + margin)
    size = (x1 - x0, y1 - y0)
    gray = image if image.ndim == 2 else np.asarray(Image.fromarray(image).convert("L"))
    out = Image.fromarray(gray[y0:y1, x0:x1]).convert("RGBA")
    log: list[str] = []

    def local(p):
        return p[0] - x0, p[1] - y0

    triangle = [local(c) for c in corners]
    inside_image = Image.new("1", size, 0)
    ImageDraw.Draw(inside_image).polygon(triangle, fill=1)
    barrier_image = Image.new("1", size, 0)
    barrier = ImageDraw.Draw(barrier_image)
    barrier.line([*triangle, triangle[0]], fill=1, width=s.count(_BARRIER_PX))
    for curve in curves:
        if curve.kind in _DIVIDERS and len(curve.pixels) > 1:
            barrier.line([local(p) for p in curve.pixels], fill=1, width=s.count(_BARRIER_PX))
    free = np.array(inside_image, bool) & ~np.array(barrier_image, bool)
    regions, _ = ndimage.label(free)

    layer_pixels = np.zeros((size[1], size[0], 4), np.uint8)
    owners: dict[int, str] = {}
    placed: list[tuple[str, str, tuple[int, int, int], tuple[float, float], int]] = []
    for number, field in enumerate(fields):
        colour = _colour(number)
        seed = local(field["seed"]) if field.get("seed") is not None else _inner_point([local(p) for p in field["ring"]], size)
        region = _region_at(regions, seed, s.count(_SEED_SEARCH_PX))
        if region == 0:
            log.append(f"field {field['name']}: seed {_px(seed, x0, y0)} lies on a line or outside the triangle; not filled")
            continue
        if region in owners:
            log.append(f"field {field['name']}: same region as {owners[region]} (no dividing line between them); not filled")
            continue
        owners[region] = field["name"]
        layer_pixels[regions == region] = (*colour, _FILL_ALPHA)
        placed.append((field["name"], field.get("legend") or field["name"], colour, seed, region))
    layer = Image.fromarray(layer_pixels, "RGBA")
    out = Image.alpha_composite(out, layer)
    draw = ImageDraw.Draw(out)
    font = _font(font_px)
    small = _font(max(s.count(_MIN_FONT_PX), font_px * 2 // 3))
    for kind in ("isotherm", "inversion", "immiscibility", "boundary"):
        colour, width, _ = _LINES[kind]
        for curve in curves:
            if curve.kind == kind and len(curve.pixels) > 1:
                draw.line([local(p) for p in curve.pixels], fill=colour, width=s.count(width))
    occupied = np.zeros((size[1], size[0]), bool)
    labels = np.zeros((size[1], size[0]), bool)
    for name, _, _, seed, _ in placed:
        occupied[_box(draw, seed, name, small, stroke, occupied.shape)] = True
    for curve in curves:
        if curve.kind == "isotherm" and curve.temperature_C is not None and len(curve.pixels) > 1:
            ink = _label_above(out, occupied, [local(p) for p in curve.pixels], f"{curve.temperature_C:g}", small,
                               _LINES["isotherm"][0], stroke, s)
            if ink is not None:
                occupied[ink[0]] |= ink[1]
                labels[ink[0]] |= ink[1]
    for name, _, _, seed, region in placed:
        position = _name_position(draw, seed, name, small, stroke, labels, regions, region,
                                  s.count(_NAME_STEP_PX), s.count(_NAME_SEARCH_PX))
        draw.text(position, name, fill=_TEXT, font=small, anchor="mm", stroke_width=stroke, stroke_fill=(255, 255, 255))

    row = 0
    pad, swatch, text_x = s.count(_LEGEND_PAD_PX), s.count(_LEGEND_SWATCH_PX), s.count(_LEGEND_TEXT_PX)
    line_height = font_px + s.count(_LEGEND_LEADING_PX)
    for kind in _LINES:
        if any(c.kind == kind for c in curves):
            colour, width, text = _LINES[kind]
            y = pad + row * line_height + font_px // 2
            draw.line([(pad, y), (swatch, y)], fill=colour, width=s.count(width) + 1)
            draw.text((text_x, pad + row * line_height), text, fill=colour, font=font)
            row += 1
    for _, legend, colour, _, _ in placed:
        top = pad + row * line_height
        draw.rectangle([pad, top + stroke, swatch, top + font_px], fill=(*colour, 160), outline=_TEXT)
        draw.text((text_x, top), legend, fill=_TEXT, font=font)
        row += 1
    out = out.convert("RGB")
    out.info["pageOrigin"] = f"{x0},{y0}"
    return out, log


def _colour(number: int) -> tuple[int, int, int]:
    if number < len(_PALETTE):
        return _PALETTE[number]
    r, g, b = colorsys.hsv_to_rgb((number * 0.61803398875) % 1.0, 0.75, 0.95)
    return int(r * 255), int(g * 255), int(b * 255)


def _font(size: int) -> ImageFont.ImageFont | ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(_FONT, size)
    except OSError:
        return ImageFont.load_default(size=size)


def _box(draw: ImageDraw.ImageDraw, centre, text: str, font, stroke: int, shape: tuple[int, int]) -> tuple[slice, slice]:
    left, top, right, bottom = (int(round(v)) for v in draw.textbbox(centre, text, font=font, anchor="mm", stroke_width=stroke))
    return slice(max(0, top), max(0, min(shape[0], bottom))), slice(max(0, left), max(0, min(shape[1], right)))


def _name_position(draw, seed, name: str, font, stroke: int, labels: np.ndarray, regions: np.ndarray, region: int,
                   step: int, reach: int) -> tuple[float, float]:
    """The seed, or the nearest point around it (rings ``step`` apart, up to ``reach``) inside the region whose name box covers no label."""
    for radius in range(0, reach + 1, step):
        for k in range(8 if radius else 1):
            angle = np.pi * k / 4
            point = (seed[0] + radius * np.cos(angle), seed[1] - radius * np.sin(angle))
            x, y = int(round(point[0])), int(round(point[1]))
            if not (0 <= y < regions.shape[0] and 0 <= x < regions.shape[1]) or regions[y, x] != region:
                continue
            if not labels[_box(draw, point, name, font, stroke, labels.shape)].any():
                return point
    return seed


def _label_above(out: Image.Image, occupied: np.ndarray, pixels: list[tuple[float, float]], text: str, font, colour,
                 stroke: int, scale: LineScale):
    """Write ``text`` along the curve on its upper side, at the arc-length middle or the nearest free place.

    Places along the curve are tried from the middle outwards; the first whose
    label covers no ``occupied`` pixel (field names, earlier labels) is used, else
    the middle. Returns the label's pixels as (image slices, mask) or None. The
    text reads left to right; along a curve steeper than 75° it reads bottom to top.
    """
    points = np.asarray(pixels, float)
    length = np.concatenate([[0.0], np.cumsum(np.linalg.norm(np.diff(points, axis=0), axis=1))])
    left, top, right, bottom = font.getbbox(text, stroke_width=stroke)
    flat = Image.new("RGBA", (right - left + 2 * stroke, bottom - top + 2 * stroke), (0, 0, 0, 0))
    ImageDraw.Draw(flat).text((stroke - left, stroke - top), text, fill=colour, font=font, stroke_width=stroke,
                              stroke_fill=(255, 255, 255))
    lift = (bottom - top) / 2.0 + scale.length(_LABEL_GAP_PX)
    span = scale.length(_DIRECTION_SPAN_PX)
    chosen = None
    for fraction in _LABEL_PLACES:
        label, corner = _placed_label(flat, points, length, fraction * length[-1], lift, span)
        ink = _clipped(np.asarray(label)[:, :, 3] > 0, corner, occupied.shape)
        if chosen is None:
            chosen = (label, corner, ink)
        if ink is not None and not occupied[ink[0]][ink[1]].any():
            chosen = (label, corner, ink)
            break
    label, corner, ink = chosen
    out.paste(label, corner, label)
    return ink


def _placed_label(flat: Image.Image, points: np.ndarray, length: np.ndarray, at: float, lift: float, span: float):
    """The label rotated along the curve at arc length ``at`` (direction over ±``span``) and its top-left corner, ``lift`` px on the upper side."""
    centre = np.array([np.interp(at, length, points[:, i]) for i in (0, 1)])
    before = np.array([np.interp(at - span, length, points[:, i]) for i in (0, 1)])
    after = np.array([np.interp(at + span, length, points[:, i]) for i in (0, 1)])
    direction = after - before
    if np.linalg.norm(direction) < 1e-9:
        direction = np.array([1.0, 0.0])
    direction /= np.linalg.norm(direction)
    if direction[0] < 0:
        direction = -direction
    if direction[1] > 0 and direction[0] < _STEEP_COS:
        direction = -direction
    normal = np.array([direction[1], -direction[0]])
    label = flat.rotate(float(np.degrees(np.arctan2(-direction[1], direction[0]))), resample=Image.BICUBIC, expand=True)
    position = centre + normal * lift
    return label, (int(round(position[0] - label.width / 2)), int(round(position[1] - label.height / 2)))


def _clipped(mask: np.ndarray, corner: tuple[int, int], shape: tuple[int, int]):
    """(image slices, mask part) of ``mask`` placed at ``corner``, clipped to ``shape``; None when fully outside."""
    x, y = corner
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(shape[1], x + mask.shape[1]), min(shape[0], y + mask.shape[0])
    if x1 <= x0 or y1 <= y0:
        return None
    return (slice(y0, y1), slice(x0, x1)), mask[y0 - y:y1 - y, x0 - x:x1 - x]


def _inner_point(ring: list[tuple[float, float]], size: tuple[int, int]) -> tuple[float, float]:
    """Interior pixel of the ring polygon farthest from its outline."""
    polygon = Image.new("1", size, 0)
    ImageDraw.Draw(polygon).polygon(ring, fill=1)
    inside = np.array(polygon, bool)
    if not inside.any():
        xs, ys = zip(*ring)
        return sum(xs) / len(xs), sum(ys) / len(ys)
    distance = ndimage.distance_transform_edt(inside)
    y, x = np.unravel_index(int(distance.argmax()), distance.shape)
    return float(x), float(y)


def _region_at(regions: np.ndarray, seed: tuple[float, float], reach: int) -> int:
    x, y = int(round(seed[0])), int(round(seed[1]))
    for radius in range(reach + 1):
        window = regions[max(0, y - radius):y + radius + 1, max(0, x - radius):x + radius + 1]
        labels = window[window > 0]
        if labels.size:
            return int(np.bincount(labels).argmax())
    return 0


def _px(point: tuple[float, float], x0: int, y0: int) -> str:
    return f"({point[0] + x0:.0f}, {point[1] + y0:.0f})"
