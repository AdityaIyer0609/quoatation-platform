"""frmBOM_NEW accessory weight formulas. Port only — do not invent rates."""

from __future__ import annotations

from decimal import Decimal

from app.services.bom.helpers import (
    LOOP_DIV,
    PI,
    WEIGHT_DIV,
    BomRequest,
    contains,
    equals,
    first_non_empty,
    get_value,
    is_inner_placement,
    is_truthy,
    num,
    parse_num,
    qty_of,
    resolve_bag_type_parts,
    round4,
    set_if_missing,
    ZERO,
)


def populate_accessories(request: BomRequest) -> None:
    populate_bag_tie(request, "top")
    populate_bag_tie(request, "bottom")
    populate_top_rope(request)
    populate_bottom_rope(request)
    populate_top_spout_rope(request)
    populate_bottom_spout_rope(request)
    populate_hook(request, "top")
    populate_hook(request, "bottom")
    populate_top_flap(request)
    populate_bottom_flap(request)
    populate_bottom_loop(request)
    populate_loop_protector(request)
    populate_loop_cover(request)
    populate_felt(request)
    populate_mf_webbing(request)
    populate_buffle(request)
    populate_inner_skin(request)
    populate_inner_box(request)
    populate_top_band(request)
    populate_stevedore(request)
    populate_ancerie(request)
    populate_hose_slider(request)
    populate_belly_band(request, "1")
    populate_belly_band(request, "2")
    populate_top_bottom_band(request)
    populate_safety_band(request)
    populate_steve_cover(request)
    populate_fabric_patch(request)
    populate_inner_top(request)
    populate_inner_bottom(request)
    populate_extra_doc(request, "1")
    populate_extra_doc(request, "2")
    populate_extra_label(request, "")
    populate_extra_label(request, "1")
    populate_extra_label(request, "2")
    populate_extra_label(request, "3")
    populate_extra_discharge(request, "2")
    populate_extra_discharge(request, "3")


def populate_belly_band(request: BomRequest, which: str) -> None:
    """TopBandBellyBand1/2WtFormula."""
    values = request.bom1
    prefix = f"BellyBand{which}"
    if get_value(values, f"{prefix}TotalKg") or not _yes(request, prefix):
        return
    grm = num(values, f"{prefix}GSM")
    size = num(values, f"{prefix}Fabric")
    qty = qty_of(request)
    if grm <= 0:
        return
    extra = Decimal("20") if is_inner_placement(request) else Decimal("15")
    cut = (request.header.size_l + request.header.size_w) * 2 + extra
    set_if_missing(values, f"{prefix}Fabric", size)
    set_if_missing(values, f"{prefix}CutSize", cut)
    set_if_missing(values, f"{prefix}TotalKg", round4((grm * cut) / LOOP_DIV))
    set_if_missing(values, f"{prefix}TotalMtr", round4((cut * qty) / Decimal("100")))


def populate_top_bottom_band(request: BomRequest) -> None:
    """TopBttomBandWtFormula uses metres then / 100000."""
    values = request.bom1
    if get_value(values, "TopBottomBandTotalKg") or not _yes(request, "TopBottomBand"):
        return
    grm = num(values, "TopBottomBandGSM")
    size = num(values, "TopBottomBandFabric")
    qty = qty_of(request)
    if grm <= 0:
        return
    extra = Decimal("20") if is_inner_placement(request) else Decimal("15")
    cut = (request.header.size_l + request.header.size_w) * 2 + extra
    mtr = (cut * qty) / Decimal("100")
    set_if_missing(values, "TopBottomBandFabric", size)
    set_if_missing(values, "TopBottomBandCutSize", cut)
    set_if_missing(values, "TopBottomBandTotalMtr", round4(mtr))
    set_if_missing(values, "TopBottomBandTotalKg", round4((grm * cut) / LOOP_DIV))


def populate_safety_band(request: BomRequest) -> None:
    """SafetyBandWtFormula: (L+H)*2*25. Stored as webbing kg / 100000."""
    values = request.bom1
    if get_value(values, "SafetyBandTotalKg") or not _yes(request, "SafetyBand"):
        return
    raw = (request.header.size_l + request.header.size_h) * 2 * Decimal("25")
    qty = qty_of(request)
    set_if_missing(values, "SafetyBandCutSize", request.header.size_l + request.header.size_h)
    set_if_missing(values, "SafetyBandTotalKg", round4(raw / LOOP_DIV))
    set_if_missing(values, "SafetyBandTotalMtr", round4(((request.header.size_l + request.header.size_h) / Decimal("100")) * qty))


