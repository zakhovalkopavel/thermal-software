"""Parse USGS Bulletin 2131 OCR dumps into calculable phase rows.

Refs:
  [60] RobieHemingway1995

Dataset build uses ``page-NNNN.txt`` (Surya OCR) only — not ``.pdftotext.txt``
(embedded PDF text layer; noisy hyphenation caused duplicate bad phase ids).
Generic: mineral header + formula on the next line (not a hard-coded name allow-list).
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from usgs_bulletin_2131.mineral_aliases import MINERAL_ALIASES

_NUM = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[Ee][-+]?\d+)?"

# Chemistry token on the formula/uncertainty line under a mineral header.
_FORMULA = re.compile(
    r"^([A-Z][a-z]?(?:\d+(?:\.\d+)?)?(?:\([A-Za-z0-9]+\)\d*)?"
    r"(?:[A-Z][a-z]?(?:\d+(?:\.\d+)?)?){0,12})"
)

_SKIP_NAME_PREFIXES = (
    "NAME AND",
    "COEFFICIENTS FOR",
    "THERMODYNAMIC PROPERTIES",
    "OXIDES AND",
    "MULTIPLE OXIDES",
    "SILICATES",
    "CARBONATES",
    "SULFATES",
    "PHOSPHATES",
    "HALIDES",
    "ELEMENTS",
    "REFERENCES",
    "STD. STATE",
    "TABLE",
)

_SKIP_LINE_MARKERS = (
    "AQUEOUS",
    "IDEAL GAS",
    "UN-IONIZED",
    "STD. STATE",
)


def _norm_minus(s: str) -> str:
    return (
        s.replace("·", "-")
        .replace("−", "-")
        .replace("–", "-")
        .replace("£", "E")
        .replace("^\\circ", "")
    )


def _floats(line: str) -> list[float]:
    line = _norm_minus(line)
    return [float(x) for x in re.findall(_NUM, line)]


def _phase_id_from_name(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "unknown"


def _split_header(line: str) -> tuple[str, str | None] | None:
    """Return (NAME, optional inline formula) for a 298/Cp data header line.

    298 K tables: ``CORUNDUM 101.961 …`` with formula on the next line.
    Cp tables: ``CORUNDUM Al2O3 50.9 …`` with formula inline.
    """
    raw = line.strip()
    if not raw or len(raw) < 4:
        return None
    upper = raw.upper()
    for prefix in _SKIP_NAME_PREFIXES:
        if upper.startswith(prefix):
            return None
    for marker in _SKIP_LINE_MARKERS:
        if marker in upper:
            return None
    # Leading ALL-CAPS words (= mineral name), optional formula token, then a number.
    m = re.match(
        r"^([A-Z][A-Z0-9\-\/\.']*(?:\s+[A-Z][A-Z0-9\-\/\.']*){0,5})"
        r"(?:\s+([A-Za-z][A-Za-z0-9\(\)]{1,30}))?"
        r"\s+" + _NUM,
        raw,
    )
    if not m:
        return None
    name = re.sub(r"\s+", " ", m.group(1)).strip(" .")
    if sum(1 for c in name if c.isalpha()) < 3:
        return None
    inline = m.group(2)
    if inline and not (
        re.search(r"\d|\(", inline) or re.search(r"[A-Z][a-z]", inline)
    ):
        # Second token is another name word mistaken as formula — fold into name.
        name = f"{name} {inline.upper()}"
        inline = None
    return name.upper(), inline


def _header_name(line: str) -> str | None:
    """Return mineral name if line looks like a 298/Cp data header."""
    hit = _split_header(line)
    return hit[0] if hit else None


def _data_floats(line: str, name: str, inline_formula: str | None) -> list[float]:
    """Floats from the numeric tail only (skip formula subscripts like Al2O3)."""
    rest = line.strip()
    # Drop leading name words.
    for part in name.split():
        rest = re.sub(rf"^{re.escape(part)}\s+", "", rest, count=1, flags=re.I)
    if inline_formula:
        rest = re.sub(rf"^{re.escape(inline_formula)}\s+", "", rest, count=1)
    return _floats(rest)


def _resolve_meta(name_upper: str) -> dict[str, str]:
    if name_upper in MINERAL_ALIASES:
        return dict(MINERAL_ALIASES[name_upper])
    collapsed = re.sub(r"\s+", " ", name_upper)
    if collapsed in MINERAL_ALIASES:
        return dict(MINERAL_ALIASES[collapsed])
    for key in sorted(MINERAL_ALIASES.keys(), key=len, reverse=True):
        if name_upper.startswith(key) or collapsed.startswith(key):
            return dict(MINERAL_ALIASES[key])
    return {"phaseId": _phase_id_from_name(name_upper)}


def _formula_from_line(line: str) -> str | None:
    text = line.strip()
    if not text:
        return None
    # Strip leading OCR noise; take first chemistry-like token.
    token = text.split()[0]
    token = token.replace("·", "").replace(" ", "")
    # Al2O3, CaFe2O4, AlO(OH), Ca(OH)2, …
    if re.fullmatch(r"[A-Za-z0-9\(\)]{2,40}", token) and re.search(
        r"\d|\(|(?:[A-Z][a-z]?){2}", token
    ):
        return token
    m = _FORMULA.match(text.replace(" ", ""))
    if m:
        return m.group(1)
    return None


def _valid_298(weight: float, s298: float, hf: float) -> bool:
    return 20.0 <= weight <= 800.0 and 5.0 <= s298 <= 800.0 and abs(hf) >= 50.0


def _page_text_sources(ocr_dir: Path, page: int) -> list[tuple[str, str]]:
    """Return OCR plain-text dumps only (``page-NNNN.txt``)."""
    out: list[tuple[str, str]] = []
    ocr = ocr_dir / f"page-{page:04d}.txt"
    if ocr.is_file() and ocr.stat().st_size > 20:
        out.append((ocr.read_text(encoding="utf-8", errors="replace"), "ocr"))
    return out


def parse_298k_pages(ocr_dir: Path, pages: list[int]) -> dict[str, Any]:
    """Parse 298.15 K tables: S, V, Hf, Gf, logK (OCR + pdftotext, validated)."""
    phases: dict[str, Any] = {}
    for page in pages:
        for text, tag in _page_text_sources(ocr_dir, page):
            lines = text.splitlines()
            i = 0
            while i < len(lines):
                line = lines[i]
                split = _split_header(line)
                if not split:
                    i += 1
                    continue
                name, inline_formula = split
                nums = _data_floats(line, name, inline_formula)
                if len(nums) < 4:
                    i += 1
                    continue
                weight, s298, v298, hf = nums[0], nums[1], nums[2], nums[3]
                if not _valid_298(weight, s298, hf):
                    i += 1
                    continue
                meta = _resolve_meta(name)
                formula = inline_formula or meta.get("formula")
                unc: dict[str, Any] = {}
                if i + 1 < len(lines) and not _header_name(lines[i + 1]):
                    next_line = lines[i + 1]
                    f = _formula_from_line(next_line)
                    if f:
                        formula = f
                    # Uncertainty line: skip leading formula token.
                    un_line = next_line
                    if f:
                        un_line = re.sub(
                            rf"^{re.escape(f)}\s+", "", next_line.strip(), count=1
                        )
                    un = _floats(un_line)
                    if un:
                        unc = {
                            "S298_unc": un[0] if len(un) > 0 else None,
                            "V_unc": un[1] if len(un) > 1 else None,
                            "Hf_unc_kJmol": un[2] if len(un) > 2 else None,
                            "Gf_unc_kJmol": un[3] if len(un) > 3 else None,
                        }
                gf = nums[4] if len(nums) > 4 else None
                logk = (
                    nums[5] if len(nums) > 5 and abs(nums[5]) < 5000 else None
                )
                key = meta["phaseId"]
                if "GLASS" in line.upper() and key in phases:
                    i += 1
                    continue
                row = {
                    "phaseId": key,
                    "formula": formula,
                    "name": name.title(),
                    "formulaWeight": weight,
                    "S298_JmolK": s298,
                    "V298_cm3mol": v298,
                    "Hf298_kJmol": hf,
                    "Gf298_kJmol": gf,
                    "logK298": logk,
                    "uncertainty": unc,
                    "pdfPage": page,
                    "textSource": tag,
                    "ref": "RobieHemingway1995",
                    "convention": "formation_298",
                    "status": "ok",
                }
                if key not in phases:
                    phases[key] = row
                i += 1
    return phases


def parse_cp_pages(ocr_dir: Path, pages: list[int]) -> dict[str, list[dict[str, Any]]]:
    """Parse Cp coefficient tables: A1..A5, T range, optional transition."""
    by_phase: dict[str, list[dict[str, Any]]] = {}
    for page in pages:
        for text, tag in _page_text_sources(ocr_dir, page):
            lines = text.splitlines()
            i = 0
            while i < len(lines):
                line = lines[i]
                split = _split_header(line)
                if not split:
                    i += 1
                    continue
                name, inline_formula = split
                nums = _data_floats(line, name, inline_formula)
                if len(nums) < 3:
                    i += 1
                    continue
                tail = line.strip()
                for part in name.split():
                    tail = re.sub(rf"^{re.escape(part)}\s+", "", tail, count=1, flags=re.I)
                if inline_formula:
                    tail = re.sub(rf"^{re.escape(inline_formula)}\s+", "", tail, count=1)
                sci = re.findall(rf"{_NUM}[Ee][-+]?\d+", _norm_minus(tail))
                coeffs = [float(x) for x in sci]
                # Constant-Cp minerals (e.g. Gibbsite) publish only A1.
                if len(coeffs) < 1:
                    i += 1
                    continue
                meta = _resolve_meta(name)
                formula = inline_formula or meta.get("formula")
                # T bounds are trailing near-integer temperatures, not S298 / A coeffs.
                def _temp_bounds(vals: list[float]) -> list[float]:
                    out: list[float] = []
                    for n in vals:
                        if not (250.0 <= n <= 3500.0):
                            continue
                        if abs(n - nums[0]) < 0.05:
                            continue  # skip S298 when it falls in the window
                        if any(abs(n - c) < 1e-6 for c in coeffs):
                            continue
                        if abs(n - round(n)) > 0.05:
                            continue
                        out.append(n)
                    return out

                temps = _temp_bounds(nums)
                if i + 1 < len(lines) and not _header_name(lines[i + 1]):
                    next_line = lines[i + 1]
                    f = _formula_from_line(next_line)
                    if f and not formula:
                        formula = f
                    for t in _temp_bounds(_floats(next_line)):
                        if t not in temps:
                            temps.append(t)
                key = meta["phaseId"]
                row: dict[str, Any] = {
                    "S298_JmolK": nums[0],
                    "formula": formula,
                    "A": {
                        "A1": coeffs[0] if len(coeffs) > 0 else None,
                        "A2": coeffs[1] if len(coeffs) > 1 else None,
                        "A3": coeffs[2] if len(coeffs) > 2 else None,
                        "A4": coeffs[3] if len(coeffs) > 3 else None,
                        "A5": coeffs[4] if len(coeffs) > 4 else None,
                        "form": "A1 + A2*T + A3*T^-2 + A4*T^-0.5 + A5*T^2",
                        "units": "J/(mol·K); T in K",
                    },
                    "Tmin_K": temps[0] if temps else None,
                    "Tmax_K": temps[1] if len(temps) > 1 else (temps[0] if temps else None),
                    "pdfPage": page,
                    "textSource": tag,
                    "ref": "RobieHemingway1995",
                }
                if len(temps) >= 3:
                    row["transition"] = {
                        "T_K": temps[2],
                        "note": "Tun/Ttm column if present",
                    }
                existing = by_phase.setdefault(key, [])
                dedupe_key = (row.get("Tmin_K"), row.get("Tmax_K"), tag)
                if any(
                    (r.get("Tmin_K"), r.get("Tmax_K"), r.get("textSource")) == dedupe_key
                    for r in existing
                ):
                    i += 1
                    continue
                existing.append(row)
                i += 1
    return by_phase


def _page_numbers(ocr_dir: Path) -> list[int]:
    """Page indices from ``page-NNNN.txt`` (OCR) only."""
    pages: set[int] = set()
    for p in ocr_dir.iterdir():
        if not p.is_file():
            continue
        m = re.match(r"^page-(\d+)\.txt$", p.name)
        if m and ".pdftotext." not in p.name:
            pages.add(int(m.group(1)))
    return sorted(pages)


def build_robie_dataset(ocr_dir: Path) -> dict[str, Any]:
    """Merge 298 K + Cp ranges + high-T tables for all pages present under ocr_dir."""
    from usgs_bulletin_2131.parse_high_t import parse_high_t_pages

    pages = _page_numbers(ocr_dir)
    # Printed 4–42 → PDF 10–48; printed 43–70 → PDF 49–76 (approx; scan by pdf index).
    pages_298 = [p for p in pages if 10 <= p <= 48]
    pages_cp = [p for p in pages if 49 <= p <= 76]
    # High-T individual-phase tables: PDF 77–458 (before mineral index).
    pages_ht = [p for p in pages if 77 <= p < 459]

    p298 = parse_298k_pages(ocr_dir, pages_298)
    cp = parse_cp_pages(ocr_dir, pages_cp)
    ht = parse_high_t_pages(ocr_dir, pages_ht)

    phases: dict[str, Any] = {}
    keys = sorted(set(p298) | set(cp) | set(ht))
    for key in keys:
        row: dict[str, Any] = {
            "phaseId": key,
            "ref": "RobieHemingway1995",
            "convention": "formation_298",
        }
        if key in p298:
            row.update(p298[key])
        if key in cp:
            row["cpRanges"] = cp[key]
            if not row.get("formula"):
                for r in cp[key]:
                    if r.get("formula"):
                        row["formula"] = r["formula"]
                        break
        if key in ht:
            row["highT"] = ht[key]
            if not row.get("formula") and ht[key].get("formula"):
                row["formula"] = ht[key]["formula"]
            if not row.get("name") and ht[key].get("name"):
                row["name"] = ht[key]["name"]
        has_298 = "Hf298_kJmol" in row
        has_cp = bool(row.get("cpRanges"))
        has_ht = bool((row.get("highT") or {}).get("rows"))
        if has_298 and has_cp:
            row["status"] = "ok"
        elif has_298 or has_cp or has_ht:
            row["status"] = "partial"
        else:
            row["status"] = "rejected"
        phases[key] = row

    return {
        "source": "RobieHemingway1995",
        "convention": "formation_298",
        "cpForm": "A1 + A2*T + A3/T^2 + A4/T^0.5 + A5*T^2",
        "nPhases": len(phases),
        "pagesScanned": {
            "all": pages,
            "table298": pages_298,
            "cpCoeffs": pages_cp,
            "highT": pages_ht,
        },
        "phases": phases,
        "note": (
            "In-memory merge from tmp OCR (.txt) dumps. Per-phase JSON "
            "(298 + Cp + high-T) is written to the staging root by usgs2131_build."
        ),
        "ref": "RobieHemingway1995",
    }
