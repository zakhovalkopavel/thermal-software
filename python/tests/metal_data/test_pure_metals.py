from pathlib import Path

from metal_data.pure_metals import load_abu_eishah_rows


def test_load_abu_eishah_rows():
    raw = Path("/app/shared/sources/metal-data/raw-tables")
    if not raw.is_dir():
        # host: python/tests/metal_data → repo root is parents[3]
        raw = Path(__file__).resolve().parents[3] / "shared/sources/metal-data/raw-tables"
    assert raw.is_dir(), raw
    rows = load_abu_eishah_rows(raw)
    iron = [r for r in rows if r["element"] == "Fe"]
    assert len(iron) >= 1
    assert all("a" in r and "b" in r for r in iron)
