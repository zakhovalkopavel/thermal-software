from metal_data.ids import material_id, normalize_sae, normalize_uns, slug


def test_slug():
    assert slug("Inconel 718") == "inconel-718"


def test_normalize_uns():
    assert normalize_uns("G10050") == "G10050"
    assert normalize_uns("s20100") == "S20100"
    assert normalize_uns(None) is None


def test_normalize_sae():
    assert normalize_sae("1008") == "1008"
    assert normalize_sae("AISI 304") == "304"
    assert normalize_sae("H13") == "H13"
    assert normalize_sae("M3, class 1") == "M3-CLASS-1"
    assert normalize_sae("M3, class 2") == "M3-CLASS-2"


def test_material_id_prefers_sae_over_uns():
    assert material_id(uns="S30400", sae="304", trade="304") == "aisi-304"
    assert material_id(uns="T72301", sae="W1") == "aisi-w1"
    assert material_id(uns="G10080", sae="1008") == "sae-1008"


def test_material_id_uns_when_no_sae():
    assert material_id(uns="S30400") == "uns-s30400"


def test_material_id_sae():
    assert material_id(sae="1008") == "sae-1008"
    assert material_id(sae="304") == "aisi-304"
