from __future__ import annotations

from decimal import Decimal

from app.schemas.bom import BomCustomerSpec, BomPreviewResponse
from app.schemas.pricing import (
    PricingIssue,
    PricingLineOut,
    PricingOptions,
    PricingPreviewResponse,
)
from app.services.bom.service import preview_bom
from app.services.pricing.book4 import (
    ADDONS,
    FOOD_LOOP_BLOCK,
    MANUAL,
    MATERIAL_CLASSIFICATION,
    MIN_KG,
    MIN_WEIGHT_MANUAL,
    PE_RM_PER_T,
    PP_RM_PER_T,
    RULE_VERSION,
    PRINT_MATRIX,
    PRINT_QTY_BOUNDARY,
    SURCHARGE_ATTACHMENT_1,
    SURCHARGE_ATTACHMENT_2,
    SURCHARGE_FOOD_GRADE,
    SURCHARGE_SHUTTLE_8,
    SURCHARGE_TWO_LOOP,
    SURCHARGE_USA,
    TYPE_C_EXTRA,
    TYPE_D_MANUAL,
)
from app.services.pricing.kg import classify_bom_kg, d, heading_kg, kg4, money
from app.services.pricing.mapping import (
    bag_type,
    conversion_candidates,
    is_food_grade,
    map_bag_design,
    map_loops,
    map_print_column,
    mapped_complications,
)


def preview_pricing(
    spec: BomCustomerSpec,
    bom: BomPreviewResponse | None = None,
    options: PricingOptions | None = None,
) -> PricingPreviewResponse:
    options = options or PricingOptions()
    if bom is None:
        bom = preview_bom(spec)
    return Book4PricingService().price(spec, bom, options)


