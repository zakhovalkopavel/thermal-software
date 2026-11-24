"""
compound_data.name_to_formula — Propose chemical formulas from English compound names.

First-pass inorganic salt / binary / hydrate grammar for unresolved labels.
Writes a review CSV only; does not mutate unresolved.json.
"""
from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path

from chemical_formula import formula_elements
from compound_data.constants.name_formula_components import (
    ANION_FRAGMENT_OVERRIDE,
    ANIONS,
    CATIONS,
    HYDRATE_PREFIXES,
    MULTIPLICATIVE_PREFIXES,
    ROMAN_VALENCE,
    Anion,
    Cation,
    components_payload,
)
from compound_data.label_normalize import normalize_label

_PAREN_FORMULA = re.compile(r"\(([^)]+)\)\s*$")
_ROMAN = re.compile(r"^(.*?)\s*\(([ivx]+)\)\s*$", re.I)
_WHITESPACE = re.compile(r"\s+")


@dataclass(frozen=True)
class NameFormulaResult:
    formula: str | None
    status: str  # proposed | exact_dict | from_parens | skipped | failed
    method: str
    notes: str


# Classical cation adjectives → systematic metal + oxidation state.
_CLASSICAL_CATIONS: dict[str, str] = {
    "ferrous": "iron(II)",
    "ferric": "iron(III)",
    "cuprous": "copper(I)",
    "cupric": "copper(II)",
    "stannous": "tin(II)",
    "stannic": "tin(IV)",
    "mercurous": "mercury(I)",
    "mercuric": "mercury(II)",
    "plumbous": "lead(II)",
    "plumbic": "lead(IV)",
    "cobaltous": "cobalt(II)",
    "cobaltic": "cobalt(III)",
    "nickelous": "nickel(II)",
    "chromous": "chromium(II)",
    "chromic": "chromium(III)",
    "manganous": "manganese(II)",
    "manganic": "manganese(III)",
    "uranyl": "uranyl",  # kept; handled as UO2 cation elsewhere if present
}


def _normalize(label: str) -> str:
    s = normalize_label(label)
    s = s.replace("·", " ").replace("•", " ")
    s = _WHITESPACE.sub(" ", s)
    words = s.split()
    if words:
        first = words[0].lower()
        if first in _CLASSICAL_CATIONS and _CLASSICAL_CATIONS[first] != first:
            words[0] = _CLASSICAL_CATIONS[first]
            s = " ".join(words)
    return s


def _default_compound_names_path() -> Path:
    """Resolve ``compound_names.csv`` on the host repo and in the Python Docker image."""
    here = Path(__file__).resolve()
    # Host: …/python/src/compound_data → repo root is parents[3]
    # Docker: /app/src/compound_data → legacy mounted at /app/legacy
    candidates = [
        Path("/app/legacy/library/resources/compound_names.csv"),
        here.parents[3] / "legacy" / "library" / "resources" / "compound_names.csv",
        here.parents[2].parent / "legacy" / "library" / "resources" / "compound_names.csv",
    ]
    for path in candidates:
        if path.is_file():
            return path
    return candidates[0]


def load_exact_name_dict(path: Path | None = None) -> dict[str, str]:
    """Invert legacy compound_names.csv → lowercased name → formula."""
    if path is None:
        path = _default_compound_names_path()
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 2:
            continue
        formula, name = parts[0], parts[1]
        if not formula or not name:
            continue
        key = _normalize(name).lower()
        out.setdefault(key, formula)
    return out


def _subscript(n: int) -> str:
    return "" if n == 1 else str(n)


def _hydrate_suffix(n: int) -> str:
    return "·H2O" if n == 1 else f"·{n}H2O"


def _wrap_polyatomic(fragment: str) -> str:
    """Parenthesize multi-element fragments when a count > 1 is needed."""
    if len(fragment) == 1:
        return fragment
    if fragment.isalpha() and fragment[0].isupper() and fragment[1:].islower():
        return fragment  # single element symbol like Cl, Fe
    # multi-char element symbols already handled; polyatomic if has digit or second capital
    if any(c.isdigit() for c in fragment) or sum(1 for c in fragment if c.isupper()) > 1:
        return f"({fragment})"
    if fragment in ("OH", "CN"):
        return f"({fragment})"
    return fragment


def _is_single_element(fragment: str) -> bool:
    return bool(re.fullmatch(r"[A-Z][a-z]?", fragment))


