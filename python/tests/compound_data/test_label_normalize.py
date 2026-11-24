"""PDF mojibake repair for compound labels."""
from __future__ import annotations

from compound_data.label_normalize import normalize_label


def test_lead_charge():
    assert normalize_label("Lead共2⫹兲 salt tridecanoic acid") == "Lead(2+) salt tridecanoic acid"


def test_n_hydroxyethyl():
    assert (
        normalize_label("N-共2-Hydroxyethyl兲-N , N-dimethyl-1-butanaminium bromide")
        == "N-(2-Hydroxyethyl)-N , N-dimethyl-1-butanaminium bromide"
    )


def test_brackets_and_prime():
    assert (
        normalize_label("Tris共dibutylcarbamodithioato-S,S ⬘兲antimony")
        == "Tris(dibutylcarbamodithioato-S,S ')antimony"
    )
    assert (
        normalize_label("Dodecahydro-1,3,4,6-ethanediylidenedicyclopenta关 cd,gh 兴 pentalene")
        == "Dodecahydro-1,3,4,6-ethanediylidenedicyclopenta[ cd,gh ] pentalene"
    )


def test_stereo_letters():
    assert (
        normalize_label("共3a␣,4␤,7␤,7a␣兲-Octahydrodimethyl-4,7-methano-1H-indene")
        == "(3aα,4β,7β,7aα)-Octahydrodimethyl-4,7-methano-1H-indene"
    )


def test_stereo_chloro_methylpentane_brackets():
    assert (
        normalize_label("(2RS'-Chloro-(3SR'-methylpentane")
        == "(2RS*,3SR*)-2-Chloro-3-methylpentane"
    )
    assert (
        normalize_label("(2RR'-Chloro-(3SS'-methylpentane")
        == "(2RR*,3SS*)-2-Chloro-3-methylpentane"
    )


def test_idempotent_on_clean():
    s = "Calcium carbide"
    assert normalize_label(s) == s
