from app.schemas.bom import BomCustomerSpec
from app.schemas.pricing import PricingOptions
from app.services.bom.service import preview_bom
from app.services.pricing.book4 import MANUAL, PE_RM_PER_T, PP_RM_PER_T, PRINT_QTY_BOUNDARY
from app.services.pricing.service import preview_pricing
import pytest


def _spec(**overrides) -> BomCustomerSpec:
    data = {
        "productType": "FIBC Bulk Bag",
        "productCategory": "Type A",
        "constructionType": "Circular",
        "bodyStyle": "Builder",
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
        "topType": "Open",
        "bottomType": "Flat",
        "loopEnabled": True,
        "loopType": "PP",
        "loopConstruction": "Cross Corner",
        "loopGsm": "40",
        "loopLength": "30",
        "loopWidth": "7",
        "loopCount": "4",
        "quantity": "499",
        "linerEnabled": False,
        "printing": "UnPrinted",
    }
    data.update(overrides)
    return BomCustomerSpec.model_validate(data)


def test_circular_builder_uses_book4_conversion_and_rm():
    spec = _spec()
    bom = preview_bom(spec)
    result = preview_pricing(spec, bom)
    assert result.conversion_rate_per_ton == 950
    assert result.complication == "Builder"
    assert result.bag_design == "Circular"
    assert result.loops == "X-Corner"
    expected_pp = round(result.pp_kg * PP_RM_PER_T / 1000, 2)
    expected_pe = round(result.pe_kg * PE_RM_PER_T / 1000, 2)
    expected_conv = round(result.total_kg_per_bag * 950 / 1000, 2)
    assert result.pp_material_cost == expected_pp
    assert result.pe_material_cost == expected_pe
    assert result.conversion_cost == expected_conv
    assert result.pe_kg == 0
    assert result.currency == "USD"
    assert result.source == "book4"
    if result.total_kg_per_bag >= 1.75:
        assert result.priced is True
        assert result.unit_price == round(expected_pp + expected_pe + expected_conv, 2)


def test_u2_x_corner_is_circular_plus_75_not_u2_plus_75():
    spec = _spec(constructionType="UPanel", loopConstruction="Cross Corner", bodyStyle="Builder")
    result = preview_pricing(spec)
    assert result.bag_design == "U+2 Panel"
    assert result.loops == "X-Corner"
    assert result.conversion_rate_per_ton == 1025  # 950 + 75, not 700 + 75
    assert result.complication == "Circular Builder + $75/t"


def test_u2_corner_builder_uses_700():
    spec = _spec(constructionType="UPanel", loopConstruction="Corner", bodyStyle="Builder")
    result = preview_pricing(spec)
    assert result.conversion_rate_per_ton == 700


def test_four_panel_maps_to_u2():
    spec = _spec(constructionType="4 Panel", loopConstruction="Corner", bodyStyle="Builder")
    result = preview_pricing(spec)
    assert result.bag_design == "U+2 Panel"
    assert result.conversion_rate_per_ton == 700


def test_non_builder_without_complication_is_manual():
    spec = _spec(bodyStyle="Non-Builder")
    result = preview_pricing(spec)
    assert result.priced is False
    assert result.requires_manual_pricing is True
    assert any(err.code == "CONVERSION" for err in result.errors)
    assert MANUAL in result.errors[0].message or any(MANUAL in err.message for err in result.errors)


def test_type_d_does_not_invent_conversion():
    spec = _spec(productCategory="Type D")
    result = preview_pricing(spec)
    assert result.priced is False
    assert result.conversion_cost is None
    assert any(err.code == "TYPE_D" for err in result.errors)


def test_type_c_circular_adds_650():
    spec = _spec(productCategory="Type C")
    result = preview_pricing(spec)
    type_c = next(item for item in result.surcharges if item.code == "TYPE_C")
    assert type_c.rate == 650


def test_food_grade_adds_250_per_ton():
    spec = _spec(bodyGrade="FDA")
    result = preview_pricing(spec)
    food = next(item for item in result.surcharges if item.code == "FOOD_GRADE")
    assert food.rate == 250


def test_food_grade_one_loop_cannot_quote():
    spec = _spec(bodyGrade="FDA", loopCount="1")
    result = preview_pricing(spec)
    assert result.priced is False
    assert any(err.code == "FOOD_LOOP" for err in result.errors)


def test_print_matrix_not_007_addon():
    spec = _spec(printing="1S1C", quantity="499")
    result = preview_pricing(spec)
    assert result.printing is not None
    assert result.printing.amount_per_bag == 0.54  # 0.44 + 0.10
    assert result.printing.amount_per_bag != 0.07


def test_print_qty_500_is_exception():
    spec = _spec(printing="1S1C", quantity="500")
    result = preview_pricing(spec)
    assert result.priced is False
    assert any(err.code == "PRINT_QTY" for err in result.errors)
    assert PRINT_QTY_BOUNDARY in result.errors[0].message or any(
        err.code == "PRINT_QTY" for err in result.errors
    )


def test_print_over_500_uses_second_band():
    spec = _spec(printing="1S1C", quantity="501")
    result = preview_pricing(spec)
    assert result.printing is not None
    assert result.printing.amount_per_bag == 0.15  # 0.10 + 0.05


def test_print_2s1c_unavailable():
    spec = _spec(printing="2S1C", quantity="499")
    result = preview_pricing(spec)
    assert any(err.code == "PRINT" for err in result.errors)


