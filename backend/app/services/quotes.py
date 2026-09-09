from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    Customer,
    ManualPricingStatus,
    PricingSnapshot,
    Quote,
    QuoteStatus,
    QuoteStatusHistory,
    QuoteVersion,
)
from app.schemas import (
    PricingSummary,
    QuoteListItem,
    QuoteSpecification,
    TimelineEvent,
    QuoteDetail,
    QuoteVersionOut,
    DashboardResponse,
    DashboardStats,
)
from app.schemas.bom import BomCustomerSpec, BomPreviewResponse
from app.schemas.pricing import PricingOptions, PricingPreviewResponse
from app.services.bom.service import preview_bom
from app.services.pricing.service import preview_pricing

_ACTIONABLE = {QuoteStatus.QUOTED.value}
_SENDABLE = {QuoteStatus.QUOTED.value, QuoteStatus.REVISION_REQUESTED.value}


def _book4_price(
    specification: dict,
    bom_snapshot: dict | None = None,
    options: PricingOptions | None = None,
) -> tuple[BomPreviewResponse, PricingPreviewResponse]:
    spec = BomCustomerSpec.model_validate(specification)
    if bom_snapshot:
        bom = BomPreviewResponse.model_validate(bom_snapshot)
    else:
        bom = preview_bom(spec)
    priced = preview_pricing(spec, bom, options or PricingOptions())
    return bom, priced


def preview_quote(specification: QuoteSpecification) -> tuple[PricingSummary, dict]:
    payload = specification.model_dump(by_alias=True)
    _bom, priced = _book4_price(payload)
    snapshot = priced.model_dump(mode="json", by_alias=True)
    return _summary_from_priced(priced), snapshot


def list_quotes(db: Session, customer: Customer) -> list[QuoteListItem]:
    quotes = db.scalars(
        select(Quote)
        .where(Quote.customer_id == customer.id)
        .order_by(Quote.created_at.desc())
        .options(selectinload(Quote.pricing_snapshots))
    ).all()
    return [_to_list_item(quote) for quote in quotes]


def get_quote(db: Session, customer: Customer, quote_id: int) -> Quote | None:
    quote = db.scalar(
        select(Quote)
        .where(Quote.id == quote_id, Quote.customer_id == customer.id)
        .options(
            selectinload(Quote.versions),
            selectinload(Quote.status_history),
            selectinload(Quote.pricing_snapshots),
            selectinload(Quote.customer),
        )
    )
    return quote


def create_quote(
    db: Session,
    customer: Customer,
    specification: dict,
    bom_snapshot: dict | None = None,
    options: PricingOptions | None = None,
) -> Quote:
    spec_data = dict(specification)
    bom, priced = _book4_price(spec_data, bom_snapshot, options)
    bom_payload = bom.model_dump(mode="json", by_alias=True)
    pricing_payload = priced.model_dump(mode="json", by_alias=True)
    legacy = QuoteSpecification.model_validate(spec_data)
    quote = Quote(
        number=_next_quote_number(db),
        customer_id=customer.id,
        status=QuoteStatus.QUOTED.value,
        product_name=_product_name(legacy),
        specification=spec_data,
        bom_snapshot=bom_payload,
        pricing_snapshot=pricing_payload,
        valid_until=datetime.now(UTC) + timedelta(days=20),
        manual_pricing_status=ManualPricingStatus.PENDING.value if priced.requires_manual_pricing else None,
    )
    db.add(quote)
    db.flush()

    version = QuoteVersion(
        quote_id=quote.id,
        version=1,
        status=QuoteStatus.QUOTED.value,
        specification=spec_data,
        bom_snapshot=bom_payload,
        pricing_snapshot=pricing_payload,
        quantity=priced.quantity,
        unit_price=priced.unit_price,
        total_amount=priced.total_amount,
        rule_version=priced.rule_version,
        created_by_name=f"{customer.first_name} {customer.last_name}".strip(),
        note=None,
        is_current=True,
    )
    db.add(version)
    db.flush()

    db.add(
        PricingSnapshot(
            quote_id=quote.id,
            quote_version_id=version.id,
            currency=priced.currency,
            unit_price=priced.unit_price,
            quantity=priced.quantity,
            total_amount=priced.total_amount,
            total_kg=priced.total_kg_per_bag,
            source=priced.source,
            rule_version=priced.rule_version,
            breakdown=pricing_payload,
        )
    )
    event_detail = f"Formal quotation sent to {customer.email}"
    if priced.requires_manual_pricing:
        reasons = "; ".join(err.message for err in priced.errors) or "Manual pricing required."
        event_detail = f"Quotation stored with BOM. {reasons}"
    db.add(
        QuoteStatusHistory(
            quote_id=quote.id,
            from_status=None,
            to_status=QuoteStatus.QUOTED.value,
            event="Quotation issued" if priced.priced else "Quotation stored — manual pricing required",
            detail=event_detail,
            event_type="success" if priced.priced else "warning",
        )
    )
    db.commit()
    db.refresh(quote)
    return get_quote(db, customer, quote.id)  # type: ignore[return-value]


