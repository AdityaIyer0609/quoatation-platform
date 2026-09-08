from __future__ import annotations

from decimal import Decimal

from app.services.bom.helpers import (
    HALF_PI,
    PI,
    WEIGHT_DIV,
    LOOP_DIV,
    ZERO,
    BomRequest,
    contains,
    equals,
    first_non_empty,
    get_value,
    is_inner_placement,
    is_truthy,
    main_bottom_type,
    nearly_equal,
    normalize_optional,
    num,
    parse_num,
    qty_of,
    resolve_bag_type_parts,
    resolve_cross_corner_extra,
    resolve_liner_density,
    resolve_sf_bucket,
    resolve_single_double_multiplier,
    resolve_thread_buffle_factor,
    resolve_tie_cut_length,
    round0,
    round4,
    set_if_missing,
    swl_of,
    bottom_sub_type,
)


def populate_calculated_component_values(request: BomRequest) -> None:
    populate_body(request)
    populate_side(request)
    populate_top(request)
    populate_top_spout(request)
    populate_top_spout_tie(request)
    populate_top_spout_iris_tie(request)
    populate_bottom(request)
    populate_bottom_spout(request)
    populate_bottom_spout_tie(request)
    populate_bottom_spout_iris_tie(request)
    populate_loop(request)
    populate_liner(request)
    populate_doc(request)
    populate_label(request)
    populate_filler_cord(request)
    populate_thread(request)


def populate_body(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "BodyTotalKg"):
        return

    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    qty = qty_of(request)
    body_no = num(values, "bodyno", Decimal("1"))
    gsm = num(values, "BodyGSM")
    lami = num(values, "BodyLami")
    if length <= 0 or width <= 0 or height <= 0 or qty <= 0 or gsm + lami <= 0:
        return

    construction, body_style, body_grade = resolve_bag_type_parts(request)
    is_inner = is_inner_placement(request)
    is_double = is_truthy(get_value(request.bom3, "DoubleFoldBody"))
    is_tunnel = equals(construction, "UPanel") and (
        contains(body_style, "Tunnel") or bool(get_value(request.bom3, "TunnelDesign"))
    )

    body_fabric = ZERO
    body_cut = ZERO
    body_weight_raw = ZERO
    tunnel_fabric = None
    tunnel_cut = None
    tunnel_weight = None
    tunnel_total_mtr = None

    if equals(construction, "Circular") or equals(construction, "Double Layer Circular Inner Skin Bag"):
        body_fabric = length + width
        body_cut = height + (Decimal("11") if is_inner else Decimal("7"))
        if is_double:
            body_cut = height + (Decimal("18") if is_inner else Decimal("14"))
        body_weight_raw = body_cut * body_fabric * 2 * (gsm + lami)
    elif equals(construction, "4 Panel"):
        is_ventilated = contains(body_style, "Ventilated") or contains(body_style, "Sulzer")
        if is_ventilated:
            if is_inner:
                body_fabric = length + Decimal("4")
                body_cut = height + Decimal("11")
                if is_double:
                    body_fabric = width + Decimal("18")
                    body_cut = height + Decimal("18")
            else:
                body_fabric = length
                body_cut = height + Decimal("7")
                if is_double:
                    body_fabric = width + Decimal("7")
                    body_cut = (height * 2) + length + Decimal("14")
        else:
            if is_inner:
                body_fabric = length + Decimal("11")
                body_cut = height + Decimal("11")
                if is_double:
                    body_fabric = length + Decimal("18")
                    body_cut = height + Decimal("18")
            else:
                body_fabric = length + Decimal("7")
                body_cut = height + Decimal("7")
                if is_double:
                    body_fabric = width + Decimal("14")
                    body_cut = height + Decimal("14")
        panel_factor = Decimal("4") if nearly_equal(length, width) else Decimal("2")
        body_weight_raw = body_cut * (gsm + lami) * body_fabric * panel_factor
    elif equals(construction, "UPanel") or equals(construction, "Double Layer Tunnel Lift Loop Bag"):
        if is_tunnel:
            tunnel_design = first_non_empty(
                get_value(request.bom3, "TunnelDesign"),
                get_value(values, "TunnelDesign"),
                "Flexcon",
            )
            if equals(tunnel_design, "Flexcon"):
                if is_inner:
                    body_fabric = width + (Decimal("18") if is_double else Decimal("15"))
                    body_cut = (
                        ((height + Decimal("18")) * 2) + length + Decimal("300")
                        if is_double
                        else (height * 2) + length + Decimal("150")
                    )
                else:
                    body_fabric = width + (Decimal("18") if is_double else Decimal("10"))
                    body_cut = (
                        ((height * 2) + length) + Decimal("158")
                        if is_double
                        else ((height * 2) + length) + Decimal("140")
                    )
                tunnel_fabric = body_fabric
                tunnel_cut = Decimal("22")
            elif contains(tunnel_design, "Store") or contains(tunnel_design, "Plastene"):
                if is_inner:
                    body_fabric = width + (Decimal("18") if is_double else Decimal("15"))
                    body_cut = (
                        (height * 2) + length + Decimal("170")
                        if is_double
                        else (height * 2) + length + Decimal("152")
                    )
                else:
                    body_fabric = width + (Decimal("18") if is_double else Decimal("10"))
                    body_cut = (
                        ((height * 2) + length) + Decimal("149")
                        if is_double
                        else ((height * 2) + length) + Decimal("142")
                    )
                tunnel_fabric = body_fabric
                tunnel_cut = Decimal("28")
            elif contains(tunnel_design, "Greif"):
                if is_inner:
                    body_fabric = width + (Decimal("27") if is_double else Decimal("20"))
                    body_cut = (
                        (((height * 2) + length) * 2) + Decimal("60")
                        if is_double
                        else (((height * 2) + length) * 2) + Decimal("42")
                    )
                else:
                    body_fabric = width + (Decimal("18") if is_double else Decimal("16"))
                    body_cut = (
                        (((height * 2) + length) * 2) + Decimal("60")
                        if is_double
                        else (((height * 2) + length) * 2) + Decimal("42")
                    )
                tunnel_fabric = body_fabric
                tunnel_cut = Decimal("22")
            body_weight_raw = body_cut * (gsm + lami) * body_fabric
            tunnel_gsm = num(values, "TunnelGSM")
            tunnel_lami = num(values, "TunnelLami")
            if (
                tunnel_fabric is not None
                and tunnel_cut is not None
                and tunnel_fabric > 0
                and tunnel_cut > 0
                and tunnel_gsm + tunnel_lami > 0
            ):
                tunnel_weight = round4(
                    (tunnel_cut * (tunnel_gsm + tunnel_lami) * tunnel_fabric * 2) / WEIGHT_DIV
                )
                tunnel_total_mtr = round4((tunnel_cut * qty * 2) / Decimal("100"))
        else:
            is_wider = contains(body_style, "Wider Fold")
            is_ventilated = contains(body_style, "Ventilated") or contains(body_style, "Sulzer")
            is_center = contains(body_style, "TUNNEL CENTER JOINT")
            is_un = equals(body_grade, "UN") or equals(body_grade, "UN+FDA")
            if is_wider:
                if is_inner:
                    body_fabric = width + Decimal("18") if is_double else length + Decimal("13")
                    body_cut = (height * 2) + width + (Decimal("18") if is_double else Decimal("15"))
                else:
                    body_fabric = width + Decimal("18") if is_double else length + Decimal("10")
                    body_cut = (height * 2) + width + (Decimal("15") if is_double else Decimal("8"))
            elif is_ventilated:
                if is_inner:
                    body_fabric = length + (Decimal("12") if is_double else Decimal("4"))
                    body_cut = (height * 2) + width + (Decimal("21") if is_double else Decimal("15"))
                else:
                    body_fabric = length + (Decimal("8") if is_double else ZERO)
                    body_cut = (height * 2) + width + (Decimal("14") if is_double else Decimal("7"))
            elif is_center:
                body_fabric = width + Decimal("20")
                body_cut = (((height * 2) + length) * 2) + Decimal("42")
                if is_double:
                    body_fabric = width + (Decimal("18") if is_inner else Decimal("27"))
                    body_cut += Decimal("18")
            elif is_un:
                if is_inner:
                    body_fabric = width + Decimal("18") if is_double else length + Decimal("15")
                    body_cut = (height * 2) + width + (Decimal("18") if is_double else Decimal("19"))
                else:
                    body_fabric = width + Decimal("18") if is_double else length + Decimal("10")
                    body_cut = (height * 2) + width + (Decimal("15") if is_double else Decimal("8"))
            else:
                if is_inner:
                    body_fabric = length + (Decimal("18") if is_double else Decimal("11"))
                    body_cut = (height * 2) + width + (Decimal("23") if is_double else Decimal("15"))
                else:
                    body_fabric = width + Decimal("14") if is_double else length + Decimal("7")
                    body_cut = (height * 2) + width + (Decimal("13") if is_double else Decimal("6"))
            body_weight_raw = body_cut * (gsm + lami) * body_fabric

    if body_fabric <= 0 or body_cut <= 0 or body_weight_raw <= 0:
        return

    body_factor = (
        (Decimal("4") if nearly_equal(length, width) else Decimal("2"))
        if equals(construction, "4 Panel")
        else Decimal("1")
    )
    set_if_missing(values, "BodyFabric", body_fabric)
    set_if_missing(values, "BodyCutSize", body_cut)
    set_if_missing(values, "BodyTotalKg", round4(body_weight_raw / WEIGHT_DIV))
    set_if_missing(values, "BodyTotalMtr", round4((body_cut / Decimal("100")) * qty * body_factor) * body_no)
    if tunnel_fabric is not None and tunnel_fabric > 0:
        set_if_missing(values, "TunnelFabric", tunnel_fabric)
    if tunnel_cut is not None and tunnel_cut > 0:
        set_if_missing(values, "TunnelCutSize", tunnel_cut)
    if tunnel_weight is not None and tunnel_weight > 0:
        set_if_missing(values, "TunnelTotalKg", tunnel_weight)
    if tunnel_total_mtr is not None and tunnel_total_mtr > 0:
        set_if_missing(values, "TunnelTotalMtr", tunnel_total_mtr)


