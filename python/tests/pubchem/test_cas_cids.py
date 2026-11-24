"""CID extraction from compound xref and substance PUG REST bodies."""
from __future__ import annotations

from pubchem.cas_cids import cids_from_body


def test_identifier_list_and_substance_information():
    assert cids_from_body({"IdentifierList": {"CID": [1, 2, 1]}}) == [1, 2]
    assert cids_from_body({"InformationList": {"Information": [
        {"SID": 9}, {"SID": 8, "CID": [3, 3]}, {"SID": 7, "CID": [4]},
    ]}}) == [3, 4]
    assert cids_from_body(None) == []
