"""
phase_diagrams.nbs.nbs_ref_repair — Fill missed Table I references (txt then json).

Hybrid pipeline: rule-based field fixes + ``pdftotext -layout`` ref overlay (primary),
optional hybrid OCR only for remaining gaps. Flags composition/T anomalies; does not
auto-rewrite systems or mol%.

Spec: docs/scripts/phase-diagrams/NBS.md
"""
from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass, field
from pathlib import Path

from phase_diagrams.nbs.nbs_entry_index import (
    NOTE_PHRASES,
    extract_note_phrases,
    is_note_token,
    numeric_references,
)
from phase_diagrams.nbs.nbs_text_normalizer import NbsTextNormalizer

_ENTRY_START = re.compile(r"^(\d{1,4})\b(.*)$")
_DUMP_ENTRY = re.compile(r"^\s*(\d{1,4})\b(.*)$")
_TEMP_FLOAT = re.compile(r"(?<![\d.])(\d+\.\d+)(?![\d.])")
_NOTE_BLOB = re.compile(
    r"(?i)\b(?:"
    + "|".join(re.escape(p) for p in sorted(NOTE_PHRASES, key=len, reverse=True))
    + r"|APP|GT|NA)\b"
)
_INT_TOKEN = re.compile(r"^\d{1,4}$")
_MONOTONIC_DROP = 5.0


@dataclass
class PdfRefRow:
    """References (and whether a temperature value was present) from the PDF text layer."""

    refs: list[str] = field(default_factory=list)
    has_temperature: bool = True
    temperature_text: str = ""


@dataclass
class DumpFields:
    entry: int
    system: str
    composition: str
    temperature: str
    refs: list[str]
    raw: str