def populate_loop(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "LoopTotalKg"):
        return
    loop_grm = num(values, "LoopGSM")
    loop_l = num(values, "LoopL")
    loop_w = num(values, "LoopW")
    loop_no = num(values, "loopRemarks")
    bag_height = request.header.size_h
    bag_qty = qty_of(request)
    swl = swl_of(request)
    if loop_grm <= 0 or loop_l <= 0 or loop_w <= 0 or loop_no <= 0 or bag_qty <= 0:
        return

    construction, body_style, _ = resolve_bag_type_parts(request)
    loop_const = get_value(values, "loopconst")
    loop_override = parse_num(get_value(request.bom3, "LoopLength"))
    drop_loop_length = num(values, "DropLoop")
    has_drop = request.header.is_drop_loop
    has_tunnel = equals(construction, "UPanel") and contains(body_style, "Tunnel")
    loop_till_bottom = is_truthy(get_value(request.bom3, "TillTheBottom"))
    sf_bucket = resolve_sf_bucket(request.header.sf_ratio)
    loop_cut = ZERO

    till_bottom_constructions = {
        "upanel",
        "buffle",
        "4 panel",
        "tube + corner",
        "single + 4 loop",
        "double + 4 loop",
        "4 panel + conical bag(three piece)",
        "4 panel + conical bag(single piece)",
    }
    is_till = construction.strip().lower() in till_bottom_constructions

    if is_till and loop_till_bottom:
        loop_cut = (loop_l * 2) + (Decimal("50") if sf_bucket == 5 else Decimal("60")) + (bag_height - 5)
        if has_drop:
            loop_cut = loop_cut - drop_loop_length + (drop_loop_length * 2)
        if has_tunnel and bag_height <= 100:
            loop_cut = Decimal("160")
        elif has_tunnel and bag_height > 100:
            loop_cut = (loop_l * 2) + Decimal("50") + (Decimal("0.75") * bag_height)
    elif equals(construction, "UPanel") and equals(body_style, "Builder"):
        if swl <= 1000:
            loop_cut = (loop_l * 2) + Decimal("40") + (Decimal("0.66") * bag_height)
        elif (sf_bucket in (5, 6)) and swl <= 1500:
            loop_cut = (loop_l * 2) + Decimal("50") + (Decimal("0.75") * bag_height)
        else:
            loop_cut = (loop_l * 2) + Decimal("60") + (Decimal("0.80") * bag_height)
        if has_drop:
            loop_cut += drop_loop_length * 2
        if has_tunnel and bag_height <= 90:
            loop_cut = Decimal("160")
        elif has_tunnel and bag_height > 90:
            loop_cut = (loop_l * 2) + Decimal("50") + (Decimal("0.75") * bag_height)
    elif equals(loop_const, "Cross Corner") or equals(loop_const, "Full Loop + Cross Corner"):
        extra = resolve_cross_corner_extra(sf_bucket, swl)
        if extra <= 0:
            return
        loop_cut = (loop_l * 2) + extra
        if has_drop:
            loop_cut += drop_loop_length * 2

    if loop_override is not None and loop_override > 0:
        loop_cut = loop_override
    if loop_cut <= 0:
        return

    set_if_missing(values, "LoopFabric", loop_w)
    set_if_missing(values, "LoopCutSize", loop_cut)
    set_if_missing(values, "LoopTotalKg", round4((loop_cut * loop_grm * loop_no) / LOOP_DIV))
    set_if_missing(values, "LoopTotalMtr", round4((loop_cut / Decimal("100")) * bag_qty * loop_no))


