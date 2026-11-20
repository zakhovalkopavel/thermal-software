"""Normalize alloy / grade identity strings to stable materialIds."""

from __future__ import annotations

import re
from typing import Any, Optional


_NON_ALNUM = re.compile(r"[^a-z0-9]+")
_SAE_DIGITS = re.compile(r"^(\d{3,5}[A-Z]?)$", re.I)
_UNS = re.compile(r"^[A-Z]\d{5}$", re.I)


def slug(text: str) -> str:
    s = text.strip().lower().replace("–", "-").replace("—", "-")
    s = _NON_ALNUM.sub("-", s).strip("-")
    return s


def normalize_uns(value: Any) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip().upper().replace(" ", "")
    if not s or s in {"—", "-", "N/A", "NA"}:
        return None
    if _UNS.match(s):
        return s
    return None


def normalize_sae(value: Any) -> Optional[str]:
    if value is None:
        return None
    s = str(value).strip().upper()
    if not s or s in {"—", "-", "N/A", "NA"}:
        return None
    # Drop leading SAE/AISI labels
    s = re.sub(r"^(SAE|AISI|ISI)[-_\s]?", "", s, flags=re.I)
    s = s.replace("TYPE", "").strip()
    # "M3, class 1" → M3-CLASS1 (comma / spaces → hyphen)
    s = re.sub(r"[\s,]+", "-", s)
    s = s.strip("-_")
    if not s:
        return None
    if _SAE_DIGITS.match(s):
        return s.upper()
    # Keep lettered tool steels / PH grades (H13, 17-4PH, M3-CLASS1, …)
    if re.match(r"^[A-Z0-9][A-Z0-9\-/.]*$", s, re.I) and len(s) <= 32:
        return s.upper()
    return None


def material_id(
    *,
    uns: Optional[str] = None,
    sae: Optional[str] = None,
    trade: Optional[str] = None,
    prefix: Optional[str] = None,
) -> str:
    """Prefer sae-/aisi- grade id; fall back to uns-<code>, then trade slug."""
    s = normalize_sae(sae)
    if s:
        # 4–5 digit carbon / alloy SAE → sae-1008; 3-digit & lettered tool/SS → aisi-304
        if s.isdigit() and len(s) >= 4:
            return f"sae-{s.lower()}"
        if len(s) >= 4 and s[:-1].isdigit() and s[-1].isalpha():
            return f"sae-{s.lower()}"
        return f"aisi-{s.lower()}"
    u = normalize_uns(uns)
    if u:
        return f"uns-{u.lower()}"
    t = slug(trade or "unknown")
    if prefix:
        return f"{prefix}-{t}"
    return t


def match_keys_from_row(row: dict[str, Any]) -> list[str]:
    """Collect possible identity keys for cross-table merging."""
    keys: list[str] = []
    uns = normalize_uns(
        row.get("uns_number") or row.get("uns") or row.get("UNS")
    )
    if uns:
        keys.append(f"uns:{uns}")
    for field in (
        "sae_isi_number",
        "aisi_sae_grade",
        "sae_designation",
        "sae_ps_number",
        "type",
        "steel",
        "grade",
    ):
        raw = row.get(field)
        if not raw:
            continue
        sae = normalize_sae(raw)
        if sae:
            keys.append(f"sae:{sae}")
        else:
            # e.g. odd labels that still need cross-table merge
            keys.append(f"trade:{slug(str(raw))}")
    for field in ("alloy", "designation_or_trade_name", "name"):
        if row.get(field):
            keys.append(f"trade:{slug(str(row[field]))}")
    # Deduplicate preserving order
    seen: set[str] = set()
    out: list[str] = []
    for k in keys:
        if k not in seen:
            seen.add(k)
            out.append(k)
    return out