class Book4PricingService:
    def price(
        self,
        spec: BomCustomerSpec,
        bom: BomPreviewResponse,
        options: PricingOptions,
    ) -> PricingPreviewResponse:
        errors: list[PricingIssue] = []
        warnings: list[str] = list(bom.warnings or [])
        qty = _quantity(spec, bom)
        pp_kg, pe_kg, total_kg, unclassified_kg, material_lines = classify_bom_kg(bom, spec)
        loop_count = _loop_count(spec)
        if unclassified_kg > 0:
            errors.append(PricingIssue(code="MATERIAL_CLASSIFICATION", message=MATERIAL_CLASSIFICATION))

        pp_mat = pp_kg * d(PP_RM_PER_T) / Decimal("1000")
        pe_mat = pe_kg * d(PE_RM_PER_T) / Decimal("1000")

        design, design_err = map_bag_design(
            spec.construction_type,
            spec.body_style,
            loop_count,
            options.bag_design,
        )
        if design_err:
            errors.append(PricingIssue(code="BAG_DESIGN", message=design_err))

        loops = None
        if design:
            loops, loop_err = map_loops(design, spec.loop_construction, options.loop_pattern)
            if loop_err:
                errors.append(PricingIssue(code="LOOPS", message=loop_err))

        bag_cat = bag_type(spec.product_category)
        food = is_food_grade(spec.body_grade)
        if bag_cat == "Type D":
            errors.append(PricingIssue(code="TYPE_D", message=TYPE_D_MANUAL))

        if food and (design == "1 Loop" or loop_count in {1, 2}):
            errors.append(PricingIssue(code="FOOD_LOOP", message=FOOD_LOOP_BLOCK))

        conversion_rate: int | None = None
        complication_used: str | None = None
        if design and loops and bag_cat != "Type D":
            conversion_rate, complication_used, conv_err = _resolve_conversion(
                design, loops, spec, options
            )
            if conv_err:
                errors.append(PricingIssue(code="CONVERSION", message=conv_err))

        conversion_cost: Decimal | None = None
        if conversion_rate is not None:
            conversion_cost = total_kg * d(conversion_rate) / Decimal("1000")

        min_kg = MIN_KG.get(design or "")
        if min_kg is not None and total_kg < d(min_kg):
            warnings.append(
                f"Bag weight {kg4(total_kg)} kg is below the Book4 minimum of {min_kg} kg "
                f"for {design}. Extra cost is mentioned in Book4 but no amount is given."
            )
            errors.append(
                PricingIssue(
                    code="MIN_WEIGHT",
                    message=MIN_WEIGHT_MANUAL,
                )
            )

        surcharges: list[PricingLineOut] = []
        if options.usa_market:
            surcharges.append(_per_ton_line("USA", "USA market", SURCHARGE_USA, total_kg, qty))
        if food:
            surcharges.append(
                _per_ton_line("FOOD_GRADE", "Food grade", SURCHARGE_FOOD_GRADE, total_kg, qty)
            )
        if options.shuttle_8:
            surcharges.append(
                _per_ton_line("SHUTTLE_8", "8-shuttle loom", SURCHARGE_SHUTTLE_8, total_kg, qty)
            )
        if options.attachment_count == 1:
            surcharges.append(
                _per_ton_line("ATTACHMENT", "1 attachment", SURCHARGE_ATTACHMENT_1, total_kg, qty)
            )
        elif options.attachment_count == 2:
            surcharges.append(
                _per_ton_line("ATTACHMENT", "2 attachments", SURCHARGE_ATTACHMENT_2, total_kg, qty)
            )
        elif options.attachment_count > 2:
            errors.append(
                PricingIssue(
                    code="ATTACHMENT",
                    message=f"Book4 only lists 1 or 2 attachments. {MANUAL}",
                )
            )
        if loop_count == 2:
            surcharges.append(_per_ton_line("TWO_LOOP", "2-loop bag", SURCHARGE_TWO_LOOP, total_kg, qty))

        if bag_cat == "Type C" and design:
            extra = TYPE_C_EXTRA.get(design)
            if extra is None:
                errors.append(
                    PricingIssue(
                        code="TYPE_C",
                        message=f"Type C extra is not listed in Book4 for {design}. {MANUAL}",
                    )
                )
            else:
                surcharges.append(_per_ton_line("TYPE_C", f"Type C ({design})", extra, total_kg, qty))

        addon_lines, addon_errors, addon_warnings = _addons(spec, bom, options, total_kg, pe_kg, pp_kg, qty)
        errors.extend(addon_errors)
        warnings.extend(addon_warnings)

        printing, print_errors = _printing(spec.printing, qty)
        errors.extend(print_errors)

        blocking = {e.code for e in errors}
        numeric_ok = conversion_cost is not None and not blocking.intersection(
            {
                "BAG_DESIGN",
                "LOOPS",
                "CONVERSION",
                "TYPE_D",
                "FOOD_LOOP",
                "TYPE_C",
                "ATTACHMENT",
                "ADDON",
                "PRINT",
                "PRINT_QTY",
                "MATERIAL_CLASSIFICATION",
            }
        )

        unit: Decimal | None = None
        total: Decimal | None = None
        if numeric_ok:
            unit = pp_mat + pe_mat + conversion_cost
            for line in surcharges:
                if line.amount_per_bag is not None:
                    unit += d(line.amount_per_bag)
            for line in addon_lines:
                if line.amount_per_bag is not None:
                    unit += d(line.amount_per_bag)
            if printing and printing.amount_per_bag is not None:
                unit += d(printing.amount_per_bag)
            total = unit * d(qty)

        requires_manual = (not numeric_ok) or ("MIN_WEIGHT" in blocking)

        return PricingPreviewResponse(
            currency="USD",
            source="book4",
            ruleVersion=RULE_VERSION,
            ppRmRate=float(PP_RM_PER_T),
            peRmRate=float(PE_RM_PER_T),
            quantity=qty,
            totalKgPerBag=kg4(total_kg),
            ppKg=kg4(pp_kg),
            peKg=kg4(pe_kg),
            unclassifiedKg=kg4(unclassified_kg),
            materialLines=material_lines,
            bagDesign=design,
            loops=loops,
            complication=complication_used,
            conversionRatePerTon=float(conversion_rate) if conversion_rate is not None else None,
            ppMaterialCost=money(pp_mat),
            peMaterialCost=money(pe_mat),
            conversionCost=money(conversion_cost) if conversion_cost is not None else None,
            surcharges=surcharges,
            addons=addon_lines,
            printing=printing,
            unitPrice=money(unit) if unit is not None else None,
            totalAmount=money(total) if total is not None else None,
            warnings=warnings,
            errors=errors,
            requiresManualPricing=requires_manual,
            priced=unit is not None and not requires_manual,
        )