def populate_top(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "TopTotalKg"):
        return
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    gsm = num(values, "TopGSM")
    lami = num(values, "TopLami")
    if length <= 0 or width <= 0 or qty <= 0 or gsm + lami <= 0:
        return

    construction, body_style, _ = resolve_bag_type_parts(request)
    is_inner = is_inner_placement(request)
    is_double = is_truthy(get_value(request.bom3, "DoubleFoldTop"))
    top_type = first_non_empty(get_value(request.bom3, "toptypes"), "Open")
    duffle_height = num(values, "DuffleHt")
    conical_top = num(values, "conicaltop")
    top_fabric = ZERO
    top_cut = ZERO
    factor = Decimal("1")

    if equals(top_type, "Conical PlateTop"):
        top_fabric = length + conical_top + (Decimal("18") if is_double else ZERO)
        top_cut = width + conical_top + (Decimal("18") if is_double else ZERO)
    elif equals(top_type, "Conical Top"):
        extra = Decimal("18") if is_double else (Decimal("12") if is_inner else Decimal("8"))
        if is_double and not is_inner:
            extra = Decimal("14")
        elif not is_double and is_inner:
            extra = Decimal("12")
        elif is_double and is_inner:
            extra = Decimal("18")
        else:
            extra = Decimal("8")
        top_fabric = length + extra + (conical_top * 2)
        top_cut = top_fabric
    elif top_type.lower() in {
        "duffle or skrit",
        "top + skrit",
        "oversize duffle or skrit",
        "drawstring skirt",
        "jute skirt",
        "leno",
    }:
        if duffle_height <= 0:
            return
        if equals(top_type, "Leno") or equals(top_type, "Jute Skirt"):
            top_fabric = duffle_height + (Decimal("18") if is_double else Decimal("10"))
            top_cut = ((length + width) * 2) + (Decimal("23") if is_double else Decimal("16"))
        elif equals(top_type, "Drawstring Skirt"):
            top_fabric = duffle_height + (Decimal("12") if is_double else Decimal("15"))
            adj_l = length if is_inner else length - 4
            adj_w = width if is_inner else width - 4
            top_cut = ((adj_l + adj_w) * 2) + (Decimal("14") if is_double else Decimal("12"))
        else:
            top_lam = lami > 0
            if equals(construction, "UPanel") or equals(construction, "4 Panel"):
                top_fabric = duffle_height + (Decimal("12") if is_double else Decimal("5"))
                adj_l = length if is_inner else length - 4
                adj_w = width if is_inner else width - 4
                top_cut = ((adj_l + adj_w) * 2) + (Decimal("14") if is_double else Decimal("12"))
            elif equals(construction, "Circular"):
                top_fabric = duffle_height + (Decimal("12") if is_double else (Decimal("5") if top_lam else Decimal("12")))
                top_cut = ((length + width) * 2) + (Decimal("14") if is_double else Decimal("12"))
            else:
                top_fabric = duffle_height + (Decimal("18") if is_double else (Decimal("5") if top_lam else Decimal("12")))
                adj_l = length if is_inner else length - 4
                adj_w = width if is_inner else width - 4
                top_cut = ((adj_l + adj_w) * 2) + (Decimal("18") if is_double else Decimal("12"))
    else:
        almatis = contains(body_style, "Almatis")
        circular_like = construction.lower() in {"circular", "single loop", "double loop"}
        corner_like = construction.lower() in {
            "buffle",
            "4 panel",
            "tube + corner",
            "single + 4 loop",
            "double + 4 loop",
        }
        if circular_like:
            extra = Decimal("18") if is_double else Decimal("12")
            top_fabric = length + extra
            top_cut = width + extra
        elif corner_like:
            if is_inner:
                extra = Decimal("18") if is_double else (Decimal("15") if almatis else Decimal("12"))
            else:
                extra = (Decimal("18") if almatis else Decimal("15")) if is_double else (Decimal("11") if almatis else Decimal("8"))
            top_fabric = length + extra
            top_cut = width + extra
            if almatis:
                factor = Decimal("4")
        else:
            if is_inner:
                extra = Decimal("18") if is_double else Decimal("12")
            else:
                extra = Decimal("18") if is_double else Decimal("8")
            top_fabric = length + extra
            top_cut = width + extra

    if top_fabric <= 0 or top_cut <= 0:
        return
    set_if_missing(values, "TopFabric", top_fabric)
    set_if_missing(values, "TopCutSize", top_cut)
    set_if_missing(values, "TopTotalKg", round4((top_cut * top_fabric * factor * (gsm + lami)) / WEIGHT_DIV))
    set_if_missing(values, "TopTotalMtr", round4((top_cut / Decimal("100")) * qty))