def test_usa_and_shuttle_and_two_loop():
    spec = _spec(loopCount="2")
    result = preview_pricing(
        spec,
        options=PricingOptions(usaMarket=True, shuttle8=True, attachmentCount=1),
    )
    rates = {item.code: item.rate for item in result.surcharges}
    assert rates["USA"] == 75
    assert rates["SHUTTLE_8"] == 50
    assert rates["ATTACHMENT"] == 100
    assert rates["TWO_LOOP"] == 50


def test_below_min_weight_flags_manual_without_invented_surcharge():
    spec = _spec(
        loopEnabled=False,
        sameFabricForPanels=False,
        bodyStyle="Builder",
    )
    result = preview_pricing(spec)
    assert result.total_kg_per_bag < 1.75
    assert any(err.code == "MIN_WEIGHT" for err in result.errors)
    assert result.requires_manual_pricing is True
    assert not any("invent" in (err.message.lower()) for err in result.errors)
    assert all(item.code != "MIN_WEIGHT_SURCHARGE" for item in result.surcharges)


def test_plus_rm_alu_liner_is_not_pe_rm():
    spec = _spec(
        linerEnabled=True,
        linerMaterial="ALU",
        linerType="Gusseted Liner",
        linerMicron="70",
    )
    result = preview_pricing(spec)
    assert result.pe_kg == 0
    assert result.unclassified_kg > 0
    assert any(err.code == "MATERIAL_CLASSIFICATION" for err in result.errors)
    alu = next((item for item in result.addons if item.label == "Alu Liner"), None)
    assert alu is not None
    liner_kg = next(row["kg"] for row in result.material_lines if row["heading"] == "Liner")
    extra = liner_kg * (4600 + PE_RM_PER_T) / 1000
    assert alu.amount_per_bag == round(extra, 2)


def test_ld_liner_is_pe_bucket():
    spec = _spec(
        linerEnabled=True,
        linerMaterial="LD",
        linerType="Gusseted Liner",
        linerMicron="70",
    )
    result = preview_pricing(spec)
    assert result.pe_kg > 0
    assert result.unclassified_kg == 0


def test_doc_pouch_is_not_dumped_into_pp():
    spec = _spec(docPouch=True, docLength="30", docWidth="22", docMicron="100")
    result = preview_pricing(spec)
    doc = next((row for row in result.material_lines if row["heading"] == "DocPouch"), None)
    if doc is None:
        pytest.skip("BOM produced no DocPouch kg for this spec")
    assert doc["category"] == "unclassified"
    assert result.pp_kg != result.total_kg_per_bag - result.pe_kg or result.unclassified_kg > 0
    assert result.requires_manual_pricing is True


def test_per_piece_addon():
    spec = _spec()
    result = preview_pricing(spec, options=PricingOptions(addons=["Tyvek Safety Label"]))
    line = next(item for item in result.addons if item.label == "Tyvek Safety Label")
    assert line.unit == "pcs"
    assert line.amount_per_bag == 0.07


def test_per_ton_addon_uses_total_kg():
    spec = _spec()
    result = preview_pricing(spec, options=PricingOptions(addons=["Colour Fabric"]))
    line = next(item for item in result.addons if item.label == "Colour Fabric")
    assert line.unit == "per_ton"
    assert line.amount_per_bag == round(result.total_kg_per_bag * 100 / 1000, 2)


def test_unmapped_complication_not_inferred():
    spec = _spec(
        bodyStyle="Non-Builder",
        linerType="Gusseted Liner",
        linerEnabled=True,
        linerMicron="70",
    )
    result = preview_pricing(spec)
    assert any(err.code == "CONVERSION" for err in result.errors)


def test_leno_without_kg_is_flagged():
    spec = _spec()
    result = preview_pricing(spec, options=PricingOptions(addons=["Leno Fabric"]))
    assert any(err.code == "ADDON" for err in result.errors)


def test_pricing_preview_http(client):
    spec = _spec()
    response = client.post("/api/quotes/pricing/preview", json={"specification": spec.model_dump(by_alias=True)})
    assert response.status_code == 200
    body = response.json()
    assert body["currency"] == "USD"
    assert body["ppMaterialCost"] is not None
    assert "requiresManualPricing" in body


def test_complication_picker_lists_circular_x_corner():
    spec = _spec(bodyStyle="Non-Builder")
    from app.services.pricing.mapping import complication_picker

    picker = complication_picker(spec)
    assert picker["needsPicker"] is True
    names = [row["complication"] for row in picker["candidates"]]
    assert names == [
        "Builder",
        "Complicated without Dust Proof",
        "Complicated with Dust Proof",
        "Without Shape Loosely Inserted.",
        "With Shape Loosely Inserted.",
        "Bottom Running Loops",
    ]


def test_explicit_complication_selects_circular_conversion_row():
    spec = _spec(
        bodyStyle="Non-Builder",
        length="120",
        width="120",
        height="200",
        bodyGsm="240",
    )
    result = preview_pricing(
        spec,
        options=PricingOptions(complication="Complicated without Dust Proof"),
    )
    assert result.conversion_rate_per_ton == 1050
    assert result.complication == "Complicated without Dust Proof"
    if result.total_kg_per_bag >= 1.75:
        assert result.priced is True


def test_complication_picker_http(client):
    spec = _spec(bodyStyle="Non-Builder")
    response = client.post(
        "/api/quotes/pricing/complications",
        json={"specification": spec.model_dump(by_alias=True)},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["needsPicker"] is True
    assert body["lookupDesign"] == "Circular"
    assert body["lookupLoops"] == "X-Corner"
    assert len(body["candidates"]) == 6
