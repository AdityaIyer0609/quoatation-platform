from __future__ import annotations

from fastapi import HTTPException, status

from app.schemas.bom import BomCustomerSpec
from app.services.bom.helpers import BomHeader, BomRequest, D, Values

CONSTRUCTION_MAP = {
    "circular woven": "Circular",
    "circular": "Circular",
    "u-panel": "UPanel",
    "upanel": "UPanel",
    "4-panel": "4 Panel",
    "4 panel": "4 Panel",
    "baffle": "Buffle",
    "buffle": "Buffle",
    "cross corner": "4 Panel",
}

STYLE_MAP = {
    "standard": "Non-Builder",
    "non-builder": "Non-Builder",
    "non builder": "Non-Builder",
}

GRADE_MAP = {
    "standard": "Std",
    "std": "Std",
}

TOP_MAP = {
    "open top": "Open",
    "open": "Open",
    "filling spout": "Top Spout",
    "top spout": "Top Spout",
    "duffle top": "Duffle or Skrit",
    "duffle or skrit": "Duffle or Skrit",
    "closed top": "Open",
    "conical top": "Conical Top",
    "conical plate top": "Conical PlateTop",
}

BOTTOM_MAP = {
    "flat bottom": "Flat",
    "flat": "Flat",
    "discharge spout": "Bottom Spout",
    "bottom spout": "Bottom Spout",
    "cone bottom": "Conical Base",
    "conical base": "Conical Base",
    "conical plate base": "Conical Plate Base",
    "pallet pocket": "Flat",
}

LINER_MATERIAL_MAP = {
    "ld": "LD",
    "lld": "LLD",
    "hd": "HD",
    "alu": "ALU",
    "pe liner": "LD",
    "pe": "LD",
    "aluminium": "ALU",
    "aluminum": "ALU",
}


def _map_construction(value: str) -> str:
    return CONSTRUCTION_MAP.get(value.strip().lower(), value.strip())


def _map_style(value: str) -> str:
    return STYLE_MAP.get(value.strip().lower(), value.strip() or "Non-Builder")


def _map_grade(value: str) -> str:
    return GRADE_MAP.get(value.strip().lower(), value.strip() or "Std")


def _map_top(value: str) -> str:
    return TOP_MAP.get(value.strip().lower(), value.strip())


def _map_bottom(value: str) -> str:
    return BOTTOM_MAP.get(value.strip().lower(), value.strip())


def validate_customer_spec(spec: BomCustomerSpec) -> None:
    errors: list[str] = []
    if D(spec.length) <= 0 or D(spec.width) <= 0 or D(spec.height) <= 0:
        errors.append("Length, width, and height are required.")
    if D(spec.quantity) <= 0:
        errors.append("Quantity is required.")
    if D(spec.body_gsm) <= 0 and D(spec.body_lami) <= 0:
        errors.append("Body fabric weight (GSM) is required.")
    if not spec.construction_type.strip():
        errors.append("Construction is required.")
    top = _map_top(spec.top_type)
    if top.lower() in {"top spout", "conical platetop", "conical top"}:
        if D(spec.top_spout_dia) <= 0 or D(spec.top_spout_height) <= 0:
            errors.append("Filling spout diameter and height are required for a spout top.")
    if top.lower() in {"duffle or skrit", "top + skrit"} and D(spec.duffle_height) <= 0:
        errors.append("Duffle / skirt height is required for this top type.")
    bottom = _map_bottom(spec.bottom_type)
    if bottom.lower() == "bottom spout":
        if D(spec.bottom_spout_dia) <= 0 or D(spec.bottom_spout_height) <= 0:
            errors.append("Discharge spout diameter and height are required for a spout bottom.")
    if spec.loop_enabled and (D(spec.loop_gsm) <= 0 or D(spec.loop_length) <= 0 or D(spec.loop_width) <= 0):
        errors.append("Loop GSM, length, and width are required when lifting loops are included.")
    if spec.liner_enabled and D(spec.liner_micron) <= 0:
        errors.append("Liner thickness is required when a liner is included.")
    if errors:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=" ".join(errors))