def _formula_unit(sym: str, count: int) -> str:
    """Symbol + count, parenthesizing polyatomic units when count ≠ 1."""
    if count == 1:
        return sym
    if _is_single_element(sym):
        return sym + str(count)
    wrapped = sym if sym.startswith("(") else f"({sym})"
    return wrapped + str(count)


def balance_ionic(cation_sym: str, cation_charge: int, anion: Anion, anion_count_hint: int | None = None) -> str | None:
    """Charge-neutral MxAy (or binary_rule specials)."""
    if anion.binary_rule == "carbide":
        return _carbide_formula(cation_sym, cation_charge)
    if anion.binary_rule == "boride":
        return None  # ambiguous stoichiometry without paren formula

    frag = ANION_FRAGMENT_OVERRIDE.get(anion.family, anion.fragment)
    a_charge = abs(anion.charge)
    c_charge = cation_charge

    if anion_count_hint is not None:
        # Fixed anion multiplicity from name (dioxide → 2 O); derive cation count
        n_anion = anion_count_hint
        total_neg = n_anion * a_charge
        if total_neg % c_charge != 0:
            return None
        n_cation = total_neg // c_charge
    else:
        from math import gcd

        g = gcd(c_charge, a_charge)
        n_cation = a_charge // g
        n_anion = c_charge // g

    return _formula_unit(cation_sym, n_cation) + _formula_unit(frag, n_anion)


def _carbide_formula(cation_sym: str, cation_charge: int) -> str | None:
    # Alkaline earth / Be / +2 → MC2 (acetylide); alkali +1 → M2C2; Al → Al4C3; else MC
    if cation_charge == 2 and cation_sym in ("Ca", "Sr", "Ba", "Be", "Mg", "Ra"):
        return f"{cation_sym}C2"
    if cation_charge == 1:
        return f"{cation_sym}2C2"
    if cation_sym == "Al":
        return "Al4C3"
    if cation_charge == 4 and cation_sym in ("Si", "Ti", "Zr", "Hf", "Th"):
        return f"{cation_sym}C"
    if cation_sym == "B":
        return "B4C"
    return None


def _match_cation(words: list[str]) -> tuple[Cation, int | None, list[str]] | None:
    """Match longest cation name at start; return cation, roman valence, rest."""
    if not words:
        return None
    # "uranyl nitrate" etc.
    lower = [w.lower() for w in words]
    # Try 2-word then 1-word stems
    for n in (2, 1):
        if len(lower) < n:
            continue
        stem = " ".join(lower[:n])
        for cat in CATIONS:
            if stem in cat.names:
                rest = words[n:]
                roman = None
                # Iron(III) may be glued in first token already handled upstream
                return cat, roman, rest
    # First token may be Metal(III)
    m = _ROMAN.match(words[0])
    if m:
        stem = m.group(1).lower()
        roman = ROMAN_VALENCE.get(m.group(2).lower())
        for cat in CATIONS:
            if stem in cat.names:
                return cat, roman, words[1:]
    return None


def _split_hydrate(words: list[str]) -> tuple[list[str], int | None]:
    if not words:
        return words, None
    last = words[-1].lower()
    if last in HYDRATE_PREFIXES:
        return words[:-1], HYDRATE_PREFIXES[last]
    # "hexahydrate" already covered; also "n-hydrate"
    return words, None


_ALUM_METALS = {"potassium": "K", "rubidium": "Rb", "cesium": "Cs", "caesium": "Cs", "sodium": "Na"}
_SODIUM_PREFIXES = {"monosodium": 1, "disodium": 2, "trisodium": 3}
# Oxoanion salts of Cu/Ni/… are almost always +2 when the name omits a Roman numeral.
# Simple halides stay ambiguous (FeCl2 vs FeCl3).
_DEFAULT_DIVALENT_ANIONS = frozenset({
    "nitrate", "sulfate", "sulphate", "perchlorate",
})


def _with_hydrate(formula: str, n_hyd: int | None) -> str:
    return formula if not n_hyd else formula + _hydrate_suffix(n_hyd)


def _alum_or_aluminum_sulfate(words: list[str], n_hyd: int | None) -> NameFormulaResult | None:
    """KAl(SO4)2·12H2O alums and Al2(SO4)3·nH2O."""
    low = [w.lower() for w in words]
    if not low:
        return None
    al = {"aluminum", "aluminium"}
    if low[0] in al and len(low) >= 3 and low[1] in _ALUM_METALS and low[2] in ("sulfate", "sulphate"):
        return NameFormulaResult(
            _with_hydrate(f"{_ALUM_METALS[low[1]]}Al(SO4)2", n_hyd), "proposed", "alum", "",
        )
    if low[0] in _ALUM_METALS and len(low) >= 3 and low[1] in al and low[2] in ("sulfate", "sulphate"):
        return NameFormulaResult(
            _with_hydrate(f"{_ALUM_METALS[low[0]]}Al(SO4)2", n_hyd), "proposed", "alum", "",
        )
    if low[0] in al and len(low) >= 2 and low[1] in ("sulfate", "sulphate"):
        return NameFormulaResult(_with_hydrate("Al2(SO4)3", n_hyd), "proposed", "aluminum_sulfate", "")
    return None


