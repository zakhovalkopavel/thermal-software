"""
phase_diagrams.nbs.nbs_entry_index — Parse the NSRDS-NBS 61 text dump into NbsEntry objects.

Spec: docs/scripts/phase-diagrams/NBS.md § Text index
"""
from __future__ import annotations

import re

from phase_diagrams.models.nbs_entry import NbsEntry
from phase_diagrams.nbs.nbs_text_normalizer import NbsTextNormalizer

_ENTRY_LINE = re.compile(r"^\s*[^\w\s]{0,2}\s*(\d{1,4})[.\s]+(\S.*)$")
_APPROXIMATE = re.compile(r"\s*AP[PI]'?", re.IGNORECASE)
_REF_DIGITS = re.compile(r"^\d{1,4}$")

# Melting-point / composition remarks that are never bibliography ids.
NOTE_PHRASES: tuple[str, ...] = (
    "SER SOLID SOL W/O MINIMUM",
    "SER SOLID SOL",
    "NO MINIMUM REPORTED",
    "NO TERNARY EUTECTIC",
    "NOT A EUTECTIC SYSTEM",
)
_NOTE_PHRASE_RE = re.compile(
    r"(?i)\b(?:"
    + "|".join(re.escape(p) for p in sorted(NOTE_PHRASES, key=len, reverse=True))
    + r")\b"
)
_NOTE_ONLY = re.compile(
    r"(?i)^\s*(?:NA|GT|"
    + "|".join(re.escape(p) for p in sorted(NOTE_PHRASES, key=len, reverse=True))
    + r")\s*$"
)


def build_nbs_index(text: str, page_offset: int) -> tuple[list[NbsEntry], list[str]]:
    """Entries and the entry-like lines that did not parse.

    ``text`` is ``pdftotext -layout`` output; form feeds separate PDF pages.
    ``page_offset`` = PDF page − printed page.
    """
    entries: list[NbsEntry] = []
    unparsed: list[str] = []
    for page_index, page in enumerate(text.split("\f")):
        pdf_page = page_index + 1
        for line in page.splitlines():
            match = _ENTRY_LINE.match(line)
            if not match:
                continue
            entry = _parse(int(match.group(1)), match.group(2), line, pdf_page, pdf_page - page_offset)
            if entry is None:
                unparsed.append(f"p{pdf_page}: {line.rstrip()}")
            else:
                entries.append(entry)
    return entries, unparsed


def is_note_token(token: str) -> bool:
    """True when ``token`` is a known table remark (not a reference id)."""
    return bool(_NOTE_ONLY.match(token.strip()))


def extract_note_phrases(text: str) -> tuple[str, list[str]]:
    """Strip known note phrases from ``text``; return ``(remainder, notes_found)``."""
    notes: list[str] = []
    remainder = text

    def _keep(match: re.Match[str]) -> str:
        notes.append(match.group(0).upper().replace("  ", " ").strip())
        return " "

    remainder = _NOTE_PHRASE_RE.sub(_keep, remainder)
    remainder = re.sub(r"\s+", " ", remainder).strip()
    return remainder, notes


def numeric_references(tokens: list[str]) -> list[str]:
    """Keep only digit reference ids; drop notes and OCR junk (``5ER``, ``APP``)."""
    refs: list[str] = []
    for token in tokens:
        cleaned = NbsTextNormalizer.reference(token.strip())
        if _REF_DIGITS.fullmatch(cleaned):
            refs.append(cleaned)
    return refs


def _parse(number: int, rest: str, raw: str, pdf_page: int, printed_page: int) -> NbsEntry | None:
    fields = re.split(r"\s{2,}", rest.strip())
    if len(fields) < 3:
        return None
    system_field, composition_field, temperature_field = fields[0], fields[1], fields[2]
    ref_tokens = " ".join(fields[3:]).split()
    components = NbsTextNormalizer.system(system_field)
    if len(components) < 2:
        return None

    notes: list[str] = []
    approximate_composition = bool(_APPROXIMATE.search(composition_field))
    composition_text = _APPROXIMATE.sub("", composition_field).strip()
    composition = _composition(composition_text, len(components), notes)

    temperature, uncertainty, approximate_temperature, temp_notes = _parse_temperature(temperature_field)
    notes.extend(temp_notes)

    # Note phrases that OCR dumped into the reference column.
    kept_ref_tokens: list[str] = []
    for token in ref_tokens:
        if is_note_token(token) or _NOTE_PHRASE_RE.fullmatch(token.strip()):
            notes.append(f"temperature remark: '{token.strip()}'")
            continue
        # Multi-word notes may arrive as separate tokens (SER, SOLID, SOL).
        kept_ref_tokens.append(token)
    # Re-join and strip note phrases that were split across tokens.
    joined_refs = " ".join(kept_ref_tokens)
    joined_refs, phrase_notes = extract_note_phrases(joined_refs)
    for phrase in phrase_notes:
        notes.append(f"temperature remark: '{phrase}'")
    references = numeric_references(joined_refs.split())

    return NbsEntry(
        entry=number,
        system="-".join(components),
        components=components,
        composition_mol=composition,
        temperature_C=temperature,
        uncertainty_C=uncertainty,
        approximate_composition=approximate_composition,
        approximate_temperature=approximate_temperature,
        references=references,
        pdf_page=pdf_page,
        printed_page=printed_page,
        raw=raw.rstrip(),
        notes=notes,
    )