def _quantity(spec: BomCustomerSpec, bom: BomPreviewResponse) -> int:
    try:
        return int(bom.quantity)
    except (TypeError, ValueError):
        return int(float(spec.quantity or 0))


def _loop_count(spec: BomCustomerSpec) -> int | None:
    raw = (spec.loop_count or "").strip()
    if not raw:
        return None
    try:
        return int(float(raw))
    except ValueError:
        return None


def _resolve_conversion(
    design: str,
    loops: str,
    spec: BomCustomerSpec,
    options: PricingOptions,
) -> tuple[int | None, str | None, str | None]:
    if design == "U+2 Panel" and loops == "X-Corner":
        rate, complication, err = _resolve_conversion("Circular", "X-Corner", spec, options)
        if err or rate is None:
            return None, None, err or f"U+2 Panel X-Corner needs a Circular X-Corner rate. {MANUAL}"
        return rate + 75, f"Circular {complication} + $75/t", None

    rows = conversion_candidates(design, loops)
    if not rows:
        return None, None, f"No Book4 conversion row for {design} / {loops}. {MANUAL}"

    mapped = mapped_complications(
        design=design,
        body_style=spec.body_style,
        liner_type=spec.liner_type if spec.liner_enabled else "",
        explicit=options.complication,
    )
    if len(mapped) > 1:
        return None, None, (
            f"Multiple complications apply ({', '.join(mapped)}); Book4 is one row only. {MANUAL}"
        )
    if len(mapped) == 1:
        wanted = mapped[0]
        for name, rate in rows:
            if name == wanted:
                return rate, name, None
        return None, None, f"No Book4 conversion row for {design} / {loops} / {wanted}. {MANUAL}"

    if len(rows) == 1:
        name, rate = rows[0]
        return rate, name, None

    return None, None, (
        f"Book4 has several conversion rows for {design} / {loops} and no mapped complication. {MANUAL}"
    )


def _per_ton_line(code: str, label: str, rate: float, kg: Decimal, qty: int) -> PricingLineOut:
    per_bag = kg * d(rate) / Decimal("1000")
    return PricingLineOut(
        code=code,
        label=label,
        amountPerBag=money(per_bag),
        amountTotal=money(per_bag * d(qty)),
        unit="per_ton",
        rate=float(rate),
        kg=kg4(kg),
        note=f"{rate} USD/t",
    )


