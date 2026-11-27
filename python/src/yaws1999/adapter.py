"""yaws1999 SourceAdapter stub — tables kind for the SE registry."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from source_extract.adapters.adapter_capabilities import AdapterCapabilities
from source_extract.adapters.adapter_roots import AdapterRoots
from source_extract.adapters.source_kind import SourceKind


class Yaws1999Adapter:
    """Tables adapter for Yaws 1999; command runners land in a later pass."""

    def __init__(
        self,
        *,
        dataset_root: Path | None = None,
        work_root: Path | None = None,
        history_root: Path | None = None,
    ) -> None:
        self._dataset = dataset_root or Path(
            os.environ.get("SE_YAWS_DATASET_ROOT", "shared/processed/yaws1999")
        )
        self._work = work_root or Path(
            os.environ.get("SE_YAWS_WORK_ROOT", "reports/yaws1999")
        )
        self._history = history_root or Path(
            os.environ.get("SE_YAWS_HISTORY_ROOT", "reports/yaws1999/history")
        )

    @property
    def adapter_id(self) -> str:
        return "yaws1999"

    @property
    def display_name(self) -> str:
        return "Yaws 1999 handbook tables"

    @property
    def capabilities(self) -> AdapterCapabilities:
        return AdapterCapabilities(
            kinds=(SourceKind.TABLES,),
            commands=("tables-extract", "tables-verify"),
            format_ids=("yaws-table",),
        )

    def roots(self) -> AdapterRoots:
        return AdapterRoots(current=self._dataset, work=self._work, history=self._history)

    def list_sources(self) -> list[dict[str, Any]]:
        return [{"id": "yaws1999", "kind": "tables"}]

    def list_systems(self, source_id: str | None = None) -> list[dict[str, Any]]:
        if not self._dataset.is_dir():
            return []
        return [{"id": p.stem, "path": str(p)} for p in sorted(self._dataset.glob("**/*.json"))]

    def resolve_config(self, system_id: str) -> Path | None:
        return None

    def run_command(
        self,
        command_id: str,
        params: dict[str, Any],
        *,
        log: Any | None = None,
    ) -> int:
        msg = f"yaws1999 command {command_id!r} is registered but not wired yet"
        if callable(log):
            log(msg)
        print(msg)
        return 2


def get_adapter() -> Yaws1999Adapter:
    """Entry-point / SE_ADAPTER_MODULES factory."""
    return Yaws1999Adapter()