def populate_side(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "SideTotalKg"):
        return
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    qty = qty_of(request)
    gsm = num(values, "SideGSM")
    lami = num(values, "SideLami")
    if length <= 0 or width <= 0 or height <= 0 or qty <= 0 or gsm + lami <= 0:
        return

    construction, body_style, body_grade = resolve_bag_type_parts(request)
    is_inner = is_inner_placement(request)
    is_double = is_truthy(get_value(request.bom3, "DoubleFoldBody"))
    has_tunnel = equals(construction, "UPanel") and (
        contains(body_style, "Tunnel") or bool(get_value(request.bom3, "TunnelDesign"))
    )
    tunnel_design = first_non_empty(get_value(request.bom3, "TunnelDesign"), get_value(values, "TunnelDesign"))
    is_square = nearly_equal(length, width)
    conical_height = parse_num(get_value(request.bom3, "BottomConicalHeight")) or parse_num(
        get_value(request.bom3, "conicalheight")
    ) or ZERO
    main_bottom = main_bottom_type(request)

    fabric = ZERO
    cut = ZERO
    factor = ZERO
    total_mtr_factor = Decimal("1")

    if equals(construction, "UPanel"):
        if contains(body_style, "Wider Fold"):
            fabric = width + (Decimal("18") if is_double and is_inner else Decimal("17") if is_double else Decimal("13") if is_inner else Decimal("10"))
            cut = height + (Decimal("18") if is_double and is_inner else Decimal("15") if is_double else Decimal("11") if is_inner else Decimal("7"))
        elif contains(body_style, "Ventilated") or contains(body_style, "Sulzer"):
            fabric = (length + Decimal("18") if is_inner else length + Decimal("8")) if is_double else (
                width + Decimal("4") if is_inner else width
            )
            cut = (
                (num(values, "BodyCutSize") + (Decimal("18") if is_inner else Decimal("15")))
                if is_double
                else height + (Decimal("12") if is_inner else Decimal("8"))
            )
        elif contains(body_style, "TUNNEL CENTER JOINT"):
            fabric = length + Decimal("10")
            cut = height + Decimal("10")
            if is_double:
                fabric = length + Decimal("18")
                cut = height + Decimal("18")
        elif contains(body_style, "Sleeve Bag"):
            loop_l = num(values, "LoopL")
            fabric = length + (Decimal("18") if is_double else Decimal("10"))
            cut = ((num(values, "BodyCutSize") + Decimal("18")) if is_inner else height + Decimal("14")) + (loop_l * 2)
            if is_double:
                cut += Decimal("18")
        elif equals(body_grade, "UN") or equals(body_grade, "UN+FDA"):
            fabric = width + (Decimal("18") if is_double and is_inner else Decimal("15") if is_double else Decimal("15") if is_inner else Decimal("8"))
            cut = height + (Decimal("18") if is_double and is_inner else Decimal("15") if is_double else Decimal("14") if is_inner else Decimal("8"))
        elif has_tunnel:
            if contains(tunnel_design, "Greif"):
                fabric = length + (Decimal("18") if is_double else Decimal("10"))
                cut = height + (Decimal("18") if is_double else Decimal("10"))
            else:
                fabric = length + (
                    Decimal("18") if is_double and is_inner else Decimal("15") if is_double else Decimal("11") if is_inner else Decimal("7")
                )
                cut = height + (
                    Decimal("18") if is_double and is_inner else Decimal("15") if is_double else Decimal("11") if is_inner else Decimal("7")
                )
        else:
            fabric = width + (
                Decimal("18") if is_double and is_inner else Decimal("14") if is_double else Decimal("11") if is_inner else Decimal("7")
            )
            cut = height + (
                Decimal("18") if is_double and is_inner else Decimal("14") if is_double else Decimal("11") if is_inner else Decimal("7")
            )
        factor = Decimal("2")
        total_mtr_factor = Decimal("2")
    elif equals(construction, "4 Panel"):
        if contains(body_style, "Ventilated") or contains(body_style, "Sulzer"):
            fabric = width + (
                Decimal("18") if is_double and is_inner else Decimal("8") if is_double else Decimal("4") if is_inner else ZERO
            )
            cut = height + (
                Decimal("18")
                if is_double and is_inner
                else (Decimal("14") if is_square else Decimal("15"))
                if is_double
                else Decimal("11")
                if is_inner
                else Decimal("7")
            )
        else:
            conical_extra = ZERO
            if equals(main_bottom, "Conical Base"):
                conical_extra = conical_height if conical_height > 0 else width / 2
            fabric = width + (
                Decimal("18") if is_double and is_inner else Decimal("14") if is_double else Decimal("11") if is_inner else Decimal("7")
            )
            cut = height + conical_extra + (
                Decimal("18") if is_double and is_inner else Decimal("14") if is_double else Decimal("11") if is_inner else Decimal("7")
            )
        factor = Decimal("4") if is_square else Decimal("2")
        total_mtr_factor = factor
    elif equals(construction, "4 Panel + Conical Bag(Three Piece)"):
        fabric = width + (
            Decimal("18") if is_double and is_inner else Decimal("15") if is_double else Decimal("12") if is_inner else Decimal("8")
        )
        cut = height + (
            Decimal("18") if is_double and is_inner else Decimal("15") if is_double else Decimal("12") if is_inner else Decimal("8")
        )
        factor = Decimal("4") if is_square else Decimal("2")
        total_mtr_factor = factor
    elif equals(construction, "Double Layer Tunnel Lift Loop Bag"):
        fabric = width + (Decimal("18") if is_double else Decimal("11"))
        cut = height + (Decimal("18") if is_double else Decimal("11"))
        factor = Decimal("2")
        total_mtr_factor = Decimal("2")

    if fabric <= 0 or cut <= 0 or factor <= 0:
        return
    set_if_missing(values, "SideFabric", fabric)
    set_if_missing(values, "SideCutSize", cut)
    set_if_missing(values, "SideTotalKg", round4((cut * fabric * factor * (gsm + lami)) / WEIGHT_DIV))
    set_if_missing(values, "SideTotalMtr", round4((cut / Decimal("100")) * qty * total_mtr_factor))