def _sodium_prefix_salt(words: list[str], n_hyd: int | None) -> NameFormulaResult | None:
    """trisodium phosphate → Na3PO4; disodium hydrogen phosphate → Na2HPO4."""
    if not words:
        return None
    pref = words[0].lower()
    if pref not in _SODIUM_PREFIXES:
        return None
    n_na = _SODIUM_PREFIXES[pref]
    anion_match = _match_anion(words[1:])
    if not anion_match:
        return None
    anion, _hint, note = anion_match
    if abs(anion.charge) != n_na:
        return None
    frag = ANION_FRAGMENT_OVERRIDE.get(anion.family, anion.fragment)
    body = f"Na{_subscript(n_na)}{frag}"
    return NameFormulaResult(_with_hydrate(body, n_hyd), "proposed", note or "sodium_prefix", "")


def _default_salt_valence(cation: Cation, rest: list[str]) -> int | None:
    """When no Roman numeral, prefer +2 for common salt anions if that valence exists."""
    if 2 not in (cation.valences or ()):
        return None
    joined = " ".join(w.lower() for w in rest)
    if any(a in joined for a in _DEFAULT_DIVALENT_ANIONS):
        return 2
    return None


def _match_anion(words: list[str]) -> tuple[Anion, int | None, str] | None:
    """Match anion phrase; return anion, optional multiplicity, note."""
    if not words:
        return None
    joined = " ".join(w.lower() for w in words)
    # oxide name variants with embedded prefix
    oxide_map = {
        "monoxide": (1, "oxide"),
        "dioxide": (2, "oxide"),
        "trioxide": (3, "oxide"),
        "sesquioxide": (3, "oxide"),  # M2O3 → anion count 3 with cation 2
        "tetroxide": (4, "oxide"),
        "pentoxide": (5, "oxide"),
        "disulfide": (2, "sulfide"),
        "disulphide": (2, "sulfide"),
        "dioxide": (2, "oxide"),
    }
    if joined in oxide_map:
        count, family = oxide_map[joined]
        anion = next(a for a in ANIONS if a.family == family)
        return anion, count, f"prefixed_{joined}"

    # oxyhalide: trioxychloride, dioxydichloride, …
    oxy = re.fullmatch(
        r"(?:(mono|di|tri|tetra|penta|hexa)?)oxy"
        r"(?:(mono|di|tri|tetra|penta|hexa)?)?(chloride|fluoride|bromide|iodide)",
        joined.replace(" ", ""),
    )
    # allow "trioxychloride" as one word
    one = "".join(w.lower() for w in words)
    m = re.fullmatch(
        r"(mono|di|tri|tetra|penta|hexa)?oxy"
        r"(mono|di|tri|tetra|penta|hexa)?(chloride|fluoride|bromide|iodide)",
        one,
    )
    if m:
        o_pref, x_pref, hal = m.group(1), m.group(2), m.group(3)
        n_o = MULTIPLICATIVE_PREFIXES.get(o_pref or "mono", 1) if o_pref else 1
        # "oxy" alone → 1; "trioxychloride" → tri=3
        if o_pref:
            n_o = MULTIPLICATIVE_PREFIXES[o_pref]
        else:
            n_o = 1
        n_x = MULTIPLICATIVE_PREFIXES.get(x_pref, 1) if x_pref else 1
        return (
            Anion("oxyhalide", (one,), f"O{n_o}" + {"chloride": "Cl", "fluoride": "F", "bromide": "Br", "iodide": "I"}[hal] * n_x, 0),
            None,
            f"oxyhalide_O{n_o}_X{n_x}",
        )

    # longest anion name match on full join or last token(s)
    for anion in sorted(ANIONS, key=lambda a: max(len(n) for n in a.names), reverse=True):
        for name in sorted(anion.names, key=len, reverse=True):
            # "nitrate", "tri nitrate", or glued "trinitrate"
            if not (joined == name or joined.endswith(" " + name) or joined.endswith(name)):
                continue
            prefix_part = joined[: -len(name)].strip() if joined != name else ""
            hint = None
            # silicon tetrachloride / trinitrate → prefix + anion (any family)
            if prefix_part in MULTIPLICATIVE_PREFIXES:
                hint = MULTIPLICATIVE_PREFIXES[prefix_part]
            elif not prefix_part and len(words) >= 2:
                pref = words[0].lower()
                if pref in MULTIPLICATIVE_PREFIXES and " ".join(w.lower() for w in words[1:]) == name:
                    return anion, MULTIPLICATIVE_PREFIXES[pref], f"prefix_{pref}"
            # Reject accidental suffixes ("carbonate" matching "ate") unless prefix empty/known.
            if prefix_part and prefix_part not in MULTIPLICATIVE_PREFIXES:
                continue
            return anion, hint, anion.family
    return None


