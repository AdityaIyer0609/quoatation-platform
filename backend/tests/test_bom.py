from app.schemas.bom import BomCustomerSpec
from app.services.bom.service import preview_bom


def _spec(**overrides) -> BomCustomerSpec:
    data = {
        "productType": "FIBC Bulk Bag",
        "productCategory": "Type A — Standard",
        "constructionType": "Circular",
        "bodyStyle": "Non-Builder",
        "bodyGrade": "Std",
        "sizeType": "INNER",
        "length": "90",
        "width": "90",
        "height": "120",
        "swl": "1000",
        "sfRatio": "5:1",
        "fabricColour": "White",
        "bodyGsm": "180",
        "bodyLami": "0",
        "sameFabricForPanels": True,
        "topType": "Open Top",
        "bottomType": "Flat Bottom",
        "loopEnabled": True,
        "loopConstruction": "Cross Corner",
        "loopGsm": "40",
        "loopLength": "30",
        "loopWidth": "5",
        "loopCount": "4",
        "quantity": "500",
        "linerEnabled": False,
    }
    data.update(overrides)
    return BomCustomerSpec.model_validate(data)


def _line(result, heading: str):
    return next((item for item in result.lines if item.heading == heading), None)


def test_circular_body_matches_erp_formula():
    result = preview_bom(_spec(loopEnabled=False, sameFabricForPanels=False))
    body = _line(result, "Body")
    assert body is not None
    # fabric = L+W = 180; cut = H+11 = 131; kg = 131*180*2*180 / 10_000_000
    assert body.fabric_size == "180"
    assert body.cut_size == "131"
    assert body.total_kg == 0.8489
    assert result.total_kg_per_bag >= 0.8489
    assert result.total_material_kg == round(result.total_kg_per_bag * 500, 4)


def test_four_panel_uses_panel_factor():
    result = preview_bom(
        _spec(
            constructionType="4-Panel",
            loopEnabled=False,
            sameFabricForPanels=True,
        )
    )
    body = _line(result, "Body")
    side = _line(result, "Side")
    assert body is not None
    assert body.total_kg == 0.9526
    assert side is not None
    assert side.total_kg and side.total_kg > 0


def test_higher_gsm_increases_body_kg():
    low = preview_bom(_spec(bodyGsm="160", loopEnabled=False, sameFabricForPanels=False))
    high = preview_bom(_spec(bodyGsm="200", loopEnabled=False, sameFabricForPanels=False))
    assert _line(high, "Body").total_kg > _line(low, "Body").total_kg


def test_lamination_increases_body_kg():
    plain = preview_bom(_spec(bodyLami="0", loopEnabled=False, sameFabricForPanels=False))
    coated = preview_bom(_spec(bodyLami="20", loopEnabled=False, sameFabricForPanels=False))
    assert _line(coated, "Body").total_kg > _line(plain, "Body").total_kg


def test_quantity_scales_material_not_per_bag():
    a = preview_bom(_spec(quantity="500", loopEnabled=False, sameFabricForPanels=False))
    b = preview_bom(_spec(quantity="1000", loopEnabled=False, sameFabricForPanels=False))
    assert a.total_kg_per_bag == b.total_kg_per_bag
    assert b.total_material_kg == round(a.total_material_kg * 2, 4)


def test_circular_bottom_gsm_is_body_plus_ten():
    """frmBOM_NEW copies bottom GSM = body GSM + 10 on Circular."""
    result = preview_bom(_spec(sameFabricForPanels=True, loopEnabled=False, topType="Open"))
    bottom = _line(result, "Bottom")
    assert bottom is not None
    assert bottom.gsm == "190"


def test_outer_size_uses_smaller_body_cut():
    inner = preview_bom(_spec(sizeType="INNER", loopEnabled=False, sameFabricForPanels=False))
    outer = preview_bom(_spec(sizeType="OUTER", loopEnabled=False, sameFabricForPanels=False))
    assert _line(inner, "Body").cut_size == "131"
    assert float(_line(outer, "Body").cut_size) < float(_line(inner, "Body").cut_size)


def test_top_and_bottom_spouts():
    result = preview_bom(
        _spec(
            topType="Top Spout",
            topSpoutType="Simple",
            topSpoutDia="40",
            topSpoutHeight="50",
            bottomType="Bottom Spout",
            bottomSpoutType="Simple",
            bottomSpoutDia="35",
            bottomSpoutHeight="40",
            loopEnabled=False,
        )
    )
    assert _line(result, "Top Spout") is not None
    assert _line(result, "Top Spout").total_kg > 0
    assert _line(result, "Bottom Spout") is not None
    assert _line(result, "Bottom Spout").total_kg > 0


def test_iris_spout_uses_pi_constant():
    result = preview_bom(
        _spec(
            topType="Top Spout",
            topSpoutType="Iris/Pyjama Closure",
            topSpoutDia="40",
            topSpoutHeight="50",
            loopEnabled=False,
        )
    )
    spout = _line(result, "Top Spout")
    assert spout is not None
    # cut = 3.14 * (40+4) = 138.16
    assert abs(float(spout.cut_size) - 138.16) < 0.001