def _addons(
    spec: BomCustomerSpec,
    bom: BomPreviewResponse,
    options: PricingOptions,
    total_kg: Decimal,
    pe_kg: Decimal,
    pp_kg: Decimal,
    qty: int,
) -> tuple[list[PricingLineOut], list[PricingIssue], list[str]]:
    names: list[str] = []
    for item in options.addons:
        if item not in names:
            names.append(item)
    if (spec.loop_type or "").strip() == "MultiFilament" and "MF Webbing" not in names:
        names.append("MF Webbing")
    if spec.liner_enabled and (spec.liner_material or "").strip() == "ALU" and "Alu Liner" not in names:
        names.append("Alu Liner")

    lines: list[PricingLineOut] = []
    errors: list[PricingIssue] = []
    warnings: list[str] = []
    for name in names:
        meta = ADDONS.get(name)
        if meta is None:
            errors.append(PricingIssue(code="ADDON", message=f"Unknown addon {name!r}. {MANUAL}"))
            continue
        if meta["unit"] == "pcs":
            per_bag = d(meta["rate"])
            lines.append(
                PricingLineOut(
                    code="ADDON",
                    label=name,
                    amountPerBag=money(per_bag),
                    amountTotal=money(per_bag * d(qty)),
                    unit="pcs",
                    rate=float(meta["rate"]),
                    note="per piece",
                )
            )
            continue

        kg: Decimal | None
        heading = meta["bom_heading"]
        plus = meta["plus_rm"]
        if heading:
            kg = heading_kg(bom, heading)
            if kg is None:
                errors.append(
                    PricingIssue(
                        code="ADDON",
                        message=f"BOM has no {heading} kg required for addon {name}. {MANUAL}",
                    )
                )
                continue
        elif plus:
            errors.append(
                PricingIssue(
                    code="ADDON",
                    message=f"BOM does not provide a quantity for Plus RM addon {name}. {MANUAL}",
                )
            )
            continue
        else:
            kg = total_kg

        rate = d(meta["rate"])
        per_bag = kg * rate / Decimal("1000")
        note = f"{meta['rate']} USD/t"
        if plus == "PP":
            per_bag += kg * d(PP_RM_PER_T) / Decimal("1000")
            note += f" + PP RM {PP_RM_PER_T} USD/t"
            if kg > 0 and kg <= pp_kg + pe_kg:
                warnings.append(
                    f"{name} Plus RM uses kg that may already be in PP material cost. Book4 does not say to deduct."
                )
        elif plus == "PE":
            per_bag += kg * d(PE_RM_PER_T) / Decimal("1000")
            note += f" + PE RM {PE_RM_PER_T} USD/t"
            if heading == "Liner" and pe_kg > 0:
                warnings.append(
                    f"{name} Plus RM uses liner kg already included in PE/Liner material cost. Book4 does not say to deduct."
                )
        lines.append(
            PricingLineOut(
                code="ADDON",
                label=name,
                amountPerBag=money(per_bag),
                amountTotal=money(per_bag * d(qty)),
                unit="per_ton",
                rate=float(meta["rate"]),
                kg=kg4(kg),
                note=note,
            )
        )
    return lines, errors, warnings


def _printing(printing: str, qty: int) -> tuple[PricingLineOut | None, list[PricingIssue]]:
    column, err = map_print_column(printing)
    if err:
        return None, [PricingIssue(code="PRINT", message=err)]
    if column is None:
        return (
            PricingLineOut(
                code="PRINT",
                label="UnPrinted",
                amountPerBag=0.0,
                amountTotal=0.0,
                unit="pcs",
                rate=0,
                note="No print matrix charge",
            ),
            [],
        )
    if qty == 500:
        return None, [PricingIssue(code="PRINT_QTY", message=PRINT_QTY_BOUNDARY)]
    if qty < 500:
        band = PRINT_MATRIX["lt500"]
        band_name = "<500"
    elif qty > 500:
        band = PRINT_MATRIX["gt500"]
        band_name = ">500"
    else:
        return None, [PricingIssue(code="PRINT_QTY", message=PRINT_QTY_BOUNDARY)]
    cliche = d(band["cliche"])
    print_rate = d(band[column])
    per_bag = cliche + print_rate
    return (
        PricingLineOut(
            code="PRINT",
            label=f"Printing {column} ({band_name})",
            amountPerBag=money(per_bag),
            amountTotal=money(per_bag * d(qty)),
            unit="pcs",
            rate=float(per_bag),
            note=f"Cliché {band['cliche']} + {column} {band[column]}",
        ),
        [],
    )