def _build_oxyhalide(cation_sym: str, cation_charge: int, n_o: int, halide: str, n_x: int) -> str | None:
    total_neg = 2 * n_o + n_x
    if total_neg % cation_charge != 0:
        return None
    n_c = total_neg // cation_charge
    return f"{cation_sym}{_subscript(n_c)}O{_subscript(n_o)}{halide}{_subscript(n_x)}"


def name_to_formula(label: str, *, exact_dict: dict[str, str] | None = None) -> NameFormulaResult:
    """Parse one English label into a formula proposal."""
    raw = _normalize(label)
    if not raw:
        return NameFormulaResult(None, "skipped", "empty", "empty label")

    # Trailing parenthetical formula
    pm = _PAREN_FORMULA.search(raw)
    if pm:
        candidate = pm.group(1).strip().replace(" ", "")
        # Fe2B, ReO3Cl, etc.
        try:
            formula_elements(candidate)
            return NameFormulaResult(candidate, "from_parens", "paren_formula", "formula in parentheses")
        except Exception:
            pass  # fall through to name parse on stripped label
        raw = _normalize(raw[: pm.start()])

    key = raw.lower()
    if exact_dict and key in exact_dict:
        f = exact_dict[key]
        try:
            formula_elements(f)
            return NameFormulaResult(f, "exact_dict", "compound_names.csv", "exact dictionary hit")
        except Exception as e:
            return NameFormulaResult(None, "failed", "exact_dict", f"dict formula invalid: {e}")

    words = [w.strip(",;") for w in raw.split() if w.strip(",;")]
    # Strip trailing hydrate first
    words, n_hyd = _split_hydrate(words)

    # Alums / aluminum sulfate before the generic cation+anion grammar
    alum = _alum_or_aluminum_sulfate(words, n_hyd)
    if alum is not None:
        return alum

    # zirconyl chloride → ZrOCl2
    if words and words[0].lower() == "zirconyl":
        rest = words[1:]
        anion_match = _match_anion(rest)
        if anion_match and anion_match[0].family == "chloride":
            formula = "ZrOCl2"
            if n_hyd:
                formula = formula + _hydrate_suffix(n_hyd)
            return NameFormulaResult(formula, "proposed", "zirconyl", "")

    # trisodium / disodium phosphate…
    poly_na = _sodium_prefix_salt(words, n_hyd)
    if poly_na is not None:
        return poly_na

    matched = _match_cation(words)
    if not matched:
        return NameFormulaResult(None, "failed", "unparsed", "no cation match")
    cation, roman, rest = matched

    # Roman may be in rest[0] as (III) alone — rare
    if roman is None and rest and re.fullmatch(r"\(([ivx]+)\)", rest[0], re.I):
        roman = ROMAN_VALENCE.get(rest[0][1:-1].lower())
        rest = rest[1:]

    valence = roman if roman is not None else cation.default_valence
    if valence is None:
        # Cu/Ni/… nitrates and sulfates are almost always +2 when unnamed
        valence = _default_salt_valence(cation, rest)
    if valence is None:
        return NameFormulaResult(None, "failed", "needs_review", "multi-valent cation without Roman numeral")

    if not rest:
        return NameFormulaResult(None, "failed", "unparsed", "cation only")

    # Oxyhalide one-token or multi
    one = "".join(w.lower() for w in rest)
    m_oxy = re.fullmatch(
        r"(mono|di|tri|tetra|penta|hexa)?oxy"
        r"(mono|di|tri|tetra|penta|hexa)?(chloride|fluoride|bromide|iodide)",
        one,
    )
    if m_oxy:
        o_pref, x_pref, hal_name = m_oxy.group(1), m_oxy.group(2), m_oxy.group(3)
        n_o = MULTIPLICATIVE_PREFIXES[o_pref] if o_pref else 1
        n_x = MULTIPLICATIVE_PREFIXES[x_pref] if x_pref else 1
        halide = {"chloride": "Cl", "fluoride": "F", "bromide": "Br", "iodide": "I"}[hal_name]
        formula = _build_oxyhalide(cation.symbol, valence, n_o, halide, n_x)
        if formula is None:
            return NameFormulaResult(None, "failed", "oxyhalide", "charge imbalance")
        if n_hyd:
            formula = formula + _hydrate_suffix(n_hyd)
        try:
            formula_elements(formula.replace("·", "."))
        except Exception:
            # · may not parse; try without hydrate check on anhydrous part
            try:
                formula_elements(formula.split("·")[0])
            except Exception as e:
                return NameFormulaResult(None, "failed", "oxyhalide", f"unparseable: {e}")
        return NameFormulaResult(formula, "proposed", "oxyhalide", f"O{n_o}{halide}{n_x}")

    anion_match = _match_anion(rest)
    if not anion_match:
        return NameFormulaResult(None, "failed", "unparsed", f"no anion match in {' '.join(rest)}")
    anion, hint, note = anion_match

    # sesquioxide → M2O3
    if " ".join(w.lower() for w in rest) == "sesquioxide" or rest[-1].lower() == "sesquioxide":
        formula = f"{cation.symbol}2O3"
    else:
        formula = balance_ionic(cation.symbol, valence, anion, anion_count_hint=hint)
        if formula is None:
            return NameFormulaResult(None, "failed", note, "could not balance / ambiguous binary")

    if n_hyd:
        formula = formula + _hydrate_suffix(n_hyd)

    anhydrous = formula.split("·")[0]
    try:
        formula_elements(anhydrous)
    except Exception as e:
        return NameFormulaResult(None, "failed", note, f"unparseable formula {formula}: {e}")

    return NameFormulaResult(formula, "proposed", note, "")