def populate_top_spout(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "FSTotalKg"):
        return
    top_type = first_non_empty(get_value(request.bom3, "toptypes"), "")
    if top_type.lower() not in {"top spout", "conical platetop", "conical top"}:
        return
    dia = num(values, "FSL")
    height = num(values, "FSW")
    gsm = num(values, "FSGSM")
    lami = num(values, "FSLami")
    no = parse_num(get_value(request.bom3, "fsno")) or Decimal("1")
    qty = qty_of(request)
    if dia <= 0 or height <= 0 or gsm + lami <= 0 or qty <= 0:
        return

    _, _, body_grade = resolve_bag_type_parts(request)
    is_fda = equals(body_grade, "FDA") or equals(body_grade, "UN+FDA")
    is_double = is_truthy(get_value(request.bom3, "DoubleFoldTop"))
    top_edge = is_truthy(get_value(request.bom3, "fsedgehaming"))
    has_lam = lami > 0
    spout_type = normalize_optional(request.header.fs_type) or ""
    fabric = ZERO
    cut = ZERO
    weight_raw = ZERO

    if contains(spout_type, "Iris") or contains(spout_type, "Pyjama"):
        iris = (dia / 2) + Decimal("12.5") + height
        if is_double:
            fabric = iris + Decimal("18") if is_fda else iris
            cut = PI * (dia + Decimal("18"))
        else:
            if is_fda:
                iris += Decimal("5")
                fabric = iris + Decimal("3")
            else:
                fabric = iris + Decimal("4") if top_edge else iris
            cut = PI * (dia + Decimal("4"))
        weight_raw = cut * iris * (gsm + lami) * no
    elif contains(spout_type, "Tube"):
        if is_double:
            cut = height + (Decimal("18") if (is_fda or not has_lam) else Decimal("12"))
            fabric = round0((HALF_PI * dia) + Decimal("8"))
        else:
            cut = height + (Decimal("10") if (is_fda or not has_lam) else (Decimal("8") if top_edge else Decimal("5")))
            fabric = round0((HALF_PI * dia) + Decimal("1"))
        weight_raw = cut * fabric * (gsm + lami) * no * 2
    elif contains(spout_type, "Petal") or contains(spout_type, "Bonnet"):
        fabric = height + (Decimal("18") if is_double else (Decimal("8") if has_lam and top_edge else Decimal("5") if has_lam else Decimal("12")))
        cut = PI * (dia + (Decimal("18") if is_double else Decimal("4")))
        weight_raw = cut * fabric * (gsm + lami) * no
    else:
        if is_double:
            fabric = height + (Decimal("18") if is_fda else (Decimal("12") if has_lam else Decimal("18")))
            cut = PI * (dia + Decimal("11"))
        else:
            fabric = height + (Decimal("10") if is_fda else (Decimal("8") if has_lam and top_edge else Decimal("5") if has_lam else Decimal("12")))
            cut = PI * (dia + Decimal("4"))
        weight_raw = cut * fabric * (gsm + lami) * no

    if fabric <= 0 or cut <= 0 or weight_raw <= 0:
        return
    set_if_missing(values, "FSFabric", fabric)
    set_if_missing(values, "FSCutSize", cut)
    set_if_missing(values, "FSTotalKg", round4(weight_raw / WEIGHT_DIV))
    set_if_missing(values, "FSTotalMtr", round4((cut / Decimal("100")) * qty * no))


def populate_bottom(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "BottomTotalKg"):
        return
    bottom_type = normalize_optional(get_value(request.bom3, "bottomtypes")) or ""
    parts = [p.strip() for p in bottom_type.split("/") if p.strip()]
    main = parts[0] if parts else "Flat"
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    gsm = num(values, "BottomGSM")
    lami = num(values, "BottomLami")
    bottom_no = num(values, "bottomno", Decimal("1"))
    if length <= 0 or width <= 0 or qty <= 0 or gsm + lami <= 0:
        return

    construction, body_style, _ = resolve_bag_type_parts(request)
    is_inner = is_inner_placement(request)
    is_double = is_truthy(get_value(request.bom3, "DoubleFoldBottom"))
    conical_height = parse_num(get_value(request.bom3, "BottomConicalHeight")) or parse_num(
        get_value(request.bom3, "conicalheight")
    ) or ZERO
    bottom_dia = num(values, "DSL")
    fabric = ZERO
    cut = ZERO
    factor = Decimal("1")

    if equals(main, "Conical Plate Base") and conical_height > 0:
        extra = Decimal("18") if is_double else (conical_height if is_inner else conical_height - 4)
        fabric = length + extra
        cut = width + extra
    elif equals(main, "Conical Base") and bottom_dia > 0:
        one_side = (bottom_dia * PI) / 4
        fabric = length + (Decimal("18") if is_inner and is_double else Decimal("12") if is_inner else Decimal("15") if is_double else Decimal("8"))
        cut = ((width - one_side) / 2) + (
            Decimal("18") if is_inner and is_double else Decimal("14") if is_inner else Decimal("18") if is_double else Decimal("10")
        )
        factor = Decimal("4")
    elif construction.lower() in {"circular", "single loop", "double loop"}:
        if construction.lower() in {"single loop", "double loop"} and equals(main, "Star Bottom"):
            return
        extra = Decimal("18") if is_double else (Decimal("12") if equals(construction, "Circular") else Decimal("10"))
        fabric = length + extra
        cut = width + extra
    elif construction.lower() in {
        "4 panel",
        "buffle",
        "tube + corner",
        "single + 4 loop",
        "double + 4 loop",
    }:
        almatis = contains(body_style, "Almatis")
        if is_inner:
            extra = Decimal("18") if is_double else Decimal("12")
        else:
            extra = Decimal("15") if is_double else Decimal("8")
        fabric = length + extra
        cut = width + extra
        if almatis:
            factor = Decimal("4")
    elif construction.lower() in {
        "double layer tunnel lift loop bag",
        "double layer circular inner skin bag",
        "hood bag-covered bag",
    }:
        extra = (
            Decimal("18") if is_inner and is_double else Decimal("12") if is_inner else Decimal("15") if is_double else Decimal("8")
        )
        fabric = length + extra
        cut = width + extra

    if fabric <= 0 or cut <= 0:
        return
    set_if_missing(values, "BottomFabric", fabric)
    set_if_missing(values, "BottomCutSize", cut)
    set_if_missing(
        values,
        "BottomTotalKg",
        round4(((cut * fabric * factor * (gsm + lami)) * bottom_no) / WEIGHT_DIV),
    )
    set_if_missing(values, "BottomTotalMtr", round4((cut / Decimal("100")) * qty))