def test_cross_corner_loops():
    result = preview_bom(_spec(sameFabricForPanels=False))
    loop = _line(result, "Loop")
    assert loop is not None
    # extra 70 for SF 5 / SWL 1000; cut = 30*2+70 = 130; kg = 130*40*4/100000
    assert loop.cut_size == "130"
    assert loop.total_kg == 0.208


def test_liner_gusseted():
    result = preview_bom(
        _spec(
            linerEnabled=True,
            linerMaterial="LD",
            linerType="Gusseted Liner",
            linerMicron="80",
            loopEnabled=False,
            sameFabricForPanels=False,
        )
    )
    liner = _line(result, "Liner")
    assert liner is not None
    assert liner.total_kg > 0


def test_doc_pouch_and_label():
    result = preview_bom(
        _spec(
            loopEnabled=False,
            sameFabricForPanels=False,
            docPouch=True,
            docLength="30",
            docWidth="22",
            label=True,
            labelLength="10",
            labelWidth="8",
        )
    )
    assert _line(result, "DocPouch").total_kg > 0
    assert _line(result, "Label").total_kg > 0


def test_upanel_has_side_panels():
    result = preview_bom(
        _spec(
            constructionType="U-Panel",
            loopEnabled=False,
            sameFabricForPanels=True,
        )
    )
    assert _line(result, "Body").total_kg > 0
    assert _line(result, "Side").total_kg > 0


def test_validation_requires_spout_sizes():
    from fastapi import HTTPException

    try:
        preview_bom(_spec(topType="Top Spout", topSpoutDia="", topSpoutHeight=""))
        raise AssertionError("expected validation error")
    except HTTPException as exc:
        assert exc.status_code == 422


def test_bottom_rope_uses_erp_cut_plus_five():
    result = preview_bom(
        _spec(
            loopEnabled=False,
            sameFabricForPanels=False,
            bottomRope=True,
            bottomRopeGsm="10",
            bottomRopeSize="10",
            bottomRopeCut="20",
            bottomRopeCount="1",
        )
    )
    rope = _line(result, "Bottom Rope")
    assert rope is not None
    # cut = 20 + 5 = 25; kg = 25 * 10 * 1 / 100000
    assert rope.cut_size == "25"
    assert rope.total_kg == 0.0025


def test_top_flap_inner_formula():
    result = preview_bom(
        _spec(
            loopEnabled=False,
            sameFabricForPanels=False,
            sizeType="INNER",
            length="90",
            width="90",
            topFlap=True,
            topFlapGsm="180",
            topFlapLami="0",
            topFlapCount="1",
        )
    )
    flap = _line(result, "Top Flap")
    assert flap is not None
    # fabric = 90+5=95; cut = 90+15=105; kg = 105*95*180 / 10_000_000
    assert flap.fabric_size == "95"
    assert flap.cut_size == "105"
    assert flap.total_kg == 0.1796


def test_hose_slider_fixed_weight():
    result = preview_bom(_spec(loopEnabled=False, sameFabricForPanels=False, hoseSlider=True, hoseSliderCount="2"))
    line = _line(result, "Hose Slider")
    assert line is not None
    assert line.total_kg == 0.01


def test_top_rope_shows_type_and_color():
    result = preview_bom(
        _spec(
            loopEnabled=False,
            sameFabricForPanels=False,
            topRope=True,
            topRopeType="Braided Rope",
            topRopeGsm="10",
            topRopeSize="10",
            topRopeColor="Milky White",
            topRopeCount="1",
        )
    )
    line = _line(result, "Top Rope")
    assert line is not None
    assert line.lamination == "Braided Rope"
    assert line.colour == "Milky White"
    # cut = 10*20+5 = 205; kg = 205*10*1 / 100000
    assert line.cut_size == "205"
    assert line.total_kg == 0.0205


def test_belly_band_1_inner_formula():
    result = preview_bom(
        _spec(
            loopEnabled=False,
            sameFabricForPanels=False,
            sizeType="INNER",
            length="90",
            width="90",
            bellyBand1=True,
            bellyBand1Gsm="40",
            bellyBand1Size="5",
        )
    )
    line = _line(result, "Belly Band 1")
    assert line is not None
    # cut = (90+90)*2+20 = 380; kg = 40*380/100000
    assert line.cut_size == "380"
    assert line.total_kg == 0.152


def test_extra_doc_pouch_1_formula():
    result = preview_bom(
        _spec(
            loopEnabled=False,
            sameFabricForPanels=False,
            docPouch1=True,
            doc1Length="30",
            doc1Width="22",
            doc1Micron="80",
            doc1Opening="Vertical Open",
            doc1Type="Simple",
            doc1Unit="CMS",
            doc1Count="1",
        )
    )
    line = _line(result, "DocPouch1")
    assert line is not None
    # fabric=30; cut=22+4=26; kg = 30*26*2*80*0.92 / 10_000_000
    assert line.fabric_size == "30"
    assert line.cut_size == "26"
    assert line.total_kg == 0.0115


def test_packing_and_party_go_to_instruction():
    from app.services.bom.mapper import map_customer_spec

    request = map_customer_spec(
        _spec(partyName="Acme", packing="Bale", transport="20 ft", cableTie=True, cableTieCount="4")
    )
    assert "Party: Acme" in request.header.instruction
    assert "Packing: Bale" in request.header.instruction
    assert "Transport: 20 ft" in request.header.instruction
    assert "Cable tie x4" in request.header.instruction

