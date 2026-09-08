from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from app.schemas.bom import BomCustomerSpec, BomPreviewResponse

MONEY = Decimal("0.01")
KG = Decimal("0.0001")

PP_HEADINGS = {
    "Body",
    "Side",
    "Top",
    "Top Spout",
    "Top Spout Tie",
    "Bottom",
    "Bottom Spout",
    "Bottom Spout Tie",
    "Loop",
    "IRIS Tie",
    "Top Flap",
    "Buffle",
    "Loop Cover",
    "Inner Skin",
    "Tunnel",
    "Reinforce fabric",
    "Thread",
}

PE_LINER_MATERIALS = {"ld", "lld", "hd", "pe"}


def d(value: float | int | str | Decimal | None) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def money(value: Decimal) -> float:
    return float(value.quantize(MONEY, rounding=ROUND_HALF_UP))


def kg4(value: Decimal) -> float:
    return float(value.quantize(KG, rounding=ROUND_HALF_UP))


def _liner_is_pe(spec: BomCustomerSpec) -> bool:
    if not spec.liner_enabled:
        return False
    material = (spec.liner_material or "").strip().lower()
    return material in PE_LINER_MATERIALS


def classify_bom_kg(
    bom: BomPreviewResponse,
    spec: BomCustomerSpec,
) -> tuple[Decimal, Decimal, Decimal, Decimal, list[dict[str, str | float]]]:
    """Return pp, pe, total, unclassified, per-line rows. Never PP = total − liner."""
    pe_ok = _liner_is_pe(spec)
    pp = Decimal("0")
    pe = Decimal("0")
    unclassified = Decimal("0")
    rows: list[dict[str, str | float]] = []
    for line in bom.lines:
        kg = d(line.total_kg)
        if kg <= 0:
            continue
        heading = line.heading
        if heading == "Liner" and pe_ok:
            category = "PE/Liner"
            pe += kg
        elif heading in PP_HEADINGS:
            category = "PP"
            pp += kg
        else:
            category = "unclassified"
            unclassified += kg
        rows.append({"heading": heading, "category": category, "kg": kg4(kg)})
    total = d(bom.total_kg_per_bag)
    return pp, pe, total, unclassified, rows


def heading_kg(bom: BomPreviewResponse, heading: str) -> Decimal | None:
    total = Decimal("0")
    found = False
    for line in bom.lines:
        if line.heading == heading:
            found = True
            total += d(line.total_kg)
    if not found:
        return None
    return total