def populate_bottom_spout(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "DSTotalKg"):
        return
    bottom_type = normalize_optional(get_value(request.bom3, "bottomtypes")) or normalize_optional(
        request.header.ds_type
    ) or ""
    parts = [p.strip() for p in bottom_type.split("/") if p.strip()]
    main = parts[0] if parts else ""
    sub = parts[1] if len(parts) > 1 else ""
    if not equals(main, "Bottom Spout"):
        return
    dia = num(values, "DSL")
    height = num(values, "DSW")
    gsm = num(values, "DSGSM")
    lami = num(values, "DSLami")
    no = parse_num(get_value(request.bom3, "dsno")) or Decimal("1")
    qty = qty_of(request)
    if dia <= 0 or height <= 0 or gsm + lami <= 0 or qty <= 0:
        return

    _, _, body_grade = resolve_bag_type_parts(request)
    is_fda = equals(body_grade, "FDA") or equals(body_grade, "UN+FDA")
    is_double = is_truthy(get_value(request.bom3, "DoubleFoldBottom")) or is_truthy(
        get_value(request.bom3, "DoubleFoldBottomSpout")
    )
    edge = is_truthy(get_value(request.bom3, "dsedgehaming"))
    has_filler = (
        is_truthy(get_value(request.bom3, "fillercordbottom"))
        or is_truthy(get_value(request.bom3, "fillercord"))
        or is_truthy(get_value(request.bom3, "isfillercord"))
    )
    has_lam = lami > 0
    fabric = ZERO
    cut = ZERO
    weight_raw = ZERO

    if contains(sub, "Tube"):
        cut = height + (
            (Decimal("18") if (is_fda or not has_lam) else Decimal("12"))
            if is_double
            else (Decimal("10") if (is_fda or not has_lam) else Decimal("5"))
        )
        fabric = round0((HALF_PI * dia) + (Decimal("8") if is_double else Decimal("1")))
        weight_raw = cut * fabric * (gsm + lami) * no * 2
    elif contains(sub, "Iris") or contains(sub, "Pyjama") or contains(sub, "Bonnet"):
        iris = (dia / 2) + Decimal("12.5") + height
        if is_double:
            fabric = iris + Decimal("12") if is_fda else iris + Decimal("18")
            cut = PI * (dia + Decimal("12"))
        else:
            fabric = iris + Decimal("5") if is_fda else (iris + Decimal("4") if edge else iris)
            cut = PI * (dia + Decimal("4"))
        weight_raw = cut * iris * (gsm + lami) * no
    else:
        if is_double:
            fabric = height + Decimal("20") if is_fda else height + (Decimal("17") if has_filler else Decimal("12"))
            cut = PI * (dia + Decimal("11"))
        else:
            if is_fda:
                fabric = height + Decimal("13")
            elif has_filler:
                fabric = height + Decimal("10")
            elif edge:
                fabric = height + Decimal("8")
            else:
                fabric = height + Decimal("5")
            cut = PI * (dia + Decimal("4"))
        weight_raw = cut * fabric * (gsm + lami) * no

    if fabric <= 0 or cut <= 0 or weight_raw <= 0:
        return
    set_if_missing(values, "DSFabric", fabric)
    set_if_missing(values, "DSCutSize", cut)
    set_if_missing(values, "DSTotalKg", round4(weight_raw / WEIGHT_DIV))
    set_if_missing(values, "DSTotalMtr", round4((cut / Decimal("100")) * qty * no))


def _populate_tie(request: BomRequest, gsm_key: str, fabric_key: str, cut_key: str, kg_key: str, mtr_key: str, no_key: str, remarks_key: str) -> None:
    values = request.bom1
    if get_value(values, kg_key):
        return
    grm = num(values, gsm_key)
    size = num(values, fabric_key)
    qty = qty_of(request)
    no = parse_num(get_value(request.bom3, no_key)) or ZERO
    if grm <= 0 or qty <= 0 or no <= 0:
        return
    cut = resolve_tie_cut_length(get_value(values, remarks_key), get_value(values, cut_key))
    if cut <= 0:
        return
    if size > 0:
        set_if_missing(values, fabric_key, size)
    set_if_missing(values, cut_key, cut)
    set_if_missing(values, kg_key, round4((cut * grm * no) / LOOP_DIV))
    set_if_missing(values, mtr_key, round4((cut / Decimal("100")) * qty * no))


def populate_top_spout_tie(request: BomRequest) -> None:
    _populate_tie(
        request,
        "FSTieGSM",
        "FSTieFabric",
        "FSTieCutSize",
        "FSTieTotalKg",
        "FSTieTotalMtr",
        "TopSpoutTieNo",
        "FSTieRemarks",
    )


def populate_bottom_spout_tie(request: BomRequest) -> None:
    _populate_tie(
        request,
        "DSTieGSM",
        "DSTieFabric",
        "DSTieCutSize",
        "DSTieTotalKg",
        "DSTieTotalMtr",
        "BottomSpoutTieNo",
        "DSTieRemarks",
    )


def _iris_tie(request: BomRequest, gsm_keys: list[str], no_key: str, dia_key: str, cut_key: str, kg_key: str, mtr_key: str) -> None:
    values = request.bom1
    if get_value(values, kg_key):
        return
    grm = ZERO
    for key in gsm_keys:
        grm = num(values, key)
        if grm > 0:
            break
    qty = qty_of(request)
    no = parse_num(get_value(request.bom3, no_key)) or ZERO
    dia = num(values, dia_key)
    if grm <= 0 or qty <= 0 or no <= 0 or dia <= 0:
        return
    cut = round4((dia * PI) + Decimal("35"))
    set_if_missing(values, cut_key, cut)
    set_if_missing(values, kg_key, round4((cut * grm * no) / LOOP_DIV))
    set_if_missing(values, mtr_key, round4((cut / Decimal("100")) * qty * no))


def populate_top_spout_iris_tie(request: BomRequest) -> None:
    _iris_tie(request, ["FSIRISTieGSM", "FSTieGSM"], "TopSpoutTieIRISNo", "FSL", "FSIRISTieCutSize", "FSIRISTieTotalKg", "FSIRISTieTotalMtr")


def populate_bottom_spout_iris_tie(request: BomRequest) -> None:
    _iris_tie(request, ["DSIRISTieGSM", "DSTieGSM"], "BottomSpoutTieIRISNo", "DSL", "DSIRISTieCutSize", "DSIRISTieTotalKg", "DSIRISTieTotalMtr")