def accept_quote(db: Session, customer: Customer, quote: Quote) -> Quote:
    return _transition(
        db,
        customer,
        quote,
        QuoteStatus.ACCEPTED.value,
        event="Quotation accepted",
        detail=f"Accepted by {customer.first_name} {customer.last_name}",
        event_type="success",
    )


def reject_quote(db: Session, customer: Customer, quote: Quote, message: str) -> Quote:
    return _transition(
        db,
        customer,
        quote,
        QuoteStatus.REJECTED.value,
        event="Quotation declined",
        detail=message,
        event_type="error",
        note=message,
    )


def request_revision(db: Session, customer: Customer, quote: Quote, message: str) -> Quote:
    return _transition(
        db,
        customer,
        quote,
        QuoteStatus.REVISION_REQUESTED.value,
        event="Revision requested",
        detail=message,
        event_type="warning",
        note=message,
        new_version=False,
    )


def issue_new_version(
    db: Session,
    customer: Customer,
    quote: Quote,
    specification: dict | None = None,
    bom_snapshot: dict | None = None,
    options: PricingOptions | None = None,
    *,
    reason: str,
    created_by_name: str,
    created_by_staff_id: int | None = None,
) -> Quote:
    if quote.status not in {QuoteStatus.QUOTED.value, QuoteStatus.REVISION_REQUESTED.value}:
        raise PermissionError("A new version can only be issued while the quotation is quoted or awaiting revision.")
    if not reason.strip():
        raise PermissionError("A revision reason is required.")
    spec_data = dict(specification or quote.specification or {})
    from_status = quote.status
    bom, priced = _book4_price(spec_data, bom_snapshot, options)
    bom_payload = bom.model_dump(mode="json", by_alias=True)
    pricing_payload = priced.model_dump(mode="json", by_alias=True)
    next_number = max((item.version for item in quote.versions), default=0) + 1
    for item in quote.versions:
        item.is_current = False
        db.add(item)
    version = QuoteVersion(
        quote_id=quote.id,
        version=next_number,
        status=QuoteStatus.QUOTED.value,
        specification=spec_data,
        bom_snapshot=bom_payload,
        pricing_snapshot=pricing_payload,
        quantity=priced.quantity,
        unit_price=priced.unit_price,
        total_amount=priced.total_amount,
        rule_version=priced.rule_version,
        created_by_staff_id=created_by_staff_id,
        created_by_name=created_by_name,
        note=reason.strip(),
        is_current=True,
    )
    db.add(version)
    db.flush()
    db.add(
        PricingSnapshot(
            quote_id=quote.id,
            quote_version_id=version.id,
            currency=priced.currency,
            unit_price=priced.unit_price,
            quantity=priced.quantity,
            total_amount=priced.total_amount,
            total_kg=priced.total_kg_per_bag,
            source=priced.source,
            rule_version=priced.rule_version,
            breakdown=pricing_payload,
        )
    )
    # Live quote pointer moves to the new freeze. Historical version rows are never rewritten.
    quote.specification = spec_data
    quote.bom_snapshot = bom_payload
    quote.pricing_snapshot = pricing_payload
    quote.product_name = _product_name(QuoteSpecification.model_validate(spec_data))
    quote.status = QuoteStatus.QUOTED.value
    quote.manual_pricing_status = (
        ManualPricingStatus.PENDING.value if priced.requires_manual_pricing else None
    )
    quote.manual_pricing_note = None
    db.add(quote)
    db.add(
        QuoteStatusHistory(
            quote_id=quote.id,
            from_status=from_status,
            to_status=QuoteStatus.QUOTED.value,
            event=f"Version {next_number} issued",
            detail=reason or f"Issued V{next_number}",
            event_type="success",
        )
    )
    db.commit()
    return get_quote(db, customer, quote.id)  # type: ignore[return-value]


def current_version(quote: Quote) -> QuoteVersion | None:
    current = [item for item in quote.versions if item.is_current]
    if current:
        return max(current, key=lambda item: item.version)
    if not quote.versions:
        return None
    return max(quote.versions, key=lambda item: item.version)


