from __future__ import annotations

import re
from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal
from typing import Any

PI = Decimal("3.14")
HALF_PI = Decimal("1.57")
WEIGHT_DIV = Decimal("10000000")
LOOP_DIV = Decimal("100000")
FOUR_DP = Decimal("0.0001")
ZERO = Decimal("0")


def D(value: Any, default: Decimal = ZERO) -> Decimal:
    if value is None:
        return default
    if isinstance(value, Decimal):
        return value
    text = str(value).strip()
    if not text:
        return default
    try:
        return Decimal(text)
    except Exception:
        return default


def round4(value: Decimal) -> Decimal:
    return value.quantize(FOUR_DP, rounding=ROUND_HALF_UP)


def round0(value: Decimal) -> Decimal:
    return value.quantize(Decimal("1"), rounding=ROUND_HALF_UP)


def fmt(value: Decimal) -> str:
    normalized = round4(value).normalize()
    text = format(normalized, "f")
    if "." in text:
        text = text.rstrip("0").rstrip(".")
    return text or "0"


class Values(dict[str, str]):
    """Case-insensitive string map matching ERP Bom1/Bom3 dictionaries."""

    def __init__(self, data: dict[str, str] | None = None) -> None:
        super().__init__()
        self._index: dict[str, str] = {}
        if data:
            for key, value in data.items():
                self[key] = value

    def __getitem__(self, key: str) -> str:  # type: ignore[override]
        real = self._index.get(key.lower())
        if real is None:
            raise KeyError(key)
        return super().__getitem__(real)

    def __setitem__(self, key: str, value: str) -> None:  # type: ignore[override]
        lowered = key.lower()
        existing = self._index.get(lowered)
        if existing is not None and existing != key:
            super().pop(existing, None)
        self._index[lowered] = key
        super().__setitem__(key, "" if value is None else str(value))

    def get(self, key: str, default: str = "") -> str:  # type: ignore[override]
        real = self._index.get(key.lower())
        if real is None:
            return default
        return super().get(real, default) or ""


def get_value(values: Values, key: str) -> str:
    return (values.get(key) or "").strip()


def first_non_empty(*values: str | None) -> str:
    for value in values:
        if value and str(value).strip():
            return str(value).strip()
    return ""


def parse_num(value: str | None) -> Decimal | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return Decimal(text)
    except Exception:
        return None


def num(values: Values, key: str, default: Decimal = ZERO) -> Decimal:
    parsed = parse_num(get_value(values, key))
    return parsed if parsed is not None else default


def set_if_missing(values: Values, key: str, value: Decimal) -> None:
    if get_value(values, key):
        return
    values[key] = fmt(value)


def is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"yes", "true", "1"}


def equals(left: str, right: str) -> bool:
    return left.strip().lower() == right.strip().lower()


def contains(haystack: str, needle: str) -> bool:
    return needle.lower() in haystack.lower()


def nearly_equal(left: Decimal, right: Decimal) -> bool:
    return abs(left - right) < Decimal("0.0001")


def normalize_optional(value: str | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    return str(value).strip()


@dataclass
class BomHeader:
    bag_type: str = ""
    size_l: Decimal = ZERO
    size_w: Decimal = ZERO
    size_h: Decimal = ZERO
    size_type: str = "INNER"
    swl: str = ""
    sf_ratio: str = "5:1"
    qty: str = "0"
    qty_unit: str = "PCS"
    fs_type: str = ""
    ds_type: str = ""
    fab_color: str = ""
    instruction: str = ""
    body_remarks: str = ""
    print_type: str = ""
    loop_type: str = ""
    is_drop_loop: bool = False
    doc: str = ""
    doc_unit: str = "CM"
    doc_number: str = "1"


@dataclass
class BomRequest:
    header: BomHeader
    bom1: Values = field(default_factory=Values)
    bom3: Values = field(default_factory=Values)


def resolve_bag_type_parts(request: BomRequest) -> tuple[str, str, str]:
    parts = [p.strip() for p in (request.header.bag_type or "").split("/") if p.strip()]
    construction = first_non_empty(get_value(request.bom1, "Construction"), parts[0] if parts else "")
    body_style = first_non_empty(get_value(request.bom1, "BodyStyle"), parts[1] if len(parts) > 1 else "")
    body_grade = first_non_empty(get_value(request.bom1, "BodyGrade"), parts[2] if len(parts) > 2 else "")
    return construction, body_style, body_grade


def is_inner_placement(request: BomRequest) -> bool:
    return not equals(request.header.size_type or "", "OUTER")


def resolve_sf_bucket(sf_ratio: str | None) -> int:
    value = (normalize_optional(sf_ratio) or "")
    if value.lower().startswith("8"):
        return 8
    if value.lower().startswith("6"):
        return 6
    return 5


def resolve_cross_corner_extra(sf_bucket: int, swl: Decimal) -> Decimal:
    if sf_bucket == 5:
        if swl <= 1250:
            return Decimal("70")
        if swl <= 1500:
            return Decimal("80")
        if swl <= 2000:
            return Decimal("90")
        return ZERO
    if swl <= 1000:
        return Decimal("60")
    if swl <= 1299:
        return Decimal("80")
    if swl <= 1300:
        return Decimal("90")
    if swl <= 2000:
        return Decimal("100")
    return ZERO


def resolve_liner_density(liner_material: str) -> Decimal:
    if equals(liner_material, "LD") or equals(liner_material, "LLD"):
        return Decimal("0.92")
    if equals(liner_material, "HD"):
        return Decimal("0.94")
    if equals(liner_material, "ALU"):
        return Decimal("1.1")
    return Decimal("1")


def resolve_tie_cut_length(remarks: str, cut_size: str) -> Decimal:
    match = re.search(r"(\d+(\.\d+)?)", remarks or "")
    if match:
        from_remarks = D(match.group(1))
        if from_remarks > 0:
            return (from_remarks * 2) + Decimal("5")
    return parse_num(cut_size) or ZERO


def resolve_single_double_multiplier(value: str | None) -> Decimal:
    if not value or not value.strip():
        return ZERO
    lowered = value.strip().lower()
    if "double" in lowered or lowered == "2":
        return Decimal("2")
    if "single" in lowered or lowered == "1":
        return Decimal("1")
    return ZERO


def resolve_thread_buffle_factor(value: str | None) -> Decimal:
    if not value or not value.strip():
        return ZERO
    if contains(value, "All Seam"):
        return Decimal("16")
    if contains(value, "Eight Seam"):
        return Decimal("12")
    if contains(value, "Bag Corner Seam"):
        return Decimal("8")
    return ZERO


def qty_of(request: BomRequest) -> Decimal:
    return parse_num(request.header.qty) or ZERO


def swl_of(request: BomRequest) -> Decimal:
    return parse_num(request.header.swl) or ZERO


def main_bottom_type(request: BomRequest) -> str:
    raw = normalize_optional(get_value(request.bom3, "bottomtypes")) or ""
    parts = [p.strip() for p in raw.split("/") if p.strip()]
    return parts[0] if parts else "Flat"


def bottom_sub_type(request: BomRequest) -> str:
    raw = normalize_optional(get_value(request.bom3, "bottomtypes")) or normalize_optional(
        request.header.ds_type
    ) or ""
    parts = [p.strip() for p in raw.split("/") if p.strip()]
    return parts[1] if len(parts) > 1 else ""