def populate_liner(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "LinerTotalKg"):
        return
    qty = qty_of(request)
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    micron = num(values, "LinerDim")
    if qty <= 0 or micron <= 0 or length <= 0 or width <= 0 or height <= 0:
        return
    explicit_cut = num(values, "LinerL")
    explicit_fabric = num(values, "LinerW")
    liner_material = normalize_optional(get_value(values, "Liner")) or ""
    liner_type = (normalize_optional(get_value(values, "LinerType")) or "").split("|")[0].strip()
    top_type = normalize_optional(get_value(request.bom3, "toptypes")) or "Open"
    main_bottom = main_bottom_type(request)
    is_inner = is_inner_placement(request)
    duffle_height = num(values, "DuffleHt")
    slit_ht = num(values, "SlitHt")
    top_spout_height = num(values, "FSW")
    top_spout_dia = num(values, "FSL")
    bottom_spout_height = num(values, "DSW")
    bottom_spout_dia = num(values, "DSL")
    density = resolve_liner_density(liner_material)
    fabric = ZERO
    cut = ZERO

    if explicit_fabric > 0:
        fabric = explicit_fabric
        cut = explicit_cut
    else:
        adj_l = length if is_inner else max(ZERO, length - 4)
        adj_w = width if is_inner else max(ZERO, width - 4)
        bottom = ((length / 2) + (width / 2)) / 2
        computed_bottom = (
            round0(((((adj_l + adj_w + 5) - (HALF_PI * bottom_spout_dia + 3)) / 4) * Decimal("1.12")))
            if bottom_spout_height > 0
            else ZERO
        )
        computed_top = (
            round0(((((adj_l + adj_w + 5) - (HALF_PI * top_spout_dia + 3)) / 4) * Decimal("1.12")))
            if top_spout_height > 0
            else ZERO
        )
        add_cm = Decimal("10") if is_inner else Decimal("15")
        if is_inner and bottom_spout_height > 0:
            add_cm += Decimal("5")
        if is_inner and top_spout_height > 0:
            add_cm += Decimal("5")

        if equals(liner_type, "Form Fit Liner") or equals(liner_type, "Form Fit Flenze Liner"):
            fabric = adj_l + adj_w + (Decimal("25") if contains(liner_type, "Flenze") else Decimal("5"))
            if equals(main_bottom, "Bottom Spout") and top_type.lower() in {
                "open",
                "duffle or skrit",
                "top + skrit",
                "leno",
            }:
                cut = (
                    ((adj_l + adj_w) / 2) - 10 + computed_bottom + height + 10 + bottom_spout_height + 5
                    if equals(top_type, "Open")
                    else duffle_height + 5 + computed_bottom + height + bottom_spout_height + add_cm
                )
            else:
                cut = top_spout_height + computed_top + computed_bottom + height + bottom_spout_height + add_cm
                if equals(top_type, "Open") or equals(main_bottom, "Flat"):
                    cut += (((adj_l + adj_w) / 2) / 2) + 5
        elif equals(liner_type, "Gusseted Liner"):
            fabric = adj_l + adj_w + 5
            if top_type.lower() in {"open", "duffle or skrit", "top + skrit", "leno"} and equals(main_bottom, "Flat"):
                cut = bottom + height + 80 + add_cm
            elif top_type.lower() in {"duffle or skrit", "top + skrit", "leno"} and equals(main_bottom, "Bottom Spout"):
                cut = bottom + height + duffle_height + bottom_spout_height + add_cm
            elif equals(top_type, "Top Spout") and equals(main_bottom, "Flat"):
                cut = ((adj_w + adj_l) / 2) + height + top_spout_height + add_cm
            elif equals(top_type, "Top Spout") and equals(main_bottom, "Bottom Spout"):
                cut = ((adj_w + adj_l) / 2) + height + top_spout_height + bottom_spout_height + 20
            elif equals(top_type, "Open") and equals(main_bottom, "Bottom Spout"):
                cut = bottom + height + bottom_spout_height + 100
        elif equals(liner_type, "Suspended") and slit_ht > 0:
            fabric = adj_l + adj_w + 5
            cut = height + slit_ht + adj_w + 10
        elif equals(liner_type, "Tray Liner") and explicit_cut > 0:
            fabric = (length * 2) + (width * 2) + 10 if is_inner else length + width
            cut = explicit_cut + (width / 2) + 5

    if fabric <= 0 or cut <= 0:
        return
    set_if_missing(values, "LinerFabric", fabric)
    set_if_missing(values, "LinerCutSize", cut)
    set_if_missing(values, "LinerTotalKg", round4((cut * fabric * 2 * micron * density) / WEIGHT_DIV))
    set_if_missing(values, "LinerTotalMtr", round4((cut / Decimal("100")) * qty))


def populate_doc(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "DocTotalKg"):
        return
    length = num(values, "docl")
    width = num(values, "docw")
    micron = num(values, "DocGSM", Decimal("100"))
    qty = qty_of(request)
    if length <= 0 or width <= 0 or qty <= 0:
        return
    doc_parts = [p.strip() for p in (request.header.doc or "").split("/") if p.strip()]
    doc_type = doc_parts[0] if doc_parts else ""
    open_type = doc_parts[1] if len(doc_parts) > 1 else ""
    count = parse_num(request.header.doc_number) or (parse_num(doc_parts[3]) if len(doc_parts) > 3 else None) or Decimal("1")
    is_inch = equals(request.header.doc_unit, "INCH")
    fabric = length
    cut = width
    horizontal = contains(open_type, "RHS Open") or contains(open_type, "Upside Open") or contains(open_type, "Horizontal Open")
    if horizontal:
        fabric += 4
    else:
        cut += 4
    if is_inch:
        fabric *= Decimal("2.54")
        cut *= Decimal("2.54")
    total_kg = fabric * cut * 2 * micron * Decimal("0.92")
    if contains(doc_type, "Zip Lock"):
        total_kg += total_kg * Decimal("0.16")
    set_if_missing(values, "DocFabric", fabric)
    set_if_missing(values, "DocCutSize", cut)
    set_if_missing(values, "DocTotalKg", round4((total_kg * count) / WEIGHT_DIV))
    set_if_missing(values, "DocTotalMtr", round4((cut / Decimal("100")) * qty))


def populate_label(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "LableTotalKg"):
        return
    length = num(values, "LabelL") or num(values, "LableFabric")
    width = num(values, "LabelW") or num(values, "LableCutSize")
    micron = num(values, "LableGSM", Decimal("100"))
    qty = qty_of(request)
    if length <= 0 or width <= 0 or qty <= 0:
        return
    is_tyvac = is_truthy(get_value(values, "IsTyvac")) or contains(get_value(values, "LabelType"), "Tyvac")
    density = Decimal("1") if is_tyvac else Decimal("0.92")
    set_if_missing(values, "LableFabric", length)
    set_if_missing(values, "LableCutSize", width)
    set_if_missing(
        values,
        "LableTotalKg",
        round4((length * width * micron * Decimal("2.54") * Decimal("2.54") * density) / WEIGHT_DIV),
    )
    set_if_missing(values, "LableTotalMtr", round4((width / Decimal("100")) * qty))


