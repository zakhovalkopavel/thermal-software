"""phase-diagrams SourceAdapter — host-specific Atlas/NBS wiring for SE."""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from source_extract.adapters.adapter_capabilities import AdapterCapabilities
from source_extract.adapters.adapter_roots import AdapterRoots
from source_extract.adapters.source_kind import SourceKind
from source_extract.versioning.dataset_store import DatasetStore


class PhaseDiagramsAdapter:
    """Wraps ``phase_diagrams.cli`` as a SourceAdapter for source-extract."""

    def __init__(
        self,
        *,
        dataset_root: Path | None = None,
        work_root: Path | None = None,
        history_root: Path | None = None,
    ) -> None:
        self._dataset = dataset_root or Path(
            os.environ.get("SE_DATASET_ROOT", "shared/processed/phase-diagrams")
        )
        self._work = work_root or Path(
            os.environ.get("SE_WORK_ROOT", "reports/phase-diagrams")
        )
        self._history = history_root or Path(
            os.environ.get("SE_HISTORY_ROOT", "reports/phase-diagrams/history")
        )

    @property
    def adapter_id(self) -> str:
        return "phase-diagrams"

    @property
    def display_name(self) -> str:
        return "Phase diagrams (Slag Atlas + NSRDS-NBS 61)"

    @property
    def capabilities(self) -> AdapterCapabilities:
        return AdapterCapabilities(
            kinds=(SourceKind.DIAGRAMS,),
            commands=(
                "extract",
                "auto",
                "trace-curves",
                "nodes",
                "detect-isotherms",
                "index-figures",
                "calibrate",
                "new",
                "tile",
                "auto-overlay",
                "validate",
                "promote",
                "compare",
                "nbs-index",
            ),
            has_nbs_cross_check=True,
            has_compound_catalog=True,
            format_ids=("phase-diagram-system", "nbs-entry"),
        )

    def roots(self) -> AdapterRoots:
        return AdapterRoots(current=self._dataset, work=self._work, history=self._history)

    def list_sources(self) -> list[dict[str, Any]]:
        path = self._dataset / "sources.json"
        if not path.is_file():
            return []
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict) and "sources" in data:
            sources = data["sources"]
            if isinstance(sources, dict):
                return [{"id": k, **(v if isinstance(v, dict) else {"value": v})} for k, v in sources.items()]
            if isinstance(sources, list):
                return list(sources)
        if isinstance(data, dict):
            return [{"id": k, **(v if isinstance(v, dict) else {"value": v})} for k, v in data.items()]
        return []

    def list_systems(self, source_id: str | None = None) -> list[dict[str, Any]]:
        """Editable drafts across auto-full / candidates / systems / starts."""
        from phase_diagrams.review.draft_system_lister import DraftSystemLister

        _ = source_id  # catalog filter reserved for multi-source adapters
        return DraftSystemLister(work_root=self._work, dataset_root=self._dataset).list_systems()

    def resolve_system(self, system_id: str, preferred: str | None = None) -> dict[str, Any]:
        """Richest (or preferred) draft entry for opening a review session."""
        from phase_diagrams.review.draft_system_lister import DraftSystemLister

        return DraftSystemLister(work_root=self._work, dataset_root=self._dataset).resolve(
            system_id,
            preferred=preferred,
        )

    def resolve_config(self, system_id: str) -> Path | None:
        configs = self._dataset / "configs"
        for name in (
            f"{system_id}.config.json",
            f"{system_id}.curves.config.json",
            f"{system_id}.json",
        ):
            path = configs / name
            if path.is_file():
                return path
        return None

    def run_command(
        self,
        command_id: str,
        params: dict[str, Any],
        *,
        log: Any | None = None,
    ) -> int:
        from phase_diagrams.cli.main import main as pd_main

        argv = self._to_argv(command_id, params)
        log_fn = params.get("_log_append") or log
        if callable(log_fn):
            log_fn(f"phase-diagrams argv: {' '.join(argv)}")
        previous_version: str | None = None
        if command_id == "promote":
            previous_version = self._archive_current_before_promote(params)
        code = pd_main(argv)
        if code == 0 and command_id == "promote":
            self._write_promote_manifest(params, previous_version=previous_version)
        return code

    def _archive_current_before_promote(self, params: dict[str, Any]) -> str | None:
        system = params.get("system")
        if not system:
            return None
        store = DatasetStore(self._dataset, self._history)
        return store.archive_current(relative_path=f"systems/{system}.json", dataset_id=str(system))

    def _write_promote_manifest(
        self,
        params: dict[str, Any],
        *,
        previous_version: str | None,
    ) -> None:
        from datetime import datetime, timezone

        from source_extract.versioning.file_run_recorder import FileRunRecorder
        from source_extract.versioning.format_registry import SYSTEM_JSON_V1, FormatRegistry
        from source_extract.versioning.run_manifest import RunManifest

        system = params.get("system")
        if not system:
            return
        current = self._dataset / "systems" / f"{system}.json"
        if not current.is_file():
            return
        fmt = SYSTEM_JSON_V1
        manifest = RunManifest(
            dataset_id=str(system),
            version=datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"),
            previous_version=previous_version,
            command="promote",
            parameters={k: v for k, v in params.items() if not str(k).startswith("_")},
            adapter_id=self.adapter_id,
            format_block=fmt.to_dict(),
            change_note=FormatRegistry.change_note(fmt.format_id, fmt.version),
            input_hashes={"current": DatasetStore.hash_file(current)},
            diff_summary={"promoted": f"systems/{system}.json"},
        )
        FileRunRecorder(self._history).record(manifest)

    @staticmethod
    def _to_argv(command_id: str, params: dict[str, Any]) -> list[str]:
        argv: list[str] = [command_id]
        system = params.get("system")
        if system and command_id not in {
            "index-figures",
            "validate",
            "nbs-index",
            "nbs-bibliography",
            "nbs-refs",
            "nbs-suggest",
            "tile",
        }:
            argv.append(str(system))
        skip = {"system", "adapter_id", "_log_append"}
        for key, value in params.items():
            if key in skip or value is None:
                continue
            flag = f"--{key.replace('_', '-')}"
            if isinstance(value, bool):
                if value:
                    argv.append(flag)
                continue
            if isinstance(value, (list, tuple)):
                argv.append(flag)
                argv.extend(str(v) for v in value)
                continue
            argv.extend([flag, str(value)])
        return argv


def get_adapter() -> PhaseDiagramsAdapter:
    """Entry-point / SE_ADAPTER_MODULES factory."""
    return PhaseDiagramsAdapter()
