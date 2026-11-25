"""List editable systems across draft folders (diagram-review parity)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from phase_diagrams.constants.draft_source_order import DRAFT_SOURCE_ORDER
from phase_diagrams.review.draft_content_score import draft_content_score
from phase_diagrams.review.draft_image_finder import DraftImageFinder


class DraftSystemLister:
    """Scan work + dataset roots and merge per system id."""

    def __init__(self, *, work_root: Path, dataset_root: Path) -> None:
        self._work = work_root
        self._dataset = dataset_root

    def roots(self) -> list[tuple[str, Path]]:
        return [
            ("auto-full", self._work / "auto-full"),
            ("candidates", self._work / "candidates"),
            ("systems", self._dataset / "systems"),
            ("starts", self._work / "starts"),
        ]

    def list_systems(self) -> list[dict[str, Any]]:
        by_id: dict[str, dict[str, Any]] = {}
        for kind, root in self.roots():
            if not root.is_dir():
                continue
            for path in sorted(root.glob("*.json")):
                data = self._load_json(path)
                if data is None:
                    continue
                entry = self._entry(path, kind, data)
                key = path.stem.lower()
                if key not in by_id:
                    by_id[key] = entry
                    continue
                self._merge(by_id[key], entry, kind)
        return sorted(by_id.values(), key=lambda e: str(e["id"]).lower())

    def resolve(self, system_id: str, preferred: str | None = None) -> dict[str, Any]:
        """Return the richest (or preferred) draft entry for a system id."""
        needle = system_id.lower()
        found: dict[str, dict[str, Any]] = {}
        for kind, root in self.roots():
            if not root.is_dir():
                continue
            for path in root.glob("*.json"):
                if path.stem.lower() != needle:
                    continue
                data = self._load_json(path)
                if data is None:
                    continue
                found[kind] = self._entry(path, kind, data)
                break
        if not found:
            raise FileNotFoundError(f"No draft JSON for {system_id}")
        if preferred and preferred in found and int(found[preferred].get("contentScore") or 0) > 0:
            return found[preferred]
        return max(
            found.values(),
            key=lambda e: (
                int(e.get("contentScore") or 0),
                -DRAFT_SOURCE_ORDER.index(str(e["draftSource"]))
                if e.get("draftSource") in DRAFT_SOURCE_ORDER
                else -99,
            ),
        )

    def _entry(self, path: Path, kind: str, data: dict[str, Any]) -> dict[str, Any]:
        comps = data.get("components") or []
        png = DraftImageFinder.find(
            work_root=self._work,
            dataset_root=self._dataset,
            system_id=path.stem,
            draft_kind=kind,
        )
        report = self._work / "auto-full" / f"{path.stem}.md"
        return {
            "id": path.stem,
            "system": data.get("system", path.stem),
            "components": comps,
            "diagramKind": "binary" if len(comps) == 2 else "ternary",
            "source": data.get("source"),
            "draftSource": kind,
            "availableSources": [kind],
            "draftPath": str(path),
            "n_invariants": len(data.get("invariantPoints") or []),
            "n_boundaries": len(data.get("boundaryCurves") or []),
            "n_isotherms": len(data.get("isotherms") or []),
            "n_liquidus": len(data.get("liquidus") or []),
            "contentScore": draft_content_score(data),
            "hasImage": png is not None,
            "hasReport": report.is_file(),
            "imagePath": str(png) if png else None,
        }

    def _merge(self, existing: dict[str, Any], entry: dict[str, Any], kind: str) -> None:
        sources = set(existing.get("availableSources") or [])
        sources.add(kind)
        existing["availableSources"] = sorted(
            sources,
            key=lambda k: DRAFT_SOURCE_ORDER.index(k) if k in DRAFT_SOURCE_ORDER else 99,
        )
        existing["hasImage"] = bool(existing.get("hasImage")) or bool(entry.get("hasImage"))
        better = int(entry.get("contentScore") or 0) > int(existing.get("contentScore") or 0) or (
            int(entry.get("contentScore") or 0) == int(existing.get("contentScore") or 0)
            and DRAFT_SOURCE_ORDER.index(kind)
            < DRAFT_SOURCE_ORDER.index(str(existing["draftSource"]))
        )
        if not better:
            return
        for field in (
            "id",
            "system",
            "components",
            "diagramKind",
            "source",
            "draftSource",
            "draftPath",
            "n_invariants",
            "n_boundaries",
            "n_isotherms",
            "n_liquidus",
            "contentScore",
            "hasImage",
            "hasReport",
            "imagePath",
        ):
            existing[field] = entry[field]
        existing["hasImage"] = bool(entry.get("hasImage")) or bool(existing.get("hasImage"))

    @staticmethod
    def _load_json(path: Path) -> dict[str, Any] | None:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
        return data if isinstance(data, dict) else None