def map_customer_spec(spec: BomCustomerSpec) -> BomRequest:
    construction = _map_construction(spec.construction_type)
    body_style = _map_style(spec.body_style)
    body_grade = _map_grade(spec.body_grade)
    top = _map_top(spec.top_type)
    bottom = _map_bottom(spec.bottom_type)
    if bottom.lower() == "bottom spout" and spec.bottom_spout_type.strip():
        bottom = f"Bottom Spout/{spec.bottom_spout_type.strip()}"

    bag_type = f"{construction}/{body_style}/{body_grade}"
    same = spec.same_fabric_for_panels
    top_gsm = spec.top_gsm if spec.top_gsm.strip() else (spec.body_gsm if same else "")
    top_lami = spec.top_lami if spec.top_lami.strip() else (spec.body_lami if same else "")
    bottom_gsm = spec.bottom_gsm if spec.bottom_gsm.strip() else (
        str(int(D(spec.body_gsm)) + 10) if same and construction == "Circular" and D(spec.body_gsm) > 0 else (spec.body_gsm if same else "")
    )
    bottom_lami = spec.bottom_lami if spec.bottom_lami.strip() else (spec.body_lami if same else "")
    side_gsm = spec.side_gsm if spec.side_gsm.strip() else (spec.body_gsm if same else "")
    side_lami = spec.side_lami if spec.side_lami.strip() else (spec.body_lami if same else "")
    spout_gsm = spec.top_spout_gsm if spec.top_spout_gsm.strip() else (spec.body_gsm if same else "")
    spout_lami = spec.top_spout_lami if spec.top_spout_lami.strip() else (spec.body_lami if same else "")
    ds_gsm = spec.bottom_spout_gsm if spec.bottom_spout_gsm.strip() else (spec.body_gsm if same else "")
    ds_lami = spec.bottom_spout_lami if spec.bottom_spout_lami.strip() else (spec.body_lami if same else "")

    loop_const = spec.loop_construction.strip()
    if spec.loop_enabled and not loop_const:
        loop_const = "Cross Corner" if construction == "Circular" else "Corner"

    liner_material = LINER_MATERIAL_MAP.get(spec.liner_material.strip().lower(), spec.liner_material.strip().upper() or "LD")

    header = BomHeader(
        bag_type=bag_type,
        size_l=D(spec.length),
        size_w=D(spec.width),
        size_h=D(spec.height),
        size_type="OUTER" if spec.size_type.strip().upper() == "OUTER" else "INNER",
        swl=spec.swl.strip() or "0",
        sf_ratio=spec.sf_ratio.strip() or "5:1",
        qty=spec.quantity.strip() or "0",
        qty_unit="PCS",
        fs_type=spec.top_spout_type.strip(),
        ds_type=spec.bottom_spout_type.strip(),
        fab_color=spec.fabric_colour.strip() or "White",
        instruction=" | ".join(
            part
            for part in [
                spec.notes.strip(),
                f"Party: {spec.party_name.strip()}" if spec.party_name.strip() else "",
                f"Packing: {spec.packing.strip()}" if spec.packing.strip() else "",
                f"Transport: {spec.transport.strip()}" if spec.transport.strip() else "",
                "Cable tie" + (f" x{spec.cable_tie_count}" if spec.cable_tie_count.strip() else "") if spec.cable_tie else "",
                "Top velcro" if spec.top_velcro else "",
                "Bottom velcro" if spec.bottom_velcro else "",
            ]
            if part
        ),
        print_type=spec.printing.strip(),
        loop_type=spec.loop_type.strip(),
        is_drop_loop=spec.drop_loop,
        doc=" / ".join(part for part in [spec.doc_type.strip(), spec.doc_opening.strip()] if part) if spec.doc_pouch else "",
        doc_unit=spec.doc_unit.strip() or "CM",
        doc_number=spec.doc_count.strip() or "1",
    )

    bom1 = Values(
        {
            "Construction": construction,
            "BodyStyle": body_style,
            "BodyGrade": body_grade,
            "BodyGSM": spec.body_gsm,
            "BodyLami": spec.body_lami or "0",
            "BodyColor": spec.fabric_colour,
            "TopGSM": top_gsm,
            "TopLami": top_lami or "0",
            "TopColor": spec.fabric_colour,
            "BottomGSM": bottom_gsm,
            "BottomLami": bottom_lami or "0",
            "BottomColor": spec.fabric_colour,
            "SideGSM": side_gsm,
            "SideLami": side_lami or "0",
            "SideColor": spec.fabric_colour,
            "DuffleHt": spec.duffle_height,
            "conicaltop": spec.conical_top,
            "FSL": spec.top_spout_dia,
            "FSW": spec.top_spout_height,
            "FSGSM": spout_gsm,
            "FSLami": spout_lami or "0",
            "FSColor": spec.fabric_colour,
            "DSL": spec.bottom_spout_dia,
            "DSW": spec.bottom_spout_height,
            "DSGSM": ds_gsm,
            "DSLami": ds_lami or "0",
            "DSColor": spec.fabric_colour,
            "LoopGSM": spec.loop_gsm if spec.loop_enabled else "",
            "LoopL": spec.loop_length if spec.loop_enabled else "",
            "LoopW": spec.loop_width if spec.loop_enabled else "",
            "loopRemarks": spec.loop_count if spec.loop_enabled else "",
            "loopconst": loop_const if spec.loop_enabled else "",
            "LoopColor": spec.fabric_colour,
            "DropLoop": spec.drop_loop_length if spec.drop_loop else "",
            "Liner": liner_material if spec.liner_enabled else "",
            "LinerType": spec.liner_type if spec.liner_enabled else "",
            "LinerDim": spec.liner_micron if spec.liner_enabled else "",
            "LinerColor": spec.fabric_colour if spec.liner_enabled else "",
            "docl": spec.doc_length if spec.doc_pouch else "",
            "docw": spec.doc_width if spec.doc_pouch else "",
            "DocGSM": spec.doc_micron if spec.doc_pouch else "",
            "LabelL": spec.label_length if spec.label else "",
            "LabelW": spec.label_width if spec.label else "",
            "LableGSM": spec.label_micron if spec.label else "",
            "LabelType": "Tyvac" if spec.label and spec.label_tyvac else "",
            "TunnelDesign": spec.tunnel_design,
            "TunnelGSM": spec.tunnel_gsm,
            "TunnelLami": spec.tunnel_lami or "0",
            "FSTieGSM": spec.top_spout_tie_gsm,
            "FSTieFabric": spec.top_spout_tie_size,
            "FSTieRemarks": spec.top_spout_tie_remarks,
            "DSTieGSM": spec.bottom_spout_tie_gsm,
            "DSTieFabric": spec.bottom_spout_tie_size,
            "DSTieRemarks": spec.bottom_spout_tie_remarks,
            "FillerCordGSM": spec.filler_cord_gpm if spec.filler_cord else "",
            "IsTyvac": "yes" if spec.label_tyvac else "no",
            "TopRopeGSM": spec.top_rope_gsm if spec.top_rope else "",
            "TopRopeType": spec.top_rope_type if spec.top_rope else "",
            "TopRopeFabric": spec.top_rope_size if spec.top_rope else "",
            "TopRopeCutInput": spec.top_rope_cut if spec.top_rope else "",
            "TopRopeColor": spec.top_rope_color if spec.top_rope else "",
            "TopRopeNo": spec.top_rope_count if spec.top_rope else "",
            "BottomRopeGSM": spec.bottom_rope_gsm if spec.bottom_rope else "",
            "BottomRopeType": spec.bottom_rope_type if spec.bottom_rope else "",
            "BottomRopeFabric": spec.bottom_rope_size if spec.bottom_rope else "",
            "BottomRopeCutInput": spec.bottom_rope_cut if spec.bottom_rope else "",
            "BottomRopeColor": spec.bottom_rope_color if spec.bottom_rope else "",
            "BottomRopeNo": spec.bottom_rope_count if spec.bottom_rope else "",
            "FSRopeGSM": spec.top_spout_rope_gsm if spec.top_spout_rope else "",
            "FSRopeType": spec.top_spout_rope_type if spec.top_spout_rope else "",
            "FSRopeFabric": spec.top_spout_rope_size if spec.top_spout_rope else "",
            "FSRopeColor": spec.top_spout_rope_color if spec.top_spout_rope else "",
            "FSRopeNo": spec.top_spout_rope_count if spec.top_spout_rope else "",
            "FSRopeRemarks": spec.top_spout_rope_remarks if spec.top_spout_rope else "",
            "DSRopeGSM": spec.bottom_spout_rope_gsm if spec.bottom_spout_rope else "",
            "DSRopeType": spec.bottom_spout_rope_type if spec.bottom_spout_rope else "",
            "DSRopeFabric": spec.bottom_spout_rope_size if spec.bottom_spout_rope else "",
            "DSRopeColor": spec.bottom_spout_rope_color if spec.bottom_spout_rope else "",
            "DSRopeNo": spec.bottom_spout_rope_count if spec.bottom_spout_rope else "",
            "DSRopeRemarks": spec.bottom_spout_rope_remarks if spec.bottom_spout_rope else "",
            "TopTieGSM": spec.top_tie_gsm if spec.top_tie else "",
            "TopTieFabric": spec.top_tie_size if spec.top_tie else "",
            "TopTieCutInput": spec.top_tie_cut if spec.top_tie else "",
            "TopTieColor": spec.top_tie_color if spec.top_tie else "",
            "TopTieNo": spec.top_tie_count if spec.top_tie else "",
            "BottomTieGSM": spec.bottom_tie_gsm if spec.bottom_tie else "",
            "BottomTieFabric": spec.bottom_tie_size if spec.bottom_tie else "",
            "BottomTieCutInput": spec.bottom_tie_cut if spec.bottom_tie else "",
            "BottomTieColor": spec.bottom_tie_color if spec.bottom_tie else "",
            "BottomTieNo": spec.bottom_tie_count if spec.bottom_tie else "",
            "TopFlapGSM": spec.top_flap_gsm if spec.top_flap else "",
            "TopFlapLamiType": spec.top_flap_lami if spec.top_flap else "",
            "TopFlapColor": spec.top_flap_color if spec.top_flap else "",
            "TopFlapNo": spec.top_flap_count if spec.top_flap else "",
            "BottomFlapGSM": spec.bottom_flap_gsm if spec.bottom_flap else "",
            "BottomFlapLami": spec.bottom_flap_lami if spec.bottom_flap else "",
            "BottomFlapColor": spec.bottom_flap_color if spec.bottom_flap else "",
            "BottomFlapNo": spec.bottom_flap_count if spec.bottom_flap else "",
            "TopHookGSM": spec.top_hook_gsm if spec.top_hook else "",
            "TopHookFabric": spec.top_hook_size if spec.top_hook else "",
            "TopHookCutSize": spec.top_hook_cut if spec.top_hook else "",
            "TopHookColor": spec.top_hook_color if spec.top_hook else "",
            "TopHookNo": spec.top_hook_count if spec.top_hook else "",
            "BottomHookGSM": spec.bottom_hook_gsm if spec.bottom_hook else "",
            "BottomHookFabric": spec.bottom_hook_size if spec.bottom_hook else "",
            "BottomHookCutSize": spec.bottom_hook_cut if spec.bottom_hook else "",
            "BottomHookColor": spec.bottom_hook_color if spec.bottom_hook else "",
            "BottomHookNo": spec.bottom_hook_count if spec.bottom_hook else "",
            "BottomLoopGSM": spec.bottom_loop_gsm if spec.bottom_loop else "",
            "BottomLoopL": spec.bottom_loop_length if spec.bottom_loop else "",
            "BottomLoopW": spec.bottom_loop_width if spec.bottom_loop else "",
            "BottomLoopNo": spec.bottom_loop_count if spec.bottom_loop else "",
            "LoopProtectorType": spec.loop_protector_type if spec.loop_protector else "",
            "LoopProtectorGSM": spec.loop_protector_gsm if spec.loop_protector else "",
            "LoopProtectorLami": spec.loop_protector_lami if spec.loop_protector else "",
            "LoopProtectorSize": spec.loop_protector_size if spec.loop_protector else "",
            "LoopCoverGSM": spec.loop_cover_gsm if spec.loop_cover else "",
            "LoopCoverLamiType": spec.loop_cover_lami if spec.loop_cover else "",
            "LoopCoverSize": spec.loop_cover_size if spec.loop_cover else "",
            "LoopCoverCutSize": spec.loop_cover_cut if spec.loop_cover else "",
            "LoopCoverNo": spec.loop_cover_count if spec.loop_cover else "",
            "BuffleGSM": spec.buffle_gsm,
            "BuffleKind": spec.buffle_kind,
            "InnerSkinGSM": spec.inner_skin_gsm if spec.inner_skin else "",
            "InnerSkinLami": spec.inner_skin_lami if spec.inner_skin else "",
            "InnerSkinExtraCut": spec.inner_skin_extra_cut if spec.inner_skin else "",
            "InnerBoxGSM": spec.inner_box_gsm if spec.inner_box else "",
            "InnerBoxLami": spec.inner_box_lami if spec.inner_box else "",
            "TopBandGSM": spec.top_band_gsm if spec.top_band else "",
            "TopBandFabric": spec.top_band_size if spec.top_band else "",
            "StevedoreGSM": spec.stevedore_gsm if spec.stevedore else "",
            "StevedoreFabric": spec.stevedore_size if spec.stevedore else "",
            "StevedoreNo": spec.stevedore_count if spec.stevedore else "",
            "AncerieGSM": spec.ancerie_gsm if spec.ancerie else "",
            "AncerieType": spec.ancerie_type if spec.ancerie else "",
            "AncerieColor": spec.ancerie_color if spec.ancerie else "",
            "AncerieSize": spec.ancerie_size if spec.ancerie else "",
            "AncerieAtt": spec.ancerie_att if spec.ancerie else "",
            "AncerieNo": spec.ancerie_count if spec.ancerie else "",
            "HoseSliderNo": spec.hose_slider_count if spec.hose_slider else "",
            "TopPetalFlapGSM": spec.top_petal_flap_gsm,
            "TopPetalFlapLami": spec.top_petal_flap_lami,
            "BottomPetalFlapGSM": spec.bottom_petal_flap_gsm,
            "BottomPetalFlapLami": spec.bottom_petal_flap_lami,
            "BellyBand1GSM": spec.belly_band1_gsm if spec.belly_band1 else "",
            "BellyBand1Fabric": spec.belly_band1_size if spec.belly_band1 else "",
            "BellyBand2GSM": spec.belly_band2_gsm if spec.belly_band2 else "",
            "BellyBand2Fabric": spec.belly_band2_size if spec.belly_band2 else "",
            "TopBottomBandGSM": spec.top_bottom_band_gsm if spec.top_bottom_band else "",
            "TopBottomBandFabric": spec.top_bottom_band_size if spec.top_bottom_band else "",
            "SteveCoverL": spec.steve_cover_length if spec.steve_cover else "",
            "SteveCoverSize": spec.steve_cover_size if spec.steve_cover else "",
            "SteveCoverGSM": spec.steve_cover_gsm if spec.steve_cover else "",
            "SteveCoverLami": spec.steve_cover_lami if spec.steve_cover else "",
            "SteveCoverNo": spec.steve_cover_count if spec.steve_cover else "",
            "FabricPatchGSM": spec.fabric_patch_gsm if spec.fabric_patch else "",
            "FabricPatchLami": spec.fabric_patch_lami if spec.fabric_patch else "",
            "InnerTopGSM": spec.inner_top_gsm if spec.inner_top else "",
            "InnerTopLami": spec.inner_top_lami if spec.inner_top else "",
            "InnerTopExtra": spec.inner_top_extra if spec.inner_top else "",
            "InnerTopDia": spec.inner_top_dia if spec.inner_top else "",
            "InnerBottomGSM": spec.inner_bottom_gsm if spec.inner_bottom else "",
            "InnerBottomLami": spec.inner_bottom_lami if spec.inner_bottom else "",
            "InnerBottomExtra": spec.inner_bottom_extra if spec.inner_bottom else "",
            "InnerBottomDia": spec.inner_bottom_dia if spec.inner_bottom else "",
            "Doc1L": spec.doc1_length if spec.doc_pouch1 else "",
            "Doc1W": spec.doc1_width if spec.doc_pouch1 else "",
            "Doc1GSM": spec.doc1_micron if spec.doc_pouch1 else "",
            "Doc2L": spec.doc2_length if spec.doc_pouch2 else "",
            "Doc2W": spec.doc2_width if spec.doc_pouch2 else "",
            "Doc2GSM": spec.doc2_micron if spec.doc_pouch2 else "",
            "ExtraLabelL": spec.extra_label_length if spec.extra_label else "",
            "ExtraLabelW": spec.extra_label_width if spec.extra_label else "",
            "ExtraLabelMicron": spec.extra_label_micron if spec.extra_label else "",
            "ExtraLabel1L": spec.extra_label1_length if spec.extra_label1 else "",
            "ExtraLabel1W": spec.extra_label1_width if spec.extra_label1 else "",
            "ExtraLabel1Micron": spec.extra_label1_micron if spec.extra_label1 else "",
            "ExtraLabel2L": spec.extra_label2_length if spec.extra_label2 else "",
            "ExtraLabel2W": spec.extra_label2_width if spec.extra_label2 else "",
            "ExtraLabel2Micron": spec.extra_label2_micron if spec.extra_label2 else "",
            "ExtraLabel3L": spec.extra_label3_length if spec.extra_label3 else "",
            "ExtraLabel3W": spec.extra_label3_width if spec.extra_label3 else "",
            "ExtraLabel3Micron": spec.extra_label3_micron if spec.extra_label3 else "",
            "DS2L": spec.bottom_spout2_dia if spec.bottom_spout2 else "",
            "DS2W": spec.bottom_spout2_height if spec.bottom_spout2 else "",
            "DS2GSM": spec.bottom_spout2_gsm if spec.bottom_spout2 else "",
            "DS2Lami": spec.bottom_spout2_lami if spec.bottom_spout2 else "",
            "DS3L": spec.bottom_spout3_dia if spec.bottom_spout3 else "",
            "DS3W": spec.bottom_spout3_height if spec.bottom_spout3 else "",
            "DS3GSM": spec.bottom_spout3_gsm if spec.bottom_spout3 else "",
            "DS3Lami": spec.bottom_spout3_lami if spec.bottom_spout3 else "",
        }
    )

    bom3 = Values(
        {
            "toptypes": top,
            "bottomtypes": bottom,
            "BottomConicalHeight": spec.bottom_conical_height,
            "DoubleFoldBody": "yes" if spec.double_fold_body else "no",
            "DoubleFoldTop": "yes" if spec.double_fold_top else "no",
            "DoubleFoldBottom": "yes" if spec.double_fold_bottom else "no",
            "TillTheBottom": "yes" if spec.loop_till_bottom else "no",
            "TunnelDesign": spec.tunnel_design,
            "fsno": spec.top_spout_count or "1",
            "dsno": spec.bottom_spout_count or "1",
            "fsedgehaming": "yes" if spec.top_spout_edge_hemming else "no",
            "dsedgehaming": "yes" if spec.bottom_spout_edge_hemming else "no",
            "TopSpoutTieNo": spec.top_spout_tie_count,
            "BottomSpoutTieNo": spec.bottom_spout_tie_count,
            "TopSpoutTieIRISNo": spec.top_iris_tie_count,
            "BottomSpoutTieIRISNo": spec.bottom_iris_tie_count,
            "fillercordtop": "yes" if spec.filler_cord_top else "no",
            "fillercordbottom": "yes" if spec.filler_cord_bottom else "no",
            "fillercordbody": "yes" if spec.filler_cord_body else "no",
            "fillercordtopspout": "yes" if spec.filler_cord_top_spout else "no",
            "fillercordbottomspout": "yes" if spec.filler_cord_bottom_spout else "no",
            "fillercordbuffle": "yes" if spec.filler_cord_buffle else "no",
            "fillercordtoptype": spec.filler_cord_top_type,
            "fillercordbottomtype": spec.filler_cord_bottom_type,
            "fillercordbodytype": spec.filler_cord_body_type,
            "fillercordFStype": spec.filler_cord_top_spout_type,
            "fillercordDStype": spec.filler_cord_bottom_spout_type,
            "fillercordbuffletype": spec.filler_cord_buffle_type,
            "threadColor": spec.thread_colour,
            "threadtype": spec.thread_type,
            "ThreadBuffleSeam": spec.thread_buffle_seam,
            "ThreadNeedle": spec.thread_needle,
            "ThreadDenier": spec.thread_denier,
            "Hiracle": "yes" if spec.hiracle else "no",
            "HiracleTop": "yes" if spec.hiracle_top else "no",
            "HIracleBottom": "yes" if spec.hiracle_bottom else "no",
            "TopRope": "yes" if spec.top_rope else "no",
            "BottomRope": "yes" if spec.bottom_rope else "no",
            "FSRope": "yes" if spec.top_spout_rope else "no",
            "DSRope": "yes" if spec.bottom_spout_rope else "no",
            "TopTie": "yes" if spec.top_tie else "no",
            "BottomTie": "yes" if spec.bottom_tie else "no",
            "TopFlap": "yes" if spec.top_flap else "no",
            "BottomFlap": "yes" if spec.bottom_flap else "no",
            "TopHook": "yes" if spec.top_hook else "no",
            "BottomHook": "yes" if spec.bottom_hook else "no",
            "BottomLoop": "yes" if spec.bottom_loop else "no",
            "LoopProtector": "yes" if spec.loop_protector else "no",
            "LoopProtectorType": spec.loop_protector_type,
            "LoopCover": "yes" if spec.loop_cover else "no",
            "LoopCoverNo": spec.loop_cover_count,
            "Felt": "yes" if spec.felt else "no",
            "FeltTop": "yes" if spec.felt_top else "no",
            "FeltBottom": "yes" if spec.felt_bottom else "no",
            "FeltBody": "yes" if spec.felt_body else "no",
            "FeltTopSpout": "yes" if spec.felt_top_spout else "no",
            "FeltBottomSpout": "yes" if spec.felt_bottom_spout else "no",
            "MFWeb": "yes" if spec.mf_web else "no",
            "MFWebTop": "yes" if spec.mf_web_top else "no",
            "MFWebBottom": "yes" if spec.mf_web_bottom else "no",
            "MFWebBody": "yes" if spec.mf_web_body else "no",
            "MFWebTopSpout": "yes" if spec.mf_web_top_spout else "no",
            "MFWebBottomSpout": "yes" if spec.mf_web_bottom_spout else "no",
            "MFWebBuffle": "yes" if spec.mf_web_buffle else "no",
            "BuffleType": spec.buffle_kind,
            "InnerSkin": "yes" if spec.inner_skin else "no",
            "InnerBox": "yes" if spec.inner_box else "no",
            "TopBand": "yes" if spec.top_band else "no",
            "Stevedore": "yes" if spec.stevedore else "no",
            "StevedoreNo": spec.stevedore_count,
            "StevedorePortion": spec.stevedore_portion,
            "Ancerie": "yes" if spec.ancerie else "no",
            "AncerieNo": spec.ancerie_count,
            "HoseSlider": "yes" if spec.hose_slider else "no",
            "HoseSliderNo": spec.hose_slider_count,
            "TopFlapNo": spec.top_flap_count,
            "BottomFlapNo": spec.bottom_flap_count,
            "TopRopeNo": spec.top_rope_count,
            "BottomRopeNo": spec.bottom_rope_count,
            "FSRopeNo": spec.top_spout_rope_count,
            "DSRopeNo": spec.bottom_spout_rope_count,
            "TopTieNo": spec.top_tie_count,
            "BottomTieNo": spec.bottom_tie_count,
            "TopHookNo": spec.top_hook_count,
            "BottomHookNo": spec.bottom_hook_count,
            "BottomLoopNo": spec.bottom_loop_count,
            "BellyBand1": "yes" if spec.belly_band1 else "no",
            "BellyBand2": "yes" if spec.belly_band2 else "no",
            "TopBottomBand": "yes" if spec.top_bottom_band else "no",
            "SafetyBand": "yes" if spec.safety_band else "no",
            "SteveCover": "yes" if spec.steve_cover else "no",
            "SteveCoverNo": spec.steve_cover_count,
            "FabricPatch": "yes" if spec.fabric_patch else "no",
            "InnerTop": "yes" if spec.inner_top else "no",
            "InnerBottom": "yes" if spec.inner_bottom else "no",
            "Doc1": "yes" if spec.doc_pouch1 else "no",
            "Doc1Type": spec.doc1_type,
            "Doc1Opening": spec.doc1_opening,
            "Doc1Unit": spec.doc1_unit,
            "Doc1No": spec.doc1_count,
            "Doc2": "yes" if spec.doc_pouch2 else "no",
            "Doc2Type": spec.doc2_type,
            "Doc2Opening": spec.doc2_opening,
            "Doc2Unit": spec.doc2_unit,
            "Doc2No": spec.doc2_count,
            "ExtraLabel": "yes" if spec.extra_label else "no",
            "ExtraLabelNo": spec.extra_label_count,
            "ExtraLabel1": "yes" if spec.extra_label1 else "no",
            "ExtraLabel2": "yes" if spec.extra_label2 else "no",
            "ExtraLabel3": "yes" if spec.extra_label3 else "no",
            "DS2": "yes" if spec.bottom_spout2 else "no",
            "DS3": "yes" if spec.bottom_spout3 else "no",
        }
    )
    return BomRequest(header=header, bom1=bom1, bom3=bom3)