def serialize_version(version: QuoteVersion) -> QuoteVersionOut:
    snap = version.pricing_snapshot if isinstance(version.pricing_snapshot, dict) else {}
    return QuoteVersionOut(
        id=str(version.id),
        version=version.version,
        status=version.status,
        createdAt=_fmt(version.created_at),
        note=version.note,
        quantity=version.quantity if version.quantity is not None else snap.get("quantity"),
        unitPrice=float(version.unit_price) if version.unit_price is not None else snap.get("unitPrice"),
        totalAmount=float(version.total_amount) if version.total_amount is not None else snap.get("totalAmount"),
        ruleVersion=version.rule_version or str(snap.get("ruleVersion") or "book4-16-04-26"),
        createdByName=version.created_by_name or "",
        isCurrent=bool(version.is_current),
        requiresManualPricing=bool(snap.get("requiresManualPricing")),
        bomSnapshot=version.bom_snapshot,
        pricingSnapshot=version.pricing_snapshot,
        specification=version.specification,
    )


def compare_versions(quote: Quote, from_version: int, to_version: int) -> dict:
    by_number = {item.version: item for item in quote.versions}
    left = by_number.get(from_version)
    right = by_number.get(to_version)
    if left is None or right is None:
        raise LookupError("Version not found")
    left_out = serialize_version(left)
    right_out = serialize_version(right)
    return {
        "from": left_out.model_dump(by_alias=True),
        "to": right_out.model_dump(by_alias=True),
        "changes": {
            "quantity": {"from": left_out.quantity, "to": right_out.quantity},
            "unitPrice": {"from": left_out.unit_price, "to": right_out.unit_price},
            "totalAmount": {"from": left_out.total_amount, "to": right_out.total_amount},
            "ruleVersion": {"from": left_out.rule_version, "to": right_out.rule_version},
            "status": {"from": left_out.status, "to": right_out.status},
            "requiresManualPricing": {
                "from": left_out.requires_manual_pricing,
                "to": right_out.requires_manual_pricing,
            },
        },
    }


def dashboard(db: Session, customer: Customer) -> DashboardResponse:
    items = list_quotes(db, customer)
    pending = next((item for item in items if item.status == QuoteStatus.QUOTED.value), None)
    in_progress = sum(
        1
        for item in items
        if item.status in {QuoteStatus.QUOTED.value, QuoteStatus.REVISION_REQUESTED.value}
    )
    return DashboardResponse(
        greetingName=customer.first_name,
        dateLabel=datetime.now(UTC).strftime("%A, %d %B %Y"),
        stats=DashboardStats(
            quotesThisMonth=str(len(items)),
            quotesThisMonthDelta="Current account",
            inProgress=str(in_progress),
            inProgressDelta="Awaiting action",
            totalSpentYtd="—",
            totalSpentDelta="Priced quotes only",
        ),
        recentQuotes=items[:5],
        pendingQuote=pending,
    )


def serialize_quote(quote: Quote) -> QuoteDetail:
    row = _latest_snapshot(quote)
    spec_payload = dict(quote.specification) if isinstance(quote.specification, dict) else {}
    if getattr(quote, "bom_snapshot", None) and "bomSnapshot" not in spec_payload:
        spec_payload["bomSnapshot"] = quote.bom_snapshot
    customer = quote.customer
    frozen = quote.pricing_snapshot if isinstance(quote.pricing_snapshot, dict) else None
    if frozen is None and row is not None and isinstance(row.breakdown, dict):
        frozen = row.breakdown
    pricing = _summary_from_row(row, frozen)
    assigned = getattr(customer, "assigned_staff", None)
    errors = (frozen or {}).get("errors") or []
    warnings = (frozen or {}).get("warnings") or []
    return QuoteDetail(
        id=str(quote.id),
        number=quote.number,
        status=quote.status,
        productName=quote.product_name,
        createdAt=_fmt(quote.created_at),
        validUntil=_fmt(quote.valid_until) if quote.valid_until else None,
        leadTime=quote.lead_time,
        paymentTerms=quote.payment_terms,
        requestedBy=f"{customer.first_name} {customer.last_name}",
        company=customer.company,
        specification=spec_payload,
        bomSnapshot=quote.bom_snapshot,
        pricingSnapshot=frozen,
        pricing=pricing,
        timeline=[
            TimelineEvent(
                at=_fmt(event.created_at, with_time=True),
                event=event.event,
                detail=event.detail,
                type=event.event_type,
            )
            for event in sorted(quote.status_history, key=lambda item: item.created_at, reverse=True)
        ],
        versions=[serialize_version(version) for version in sorted(quote.versions, key=lambda item: item.version)],
        currentVersion=(current_version(quote).version if current_version(quote) else 1),
        customerId=str(quote.customer_id),
        customerEmail=customer.email,
        assignedStaffId=assigned.id if assigned else None,
        assignedStaffName=f"{assigned.first_name} {assigned.last_name}".strip() if assigned else None,
        createdByStaffId=quote.created_by_staff_id,
        manualPricingStatus=quote.manual_pricing_status,
        manualPricingNote=quote.manual_pricing_note,
        manualPricingReasons=[
            err.get("message") if isinstance(err, dict) else str(err) for err in errors
        ],
        manualPricingWarnings=[str(item) for item in warnings],
    )