def propose_for_unresolved(
    unresolved_path: Path,
    *,
    exact_dict: dict[str, str] | None = None,
) -> list[dict[str, str]]:
    """Run name→formula on labeled unresolved rows."""
    data = json.loads(unresolved_path.read_text(encoding="utf-8"))
    entries = data["entries"] if isinstance(data, dict) and "entries" in data else data
    if exact_dict is None:
        exact_dict = load_exact_name_dict()
    rows: list[dict[str, str]] = []
    for entry in entries:
        cas = str(entry.get("cas") or "")
        labels = entry.get("labels") or []
        if not labels:
            rows.append({
                "cas": cas,
                "label": "",
                "formula": "",
                "status": "skipped",
                "method": "no_label",
                "notes": "unlabeled",
            })
            continue
        # Prefer systematic-looking label: has Roman, hydrate, or anion keyword
        best: NameFormulaResult | None = None
        best_label = labels[0]
        for lab in labels:
            r = name_to_formula(lab, exact_dict=exact_dict)
            if best is None:
                best, best_label = r, lab
                continue
            rank = {"from_parens": 0, "exact_dict": 1, "proposed": 2, "failed": 3, "skipped": 4}
            if rank.get(r.status, 9) < rank.get(best.status, 9):
                best, best_label = r, lab
            elif r.status == best.status == "proposed" and r.formula and not best.formula:
                best, best_label = r, lab
        assert best is not None
        rows.append({
            "cas": cas,
            "label": best_label,
            "formula": best.formula or "",
            "status": best.status,
            "method": best.method,
            "notes": best.notes,
        })
    return rows


def write_proposals(
    unresolved_path: Path,
    out_csv: Path,
    out_components: Path,
) -> list[dict[str, str]]:
    """Write review CSV + components.json; return rows."""
    rows = propose_for_unresolved(unresolved_path)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    out_components.parent.mkdir(parents=True, exist_ok=True)
    out_components.write_text(
        json.dumps(components_payload(), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    with out_csv.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["cas", "label", "formula", "status", "method", "notes"],
        )
        w.writeheader()
        w.writerows(rows)
    return rows


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[3]
    unresolved = root / "shared" / "processed" / "compound-data" / "unresolved.json"
    out_dir = root / "tmp" / "reports" / "python" / "compound-data"
    rows = write_proposals(
        unresolved,
        out_dir / "name-formula-proposals.csv",
        out_dir / "name-formula-components.json",
    )
    from collections import Counter
    c = Counter(r["status"] for r in rows)
    print(f"wrote {len(rows)} rows → {out_dir}")
    print(dict(c))
