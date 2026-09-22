from __future__ import annotations

from copy import deepcopy

from app.services.pricing.book4 import CONVERSION_ROWS, default_book_payload


def conversion_tuples(rows: list[dict] | list[tuple] | None = None) -> list[tuple[str, str, str, int]]:
    if not rows:
        return list(CONVERSION_ROWS)
    out: list[tuple[str, str, str, int]] = []
    for row in rows:
        if isinstance(row, dict):
            out.append(
                (
                    str(row.get("design") or "").strip(),
                    str(row.get("loops") or "").strip(),
                    str(row.get("complication") or "").strip(),
                    int(float(row.get("rate") or 0)),
                )
            )
        else:
            out.append((str(row[0]), str(row[1]), str(row[2]), int(row[3])))
    return [item for item in out if item[0] and item[1]]


class BookRates:
    def __init__(self, payload: dict | None = None) -> None:
        base = default_book_payload()
        data = deepcopy(base)
        if payload:
            data.update(deepcopy(payload))
            for key in ("surcharges", "typeCExtra", "minKg", "printMatrix", "printTypeMap"):
                if key in payload and isinstance(payload[key], dict):
                    merged = deepcopy(base[key])
                    merged.update(payload[key])
                    data[key] = merged
            if "conversionRows" in payload:
                data["conversionRows"] = deepcopy(payload["conversionRows"])
            if "addons" in payload:
                data["addons"] = deepcopy(payload["addons"])
        self.payload = data
        self.rule_version = str(data.get("ruleVersion") or base["ruleVersion"])
        platts = float(data.get("ppPlatts") if data.get("ppPlatts") is not None else base["ppPlatts"])
        fob = float(data.get("ppFob") if data.get("ppFob") is not None else base["ppFob"])
        uv = float(data.get("ppUv") if data.get("ppUv") is not None else base["ppUv"])
        self.pp_rm_per_t = platts + fob + uv
        self.pe_rm_per_t = float(data.get("peRmPerT") if data.get("peRmPerT") is not None else base["peRmPerT"])
        self.u_panel_x_corner_extra = int(float(data.get("uPanelXCornerExtra") or 75))
        surcharges = data.get("surcharges") or base["surcharges"]
        self.surcharge_usa = float(surcharges.get("usa", 75))
        self.surcharge_food_grade = float(surcharges.get("foodGrade", 250))
        self.surcharge_shuttle_8 = float(surcharges.get("shuttle8", 50))
        self.surcharge_attachment_1 = float(surcharges.get("attachment1", 100))
        self.surcharge_attachment_2 = float(surcharges.get("attachment2", 150))
        self.surcharge_two_loop = float(surcharges.get("twoLoop", 50))
        self.type_c_extra = {str(k): float(v) for k, v in (data.get("typeCExtra") or {}).items()}
        self.min_kg = {str(k): float(v) for k, v in (data.get("minKg") or {}).items()}
        self.conversion_rows = conversion_tuples(data.get("conversionRows"))
        self.print_matrix = data.get("printMatrix") or base["printMatrix"]
        self.print_type_map = data.get("printTypeMap") or base["printTypeMap"]
        self.addons: dict[str, dict] = {}
        for item in data.get("addons") or []:
            if not isinstance(item, dict) or not item.get("name"):
                continue
            name = str(item["name"]).strip()
            self.addons[name] = {
                "rate": float(item.get("rate") or 0),
                "unit": str(item.get("unit") or "pcs"),
                "plus_rm": item.get("plusRm") or item.get("plus_rm"),
                "bom_heading": item.get("bomHeading") or item.get("bom_heading"),
            }


def validate_book_payload(payload: dict) -> list[str]:
    errors: list[str] = []
    if not isinstance(payload, dict):
        return ["Pricing book must be an object."]
    rows = payload.get("conversionRows")
    if rows is not None:
        if not isinstance(rows, list) or not rows:
            errors.append("Add at least one conversion row.")
        else:
            for index, row in enumerate(rows, start=1):
                if not isinstance(row, dict):
                    errors.append(f"Conversion row {index} is invalid.")
                    continue
                if not str(row.get("design") or "").strip():
                    errors.append(f"Conversion row {index} needs a bag design.")
                if not str(row.get("loops") or "").strip():
                    errors.append(f"Conversion row {index} needs a loop type.")
                if not str(row.get("complication") or "").strip():
                    errors.append(f"Conversion row {index} needs a complication / formula name.")
                try:
                    float(row.get("rate"))
                except (TypeError, ValueError):
                    errors.append(f"Conversion row {index} needs a numeric USD/t rate.")
    addons = payload.get("addons")
    if addons is not None:
        if not isinstance(addons, list):
            errors.append("Add-ons must be a list.")
        else:
            for index, item in enumerate(addons, start=1):
                if not isinstance(item, dict) or not str(item.get("name") or "").strip():
                    errors.append(f"Add-on {index} needs a name.")
                    continue
                unit = str(item.get("unit") or "")
                if unit not in {"pcs", "per_ton"}:
                    errors.append(f"Add-on {item.get('name')} unit must be pcs or per_ton.")
                try:
                    float(item.get("rate"))
                except (TypeError, ValueError):
                    errors.append(f"Add-on {item.get('name')} needs a numeric rate.")
    matrix = payload.get("printMatrix")
    if matrix is not None:
        if not isinstance(matrix, dict) or "lt500" not in matrix or "gt500" not in matrix:
            errors.append("Print matrix needs lt500 and gt500 bands.")
    return errors