def assert_actionable(quote: Quote) -> None:
    if quote.status not in _ACTIONABLE:
        raise PermissionError("This quotation can no longer be updated.")


def assert_sendable(quote: Quote) -> None:
    if quote.status not in _SENDABLE:
        raise PermissionError("Only the latest active version can be sent to the customer.")


def _transition(
    db: Session,
    customer: Customer,
    quote: Quote,
    to_status: str,
    *,
    event: str,
    detail: str,
    event_type: str,
    note: str | None = None,
    new_version: bool = False,
) -> Quote:
    assert_actionable(quote)
    from_status = quote.status
    quote.status = to_status
    # Historical BOM/pricing JSON is never rewritten. Status on the current version is updated in place.
    live = current_version(quote)
    if live is not None:
        live.status = to_status
        db.add(live)
    next_version = (max((item.version for item in quote.versions), default=0) + 1) if new_version else None
    if new_version:
        version = QuoteVersion(
            quote_id=quote.id,
            version=next_version or 1,
            status=to_status,
            specification=quote.specification,
            note=note,
        )
        db.add(version)
    db.add(
        QuoteStatusHistory(
            quote_id=quote.id,
            from_status=from_status,
            to_status=to_status,
            event=event,
            detail=detail,
            event_type=event_type,
        )
    )
    db.commit()
    return get_quote(db, customer, quote.id)  # type: ignore[return-value]


def _summary_from_priced(priced: PricingPreviewResponse) -> PricingSummary:
    return PricingSummary(
        currency=priced.currency,
        unitPrice=priced.unit_price,
        quantity=priced.quantity,
        totalAmount=priced.total_amount,
        totalKg=priced.total_kg_per_bag,
        requiresManualPricing=priced.requires_manual_pricing,
    )


def _summary_from_row(row, frozen: dict | None) -> PricingSummary:
    if frozen:
        return PricingSummary(
            currency=str(frozen.get("currency") or "USD"),
            unitPrice=frozen.get("unitPrice"),
            quantity=int(frozen.get("quantity") or 0),
            totalAmount=frozen.get("totalAmount"),
            totalKg=float(frozen.get("totalKgPerBag") or 0),
            requiresManualPricing=bool(frozen.get("requiresManualPricing")),
        )
    if row is None:
        return PricingSummary(
            currency="USD",
            unitPrice=None,
            quantity=0,
            totalAmount=None,
            totalKg=0,
            requiresManualPricing=True,
        )
    return PricingSummary(
        currency=row.currency,
        unitPrice=float(row.unit_price) if row.unit_price is not None else None,
        quantity=row.quantity,
        totalAmount=float(row.total_amount) if row.total_amount is not None else None,
        totalKg=float(row.total_kg),
        requiresManualPricing=row.unit_price is None,
    )


def _price(specification: QuoteSpecification) -> PricingSummary:
    summary, _snapshot = preview_quote(specification)
    return summary


def _next_quote_number(db: Session) -> str:
    year = datetime.now(UTC).year
    prefix = f"QT-{year}-"
    last = db.scalar(select(func.max(Quote.number)).where(Quote.number.like(f"{prefix}%")))
    seq = 1
    if last:
        seq = int(last.split("-")[-1]) + 1
    return f"{prefix}{seq:04d}"


def _product_name(specification: QuoteSpecification) -> str:
    return f"{specification.product_type} — {specification.product_category}"


def _to_list_item(quote: Quote) -> QuoteListItem:
    snapshot = _latest_snapshot(quote)
    frozen = quote.pricing_snapshot if isinstance(quote.pricing_snapshot, dict) else {}
    manual = bool(frozen.get("requiresManualPricing")) or bool(quote.manual_pricing_status)
    if not manual and snapshot is not None:
        manual = snapshot.unit_price is None
    amount = None
    if not manual and snapshot is not None and snapshot.total_amount is not None:
        amount = float(snapshot.total_amount)
    return QuoteListItem(
        id=str(quote.id),
        number=quote.number,
        productName=quote.product_name,
        date=_fmt(quote.created_at),
        quantity=snapshot.quantity if snapshot else 0,
        amount=amount,
        status=quote.status,
        requiresManualPricing=manual,
        manualPricingStatus=quote.manual_pricing_status,
    )


def _latest_snapshot(quote: Quote):
    snapshots = sorted(quote.pricing_snapshots, key=lambda item: item.created_at, reverse=True)
    return snapshots[0] if snapshots else None


def _fmt(value: datetime | None, with_time: bool = False) -> str:
    if value is None:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    if with_time:
        return value.strftime("%d %b %Y, %H:%M")
    return value.strftime("%d %b %Y")
