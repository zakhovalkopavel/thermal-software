"""
phase_diagrams.nbs.nbs_entry_index — Parse the NSRDS-NBS 61 text dump into NbsEntry objects.

Spec: docs/scripts/PHASE_DIAGRAM_EXTRACTION_SPEC.md § Text index
"""
from __future__ import annotations

import re

from phase_diagrams.models.nbs_entry import NbsEntry
from phase_diagrams.nbs.nbs_text_normalizer import NbsTextNormalizer

_ENTRY_LINE = re.compile(r"^\s*[^\w\s]{0,2}\s*(\d{4})\s+(\S.*)$")
_APPROXIMATE = re.compile(r"\s*AP[PI]'?", re.IGNORECASE)


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


def _parse(number: int, rest: str, raw: str, pdf_page: int, printed_page: int) -> NbsEntry | None:
    fields = re.split(r"\s{2,}", rest.strip())
    if len(fields) < 3:
        return None
    system_field, composition_field, temperature_field = fields[0], fields[1], fields[2]
    references = " ".join(fields[3:]).split()
    components = NbsTextNormalizer.system(system_field)
    if len(components) < 2:
        return None

    notes: list[str] = []
    approximate_composition = bool(_APPROXIMATE.search(composition_field))
    composition_text = _APPROXIMATE.sub("", composition_field).strip()
    composition = _composition(composition_text, len(components), notes)

    temperature_tokens = temperature_field.split()
    temperature = NbsTextNormalizer.number(temperature_tokens[0]) if temperature_tokens else None
    if temperature is None:
        return None
    tail = " ".join(temperature_tokens[1:])
    if temperature_tokens[0].endswith("~"):
        tail = "~" + tail
    approximate_temperature = bool(_APPROXIMATE.search(tail))
    tail = _APPROXIMATE.sub("", tail).strip()
    uncertainty = NbsTextNormalizer.uncertainty(tail) if tail else None
    if tail and uncertainty is None:
        notes.append(f"uncertainty not read: '{tail}'")

    return NbsEntry(
        entry=number,
        system="-".join(components),
        components=components,
        composition_mol=composition,
        temperature_C=temperature,
        uncertainty_C=uncertainty,
        approximate_composition=approximate_composition,
        approximate_temperature=approximate_temperature,
        references=[NbsTextNormalizer.reference(r) for r in references],
        pdf_page=pdf_page,
        printed_page=printed_page,
        raw=raw.rstrip(),
        notes=notes,
    )


def _composition(text: str, count: int, notes: list[str]) -> list[float] | None:
    if not text or text.upper().startswith("NA"):
        return None
    if "RANGE" in text.upper() or text.startswith("("):
        notes.append(f"composition given as a range: '{text}'")
        return None
    first = text.split()[0]
    if len(text.split()) > 1:
        notes.append(f"composition remark: '{' '.join(text.split()[1:])}'")
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
