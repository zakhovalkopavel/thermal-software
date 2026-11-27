"""phase_diagrams adapter argv bridging."""

from __future__ import annotations

from phase_diagrams.adapter import PhaseDiagramsAdapter


def test_to_argv_extract() -> None:
    argv = PhaseDiagramsAdapter._to_argv(
        "extract",
        {"system": "mgo-sio2", "dataset": "shared/processed/phase-diagrams", "verbose": True},
    )
    assert argv[0] == "extract"
    assert argv[1] == "mgo-sio2"
    assert "--dataset" in argv
    assert "--verbose" in argv


def test_adapter_identity() -> None:
    adapter = PhaseDiagramsAdapter()
    assert adapter.adapter_id == "phase-diagrams"
    assert "extract" in adapter.capabilities.commands