def extract_table_refs(
    pdf_path: Path | str,
    first_page: int,
    last_page: int,
) -> dict[int, PdfRefRow]:
    """Parse locator → refs from ``pdftotext -layout`` over Table I pages."""
    pdf = Path(pdf_path)
    if not pdf.is_file():
        raise FileNotFoundError(pdf)
    if last_page < first_page:
        raise ValueError(f"last page {last_page} < first page {first_page}")
    result = subprocess.run(
        [
            "pdftotext",
            "-f", str(first_page),
            "-l", str(last_page),
            "-layout",
            str(pdf),
            "-",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    merged: dict[int, PdfRefRow] = {}
    for page_index, page in enumerate(result.stdout.split("\f")):
        pdf_page = first_page + page_index
        printed_page = pdf_page - 8
        for entry, row in _parse_pdf_page_refs(page, printed_page).items():
            # Later pages win if a locator is repeated (should not happen).
            merged[entry] = row
    return merged


def parse_dump_line(line: str) -> DumpFields | None:
    match = _DUMP_ENTRY.match(line)
    if not match:
        return None
    entry = int(match.group(1))
    parts = re.split(r"\s{2,}", match.group(2).strip())
    if len(parts) < 2:
        return None
    system = parts[0]
    composition = parts[1] if len(parts) > 1 else ""
    temperature = parts[2] if len(parts) > 2 else ""
    ref_tokens = " ".join(parts[3:]).split() if len(parts) > 3 else []
    # Note phrases wrongly sitting in the ref column → attach to temperature when T is numeric.
    joined = " ".join(ref_tokens)
    joined, phrase_notes = extract_note_phrases(joined)
    if phrase_notes and temperature and _temperature_value(temperature) is not None:
        for phrase in phrase_notes:
            if phrase not in temperature.upper():
                temperature = f"{temperature} {phrase}"
    elif phrase_notes and (not temperature or temperature.upper() == "NA"):
        # Note was the only "ref" and there is no T — keep on temperature for later NA move,
        # or onto composition when composition is NA.
        if not composition or composition.upper() == "NA":
            composition = phrase_notes[0]
            temperature = temperature or "NA"
        else:
            temperature = phrase_notes[0]
    refs = numeric_references(joined.split())
    return DumpFields(
        entry=entry,
        system=system,
        composition=composition,
        temperature=temperature,
        refs=refs,
        raw=line.rstrip("\n"),
    )


def format_dump_line(fields: DumpFields) -> str:
    """``entry  system  composition  temperature  refs…`` with 2-space separators."""
    temp = fields.temperature.strip() or "NA"
    parts = [str(fields.entry), fields.system, fields.composition, temp]
    if fields.refs:
        parts.append(" ".join(fields.refs))
    return "  ".join(parts)


def choose_refs(
    dump_refs: list[str],
    pdf_row: PdfRefRow | None,
    *,
    force: bool = False,
) -> tuple[list[str], str | None]:
    """Pick refs for one entry. Returns ``(refs, anomaly_or_None)``.

    Prefer pdftotext only when dump refs are empty or a strict prefix of the PDF list.
    Never replace a full dump list with a divergent PDF list unless ``force``.
    """
    pdf_refs = _clean_pdf_refs(list(pdf_row.refs) if pdf_row else [])
    if force and pdf_refs:
        return pdf_refs, None
    if not dump_refs and not pdf_refs:
        return [], None
    if not dump_refs and pdf_refs:
        return pdf_refs, None
    if dump_refs and not pdf_refs:
        return dump_refs, None
    if dump_refs == pdf_refs:
        return dump_refs, None
    # Dump is a strict prefix of PDF (truncated multi-line wrap, e.g. 3583).
    if len(dump_refs) < len(pdf_refs) and pdf_refs[: len(dump_refs)] == dump_refs:
        return pdf_refs, None
    # PDF digit-truncated vs dump — keep dump.
    if _pdf_looks_truncated(dump_refs, pdf_refs):
        return dump_refs, f"pdftotext refs truncated vs dump: pdf={pdf_refs} dump={dump_refs}"
    # Divergent lists: keep dump. Note only when PDF offered more tokens (possible missed wrap).
    if pdf_refs != dump_refs:
        if len(pdf_refs) > len(dump_refs):
            return dump_refs, f"ref disagreement; kept dump: pdf={pdf_refs} dump={dump_refs}"
        return dump_refs, None
    return dump_refs, None


def repair_dump_lines(
    lines: list[str],
    pdf_refs: dict[int, PdfRefRow],
    *,
    force: bool = False,
) -> tuple[list[str], list[str], list[int]]:
    """Rewrite dump lines with repaired T/ref fields.

    Returns ``(new_lines, anomalies, missing_ref_entry_ids)``.
    """
    anomalies: list[str] = []
    missing: list[int] = []
    repaired: list[str] = []
    prev_t: float | None = None
    prev_entry: int | None = None

    for raw in lines:
        line = raw.rstrip("\n")
        if not line.strip():
            repaired.append(line)
            continue
        fields = parse_dump_line(line)
        if fields is None:
            repaired.append(line)
            continue

        pdf_row = pdf_refs.get(fields.entry)
        fields = _repair_temperature_field(fields, pdf_row)
        chosen, note = choose_refs(fields.refs, pdf_row, force=force)
        fields.refs = chosen
        if note:
            anomalies.append(f"{fields.entry}: {note}")

        if not fields.refs:
            missing.append(fields.entry)
            anomalies.append(f"{fields.entry}: missing references")

        # Monotonicity on numeric temperatures only.
        t_value = _temperature_value(fields.temperature)
        if t_value is not None and prev_t is not None and t_value + 1e-9 < prev_t - _MONOTONIC_DROP:
            anomalies.append(
                f"{fields.entry}: temperature drop {prev_t:g} → {t_value:g} "
                f"(prev entry {prev_entry})"
            )
        if t_value is not None:
            prev_t = t_value
            prev_entry = fields.entry

        # Flag composition/T that still look wrong after repair.
        anomalies.extend(_composition_temperature_flags(fields, pdf_row))

        repaired.append(format_dump_line(fields))

    return repaired, anomalies, missing


def fill_refs_hybrid_ocr(
    missing_ids: list[int],
    entry_pages: dict[int, int],
    pdf_path: Path | str,
    cache_dir: Path | str | None = None,
) -> dict[int, list[str]]:
    """Hybrid-OCR pages that still lack refs; return ``entry → refs`` for hits only."""
    if not missing_ids:
        return {}
    from phase_diagrams.nbs.nbs_hybrid_ocr import ocr_pdf_page

    pages: dict[int, list[int]] = {}
    for entry in missing_ids:
        page = entry_pages.get(entry)
        if page is None:
            continue
        pages.setdefault(page, []).append(entry)

    found: dict[int, list[str]] = {}
    for page, entries in sorted(pages.items()):
        text = ocr_pdf_page(pdf_path, page, cache_dir=cache_dir)
        parsed = _parse_pdf_page_refs(text, printed_page=page - 8)
        for entry in entries:
            row = parsed.get(entry)
            if row and row.refs:
                found[entry] = row.refs
    return found


def rebuild_entries_json(
    dump_text: str,
    page_offset: int,
    entries_path: Path,
    unparsed_path: Path | None = None,
) -> tuple[int, int]:
    """Parse the continuous dump into ``entries.json`` (and optional unparsed file)."""
    import json

    from phase_diagrams.nbs.nbs_entry_index import build_nbs_index

    # Continuous dump has no form-feeds; assign pdf pages from existing raw lines when present
    # is not available — use a single synthetic page and fix pdfPage from a side map if needed.
    # Prefer: rebuild with form-feeds injected from a page map is complex; instead parse as page 1
    # then restore pdfPage/printedPage from prior entries.json when entry ids match.
    prior_pages: dict[int, tuple[int, int]] = {}
    if entries_path.is_file() and entries_path.stat().st_size:
        try:
            prior = json.loads(entries_path.read_text(encoding="utf-8"))
            if isinstance(prior, list):
                for row in prior:
                    prior_pages[int(row["entry"])] = (
                        int(row.get("pdfPage", 1)),
                        int(row.get("printedPage", int(row.get("pdfPage", 1)) - page_offset)),
                    )
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            prior_pages = {}

    entries, unparsed = build_nbs_index(dump_text if "\f" in dump_text else dump_text + "\f", page_offset)
    out: list[dict] = []
    for entry in entries:
        pdf_page, printed = prior_pages.get(entry.entry, (entry.pdf_page, entry.printed_page))
        entry.pdf_page = pdf_page
        entry.printed_page = printed
        out.append(entry.to_dict())
    out.sort(key=lambda row: int(row["entry"]))
    entries_path.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    if unparsed_path is not None:
        unparsed_path.write_text(
            "\n".join(unparsed) + ("\n" if unparsed else ""),
            encoding="utf-8",
        )
    return len(out), len(unparsed)


def _parse_pdf_page_refs(page_text: str, printed_page: int) -> dict[int, PdfRefRow]:
    lines = page_text.splitlines()
    result: dict[int, PdfRefRow] = {}
    i = 0
    while i < len(lines):
        match = _ENTRY_START.match(lines[i])
        if not match:
            i += 1
            continue
        entry = int(match.group(1))
        if entry < 1 or entry > 9999:
            i += 1
            continue
        body = match.group(2)
        parts = [p for p in re.split(r"\s{2,}", body.strip()) if p]
        has_temperature = False
        temperature_text = ""
        refs: list[str] = []

        if len(parts) >= 4:
            # system, composition, temperature[+notes], refs…
            temperature_text = parts[2]
            has_temperature = _TEMP_FLOAT.search(temperature_text) is not None or bool(
                NbsTextNormalizer.number(temperature_text.split()[0]) if temperature_text.split() else None
            )
            # Integer-only "temperature" with note composition → actually refs (no T).
            if (
                not _TEMP_FLOAT.search(temperature_text)
                and _looks_ref_blob(temperature_text)
                and len(parts) == 4
                and _looks_ref_blob(parts[3])
            ):
                # ambiguous; keep parts[3] as refs, check parts[2]
                if is_note_token(parts[1]) or _composition_is_note(parts[1]):
                    has_temperature = False
                    refs = _ints_from(temperature_text) + _ints_from(parts[3])
                    temperature_text = ""
                else:
                    refs = _ints_from(" ".join(parts[3:]))
            else:
                refs = _ints_from(" ".join(parts[3:]))
                # Notes glued into T field before refs already excluded by parts split.
        elif len(parts) == 3:
            # system, composition, (T+notes+refs) OR (note/comp, refs) with no T
            third = parts[2]
            if _TEMP_FLOAT.search(third):
                has_temperature = True
                temperature_text = third
                # refs after the float / notes
                after = third
                mfloat = _TEMP_FLOAT.search(third)
                if mfloat:
                    after = third[mfloat.end() :]
                after = _NOTE_BLOB.sub(" ", after)
                refs = _ints_from(after)
            elif _looks_ref_blob(third) or (_ints_from(third) and not _TEMP_FLOAT.search(third)):
                # No temperature column: third field is references (possibly after a note).
                has_temperature = False
                temperature_text = ""
                # If third starts with a note phrase then ints: strip notes
                cleaned = _NOTE_BLOB.sub(" ", third)
                refs = _ints_from(cleaned)
            else:
                has_temperature = False
                temperature_text = ""
                refs = _ints_from(_NOTE_BLOB.sub(" ", third))
        elif len(parts) == 2:
            # system + something; rare
            has_temperature = False
            refs = _ints_from(_NOTE_BLOB.sub(" ", parts[1])) if _looks_ref_blob(parts[1]) else []

        # Continuation lines: indented number-only wraps under References.
        j = i + 1
        while j < len(lines):
            cont = lines[j]
            if _ENTRY_START.match(cont):
                break
            stripped = cont.strip()
            if not stripped:
                j += 1
                continue
            # Footer printed page number alone.
            if _INT_TOKEN.fullmatch(stripped) and int(stripped) == printed_page:
                j += 1
                break
            if re.fullmatch(r"[\d\s,]+", stripped):
                refs.extend(_ints_from(stripped))
                j += 1
                continue
            if re.match(r"^\s{15,}\d", cont) and not re.search(r"[A-Za-z]", cont):
                refs.extend(_ints_from(cont))
                j += 1
                continue
            break

        # Drop trailing printed-page footer if it leaked into refs.
        if refs and refs[-1] == str(printed_page) and printed_page < 200:
            refs = refs[:-1]

        result[entry] = PdfRefRow(
            refs=refs,
            has_temperature=has_temperature,
            temperature_text=temperature_text.strip(),
        )
        i = j if j > i else i + 1
    return result


def _repair_temperature_field(fields: DumpFields, pdf_row: PdfRefRow | None) -> DumpFields:
    """Move note-only / ref-as-temperature mistakes into the right fields."""
    temp = fields.temperature.strip()
    comp = fields.composition.strip()
    refs = list(fields.refs)

    # Notes dumped into the temperature field with no numeric T — keep as composition-style
    # remarks only when composition already holds a value; else leave.
    # SER SOLID SOL / etc. alone in T with numeric refs already in refs → T becomes NA.
    if temp and is_note_token(temp) and not _TEMP_FLOAT.search(temp):
        if not NbsTextNormalizer.number(temp.split()[0]):
            # Move note onto composition if composition is empty/NA and note isn't already there.
            if not comp or comp.upper() == "NA":
                fields.composition = temp
            fields.temperature = "NA"
            temp = "NA"

    # Temperature field is a bare integer (no decimal) and PDF says no T → it is a reference.
    pdf_says_no_t = pdf_row is not None and not pdf_row.has_temperature
    bare_int = bool(re.fullmatch(r"\d{1,4}", temp))
    if bare_int and (pdf_says_no_t or _composition_is_note(comp) or comp.upper() == "NA"):
        if temp not in refs:
            refs = [temp] + refs
        fields.temperature = "NA"
        fields.refs = refs
        return fields

    # PDF no-T + dump has a decimal-free numeric T that matches pdf ref → NA.
    if pdf_says_no_t and bare_int:
        if temp not in refs:
            refs.append(temp)
        fields.temperature = "NA"
        fields.refs = refs
        return fields

    # Notes glued after a real T: keep ``580.0 SER SOLID SOL``.
    # If refs empty and PDF has refs, choose_refs fills them later.
    # If temperature is ``580.0 SER SOLID SOL`` and trailing note-only tokens were in refs, cleared already.
    if pdf_says_no_t and fields.temperature.upper() != "NA":
        # Dump still shows a temperature but PDF has none — flag by converting only when
        # the dump T equals a pdf ref (integer compare).
        t_val = _temperature_value(fields.temperature)
        if t_val is not None and t_val == int(t_val):
            as_ref = str(int(t_val))
            if pdf_row and as_ref in pdf_row.refs and not _TEMP_FLOAT.search(fields.temperature):
                if as_ref not in refs:
                    refs.append(as_ref)
                fields.temperature = "NA"
                fields.refs = refs
                return fields
        # Keep dump T but anomaly is recorded elsewhere; still attach pdf note via has_temperature.
        pass

    # Strip note-only fake refs that may remain; numeric_references already applied in parse.
    fields.refs = refs
    return fields


def _composition_is_note(text: str) -> bool:
    if not text:
        return False
    if is_note_token(text):
        return True
    remainder, phrases = extract_note_phrases(text)
    return bool(phrases) and (not remainder or remainder.upper() == "NA")


def _composition_temperature_flags(fields: DumpFields, pdf_row: PdfRefRow | None) -> list[str]:
    flags: list[str] = []
    t_val = _temperature_value(fields.temperature)
    if pdf_row is not None and pdf_row.has_temperature and t_val is None and fields.temperature.upper() == "NA":
        flags.append(
            f"{fields.entry}: dump T is NA but pdftotext has temperature {pdf_row.temperature_text!r}"
        )
    # PDF text layer often misses T on early pages; only flag when dump T itself looks like a ref.
    if (
        pdf_row is not None
        and not pdf_row.has_temperature
        and t_val is not None
        and (
            re.fullmatch(r"\d{1,4}", fields.temperature.strip())
            or _composition_is_note(fields.composition)
        )
    ):
        flags.append(
            f"{fields.entry}: dump T={t_val:g} but pdftotext has no temperature column"
        )
    if t_val is not None and t_val >= 2000 and _composition_is_note(fields.composition):
        flags.append(
            f"{fields.entry}: note composition with high T={t_val:g} (possible ref-as-temperature)"
        )
    return flags


def _temperature_value(temperature_field: str) -> float | None:
    text = temperature_field.strip()
    if not text or text.upper() == "NA" or is_note_token(text):
        return None
    remainder, _ = extract_note_phrases(text)
    if not remainder or remainder.upper() == "NA":
        return None
    token = remainder.split()[0]
    if token.upper() == "GT":
        return None
    return NbsTextNormalizer.number(token)


def _looks_ref_blob(text: str) -> bool:
    cleaned = _NOTE_BLOB.sub(" ", text).strip()
    if not cleaned:
        return False
    return bool(re.fullmatch(r"[\d\s,]+", cleaned))


def _ints_from(text: str) -> list[str]:
    # Strip temperatures first so ``120.0`` does not become ``120``, ``0``.
    cleaned = _TEMP_FLOAT.sub(" ", text)
    return re.findall(r"\b(\d{1,4})\b", cleaned)


def _clean_pdf_refs(refs: list[str]) -> list[str]:
    """Drop obvious pdftotext junk (lone ``0`` from floats, empty)."""
    return [r for r in refs if r and r != "0"]


def _pdf_looks_truncated(dump_refs: list[str], pdf_refs: list[str]) -> bool:
    if not dump_refs or not pdf_refs:
        return False
    if len(pdf_refs) > len(dump_refs):
        return False
    # Every pdf token is a prefix of some dump token (digit truncation: 29 vs 2900).
    if not all(any(d == pref or d.startswith(pref) for d in dump_refs) for pref in pdf_refs):
        return False
    return any(len(d) > max(len(p) for p in pdf_refs) for d in dump_refs)
