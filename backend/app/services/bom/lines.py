from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal

from app.services.bom.helpers import (
    BomRequest,
    Values,
    contains,
    first_non_empty,
    get_value,
    parse_num,
    round4,
    ZERO,
)


@dataclass
class BomLine:
    sort_order: int
    heading: str
    gsm: str = ""
    lamination: str = ""
    colour: str = ""
    fabric_size: str = ""
    cut_size: str = ""
    total_mtr: Decimal | None = None
    total_kg: Decimal | None = None
    remarks: str = ""


def _add_line(
    lines: list[BomLine],
    sort_order: list[int],
    heading: str,
    gsm: str,
    lami: str,
    color: str,
    fabric: str,
    cut: str,
    total_mtr: Decimal | None,
    total_kg: Decimal | None,
    remarks: str,
) -> None:
    has_data = any(
        [
            bool((gsm or "").strip()),
            bool((lami or "").strip()),
            bool((color or "").strip()),
            bool((fabric or "").strip()),
            bool((cut or "").strip()),
            bool((remarks or "").strip()),
            total_mtr is not None,
            total_kg is not None,
        ]
    )
    if not has_data:
        return
    lines.append(
        BomLine(
            sort_order=sort_order[0],
            heading=heading,
            gsm=gsm or "",
            lamination=lami or "",
            colour=color or "",
            fabric_size=fabric or "",
            cut_size=cut or "",
            total_mtr=total_mtr,
            total_kg=total_kg,
            remarks=remarks or "",
        )
    )
    sort_order[0] += 1


def _any_value(primary: Values, secondary: Values, keys: list[str]) -> str:
    for key in keys:
        value = get_value(primary, key)
        if value:
            return value
        value = get_value(secondary, key)
        if value:
            return value
    return ""


def _any_num(primary: Values, secondary: Values, keys: list[str]) -> Decimal | None:
    for key in keys:
        value = parse_num(get_value(primary, key))
        if value is not None:
            return value
        value = parse_num(get_value(secondary, key))
        if value is not None:
            return value
    return None


def _add_from_sources(
    lines: list[BomLine],
    sort_order: list[int],
    heading: str,
    bom1: Values,
    bom3: Values,
    gsm_keys: list[str],
    lami_keys: list[str],
    color_keys: list[str],
    fabric_keys: list[str],
    cut_keys: list[str],
    mtr_keys: list[str],
    kg_keys: list[str],
    remarks_keys: list[str],
) -> None:
    gsm = _any_value(bom1, bom3, gsm_keys)
    lami = _any_value(bom1, bom3, lami_keys)
    color = _any_value(bom1, bom3, color_keys)
    fabric = _any_value(bom1, bom3, fabric_keys)
    cut = _any_value(bom1, bom3, cut_keys)
    total_mtr = _any_num(bom1, bom3, mtr_keys)
    total_kg = _any_num(bom1, bom3, kg_keys)
    remarks = _any_value(bom1, bom3, remarks_keys)
    has = (
        (total_kg is not None and total_kg > 0)
        or (total_mtr is not None and total_mtr > 0)
        or bool(fabric)
        or bool(cut)
    )
    if not has:
        return
    _add_line(lines, sort_order, heading, gsm, lami, color, fabric, cut, total_mtr, total_kg, remarks)


def _tunnel_heading(request: BomRequest) -> str:
    tunnel = first_non_empty(get_value(request.bom3, "TunnelDesign"), get_value(request.bom1, "TunnelDesign"))
    if contains(tunnel, "Cross Corner") or contains(tunnel, "Leno"):
        return "Reinforce fabric"
    return "Tunnel"