def populate_filler_cord(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "FillerCordTotalKg"):
        return
    gpm = num(values, "FillerCordGSM")
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    if gpm <= 0 or length <= 0 or width <= 0 or height <= 0:
        return
    construction, _, _ = resolve_bag_type_parts(request)
    is_inner = is_inner_placement(request)
    add_cm = Decimal("10") if is_inner else ZERO
    total = ZERO
    if is_truthy(get_value(request.bom3, "fillercordtop")):
        total += resolve_single_double_multiplier(get_value(request.bom3, "fillercordtoptype")) * ((length + width + add_cm) * 2)
    if is_truthy(get_value(request.bom3, "fillercordbottom")):
        base = (width + add_cm) * 2 if equals(construction, "UPanel") else (length + width + add_cm) * 2
        total += resolve_single_double_multiplier(get_value(request.bom3, "fillercordbottomtype")) * base
    top_dia = num(values, "FSL")
    top_h = num(values, "FSW")
    if is_truthy(get_value(request.bom3, "fillercordtopspout")) and top_dia > 0 and top_h > 0:
        total += resolve_single_double_multiplier(get_value(request.bom3, "fillercordFStype")) * ((PI * top_dia) + 12 + top_h)
    bot_dia = num(values, "DSL")
    bot_h = num(values, "DSW")
    if is_truthy(get_value(request.bom3, "fillercordbottomspout")) and bot_dia > 0 and bot_h > 0:
        total += resolve_single_double_multiplier(get_value(request.bom3, "fillercordDStype")) * ((PI * bot_dia) + 12 + bot_h)
    circular_like = construction.lower() in {"circular", "single loop", "double loop"}
    if is_truthy(get_value(request.bom3, "fillercordbody")) and not circular_like:
        base_h = height + add_cm if is_inner else height
        total += resolve_single_double_multiplier(get_value(request.bom3, "fillercordbodytype")) * (base_h * 4)
    if equals(construction, "Buffle"):
        base_h = height + 5 if is_inner else height
        total += resolve_single_double_multiplier(get_value(request.bom3, "fillercordbuffletype")) * (base_h * 8)
    if total <= 0:
        return
    set_if_missing(values, "FillerCordTotalKg", round4((total * gpm) / LOOP_DIV))


def populate_thread(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "ThreadTotalKg"):
        return
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    if length <= 0 or width <= 0 or height <= 0:
        return
    construction, body_style, _ = resolve_bag_type_parts(request)
    is_inner = is_inner_placement(request)
    top_type = normalize_optional(get_value(request.bom3, "toptypes")) or "Open"
    main_bottom = main_bottom_type(request)
    loop_const = get_value(values, "loopconst")
    swl = swl_of(request)
    duffle_height = num(values, "DuffleHt")
    top_dia = num(values, "FSL")
    top_h = num(values, "FSW")
    bot_dia = num(values, "DSL")
    bot_h = num(values, "DSW")
    thread = ZERO
    has_top = bool(top_type) and not equals(top_type, "Open")
    has_bottom = bool(main_bottom) and not equals(main_bottom, "Flat")
    if is_inner:
        if has_top:
            thread += (length + width + 10) * 2
        if has_bottom and not equals(construction, "UPanel"):
            thread += (length + width + 10) * 2
    else:
        if has_top:
            thread += (length + width) * 2
        if has_bottom and not equals(construction, "UPanel"):
            thread += (length + width) * 2
    if equals(top_type, "Top Spout") and top_dia > 0 and top_h > 0:
        thread += ((PI * top_dia) + 12 + top_h + 10) * 2
    if top_type.lower() in {
        "duffle or skrit",
        "top + skrit",
        "leno",
        "oversize duffle or skrit",
        "drawstring skirt",
        "jute skirt",
    } and duffle_height > 0:
        thread += (duffle_height + 5 if is_inner else duffle_height) * 2
    if equals(main_bottom, "Bottom Spout") and bot_dia > 0 and bot_h > 0:
        thread += ((PI * bot_dia) + 12 + 10 + bot_h) * 2
    has_tunnel = equals(construction, "UPanel") and (
        contains(body_style, "Tunnel") or bool(get_value(request.bom3, "TunnelDesign"))
    )
    if equals(construction, "UPanel"):
        if has_tunnel:
            thread += (((height * 2) + length + 10) * 2) + 150 if is_inner else (((height * 2) + length) * 2) + 140
            thread += width * 4
        else:
            thread += (((height * 2) + length + 10) * 2) if is_inner else (((height * 2) + length) * 2)
        thread += (height + 5) * 4 if is_inner else height * 4
    elif equals(construction, "Buffle"):
        seam = resolve_thread_buffle_factor(get_value(request.bom3, "ThreadBuffleSeam"))
        if seam > 0:
            thread += (height + 5 if is_inner else height) * seam
    elif construction.lower() in {
        "4 panel",
        "tube + corner",
        "single + 4 loop",
        "double + 4 loop",
        "4 panel + conical bag(three piece)",
        "4 panel + conical bag(single piece)",
    }:
        thread += (height + 5 if is_inner else height) * 8
    if equals(loop_const, "Cross Corner"):
        thread += Decimal("2500") if swl > 1250 else (Decimal("2000") if swl >= 500 else ZERO)
    if is_truthy(get_value(request.bom3, "Hiracle")):
        if is_truthy(get_value(request.bom3, "HiracleTop")):
            thread += ((length + width + 10) * 2 if is_inner else (length + width) * 2) * 4
        if is_truthy(get_value(request.bom3, "HIracleBottom")):
            if equals(construction, "Buffle"):
                thread += ((length + width + 10) * 2 if is_inner else (length + width) * 2) * 4
            else:
                thread += ((length * 2) + 10 if is_inner else (length * 2)) * 4
        if equals(construction, "UPanel"):
            if has_tunnel:
                thread += (((height + 5) * 2 + length + 5) * 2 * 4) if is_inner else (((height * 2) + length) * 2 * 4)
            else:
                thread += (height + 10) * 16 if is_inner else height * 16
        elif equals(construction, "Buffle"):
            thread += (height + 5 if is_inner else height) * 16
        elif construction.lower() in {
            "4 panel",
            "tube + corner",
            "single + 4 loop",
            "double + 4 loop",
            "4 panel + conical bag(three piece)",
            "4 panel + conical bag(single piece)",
        }:
            thread += (height + 5 if is_inner else height) * 16
    if thread <= 0:
        return
    set_if_missing(values, "ThreadTotalKg", round4(thread / LOOP_DIV))