def _parse_temperature(temperature_field: str) -> tuple[float | None, float | None, bool, list[str]]:
    """Return ``(T, uncertainty, approximate, notes)``. ``T`` may be None (``NA`` / note-only)."""
    notes: list[str] = []
    field = temperature_field.strip()
    if not field or field.upper() == "NA" or is_note_token(field):
        if field and field.upper() != "NA":
            notes.append(f"temperature remark: '{field}'")
        return None, None, False, notes

    remainder, phrase_notes = extract_note_phrases(field)
    for phrase in phrase_notes:
        notes.append(f"temperature remark: '{phrase}'")
    if not remainder or remainder.upper() == "NA":
        return None, None, False, notes

    # Glued uncertainty: ``575.0±2``, ``585.0+5`` → split before the mark.
    remainder = re.sub(r"(?<=[\d.])([±+\=~]|:t|:!:)(?=[\d.SO])", r" \1", remainder)

    tokens = remainder.split()
    # Leading GT / APP alone
    if tokens[0].upper() == "GT":
        notes.append("temperature remark: 'GT'")
        tokens = tokens[1:]
        if not tokens:
            return None, None, False, notes

    approximate = bool(_APPROXIMATE.search(remainder))
    # Drop APP tokens from the value stream.
    value_tokens = [t for t in tokens if not _APPROXIMATE.fullmatch(t)]
    if not value_tokens:
        return None, None, approximate, notes

    temperature = NbsTextNormalizer.number(value_tokens[0])
    if temperature is None:
        notes.append(f"temperature not read: '{temperature_field}'")
        return None, None, approximate, notes

    tail = " ".join(value_tokens[1:])
    if value_tokens[0].endswith("~"):
        tail = "~" + tail
    tail = _APPROXIMATE.sub("", tail).strip()
    # Trailing GT is a remark, not uncertainty.
    if re.search(r"(?i)\bGT\b", tail):
        notes.append("temperature remark: 'GT'")
        tail = re.sub(r"(?i)\bGT\b", "", tail).strip()
    uncertainty = NbsTextNormalizer.uncertainty(tail) if tail else None
    if tail and uncertainty is None and not is_note_token(tail):
        notes.append(f"uncertainty not read: '{tail}'")
    return temperature, uncertainty, approximate, notes


def _composition(text: str, count: int, notes: list[str]) -> list[float] | None:
    if not text or text.upper().startswith("NA"):
        return None
    # Full-field composition remarks (SER SOLID SOL, NO MINIMUM, …).
    if is_note_token(text) or _NOTE_PHRASE_RE.fullmatch(text.strip()):
        notes.append(f"composition remark: '{text.strip()}'")
        return None
    if "RANGE" in text.upper() or text.startswith("("):
        notes.append(f"composition given as a range: '{text}'")
        return None
    remainder, phrase_notes = extract_note_phrases(text)
    for phrase in phrase_notes:
        notes.append(f"composition remark: '{phrase}'")
    if not remainder or remainder.upper() == "NA":
        return None
    first = remainder.split()[0]
    if len(remainder.split()) > 1:
        notes.append(f"composition remark: '{' '.join(remainder.split()[1:])}'")
    values = [NbsTextNormalizer.number(v) for v in re.split(r"-+", first) if v]
    if any(v is None for v in values):
        notes.append(f"composition not read: '{text}'")
        return None
    if count == 2 and len(values) == 1:
        return [values[0], round(100.0 - values[0], 3)]
    if len(values) != count:
        notes.append(f"{len(values)} composition values for {count} components")
        return None
    return values
