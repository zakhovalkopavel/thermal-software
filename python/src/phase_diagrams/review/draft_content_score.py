"""Score how much editable geometry a draft JSON carries."""

from __future__ import annotations

from typing import Any


def draft_content_score(data: dict[str, Any]) -> int:
    """Empty auto-full scores 0; boundaries/liquidus weigh more than isotherms."""
    boundaries = data.get("boundaryCurves") or []
    isotherms = data.get("isotherms") or []
    invariants = data.get("invariantPoints") or []
    liquidus = data.get("liquidus") or []
    n_bc = sum(1 for bc in boundaries if bc.get("polyline_wt"))
    n_iso = sum(1 for iso in isotherms if iso.get("polyline_wt"))
    n_liq = sum(1 for br in liquidus if br.get("points"))
    return n_bc * 10 + n_iso * 3 + n_liq * 10 + len(invariants)
