"""
yaws1999.dataset — Thin adapter over ``source_extract.tables``.

Applies Yaws column schemas, ``PAGE_OFFSET`` / ``REF_KEY``, and maps DjVu
provenance fields (``djvuPages`` / ``djvuPage``) to the library's generic
``sourcePages`` / ``sourcePage`` (and back for debug JSON).
"""
from __future__ import annotations

from typing import Any

from source_extract.tables.columns import (
    align_values,
    attach_column_units,
    coalesce_header_labels,
    column_keys,
    columns_from_header,
    expand_row as _expand_row,
    header_tokens,
    parse_equation_units,
)
from source_extract.tables.dataset import (
    pages_from_parsed as _pages_from_parsed,
    shape_columns as _shape_columns_generic,
    to_dataset_table as _to_dataset_table,
    to_debug_table as _to_debug_table,
)
from source_extract.tables.naming import dataset_file_name, debug_file_name, title_slug

from yaws1999.column_schemas import schema_for
from yaws1999.constants import PAGE_OFFSET, REF_KEY

__all__ = [
    "align_values",
    "attach_column_units",
    "coalesce_header_labels",
    "column_keys",
    "columns_from_header",
    "dataset_file_name",
    "debug_file_name",
    "expand_row",
    "header_tokens",
    "parse_equation_units",
    "title_slug",
    "to_dataset_table",
    "to_debug_table",
]


def _with_source_pages(parsed: dict[str, Any]) -> dict[str, Any]:
    """Copy ``parsed`` with DjVu page fields mapped to generic source page keys."""
    out = dict(parsed)
    if out.get("sourcePages") is None and out.get("djvuPages") is not None:
        out["sourcePages"] = out["djvuPages"]
    rows = []
    for row in out.get("rows") or []:
        mapped = dict(row)
        if mapped.get("sourcePage") is None and mapped.get("djvuPage") is not None:
            mapped["sourcePage"] = mapped["djvuPage"]
        rows.append(mapped)
    out["rows"] = rows
    return out


def _shape_columns(parsed: dict[str, Any]) -> list[dict[str, str | None]]:
    fixed = schema_for(parsed.get("id"))
    if fixed is not None:
        return fixed
    return _shape_columns_generic(parsed)


def expand_row(
    row: dict[str, Any],
    columns: list[dict[str, str | None]] | list[str],
    *,
    keep_debug: bool = False,
) -> dict[str, Any]:
    """Map a parser row onto named columns; debug keeps Yaws ``djvuPage``."""
    mapped = dict(row)
    if mapped.get("sourcePage") is None and mapped.get("djvuPage") is not None:
        mapped["sourcePage"] = mapped["djvuPage"]
    out = _expand_row(mapped, columns, keep_debug=keep_debug)
    if keep_debug and "sourcePage" in out:
        out["djvuPage"] = out.pop("sourcePage")
    return out


_EQ_META_KEYS = (
    "equations",
    "equationSource",
    "equationPage",
    "coefficients",
)

_LEGACY_EQ_DOC_KEYS = (
    "equation",
    "definition",
    "estimationEquation",
    "derivedDefinitions",
    "equationDjvuPage",
)


def _primary_equation(parsed: dict[str, Any]) -> str | None:
    """First curated / OCR equation — used only for unit footnote parsing."""
    eqs = parsed.get("equations") or []
    if eqs:
        return str(eqs[0])
    eq = parsed.get("equation")
    return str(eq) if eq else None


def _with_equation_meta(doc: dict[str, Any], parsed: dict[str, Any]) -> dict[str, Any]:
    """Copy curated equation metadata onto dataset/debug docs when present.

    Public docs expose ``equations`` only (no singular ``equation`` or legacy
    alternate fields). Metadata is inserted **before** ``rows``.
    """
    for key in _LEGACY_EQ_DOC_KEYS:
        doc.pop(key, None)

    meta: dict[str, Any] = {}
    for key in _EQ_META_KEYS:
        if key in parsed and parsed[key] is not None:
            meta[key] = parsed[key]
    # Always emit equations list when curated source set it (may be empty).
    if "equations" in parsed and "equations" not in meta:
        meta["equations"] = list(parsed.get("equations") or [])

    if not meta:
        return doc
    if "rows" not in doc:
        doc.update(meta)
        return doc
    out: dict[str, Any] = {}
    for key, value in doc.items():
        if key == "rows":
            out.update(meta)
        out[key] = value
    return out


def to_dataset_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Public processed-table document (no OCR provenance)."""
    prepared = _with_source_pages(parsed)
    prepared["columns"] = _shape_columns(prepared)
    # Vendor helper still reads singular ``equation`` for unit footnotes.
    primary = _primary_equation(prepared)
    if primary is not None:
        prepared["equation"] = primary
    doc = _to_dataset_table(
        prepared,
        default_ref_key=REF_KEY,
        page_offset=PAGE_OFFSET,
    )
    return _with_equation_meta(doc, prepared)


def to_debug_table(parsed: dict[str, Any]) -> dict[str, Any]:
    """Debug document: dataset-shaped rows + document-level OCR provenance.

    Per-row ``raw`` / ``djvuPage`` are not included — those stay out of both
    processed and debug row objects. Page span is ``djvuPages`` on the doc.
    """
    prepared = _with_source_pages(parsed)
    prepared["columns"] = _shape_columns(prepared)
    primary = _primary_equation(prepared)
    if primary is not None:
        prepared["equation"] = primary
    doc = _to_debug_table(prepared, default_ref_key=REF_KEY)
    if doc.get("sourcePages") is not None:
        doc["djvuPages"] = doc.pop("sourcePages")
    elif parsed.get("djvuPages") is not None:
        doc["djvuPages"] = parsed["djvuPages"]
    # Equation meta before rows; debug ``unparsed`` stays after rows.
    return _with_equation_meta(doc, prepared)
