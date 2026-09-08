from __future__ import annotations

from app.services.pricing.book4 import CONVERSION_ROWS, PRINT_TYPE_MAP


def norm(value: str | None) -> str:
    return "".join((value or "").lower().split())


def bag_type(product_category: str) -> str | None:
    text = (product_category or "").strip()
    for label in ("Type D", "Type C", "Type B", "Type A"):
        if text.lower().startswith(label.lower()):
            return label
    return None


def is_food_grade(body_grade: str) -> bool:
    grade = norm(body_grade)
    return grade in {"fda", "un+fda", "unfda"}


def map_bag_design(
    construction: str,
    body_style: str,
    loop_count: int | None,
    override: str | None,
) -> tuple[str | None, str | None]:
    if override:
        name = override.strip()
        known = {row[0] for row in CONVERSION_ROWS}
        if name not in known:
            return None, f"Bag design {name!r} has no conversion table in Book4."
        return name, None

    c = norm(construction)
    style = (body_style or "").strip()

    if c in {"1loop", "1-loop"} or loop_count == 1:
        return "1 Loop", None
    if c == "fusion":
        return "Fusion", None
    if c in {"qbag", "q-bag"}:
        return "Q-Bag", None
    if c == "ventilated" or style == "Ventilated":
        return "Ventilated", None
    if c == "circular":
        return "Circular", None
    if c in {"upanel", "u-panel", "4panel", "4-panel"}:
        return "U+2 Panel", None
    return None, (
        f"Construction {construction!r} has no Book4 bag-design mapping. { _manual()}"
    )


def _manual() -> str:
    from app.services.pricing.book4 import MANUAL

    return MANUAL


def map_loops(design: str, loop_construction: str, loop_pattern: str | None) -> tuple[str | None, str | None]:
    if design == "1 Loop":
        if loop_pattern:
            allowed = {row[1] for row in CONVERSION_ROWS if row[0] == "1 Loop"}
            if loop_pattern not in allowed:
                return None, f"Loop pattern {loop_pattern!r} is not a Book4 1 Loop row."
            return loop_pattern, None
        return "1 Loop", None

    if loop_pattern:
        return loop_pattern, None

    key = (loop_construction or "").strip()
    if key == "Corner":
        return "Corner", None
    if key == "Cross Corner":
        return "X-Corner", None
    return None, (
        f"Loop construction {loop_construction!r} has no Book4 loop mapping. {_manual()}"
    )


def mapped_complications(
    *,
    design: str,
    body_style: str,
    liner_type: str,
    explicit: str | None,
) -> list[str]:
    found: list[str] = []
    if explicit and explicit.strip():
        return [explicit.strip()]
    if (body_style or "").strip() == "Builder":
        found.append("Builder")
    liner = liner_type or ""
    if "Flenze" in liner:
        found.append("With Flenze Shape")
    if liner.strip() == "Suspended" and design == "1 Loop":
        found.append("Suspended Liner")
    # unique preserve order
    out: list[str] = []
    for item in found:
        if item not in out:
            out.append(item)
    return out


def conversion_candidates(design: str, loops: str) -> list[tuple[str, int]]:
    return [(row[2], row[3]) for row in CONVERSION_ROWS if row[0] == design and row[1] == loops]


def conversion_table_key(design: str, loops: str) -> tuple[str, str]:
    """U+2 X-Corner uses the Circular X-Corner table, then +$75/t."""
    if design == "U+2 Panel" and loops == "X-Corner":
        return "Circular", "X-Corner"
    return design, loops


def complication_picker(spec) -> dict:
    """Book4 conversion rows the customer may choose. Labels are sheet text only."""
    from app.schemas.bom import BomCustomerSpec

    if not isinstance(spec, BomCustomerSpec):
        spec = BomCustomerSpec.model_validate(spec)

    empty: dict = {
        "bagDesign": None,
        "loops": None,
        "lookupDesign": None,
        "lookupLoops": None,
        "usesCircularXCornerPlus75": False,
        "needsPicker": False,
        "autoMapped": None,
        "candidates": [],
    }
    if not spec.loop_enabled:
        return empty

    loop_count = None
    raw = (spec.loop_count or "").strip()
    if raw.isdigit():
        loop_count = int(raw)

    design, _err = map_bag_design(spec.construction_type, spec.body_style, loop_count, None)
    if not design:
        return empty
    loops, loop_err = map_loops(design, spec.loop_construction, None)
    if not loops or loop_err:
        return empty

    lookup_design, lookup_loops = conversion_table_key(design, loops)
    rows = conversion_candidates(lookup_design, lookup_loops)
    auto = mapped_complications(
        design=lookup_design,
        body_style=spec.body_style,
        liner_type=spec.liner_type if spec.liner_enabled else "",
        explicit=None,
    )
    return {
        "bagDesign": design,
        "loops": loops,
        "lookupDesign": lookup_design,
        "lookupLoops": lookup_loops,
        "usesCircularXCornerPlus75": design == "U+2 Panel" and loops == "X-Corner",
        "needsPicker": len(rows) > 1,
        "autoMapped": auto[0] if len(auto) == 1 else None,
        "candidates": [{"complication": name, "ratePerTon": rate} for name, rate in rows],
    }


def map_print_column(printing: str) -> tuple[str | None, str | None]:
    raw = (printing or "").strip()
    if not raw or norm(raw) in {"unprinted", "un-printed", "none"}:
        return None, None
    compact = raw.lower().replace(" ", "").replace("-", "")
    column = PRINT_TYPE_MAP.get(compact)
    if column:
        return column, None
    return None, f"Printing {printing!r} has no Book4 matrix column. {_manual()}"
