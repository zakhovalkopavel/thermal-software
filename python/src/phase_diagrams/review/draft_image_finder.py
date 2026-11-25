"""Locate an overlay / auto-full PNG next to a draft JSON."""

from __future__ import annotations

from pathlib import Path


class DraftImageFinder:
    """Stateless path probes for draft background images."""

    @staticmethod
    def find(
        *,
        work_root: Path,
        dataset_root: Path,
        system_id: str,
        draft_kind: str,
    ) -> Path | None:
        stem = system_id
        candidates: list[Path] = []
        if draft_kind == "auto-full":
            candidates.append(work_root / "auto-full" / f"{stem}.png")
        if draft_kind in {"candidates", "systems"}:
            candidates.append(work_root / "overlays" / f"{stem}.png")
            candidates.append(dataset_root / "overlays" / f"{stem}.png")
        candidates.extend(
            [
                work_root / "auto-full" / f"{stem}.png",
                work_root / "overlays" / f"{stem}.png",
                work_root / "candidates" / f"{stem}.png",
                dataset_root / "overlays" / f"{stem}.png",
            ]
        )
        seen: set[Path] = set()
        for path in candidates:
            if path in seen:
                continue
            seen.add(path)
            if path.is_file():
                return path
        return None
