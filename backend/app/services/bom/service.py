from __future__ import annotations

from app.schemas.bom import BomCustomerSpec, BomLineOut, BomPreviewResponse
from app.services.bom.calc import populate_calculated_component_values
from app.services.bom.helpers import fmt, qty_of, resolve_bag_type_parts, round4
from app.services.bom.lines import build_derived_lines, calculate_total_kg
from app.services.bom.mapper import map_customer_spec, validate_customer_spec


def preview_bom(spec: BomCustomerSpec) -> BomPreviewResponse:
    validate_customer_spec(spec)
    request = map_customer_spec(spec)
    populate_calculated_component_values(request)
    lines = build_derived_lines(request)
    lines = [line for line in lines if (line.total_kg or 0) > 0]
    total_per_bag = calculate_total_kg(lines)
    qty = qty_of(request)
    total_material = round4(total_per_bag * qty)
    construction, _, _ = resolve_bag_type_parts(request)
    warnings: list[str] = []
    if not any(line.heading == "Body" and (line.total_kg or 0) > 0 for line in lines):
        warnings.append("Body fabric weight could not be calculated for this construction.")
    if spec.loop_enabled and not any(line.heading == "Loop" and (line.total_kg or 0) > 0 for line in lines):
        warnings.append(
            "Loop weight was not calculated. Cross-corner extra is only defined up to 2000 kg SWL, "
            "or use till-bottom loops for U-panel / 4-panel bags."
        )

    return BomPreviewResponse(
        lines=[
            BomLineOut(
                heading=line.heading,
                gsm=line.gsm,
                lamination=line.lamination,
                colour=line.colour,
                fabricSize=line.fabric_size,
                cutSize=line.cut_size,
                totalMtr=float(line.total_mtr) if line.total_mtr is not None else None,
                totalKg=float(line.total_kg) if line.total_kg is not None else None,
                remarks=line.remarks,
            )
            for line in lines
        ],
        totalKgPerBag=float(total_per_bag),
        totalMaterialKg=float(total_material),
        quantity=float(qty),
        construction=construction,
        sizeType=request.header.size_type,
        dimensions=f"{fmt(request.header.size_l)} × {fmt(request.header.size_w)} × {fmt(request.header.size_h)} cm",
        warnings=warnings,
        source="erp-port",
    )
