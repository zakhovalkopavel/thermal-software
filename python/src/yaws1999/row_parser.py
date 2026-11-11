"""
yaws1999.row_parser — Turn reconstructed table lines into structured rows.

A data line starts with a 1–4 digit row number, then formula, name, then the
remaining cell tokens (coefficients, temperatures, dashes for missing values).
Header and equation lines are recognized separately for the table metadata.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Optional

_TABLE_HEADER = re.compile(r"(?i)^\s*Table\s+(\d+-\d+)\s+(.+?)(?:\s*\(continued\))?\s*$")
_EQUATION = re.compile(
    r"(?i)(?:^|\s)((?:CP|log10P|n(?:gas|liq)|k(?:gas|liq)|H)\s*=|[A-Za-z].{0,8}=\s*[A-Z].{5,})",
)
_HEADER_MARKERS = re.compile(r"(?i)\bFORMULA\b.*\bNAME\b")
_ROW_START = re.compile(r"^\s*[|Il]?\s*(\d{1,4})\s+(\S+)\s+(.*\S)\s*$")
_VALUE_START = re.compile(
    r"(?:^|(?<=\s))"
    r"("
    r"-?\d+(?:\.\d+)?(?:\s*[Ee]\s*[+-]?\s*\d+)?"  # number / scientific
    r"|[—–_\-]{1,3}"  # missing-value dash
    r"|(?:NA|N/?A|APP)"
    r")"
    r"(?=\s|$)",
    re.I,
)
_SCI_SPACE = re.compile(r"(\d)\s*([Ee])\s*([+-]?)\s*(\d+)")
_TRAILING_JUNK = re.compile(r"[\s\|\]\[IJl\"'`]+$")
_TRAILING_RULE_ONE = re.compile(r"(?<=\d{2})\s+1\s*$")  # vertical rule OCR'd as "1" after TMAX
_LEADING_JUNK = re.compile(r"^[\s\|Il]+")
# Unconditional OCR cleanups (safe across this handbook).
_FORMULA_OCR = (
    (re.compile(r"^[~\"'`]+"), ""),
    (re.compile(r"[~\"'`]+$"), ""),
    (re.compile(r"AI"), "Al"),
    # Oxide oxygen misread as digit zero (Al203 → Al2O3); not B10H14 (0 before a letter).
    (re.compile(r"(?<=[A-Za-z]\d)0(?=\d)"), "O"),
)
# Name-gated halogen / oxygen fixes: only when the English name mentions them.
_NAME_HAS_CL = re.compile(r"(?i)CHLOR")
_NAME_HAS_BR = re.compile(r"(?i)BROM")
_NAME_HAS_I = re.compile(r"(?i)IOD(?:IDE|INE|O)?|\bIOD\b")
_NAME_HAS_F = re.compile(r"(?i)FLUOR")
_NAME_HAS_AL = re.compile(r"(?i)ALUMIN")
_NAME_HAS_O = re.compile(
    r"(?i)OXID|OXYGEN|\bOXY|HYDROXY|PERCHLOR|PHOSGENE|\bWATER\b|MONOXIDE|DIOXIDE|TRIOXIDE|TETROXIDE|PENTOXIDE",
)
# Name-gated element-symbol OCR: (name hint, wrong symbol(s), correct symbol).
# Wrong match is an element token boundary so TiO2 / TIBr / TII / Yt stay well-formed.
_NAME_ELEMENT_OCR: tuple[tuple[re.Pattern[str], re.Pattern[str], str], ...] = (
    # Thallium: OCR often emits Ti / TI instead of Tl (TITANIUM names do not match THALL).
    (
        re.compile(r"(?i)THALL"),
        re.compile(r"(?<![A-Za-z])(?:TI|Ti)(?=\d|$|[A-Z])"),
        "Tl",
    ),
    # Yttrium: OCR often emits Yt; ytterbium (YTTERB…) keeps Yb and does not match.
    (
        re.compile(r"(?i)YTTRIUM"),
        re.compile(r"(?<![A-Za-z])Yt(?=\d|$|[A-Z])"),
        "Y",
    ),
)
# CI/Ci → Cl; OCR digit-one Cl (C1F); bare cl before digit/end/element; all-caps CL.
_CL_OCR = re.compile(r"CL|C[Ii1]|cl(?=\d|$|[A-Z])")
_BR_OCR = re.compile(r"br|BR(?![a-z])")
_F_OCR = re.compile(r"(?<![A-Za-z])(?:fl|FL|f)(?=\d|$|[A-Z])")
# Digits OCR'd as oxygen: letter+0 (S02→SO2, ClF03→ClFO3, Os04→OsO4, ^02→O2).
_ZERO_AFTER_LETTER = re.compile(r"(?<=[A-Za-z])0(?=\d|$|[A-Z])|^0(?=\d)")
# Trailing oxygen after a count digit, but not the "10" in P4O10 (letter before count ≠ O).
_ZERO_AFTER_COUNT = re.compile(r"(?<=[A-NP-Za-np-z]\d)0(?=$|[A-Z])")
# Iodide I misread as lowercase L after a two-letter element (Agl → AgI).
# Do not match the L of Cl.
_IODIDE_L = re.compile(r"([A-Z][a-z])l(?=\d|$|[A-Z])")
_VALUE_JUNK = re.compile(r"^[|IljJ!\"'`]+$")


@dataclass
class ParsedRow:
    """One numbered compound row from a Yaws table page."""

    no: int
    formula: str
    name: str
    values: list[Any]
    raw: str
    djvu_page: int
    formula_raw: str = ""
    unparsed_tail: str = ""

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "no": self.no,
            "formula": self.formula,
            "name": self.name,
            "values": self.values,
            "djvuPage": self.djvu_page,
            "raw": self.raw,
        }
        if self.formula_raw and self.formula_raw != self.formula:
            out["formulaRaw"] = self.formula_raw
        if self.unparsed_tail:
            out["unparsedTail"] = self.unparsed_tail
        return out


@dataclass
class PageParse:
    """Result of parsing the reconstructed lines of one DjVu page."""

    table_id: Optional[str] = None
    title: Optional[str] = None
    equation: Optional[str] = None
    header: Optional[str] = None
    rows: list[ParsedRow] = field(default_factory=list)
    unparsed: list[str] = field(default_factory=list)


def parse_page_lines(lines: list[str], djvu_page: int) -> PageParse:
    """Parse reconstructed lines of one page into metadata + rows."""
    out = PageParse()
    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
        header = _TABLE_HEADER.match(line)
        if header:
            out.table_id = header.group(1)
            out.title = re.sub(r"\s*\(continued\)\s*$", "", header.group(2), flags=re.I).strip(" -")
            continue
        if out.equation is None and _looks_like_equation(line):
            out.equation = _clean_equation(line)
            continue
        if out.header is None and _HEADER_MARKERS.search(line):
            out.header = _LEADING_JUNK.sub("", _TRAILING_JUNK.sub("", line)).strip()
            continue
        if _is_noise_line(line):
            continue
        row = parse_data_line(line, djvu_page)
        if row is None:
            if _looks_like_failed_row(line):
                out.unparsed.append(f"p{djvu_page}: {line}")
            continue
        out.rows.append(row)
    return out


def parse_data_line(line: str, djvu_page: int) -> Optional[ParsedRow]:
    """Parse one ``NO FORMULA NAME …values`` line, or ``None`` if it is not a row."""
    cleaned = _LEADING_JUNK.sub("", line)
    cleaned = _TRAILING_JUNK.sub("", cleaned).strip()
    cleaned = _TRAILING_RULE_ONE.sub("", cleaned).strip()
    cleaned = _SCI_SPACE.sub(r"\1\2\3\4", cleaned)
    match = _ROW_START.match(cleaned)
    if not match:
        return None
    number = int(match.group(1))
    formula_raw = match.group(2)
    rest = match.group(3).strip()
    name, value_text = _split_name_values(rest)
    if not name:
        return None
    values, tail = _parse_values(value_text)
    name_clean = re.sub(r"\s+", " ", name).strip(" -")
    return ParsedRow(
        no=number,
        formula=clean_formula(formula_raw, name_clean),
        formula_raw=formula_raw,
        name=name_clean,
        values=values,
        unparsed_tail=tail,
        raw=line,
        djvu_page=djvu_page,
    )


def clean_formula(text: str, name: str | None = None) -> str:
    """OCR cleanup on a Yaws formula; element/halogen/oxygen fixes use ``name``.

    Examples when the name mentions the halogen: ``CI``/``Ci``/``C1`` → ``Cl``,
    ``br`` → ``Br``, ``CIF`` + chlorine → ``ClF``. Oxide names: ``0`` → ``O``
    (``C02`` → ``CO2``, ``Cl20`` → ``Cl2O``). ``CI4`` with an iodide name is left alone.
    Thallium names: ``Ti``/``TI``/``TIBr``/``TII`` → ``Tl``/``TlBr``/``TlI``.
    """
    out = text.strip()
    for pattern, repl in _FORMULA_OCR:
        out = pattern.sub(repl, out)
    if name:
        out = reconcile_formula_with_name(out, name)
    else:
        # No name: keep the old unconditional CI→Cl (most Yaws rows are chlorides).
        out = re.sub(r"CI", "Cl", out)
        out = _IODIDE_L.sub(r"\1I", out)
    return out


def reconcile_formula_with_name(formula: str, name: str) -> str:
    """Fix element-symbol / halogen / oxygen OCR using tokens in the English name."""
    out = formula
    for name_re, wrong_re, correct in _NAME_ELEMENT_OCR:
        if name_re.search(name):
            out = wrong_re.sub(correct, out)

    has_cl = bool(_NAME_HAS_CL.search(name))
    has_br = bool(_NAME_HAS_BR.search(name))
    has_i = bool(_NAME_HAS_I.search(name))
    has_f = bool(_NAME_HAS_F.search(name))
    has_o = bool(_NAME_HAS_O.search(name))

    if _NAME_HAS_AL.search(name):
        out = re.sub(r"AI(?=[A-Z0-9]|$)", "Al", out)
        # Digit one misread for lowercase L (A1 → Al).
        out = re.sub(r"A1(?=[A-Z0-9]|$)", "Al", out)
    if has_cl:
        out = _CL_OCR.sub("Cl", out)
    if has_br:
        out = _BR_OCR.sub("Br", out)
    if has_f:
        # OCR sometimes emits Fl/fl for fluorine (symbol F).
        out = _F_OCR.sub("F", out)
    if has_o:
        # Digit zero misread for oxygen (after Cl/CIF fixes so Cl20 → Cl2O).
        out = _ZERO_AFTER_LETTER.sub("O", out)
        out = _ZERO_AFTER_COUNT.sub("O", out)
    if has_i or not has_cl:
        # Agl → AgI. When the name also has chloro, skip the L that belongs to Cl
        # (negative lookbehind: do not match the ``l`` in ``Cl``).
        if has_cl:
            out = re.sub(r"(?<!C)([A-Z][a-z])l(?=\d|$|[A-Z])", r"\1I", out)
        else:
            out = _IODIDE_L.sub(r"\1I", out)
    return out


def _split_name_values(rest: str) -> tuple[str, str]:
    match = _VALUE_START.search(rest)
    if match is None:
        # Name only / empty values (common on incomplete OCR rows).
        return rest.strip(), ""
    return rest[: match.start()].strip(), rest[match.start() :].strip()


def _parse_values(text: str) -> tuple[list[Any], str]:
    if not text:
        return [], ""
    values: list[Any] = []
    pos = 0
    for match in _VALUE_START.finditer(text):
        gap = text[pos : match.start()].strip()
        if gap and not all(_VALUE_JUNK.fullmatch(tok) for tok in gap.split()):
            # Real non-value text between tokens — stop and keep the remainder.
            return values, text[pos:].strip()
        token = match.group(1)
        values.append(_coerce_value(token))
        pos = match.end()
    tail = text[pos:].strip()
    if tail and all(_VALUE_JUNK.fullmatch(tok) for tok in tail.split()):
        tail = ""
    return values, tail


def _coerce_value(token: str) -> Any:
    t = token.strip()
    if re.fullmatch(r"[—–_\-]{1,3}", t) or t.upper() in {"NA", "N/A", "APP"}:
        return None
    compact = _SCI_SPACE.sub(r"\1\2\3\4", t).replace(" ", "")
    try:
        if re.search(r"[Ee]", compact) or "." in compact:
            return float(compact)
        return int(compact)
    except ValueError:
        try:
            return float(compact)
        except ValueError:
            return t


def _looks_like_equation(line: str) -> bool:
    if _HEADER_MARKERS.search(line):
        return False
    if _ROW_START.match(_LEADING_JUNK.sub("", line)):
        return False
    if len(line) >= 120:
        return False
    if "=" in line and re.search(r"(?i)\bT\b", line):
        return True
    # OCR often drops the "=" ("CpsA + BT + … (CP-joule/(mol K), T - K)").
    if re.search(r"(?i)\bCP\b.*\bT\b.*\bK\b", line):
        return True
    if re.search(r"(?i)(?:A\s*\+\s*B\s*T|\bBT\s*\+\s*C)", line):
        return True
    return False


def _clean_equation(line: str) -> str:
    return re.sub(r"\s+", " ", line).strip(" |")


def _is_noise_line(line: str) -> bool:
    if re.fullmatch(r"\d{1,3}", line):
        return True  # bare printed page number in the footer
    if re.fullmatch(r"[|Il\s]+", line):
        return True
    if len(line) <= 2:
        return True
    return False


def _looks_like_failed_row(line: str) -> bool:
    return bool(re.match(r"^\s*[|Il]?\s*\d{1,4}\b", line))