def populate_steve_cover(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "SteveCoverTotalKg") or not _yes(request, "SteveCover"):
        return
    st_size = num(values, "StevedoreFabric") or num(values, "SteveCoverSize")
    length = num(values, "SteveCoverL")
    no = parse_num(get_value(request.bom3, "SteveCoverNo")) or num(values, "SteveCoverNo", Decimal("1"))
    gsm = num(values, "SteveCoverGSM")
    lami = num(values, "SteveCoverLami")
    qty = qty_of(request)
    fabric = st_size * 2 + Decimal("5")
    if length <= 0 or gsm + lami <= 0 or no <= 0:
        return
    raw = fabric * length * no * (lami + gsm)
    set_if_missing(values, "SteveCoverFabric", fabric)
    set_if_missing(values, "SteveCoverCutSize", length)
    set_if_missing(values, "SteveCoverTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "SteveCoverTotalMtr", round4((length * qty * no) / Decimal("100")))


def populate_fabric_patch(request: BomRequest) -> None:
    """FabricPatchWtFormula. Patch width is 10 cm in ERP."""
    values = request.bom1
    if get_value(values, "FabricPatchTotalKg") or not _yes(request, "FabricPatch"):
        return
    loop_cut = num(values, "LoopCutSize")
    loop_l = num(values, "LoopL")
    gsm = num(values, "FabricPatchGSM")
    lami = num(values, "FabricPatchLami")
    size = num(values, "FabricPatchSize") or Decimal("10")
    if gsm + lami <= 0:
        return
    cut = ((loop_cut - loop_l * 2) / 2) + Decimal("5") if loop_cut > 0 else Decimal("5")
    raw = (gsm + lami) * size * cut * 8
    qty = qty_of(request)
    set_if_missing(values, "FabricPatchFabric", size)
    set_if_missing(values, "FabricPatchCutSize", cut)
    set_if_missing(values, "FabricPatchTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "FabricPatchTotalMtr", round4((cut / Decimal("100")) * qty * 8))


def populate_inner_top(request: BomRequest) -> None:
    """InnerTopWtFormula — default circular/single-loop branch, then conical overrides."""
    values = request.bom1
    if get_value(values, "InnerTopTotalKg") or not _yes(request, "InnerTop"):
        return
    gsm = num(values, "InnerTopGSM")
    lami = num(values, "InnerTopLami")
    extra = num(values, "InnerTopExtra")
    dia = num(values, "InnerTopDia") or num(values, "FSL")
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    if gsm + lami <= 0:
        return
    construction, _, _ = resolve_bag_type_parts(request)
    inner = is_inner_placement(request)
    top = first_non_empty(get_value(request.bom3, "toptypes"), "")
    factor = Decimal("1")
    fabric = length + Decimal("12")
    cut = width + Decimal("12") + extra
    if equals(top, "Conical PlateTop"):
        fabric = length + (Decimal("32") if inner else Decimal("28"))
        cut = width + (Decimal("32") if inner else Decimal("28")) + (extra if inner else ZERO)
    elif equals(top, "Conical Top") or equals(construction, "4 Panel + Conical Bag(Three Piece)"):
        one = (dia * PI) / Decimal("4") if dia > 0 else ZERO
        fabric = length + (Decimal("12") if inner else Decimal("8"))
        cut = ((width - one) / 2) + (Decimal("14") if inner else Decimal("10")) + extra
        factor = Decimal("4")
    elif contains(top, "Duffle") or contains(top, "Skrit") or contains(top, "Leno") or contains(top, "Skirt"):
        fabric = num(values, "DuffleHt") + Decimal("5")
        cut = (length * 4 if inner else (length - Decimal("4")) * 4) + Decimal("12") + extra
    elif not inner and (
        equals(construction, "Buffle")
        or equals(construction, "4 Panel")
        or contains(construction, "Tube")
        or contains(construction, "4 Loop")
    ):
        fabric = length + Decimal("8")
        cut = width + Decimal("8") + extra
    raw = cut * fabric * (gsm + lami) * factor
    set_if_missing(values, "InnerTopFabric", fabric)
    set_if_missing(values, "InnerTopCutSize", cut)
    set_if_missing(values, "InnerTopTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "InnerTopTotalMtr", round4((cut / Decimal("100")) * qty * factor))


def populate_inner_bottom(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "InnerBottomTotalKg") or not _yes(request, "InnerBottom"):
        return
    gsm = num(values, "InnerBottomGSM")
    lami = num(values, "InnerBottomLami")
    extra = num(values, "InnerBottomExtra")
    dia = num(values, "InnerBottomDia") or num(values, "DSL")
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    if gsm + lami <= 0:
        return
    construction, _, _ = resolve_bag_type_parts(request)
    inner = is_inner_placement(request)
    bottom = first_non_empty(get_value(request.bom3, "bottomtypes"), "")
    factor = Decimal("1")
    fabric = length + Decimal("12")
    cut = width + Decimal("12") + extra
    if contains(bottom, "Conical Plate"):
        fabric = length + (Decimal("32") if inner else Decimal("28"))
        cut = width + (Decimal("32") if inner else Decimal("28")) + extra
    elif contains(bottom, "Conical Base") or equals(construction, "4 Panel + Conical Bag(Three Piece)"):
        one = (dia * PI) / Decimal("4") if dia > 0 else ZERO
        fabric = length + (Decimal("12") if inner else Decimal("8"))
        cut = ((width - one) / 2) + (Decimal("14") if inner else Decimal("10")) + extra
        factor = Decimal("4")
    raw = cut * fabric * (gsm + lami) * factor
    set_if_missing(values, "InnerBottomFabric", fabric)
    set_if_missing(values, "InnerBottomCutSize", cut)
    set_if_missing(values, "InnerBottomTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "InnerBottomTotalMtr", round4((cut / Decimal("100")) * qty * factor))


def populate_extra_doc(request: BomRequest, which: str) -> None:
    """Doc1WtFormula / Doc2WtFormula."""
    values = request.bom1
    prefix = f"Doc{which}"
    if get_value(values, f"{prefix}TotalKg") or not _yes(request, prefix):
        return
    length = num(values, f"{prefix}L")
    width = num(values, f"{prefix}W")
    micron = num(values, f"{prefix}GSM", Decimal("80"))
    count = parse_num(get_value(request.bom3, f"{prefix}No")) or Decimal("1")
    qty = qty_of(request)
    if length <= 0 or width <= 0:
        return
    opening = get_value(request.bom3, f"{prefix}Opening")
    doc_type = get_value(request.bom3, f"{prefix}Type")
    unit = get_value(request.bom3, f"{prefix}Unit")
    fabric = length
    cut = width
    if contains(opening, "RHS") or contains(opening, "Upside") or contains(opening, "Horizontal"):
        fabric += 4
    else:
        cut += 4
    if equals(unit, "INCH"):
        fabric *= Decimal("2.54")
        cut *= Decimal("2.54")
    total = fabric * cut * 2 * micron * Decimal("0.92")
    if contains(doc_type, "Zip"):
        total += total * Decimal("0.16")
    set_if_missing(values, f"{prefix}Fabric", fabric)
    set_if_missing(values, f"{prefix}CutSize", cut)
    set_if_missing(values, f"{prefix}TotalKg", round4((total * count) / WEIGHT_DIV))
    set_if_missing(values, f"{prefix}TotalMtr", round4((cut / Decimal("100")) * qty))


def populate_extra_label(request: BomRequest, which: str) -> None:
    """Same LabelWtFormula for extra labels  / 1 / 2 / 3."""
    values = request.bom1
    prefix = f"ExtraLabel{which}" if which else "ExtraLabel"
    if get_value(values, f"{prefix}TotalKg") or not _yes(request, prefix):
        return
    length = num(values, f"{prefix}L")
    width = num(values, f"{prefix}W")
    micron = num(values, f"{prefix}Micron", Decimal("100"))
    count = parse_num(get_value(request.bom3, f"{prefix}No")) or Decimal("1")
    qty = qty_of(request)
    if length <= 0 or width <= 0:
        return
    tyvac = _yes(request, "IsTyvac")
    density = Decimal("1") if tyvac else Decimal("0.92")
    raw = length * width * micron * Decimal("2.54") * Decimal("2.54") * density * count
    set_if_missing(values, f"{prefix}Fabric", length)
    set_if_missing(values, f"{prefix}CutSize", width)
    set_if_missing(values, f"{prefix}TotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, f"{prefix}TotalMtr", round4((width / Decimal("100")) * qty * count))


def populate_extra_discharge(request: BomRequest, which: str) -> None:
    """DSWtFormula1 / DSWtFormula2 — simple spout branch from populate_bottom_spout."""
    values = request.bom1
    prefix = f"DS{which}"
    if get_value(values, f"{prefix}TotalKg") or not _yes(request, prefix):
        return
    dia = num(values, f"{prefix}L")
    height = num(values, f"{prefix}W")
    gsm = num(values, f"{prefix}GSM")
    lami = num(values, f"{prefix}Lami")
    no = parse_num(get_value(request.bom3, f"{prefix}No")) or Decimal("1")
    qty = qty_of(request)
    if dia <= 0 or height <= 0 or gsm + lami <= 0:
        return
    fabric = height + Decimal("5")
    cut = PI * (dia + Decimal("4"))
    raw = cut * fabric * (gsm + lami) * no
    set_if_missing(values, f"{prefix}Fabric", fabric)
    set_if_missing(values, f"{prefix}CutSize", cut)
    set_if_missing(values, f"{prefix}TotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, f"{prefix}TotalMtr", round4((cut / Decimal("100")) * qty * no))



def _yes(request: BomRequest, key: str) -> bool:
    return is_truthy(get_value(request.bom3, key)) or is_truthy(get_value(request.bom1, key))


def _set_webbing(
    values,
    prefix: str,
    cut: Decimal,
    fabric: Decimal,
    grm: Decimal,
    no: Decimal,
    qty: Decimal,
) -> None:
    if cut <= 0 or grm <= 0 or no <= 0:
        return
    set_if_missing(values, f"{prefix}Fabric", fabric)
    set_if_missing(values, f"{prefix}CutSize", cut)
    set_if_missing(values, f"{prefix}TotalKg", round4((cut * grm * no) / LOOP_DIV))
    set_if_missing(values, f"{prefix}TotalMtr", round4((cut / Decimal("100")) * qty * no))


def populate_bag_tie(request: BomRequest, which: str) -> None:
    """TopTieFormula / BottomTieFormula."""
    values = request.bom1
    prefix = "TopTie" if which == "top" else "BottomTie"
    if get_value(values, f"{prefix}TotalKg") or not _yes(request, prefix):
        return
    grm = num(values, f"{prefix}GSM")
    size = num(values, f"{prefix}Fabric")
    no = parse_num(get_value(request.bom3, f"{prefix}No")) or num(values, f"{prefix}No", Decimal("1"))
    qty = qty_of(request)
    if grm <= 0 or no <= 0:
        return
    if which == "top":
        dia = num(values, "FSL")
        spout_type = request.header.fs_type
        cut_in = num(values, "TopTieCutInput")
        if contains(spout_type, "Iris") or contains(spout_type, "Pyjama") or contains(spout_type, "Bonnet") or contains(spout_type, "Petal"):
            cut = (PI * dia) + Decimal("35") if dia > 0 else ZERO
        elif cut_in > 0:
            cut = cut_in * 2 + Decimal("5")
        else:
            cut = size * 2 + Decimal("5") if size > 0 else ZERO
    else:
        dia = num(values, "DSL")
        sub = request.header.ds_type
        if contains(sub, "Petal") or contains(sub, "Iris") or contains(sub, "Pyjama") or contains(sub, "Bonnet"):
            cut = (PI * dia) + Decimal("35") if dia > 0 else ZERO
        else:
            cut = num(values, "BottomTieCutInput") or num(values, f"{prefix}CutSize")
            if cut <= 0 and size > 0:
                cut = size * 2 + Decimal("5")
    _set_webbing(values, prefix, cut, size, grm, no, qty)


def populate_top_rope(request: BomRequest) -> None:
    """TopRopeWtFormula: cut = size * 20 + 5."""
    values = request.bom1
    if get_value(values, "TopRopeTotalKg") or not _yes(request, "TopRope"):
        return
    size = num(values, "TopRopeFabric") or num(values, "TopRopeSize")
    grm = num(values, "TopRopeGSM")
    no = parse_num(get_value(request.bom3, "TopRopeNo")) or num(values, "TopRopeNo", Decimal("1"))
    cut = size * Decimal("20") + Decimal("5")
    _set_webbing(values, "TopRope", cut, size, grm, no, qty_of(request))


def populate_bottom_rope(request: BomRequest) -> None:
    """BottomRopeWtFormula: cut = cutSize + 5."""
    values = request.bom1
    if get_value(values, "BottomRopeTotalKg") or not _yes(request, "BottomRope"):
        return
    size = num(values, "BottomRopeFabric") or num(values, "BottomRopeSize")
    grm = num(values, "BottomRopeGSM")
    no = parse_num(get_value(request.bom3, "BottomRopeNo")) or num(values, "BottomRopeNo", Decimal("1"))
    cut_in = num(values, "BottomRopeCutInput")
    if cut_in <= 0:
        cut = size * Decimal("20") + Decimal("5")
    else:
        cut = cut_in + Decimal("5")
    _set_webbing(values, "BottomRope", cut, size, grm, no, qty_of(request))


def populate_top_spout_rope(request: BomRequest) -> None:
    """TopSpoutRopeWtFormula."""
    values = request.bom1
    if get_value(values, "FSRopeTotalKg") or not _yes(request, "FSRope"):
        return
    dia = num(values, "FSL")
    size = num(values, "FSRopeFabric") or num(values, "FSRopeSize")
    grm = num(values, "FSRopeGSM")
    no = parse_num(get_value(request.bom3, "FSRopeNo")) or num(values, "FSRopeNo", Decimal("1"))
    spout_type = request.header.fs_type
    circ = PI * dia
    if contains(spout_type, "Iris") or contains(spout_type, "Pyjama") or contains(spout_type, "Bonnet"):
        cut = circ + Decimal("25") if dia > 0 else ZERO
    elif contains(spout_type, "Petal"):
        cut = circ + Decimal("35") if dia > 0 else ZERO
        petal = dia - Decimal("10") if dia > Decimal("10") else ZERO
        petal_gsm = num(values, "TopPetalFlapGSM")
        petal_lami = num(values, "TopPetalFlapLami") if _yes(request, "TopPetalFlapLam") else ZERO
        if petal > 0 and petal_gsm + petal_lami > 0:
            raw = petal * petal * (petal_gsm + petal_lami)
            set_if_missing(values, "TopPetalFlapFabric", petal)
            set_if_missing(values, "TopPetalFlapCutSize", petal)
            set_if_missing(values, "TopPetalFlapTotalKg", round4(raw / WEIGHT_DIV))
    else:
        cut = size * 2 + Decimal("5") if size > 0 else ZERO
    _set_webbing(values, "FSRope", cut, size, grm, no, qty_of(request))


def populate_bottom_spout_rope(request: BomRequest) -> None:
    """BottomSpoutRopeWtFormula."""
    values = request.bom1
    if get_value(values, "DSRopeTotalKg") or not _yes(request, "DSRope"):
        return
    dia = num(values, "DSL")
    size = num(values, "DSRopeFabric") or num(values, "DSRopeSize")
    grm = num(values, "DSRopeGSM")
    no = parse_num(get_value(request.bom3, "DSRopeNo")) or num(values, "DSRopeNo", Decimal("1"))
    sub = request.header.ds_type
    circ = PI * dia
    if contains(sub, "Petal") or contains(sub, "Iris") or contains(sub, "Pyjama") or contains(sub, "Bonnet"):
        cut = circ + Decimal("35") if dia > 0 else ZERO
        if contains(sub, "Petal"):
            petal = dia - Decimal("10") if dia > Decimal("10") else ZERO
            petal_gsm = num(values, "BottomPetalFlapGSM")
            petal_lami = num(values, "BottomPetalFlapLami") if _yes(request, "BottomPetalFlapLam") else ZERO
            if petal > 0 and petal_gsm + petal_lami > 0:
                raw = petal * petal * (petal_gsm + petal_lami)
                set_if_missing(values, "BottomPetalFlapFabric", petal)
                set_if_missing(values, "BottomPetalFlapCutSize", petal)
                set_if_missing(values, "BottomPetalFlapTotalKg", round4(raw / WEIGHT_DIV))
    else:
        cut = size * 2 + Decimal("5") if size > 0 else ZERO
    _set_webbing(values, "DSRope", cut, size, grm, no, qty_of(request))


def populate_hook(request: BomRequest, which: str) -> None:
    """TopHookFormula / BottomHookFormula. Default cut 20 when cut size empty."""
    values = request.bom1
    prefix = "TopHook" if which == "top" else "BottomHook"
    if get_value(values, f"{prefix}TotalKg") or not _yes(request, prefix):
        return
    grm = num(values, f"{prefix}GSM")
    size = num(values, f"{prefix}Fabric")
    no = parse_num(get_value(request.bom3, f"{prefix}No")) or num(values, f"{prefix}No", Decimal("1"))
    cut = num(values, f"{prefix}CutSize")
    if cut <= 0:
        cut = Decimal("20")
    else:
        cut = cut * 2 + Decimal("5")
    _set_webbing(values, prefix, cut, size, grm, no, qty_of(request))


def populate_top_flap(request: BomRequest) -> None:
    """TopFlapWtFormula. Divide by 10_000_000 after print()."""
    values = request.bom1
    if get_value(values, "TopFlapTotalKg") or not _yes(request, "TopFlap"):
        return
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    gsm = num(values, "TopFlapGSM")
    lami = num(values, "TopFlapLamiType") or num(values, "TopFlapLami")
    no = parse_num(get_value(request.bom3, "TopFlapNo")) or num(values, "TopFlapNo", Decimal("1"))
    if gsm + lami <= 0 or length <= 0 or width <= 0 or no <= 0:
        return
    inner = is_inner_placement(request)
    fabric = num(values, "TopFlapFabric") or (length + Decimal("5") if inner else length - Decimal("5"))
    cut = num(values, "TopFlapCutSize") or (width + Decimal("15") if inner else width + Decimal("10"))
    raw = cut * fabric * (gsm + lami) * no
    set_if_missing(values, "TopFlapFabric", fabric)
    set_if_missing(values, "TopFlapCutSize", cut)
    set_if_missing(values, "TopFlapTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "TopFlapTotalMtr", round4((cut / Decimal("100")) * qty * no))


def populate_bottom_flap(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "BottomFlapTotalKg") or not _yes(request, "BottomFlap"):
        return
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    gsm = num(values, "BottomFlapGSM")
    lami = num(values, "BottomFlapLami") or num(values, "BottomFlapLamiType")
    no = parse_num(get_value(request.bom3, "BottomFlapNo")) or num(values, "BottomFlapNo", Decimal("1"))
    if gsm + lami <= 0 or length <= 0 or width <= 0 or no <= 0:
        return
    inner = is_inner_placement(request)
    fabric = width + Decimal("5") if inner else width - Decimal("5")
    cut = num(values, "BottomFlapCutSize") or (length + Decimal("15") if inner else length + Decimal("10"))
    raw = cut * fabric * (gsm + lami) * no
    set_if_missing(values, "BottomFlapFabric", fabric)
    set_if_missing(values, "BottomFlapCutSize", cut)
    set_if_missing(values, "BottomFlapTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "BottomFlapTotalMtr", round4((cut / Decimal("100")) * qty * no))


def populate_bottom_loop(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "BottomLoopTotalKg") or not _yes(request, "BottomLoop"):
        return
    length = num(values, "BottomLoopCutSize") or num(values, "BottomLoopL")
    size = num(values, "BottomLoopFabric") or num(values, "BottomLoopW")
    grm = num(values, "BottomLoopGSM")
    no = parse_num(get_value(request.bom3, "BottomLoopNo")) or num(values, "BottomLoopNo", Decimal("1"))
    _set_webbing(values, "BottomLoop", length, size, grm, no, qty_of(request))


def populate_loop_protector(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "LoopProtectorTotalKg") or not _yes(request, "LoopProtector"):
        return
    kind = get_value(request.bom3, "LoopProtectorType") or get_value(values, "LoopProtectorType")
    loop_l = num(values, "LoopL")
    loop_no = num(values, "loopRemarks") or Decimal("4")
    gsm = num(values, "LoopProtectorGSM")
    lami = num(values, "LoopProtectorLami")
    size = num(values, "LoopProtectorFabric") or num(values, "LoopProtectorSize")
    qty = qty_of(request)
    if loop_l <= 0 or gsm <= 0 or loop_no <= 0:
        return
    if contains(kind, "Fabric") or contains(kind, "Sleeve") or contains(kind, "Wear"):
        fabric = Decimal("16")
        cut = loop_l * 2
        raw = cut * loop_no * fabric * (gsm + lami) / Decimal("100")
    else:
        fabric = size if size > 0 else ZERO
        cut = loop_l * 2 - Decimal("5")
        raw = cut * loop_no * gsm
    if cut <= 0:
        return
    set_if_missing(values, "LoopProtectorFabric", fabric)
    set_if_missing(values, "LoopProtectorCutSize", cut)
    set_if_missing(values, "LoopProtectorTotalKg", round4(raw / LOOP_DIV))
    set_if_missing(values, "LoopProtectorTotalMtr", round4((cut / Decimal("100")) * loop_no * qty))


def populate_loop_cover(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "LoopCoverTotalKg") or not _yes(request, "LoopCover"):
        return
    cut = num(values, "LoopCoverCutSize")
    size = num(values, "LoopCoverFabric") or num(values, "LoopCoverSize")
    no = parse_num(get_value(request.bom3, "LoopCoverNo")) or num(values, "LoopCoverNo", Decimal("1"))
    gsm = num(values, "LoopCoverGSM")
    lami = num(values, "LoopCoverLami") or num(values, "LoopCoverLamiType")
    qty = qty_of(request)
    if cut <= 0 or size <= 0 or gsm + lami <= 0 or no <= 0:
        return
    raw = cut * size * no * (gsm + lami)
    set_if_missing(values, "LoopCoverFabric", size)
    set_if_missing(values, "LoopCoverTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "LoopCoverTotalMtr", round4((cut * qty) / Decimal("100")))


def populate_felt(request: BomRequest) -> None:
    """FeltWtFormula — seam length × 5 × 170 / 10_000_000."""
    values = request.bom1
    if get_value(values, "FeltTotalKg") or not _yes(request, "Felt"):
        return
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    qty = qty_of(request)
    add = Decimal("10") if is_inner_placement(request) else ZERO
    construction, _, _ = resolve_bag_type_parts(request)
    total = ZERO
    if _yes(request, "FeltTop"):
        total += (length + width + add) * 2
    if _yes(request, "FeltBottom"):
        total += (width + add) * 2 if equals(construction, "UPanel") else (length + width + add) * 2
    if _yes(request, "FeltTopSpout"):
        dia = num(values, "FSL")
        h = num(values, "FSW")
        if dia > 0:
            total += (PI * dia) + Decimal("12") + h
    if _yes(request, "FeltBottomSpout"):
        dia = num(values, "DSL")
        h = num(values, "DSW")
        if dia > 0:
            total += (PI * dia) + Decimal("12") + h
    if _yes(request, "FeltBody"):
        total += (height + add) * 4 if is_inner_placement(request) else height * 4
    total += add
    if total <= 0:
        return
    set_if_missing(values, "FeltCutSize", total)
    set_if_missing(values, "FeltFabric", Decimal("5"))
    set_if_missing(values, "FeltGSM", Decimal("170"))
    set_if_missing(values, "FeltTotalMtr", round4(total / Decimal("100") * qty))
    set_if_missing(values, "FeltTotalKg", round4((total * Decimal("5") * Decimal("170")) / WEIGHT_DIV))


def populate_mf_webbing(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "MFWebTotalKg") or not _yes(request, "MFWeb"):
        return
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    qty = qty_of(request)
    add = Decimal("10") if is_inner_placement(request) else ZERO
    construction, _, _ = resolve_bag_type_parts(request)
    total = ZERO
    if _yes(request, "MFWebTop"):
        total += (length + width + add) * 2
    if _yes(request, "MFWebBottom"):
        total += (width + add) * 2 if equals(construction, "UPanel") else (length + width + add) * 2
    if _yes(request, "MFWebTopSpout"):
        dia = num(values, "FSL")
        h = num(values, "FSW")
        if dia > 0:
            total += (PI * dia) + Decimal("12") + h
    if _yes(request, "MFWebBottomSpout"):
        dia = num(values, "DSL")
        h = num(values, "DSW")
        if dia > 0:
            total += (PI * dia) + Decimal("12") + h
    if _yes(request, "MFWebBody"):
        total += (height + add) * 4 if is_inner_placement(request) else height * 4
    if equals(construction, "Buffle") and _yes(request, "MFWebBuffle"):
        total += (height + Decimal("5")) * 8 if is_inner_placement(request) else height * 8
    if total <= 0:
        return
    raw = total * Decimal("15")
    set_if_missing(values, "MFWebCutSize", total)
    set_if_missing(values, "MFWebTotalMtr", round4(raw / (Decimal("15") * Decimal("100")) * qty))
    set_if_missing(values, "MFWebTotalKg", round4(raw / LOOP_DIV))


def populate_buffle(request: BomRequest) -> None:
    """BuffleWtFormula for construction Buffle, Standard / Rectangular / Special / Net."""
    values = request.bom1
    construction, _, _ = resolve_bag_type_parts(request)
    if not equals(construction, "Buffle") or get_value(values, "BuffleTotalKg"):
        return
    gsm = num(values, "BuffleGSM")
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    qty = qty_of(request)
    kind = (get_value(request.bom3, "BuffleType") or get_value(values, "BuffleKind") or "Standard").strip()
    inner = is_inner_placement(request)
    if inner:
        b_w = ((length / Decimal("3")) ** 2 + (width / Decimal("3")) ** 2).sqrt() + Decimal("10")
        b_h = height - Decimal("20")
    else:
        b_w = (((length - Decimal("5")) / Decimal("3")) ** 2 + ((width - Decimal("5")) / Decimal("3")) ** 2).sqrt() + Decimal("10")
        b_h = height - Decimal("25")
    cut_override = num(values, "BuffleCutSize")
    cut = cut_override if cut_override > 0 else b_h
    if contains(kind, "Net"):
        raw = (b_h * Decimal("50") / Decimal("100")) * 4
        kg = round4(raw / Decimal("1000"))
    else:
        if gsm <= 0 or b_w <= 0 or b_h <= 0:
            return
        raw = b_w * b_h * gsm * 4
        kg = round4(raw / WEIGHT_DIV)
    set_if_missing(values, "BuffleFabric", round4(b_w))
    set_if_missing(values, "BuffleCutSize", round4(cut))
    set_if_missing(values, "BuffleTotalKg", kg)
    set_if_missing(values, "BuffleTotalMtr", round4((cut / Decimal("100")) * qty * 4))


def populate_inner_skin(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "InnerSkinTotalKg") or not _yes(request, "InnerSkin"):
        return
    gsm = num(values, "InnerSkinGSM")
    lami = num(values, "InnerSkinLami") or num(values, "InnerSkinLamiType")
    extra = num(values, "InnerSkinExtraCut")
    length = request.header.size_l
    width = request.header.size_w
    height = request.header.size_h
    qty = qty_of(request)
    if gsm + lami <= 0 or length <= 0 or height <= 0:
        return
    construction, style, grade = resolve_bag_type_parts(request)
    inner = is_inner_placement(request)
    fabric = ZERO
    cut = ZERO
    factor = Decimal("1")
    if equals(construction, "4 Panel") or equals(construction, "Double Layer Circular Inner Skin Bag"):
        fabric = length + Decimal("12")
        cut = (height + Decimal("12") if inner else height + Decimal("8")) + extra
        factor = Decimal("4") if length == width else Decimal("2")
    elif equals(construction, "UPanel") or equals(construction, "Double Layer Tunnel Lift Loop Bag"):
        if contains(style, "Wider"):
            fabric = length + Decimal("15")
            cut = ((height * 2) + width + (Decimal("14") if inner else Decimal("8"))) + extra
        elif contains(grade, "UN"):
            fabric = length + Decimal("15")
            cut = ((height * 2) + width + (Decimal("19") if inner else Decimal("8"))) + extra
        else:
            fabric = length + Decimal("12")
            cut = ((height * 2) + width + (Decimal("14") if inner else Decimal("8"))) + extra
        factor = Decimal("1")
    else:
        fabric = length + Decimal("12")
        cut = height + Decimal("12") + extra
        factor = Decimal("1")
    raw = cut * (gsm + lami) * factor * fabric
    if _yes(request, "InnerSkinRF"):
        raw += raw * Decimal("0.1111")
    set_if_missing(values, "InnerSkinFabric", fabric)
    set_if_missing(values, "InnerSkinCutSize", cut)
    set_if_missing(values, "InnerSkinTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "InnerSkinTotalMtr", round4((cut / Decimal("100")) * qty * factor))


def populate_inner_box(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "InnerBoxTotalKg") or not _yes(request, "InnerBox"):
        return
    gsm = num(values, "InnerBoxGSM")
    lami = num(values, "InnerBoxLami")
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    if gsm + lami <= 0:
        return
    if is_inner_placement(request):
        fabric = length + width + Decimal("4")
        cut = width + Decimal("17")
    else:
        fabric = length + width - Decimal("6")
        cut = width + Decimal("12")
    raw = fabric * cut * 2 * (gsm + lami)
    set_if_missing(values, "InnerBoxFabric", fabric)
    set_if_missing(values, "InnerBoxCutSize", cut)
    set_if_missing(values, "InnerBoxTotalKg", round4(raw / WEIGHT_DIV))
    set_if_missing(values, "InnerBoxTotalMtr", round4(qty * (cut / Decimal("100"))))


def populate_top_band(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "TopBandTotalKg") or not _yes(request, "TopBand"):
        return
    grm = num(values, "TopBandGSM")
    size = num(values, "TopBandFabric")
    length = request.header.size_l
    width = request.header.size_w
    qty = qty_of(request)
    if grm <= 0:
        return
    extra = Decimal("20") if is_inner_placement(request) else Decimal("15")
    cut = (length + width) * 2 + extra
    set_if_missing(values, "TopBandFabric", size)
    set_if_missing(values, "TopBandCutSize", cut)
    set_if_missing(values, "TopBandTotalKg", round4((grm * cut) / LOOP_DIV))
    set_if_missing(values, "TopBandTotalMtr", round4((cut * qty) / Decimal("100")))


def populate_stevedore(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "StevedoreTotalKg") or not _yes(request, "Stevedore"):
        return
    grm = num(values, "StevedoreGSM")
    size = num(values, "StevedoreFabric")
    no = parse_num(get_value(request.bom3, "StevedoreNo")) or num(values, "StevedoreNo", Decimal("1"))
    cut = num(values, "StevedoreCutSize") or num(values, "StevedoreL")
    qty = qty_of(request)
    length = request.header.size_l
    width = request.header.size_w
    portion = get_value(request.bom3, "StevedorePortion") or "Length"
    extra = Decimal("20") if is_inner_placement(request) else Decimal("15")
    if cut <= 0:
        if contains(portion, "Width"):
            cut = width * 2 + extra
        elif contains(portion, "Diagonal"):
            cut = ((width * width + length * length).sqrt() * 2) + extra
        else:
            cut = length * 2 + extra
    _set_webbing(values, "Stevedore", cut, size, grm, no, qty)


def populate_ancerie(request: BomRequest) -> None:
    values = request.bom1
    if get_value(values, "AncerieTotalKg") or not _yes(request, "Ancerie"):
        return
    loop_w = num(values, "LoopW")
    size = num(values, "AncerieSize")
    att = num(values, "AncerieAtt")
    grm = num(values, "AncerieGSM")
    no = parse_num(get_value(request.bom3, "AncerieNo")) or num(values, "AncerieNo", Decimal("1"))
    qty = qty_of(request)
    cut = size * 2 + att
    fabric = loop_w if loop_w > 0 else size
    _set_webbing(values, "Ancerie", cut, fabric, grm, no, qty)


def populate_hose_slider(request: BomRequest) -> None:
    """print() uses wt = textHoseSliderNo * 0.005 kg per bag."""
    values = request.bom1
    if get_value(values, "HoseSliderTotalKg") or not _yes(request, "HoseSlider"):
        return
    no = parse_num(get_value(request.bom3, "HoseSliderNo")) or num(values, "HoseSliderNo", Decimal("1"))
    if no <= 0:
        return
    set_if_missing(values, "HoseSliderTotalKg", round4(no * Decimal("0.005")))
