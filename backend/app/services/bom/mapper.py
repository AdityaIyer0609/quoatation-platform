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
        instruction=spec.notes.strip(),
        print_type=spec.printing.strip(),
        loop_type=spec.loop_type.strip(),
        is_drop_loop=spec.drop_loop,
        doc=spec.doc_type.strip() if spec.doc_pouch else "",
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
        }
    )

    bom3 = Values(
        {
            "toptypes": top,
            "bottomtypes": bottom,
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
            "fillercordtoptype": spec.filler_cord_top_type,
            "fillercordbottomtype": spec.filler_cord_bottom_type,
            "fillercordbodytype": spec.filler_cord_body_type,
            "fillercordFStype": spec.filler_cord_top_spout_type,
            "fillercordDStype": spec.filler_cord_bottom_spout_type,
            "threadColor": spec.thread_colour,
            "threadtype": spec.thread_type,
        }
    )
    return BomRequest(header=header, bom1=bom1, bom3=bom3)
