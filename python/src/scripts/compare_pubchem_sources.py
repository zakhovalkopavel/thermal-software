#!/usr/bin/env python3
"""
compare_pubchem_sources.py — Pairwise similarity of PubChem catalog source strings.

Every source is compared with every other source. A pair is reported when the strings are close
enough that they might be the same work: word overlap, or character 4-gram overlap. The catalog
is not changed.

    PYTHONPATH=python/src python python/src/scripts/compare_pubchem_sources.py
"""
from __future__ import annotations

import argparse
import json
import re
from difflib import SequenceMatcher
from pathlib import Path

from pubchem.constants.pubchem import PUBCHEM_DIR, PUBCHEM_REFERENCES_FILE

_WORD = re.compile(r"[a-z0-9]+")
_GRAM = 4


def normalize(text: str) -> str:
    """Lower case, '&' as 'and', punctuation as space. Years and pages stay in the string."""
    text = text.lower().replace("&", " and ")
    return " ".join(_WORD.findall(text))


def words(text: str) -> set[str]:
    return set(_WORD.findall(text))


def grams(text: str) -> set[str]:
    compact = text.replace(" ", "")
    if len(compact) <= _GRAM:
        return {compact} if compact else set()
    return {compact[i:i + _GRAM] for i in range(len(compact) - _GRAM + 1)}


def jaccard(left: set[str], right: set[str]) -> float:
    if not left and not right:
        return 1.0
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


def compare_sources(rows: list[dict], word_min: float, gram_min: float) -> list[dict]:
    """Every row against every later row. A hit needs word Jaccard or 4-gram Jaccard at the floor."""
    prepared = []
    for row in rows:
        source = str(row.get("source") or "")
        folded = normalize(source)
        prepared.append({
            "refNumber": row.get("refNumber"),
            "refCode": row.get("refCode"),
            "source": source,
            "folded": folded,
            "words": words(folded),
            "grams": grams(folded),
        })
    hits: list[dict] = []
    for i, left in enumerate(prepared):
        for right in prepared[i + 1:]:
            word_score = jaccard(left["words"], right["words"])
            gram_score = jaccard(left["grams"], right["grams"])
            if word_score < word_min and gram_score < gram_min:
                continue
            ratio = SequenceMatcher(None, left["folded"], right["folded"]).ratio()
            hits.append({
                "word": round(word_score, 3),
                "gram": round(gram_score, 3),
                "ratio": round(ratio, 3),
                "a": {"refNumber": left["refNumber"], "refCode": left["refCode"], "source": left["source"]},
                "b": {"refNumber": right["refNumber"], "refCode": right["refCode"], "source": right["source"]},
            })
    hits.sort(key=lambda hit: (-hit["ratio"], -hit["word"], hit["a"]["refNumber"] or 0))
    return hits


def _default_file() -> Path:
    raw = Path(PUBCHEM_DIR) / PUBCHEM_REFERENCES_FILE
    if raw.is_file():
        return raw
    return Path(__file__).resolve().parents[3] / raw


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--file", type=Path, default=_default_file(), help="pubchem-references.jsonl")
    parser.add_argument("--word-min", type=float, default=0.72, help="minimum word Jaccard to keep a pair")
    parser.add_argument("--gram-min", type=float, default=0.62, help="minimum 4-gram Jaccard to keep a pair")
    parser.add_argument("--json", action="store_true", help="print the pairs as JSON")
    args = parser.parse_args()
    rows = [json.loads(line) for line in args.file.read_text(encoding="utf-8").splitlines() if line.strip()]
    hits = compare_sources(rows, args.word_min, args.gram_min)
    if args.json:
        print(json.dumps({"rows": len(rows), "pairs": len(hits), "hits": hits}, ensure_ascii=False, indent=2))
        return
    print(f"{len(rows)} sources, {len(hits)} similar pairs (word>={args.word_min} or 4-gram>={args.gram_min})")
    for hit in hits:
        print(
            f"\nratio {hit['ratio']:.3f}  words {hit['word']:.3f}  grams {hit['gram']:.3f}"
            f"\n  #{hit['a']['refNumber']} {hit['a']['refCode']}\n  {hit['a']['source']}"
            f"\n  #{hit['b']['refNumber']} {hit['b']['refCode']}\n  {hit['b']['source']}"
        )


if __name__ == "__main__":
    main()