def build_derived_lines(request: BomRequest) -> list[BomLine]:
    lines: list[BomLine] = []
    values = request.bom1
    editor = request.bom3
    sort_order = [1]
    header = request.header

    def g(key: str) -> str:
        return get_value(values, key)

    _add_line(
        lines, sort_order, "Body", g("BodyGSM"), g("BodyLami"),
        first_non_empty(g("BodyColor"), header.fab_color), g("BodyFabric"), g("BodyCutSize"),
        parse_num(g("BodyTotalMtr")), parse_num(g("BodyTotalKg")),
        first_non_empty(g("BodyRemarks"), header.body_remarks),
    )
    _add_line(
        lines, sort_order, "Side", g("SideGSM"), g("SideLami"),
        first_non_empty(g("SideColor"), header.fab_color), g("SideFabric"), g("SideCutSize"),
        parse_num(g("SideTotalMtr")), parse_num(g("SideTotalKg")), g("SideRemarks"),
    )
    _add_line(
        lines, sort_order, "Top", g("TopGSM"), g("TopLami"),
        first_non_empty(g("TopColor"), header.fab_color), g("TopFabric"), g("TopCutSize"),
        parse_num(g("TopTotalMtr")), parse_num(g("TopTotalKg")),
        first_non_empty(g("TopRemarks"), g("TopRemarks1")),
    )
    _add_line(
        lines, sort_order, "Top Spout", g("FSGSM"), g("FSLami"), g("FSColor"),
        g("FSFabric"), g("FSCutSize"), parse_num(g("FSTotalMtr")), parse_num(g("FSTotalKg")),
        first_non_empty(g("FSRemarks"), header.fs_type),
    )
    _add_line(
        lines, sort_order, "Top Spout Tie", g("FSTieGSM"), g("FSTieLami"), g("FSTieColor"),
        g("FSTieFabric"), g("FSTieCutSize"), parse_num(g("FSTieTotalMtr")), parse_num(g("FSTieTotalKg")),
        first_non_empty(g("FSTieRemarks"), g("FSTieRemarks1")),
    )
    _add_line(
        lines, sort_order, "Bottom", g("BottomGSM"), g("BottomLami"),
        first_non_empty(g("BottomColor"), header.fab_color), g("BottomFabric"), g("BottomCutSize"),
        parse_num(g("BottomTotalMtr")), parse_num(g("BottomTotalKg")),
        first_non_empty(g("BottomRemarks"), g("BottomRemarks1")),
    )
    _add_line(
        lines, sort_order, "Bottom Spout", g("DSGSM"), g("DSLami"), g("DSColor"),
        g("DSFabric"), g("DSCutSize"), parse_num(g("DSTotalMtr")), parse_num(g("DSTotalKg")),
        first_non_empty(g("DSRemarks"), header.ds_type),
    )
    _add_line(
        lines, sort_order, "Bottom Spout Tie", g("DSTieGSM"), g("DSTieLami"), g("DSTieColor"),
        g("DSTieFabric"), g("DSTieCutSize"), parse_num(g("DSTieTotalMtr")), parse_num(g("DSTieTotalKg")),
        first_non_empty(g("DSTieRemarks"), g("DSTieRemarks1")),
    )
    _add_line(
        lines, sort_order, "Loop", g("LoopGSM"), "", g("LoopColor"),
        g("LoopFabric"), g("LoopCutSize"), parse_num(g("LoopTotalMtr")), parse_num(g("LoopTotalKg")),
        first_non_empty(g("LoopRemarks"), g("LoopRemarks1")),
    )
    _add_line(
        lines, sort_order, "Liner", g("LinerGSM"), g("LinerLami"), g("LinerColor"),
        first_non_empty(g("LinerFabric"), g("LinerL")), g("LinerCutSize"),
        parse_num(g("LinerTotalMtr")), parse_num(g("LinerTotalKg")),
        first_non_empty(g("LinerRemarks"), g("LinerRemarks1")),
    )
    _add_line(
        lines, sort_order, "DocPouch", g("DocGSM"), g("DocLami"), g("DocColor"),
        g("DocFabric"), g("DocCutSize"), parse_num(g("DocTotalMtr")), parse_num(g("DocTotalKg")),
        g("DocRemarks"),
    )
    _add_line(
        lines, sort_order, "Label", g("LableGSM"), "", g("LabelColor"),
        g("LableFabric"), g("LableCutSize"), parse_num(g("LableTotalMtr")), parse_num(g("LableTotalKg")),
        first_non_empty(g("LabelRemarks"), g("LabelRemarks1")),
    )
    _add_line(
        lines, sort_order, "Filler Cord", g("FillerCordGSM"), "", "", "", "",
        None, parse_num(g("FillerCordTotalKg")), "",
    )
    _add_line(
        lines, sort_order, "Thread", "", "", get_value(request.bom3, "threadColor"), "", "",
        ZERO, parse_num(g("ThreadTotalKg")), get_value(request.bom3, "threadtype"),
    )
    _add_from_sources(
        lines, sort_order, "IRIS Tie", values, editor,
        ["FSIRISTieGSM", "FSTieGSM"], [], ["TopSpoutTieIRISColor", "FSTieColor"],
        ["FSIRISTieFabric", "FSTieFabric"], ["FSIRISTieCutSize"], ["FSIRISTieTotalMtr"],
        ["FSIRISTieTotalKg"], ["TopSpoutTieIRISRemarks", "FSTieRemarks"],
    )
    extras = [
        ("Top Flap", ["TopFlapGSM"], ["TopFlapLamiType"], ["TopFlapColor"], ["TopFlapFabric"], ["TopFlapCutSize"], ["TopFlapTotalMtr"], ["TopFlapTotalKg"], ["TopFlapRemarks"]),
        ("Buffle", ["BuffleGSM"], ["BuffleLamiType"], ["BuffleColor"], ["BuffleFabric"], ["BuffleCutSize"], ["BuffleTotalMtr"], ["BuffleTotalKg"], ["BuffleRemarks"]),
        ("Loop Cover", ["LoopCoverGSM"], ["LoopCoverLamiType"], ["LoopCoverColor"], ["LoopCoverFabric"], ["LoopCoverCutSize"], ["LoopCoverTotalMtr"], ["LoopCoverTotalKg"], ["LoopCoverRemarks"]),
        ("Felt", ["FeltGSM"], ["FeltType"], ["FeltColor"], ["FeltFabric"], ["FeltCutSize"], ["FeltTotalMtr"], ["FeltTotalKg"], ["FeltRemarks"]),
        ("Inner Skin", ["InnerSkinGSM"], ["InnerSkinLamiType"], ["InnerSkinColor"], ["InnerSkinFabric"], ["InnerSkinCutSize"], ["InnerSkinTotalMtr"], ["InnerSkinTotalKg"], ["InnerSkinRemarks"]),
    ]
    for item in extras:
        _add_from_sources(lines, sort_order, item[0], values, editor, *item[1:])
    _add_from_sources(
        lines, sort_order, _tunnel_heading(request), values, editor,
        ["TunnelGSM"], ["TunnelLami"], ["TunnelColor"], ["TunnelFabric"], ["TunnelCutSize"],
        ["TunnelTotalMtr"], ["TunnelTotalKg"], ["TunnelRemarks"],
    )
    return lines


def calculate_total_kg(lines: list[BomLine]) -> Decimal:
    total = ZERO
    for line in lines:
        if line.total_kg is not None:
            total += line.total_kg
    return round4(total)
