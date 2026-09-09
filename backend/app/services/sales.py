from datetime import UTC, datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.models import (
    AuditEvent,
    Customer,
    ManualPricingStatus,
    Quote,
    StaffRole,
    StaffUser,
)
from app.schemas import QuoteListItem
from app.services.audit import record_audit
from app.services import quotes as quote_service
from app.services.auth import create_customer
from app.schemas.pricing import PricingOptions


class AccessDenied(PermissionError):
    pass


def staff_name(staff: StaffUser) -> str:
    return f"{staff.first_name} {staff.last_name}".strip()


def can_manage_all_customers(staff: StaffUser) -> bool:
    return staff.role in {StaffRole.ADMIN.value, StaffRole.SALES_MANAGER.value}


def can_create_quotes(staff: StaffUser) -> bool:
    return staff.role in {
        StaffRole.ADMIN.value,
        StaffRole.SALES_MANAGER.value,
        StaffRole.SALES_EXECUTIVE.value,
    }


def can_approve_manual(staff: StaffUser) -> bool:
    return staff.role in {StaffRole.ADMIN.value, StaffRole.PRICING_MANAGER.value}


def assert_customer_access(staff: StaffUser, customer: Customer) -> None:
    if can_manage_all_customers(staff):
        return
    if staff.role == StaffRole.PRICING_MANAGER.value:
        if _customer_has_manual_quote(customer):
            return
        raise AccessDenied("Pricing managers can only access customers with manual-pricing quotations.")
    if customer.assigned_staff_id != staff.id:
        raise AccessDenied("This customer is not assigned to you.")


def assert_quote_access(db: Session, staff: StaffUser, quote: Quote) -> None:
    if can_manage_all_customers(staff):
        return
    if staff.role == StaffRole.PRICING_MANAGER.value:
        if _is_manual_quote(quote):
            return
        raise AccessDenied("Pricing managers can only access quotations that need manual pricing.")
    customer = quote.customer
    if customer is None:
        customer = db.get(Customer, quote.customer_id)
    if customer is None or customer.assigned_staff_id != staff.id:
        raise AccessDenied("This quotation is not assigned to you.")


def _is_manual_quote(quote: Quote) -> bool:
    if quote.manual_pricing_status:
        return True
    snap = quote.pricing_snapshot if isinstance(quote.pricing_snapshot, dict) else {}
    return bool(snap.get("requiresManualPricing")) or snap.get("unitPrice") is None


def _customer_has_manual_quote(customer: Customer) -> bool:
    for quote in customer.quotes or []:
        if _is_manual_quote(quote):
            return True
    return False


def visible_quotes_query(db: Session, staff: StaffUser):
    query = select(Quote).options(
        selectinload(Quote.customer).selectinload(Customer.assigned_staff),
        selectinload(Quote.pricing_snapshots),
        selectinload(Quote.versions),
        selectinload(Quote.status_history),
    )
    if can_manage_all_customers(staff):
        return query
    if staff.role == StaffRole.PRICING_MANAGER.value:
        return query.where(
            or_(
                Quote.manual_pricing_status.is_not(None),
            )
        )
    return query.join(Customer, Quote.customer_id == Customer.id).where(
        Customer.assigned_staff_id == staff.id
    )


def list_customers(db: Session, staff: StaffUser, search: str = "") -> list[Customer]:
    query = select(Customer).options(selectinload(Customer.assigned_staff), selectinload(Customer.quotes))
    if can_manage_all_customers(staff):
        pass
    elif staff.role == StaffRole.PRICING_MANAGER.value:
        query = (
            query.join(Quote, Quote.customer_id == Customer.id)
            .where(Quote.manual_pricing_status.is_not(None))
            .distinct()
        )
    else:
        query = query.where(Customer.assigned_staff_id == staff.id)
    if search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                Customer.company.ilike(term),
                Customer.email.ilike(term),
                Customer.first_name.ilike(term),
                Customer.last_name.ilike(term),
            )
        )
    return list(db.scalars(query.order_by(Customer.company, Customer.email)).unique().all())


def get_customer(db: Session, staff: StaffUser, customer_id: int) -> Customer:
    customer = db.scalar(
        select(Customer)
        .where(Customer.id == customer_id)
        .options(selectinload(Customer.assigned_staff), selectinload(Customer.quotes))
    )
    if customer is None:
        raise LookupError("Customer not found")
    assert_customer_access(staff, customer)
    return customer


def create_sales_customer(
    db: Session,
    staff: StaffUser,
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    company: str = "",
    assigned_staff_id: int | None = None,
) -> Customer:
    if staff.role not in {StaffRole.ADMIN.value, StaffRole.SALES_MANAGER.value}:
        raise AccessDenied("Only managers and admins can create customers.")
    assignee = assigned_staff_id
    if assignee is None and staff.role == StaffRole.SALES_MANAGER.value:
        assignee = None
    customer = create_customer(
        db,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name,
        company=company,
    )
    if assignee is not None:
        customer.assigned_staff_id = assignee
        db.add(customer)
        db.commit()
        db.refresh(customer)
    record_audit(
        db,
        staff=staff,
        action="customer.created",
        entity_type="customer",
        entity_id=customer.id,
        detail=f"Created customer {customer.email}",
        commit=True,
    )
    return customer


def assign_customer(db: Session, staff: StaffUser, customer_id: int, staff_id: int | None) -> Customer:
    if staff.role != StaffRole.ADMIN.value and staff.role != StaffRole.SALES_MANAGER.value:
        raise AccessDenied("Only managers and admins can assign customers.")
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise LookupError("Customer not found")
    if staff_id is not None:
        assignee = db.get(StaffUser, staff_id)
        if assignee is None or assignee.role not in {
            StaffRole.SALES_EXECUTIVE.value,
            StaffRole.SALES_MANAGER.value,
            StaffRole.ADMIN.value,
        }:
            raise AccessDenied("Assignee must be a sales user.")
    customer.assigned_staff_id = staff_id
    db.add(customer)
    record_audit(
        db,
        staff=staff,
        action="customer.assigned",
        entity_type="customer",
        entity_id=customer.id,
        detail=f"Assigned to staff_id={staff_id}",
    )
    db.commit()
    db.refresh(customer)
    return customer


def list_quotes(
    db: Session,
    staff: StaffUser,
    *,
    search: str = "",
    status: str = "",
    customer_id: int | None = None,
    manual_only: bool = False,
) -> list[Quote]:
    query = visible_quotes_query(db, staff)
    if status:
        query = query.where(Quote.status == status)
    if customer_id is not None:
        query = query.where(Quote.customer_id == customer_id)
    if manual_only or staff.role == StaffRole.PRICING_MANAGER.value:
        query = query.where(Quote.manual_pricing_status.is_not(None))
    if search.strip():
        term = f"%{search.strip()}%"
        query = query.where(or_(Quote.number.ilike(term), Quote.product_name.ilike(term)))
    return list(db.scalars(query.order_by(Quote.created_at.desc())).unique().all())


def get_quote(db: Session, staff: StaffUser, quote_id: int) -> Quote:
    quote = db.scalar(
        select(Quote)
        .where(Quote.id == quote_id)
        .options(
            selectinload(Quote.customer).selectinload(Customer.assigned_staff),
            selectinload(Quote.versions),
            selectinload(Quote.status_history),
            selectinload(Quote.pricing_snapshots),
        )
    )
    if quote is None:
        raise LookupError("Quote not found")
    assert_quote_access(db, staff, quote)
    return quote


def create_quote_for_customer(
    db: Session,
    staff: StaffUser,
    customer_id: int,
    specification: dict,
    bom_snapshot: dict | None = None,
    options: PricingOptions | None = None,
) -> Quote:
    if not can_create_quotes(staff):
        raise AccessDenied("Your role cannot create quotations.")
    customer = get_customer(db, staff, customer_id)
    quote = quote_service.create_quote(db, customer, specification, bom_snapshot, options)
    quote.created_by_staff_id = staff.id
    for version in quote.versions:
        if version.version == 1:
            version.created_by_staff_id = staff.id
            version.created_by_name = staff_name(staff)
            db.add(version)
    db.add(quote)
    record_audit(
        db,
        staff=staff,
        action="quote.created",
        entity_type="quote",
        entity_id=quote.id,
        detail=f"Created {quote.number} for {customer.email}",
    )
    db.commit()
    return get_quote(db, staff, quote.id)


def issue_version_for_staff(
    db: Session,
    staff: StaffUser,
    quote_id: int,
    *,
    reason: str,
    specification: dict | None = None,
    bom_snapshot: dict | None = None,
    options: PricingOptions | None = None,
) -> Quote:
    if not can_create_quotes(staff):
        raise AccessDenied("Your role cannot issue a new quotation version.")
    quote = get_quote(db, staff, quote_id)
    updated = quote_service.issue_new_version(
        db,
        quote.customer,
        quote,
        specification,
        bom_snapshot,
        options,
        reason=reason,
        created_by_name=staff_name(staff),
        created_by_staff_id=staff.id,
    )
    record_audit(
        db,
        staff=staff,
        action="quote.version.issued",
        entity_type="quote",
        entity_id=updated.id,
        detail=reason or "New version issued",
        commit=True,
    )
    return get_quote(db, staff, updated.id)


def set_manual_pricing(
    db: Session,
    staff: StaffUser,
    quote: Quote,
    *,
    action: str,
    note: str = "",
) -> Quote:
    from app.models import QuoteStatusHistory

    if not can_approve_manual(staff):
        raise AccessDenied("Only pricing managers and admins can resolve manual pricing.")
    if not _is_manual_quote(quote):
        raise AccessDenied("This quotation does not require manual pricing.")
    if action not in {ManualPricingStatus.APPROVED.value, ManualPricingStatus.RESOLVED.value}:
        raise AccessDenied("Action must be approved or resolved.")
    # Frozen Book4/BOM snapshots are never rewritten.
    quote.manual_pricing_status = action
    quote.manual_pricing_note = note
    quote.manual_pricing_at = datetime.now(UTC)
    quote.manual_pricing_by_id = staff.id
    db.add(quote)
    record_audit(
        db,
        staff=staff,
        action=f"quote.manual_pricing.{action}",
        entity_type="quote",
        entity_id=quote.id,
        detail=note or f"Manual pricing marked {action}",
    )
    db.add(
        QuoteStatusHistory(
            quote_id=quote.id,
            from_status=quote.status,
            to_status=quote.status,
            event=f"Manual pricing {action}",
            detail=note or f"Marked {action} by {staff_name(staff)}",
            event_type="success" if action == ManualPricingStatus.APPROVED.value else "neutral",
        )
    )
    db.commit()
    return get_quote(db, staff, quote.id)


def dashboard(db: Session, staff: StaffUser) -> dict:
    quotes = list_quotes(db, staff)
    pending = [q for q in quotes if q.status in {"quoted", "revision_requested"}]
    manual = [q for q in quotes if q.manual_pricing_status == ManualPricingStatus.PENDING.value]
    accepted = [q for q in quotes if q.status == "accepted"]
    rejected = [q for q in quotes if q.status == "rejected"]
    recent = quotes[:8]
    activity = list(
        db.scalars(
            select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(15)
        ).all()
    )
    if not can_manage_all_customers(staff) and staff.role != StaffRole.PRICING_MANAGER.value:
        ids = {q.id for q in quotes}
        customer_ids = {q.customer_id for q in quotes}
        activity = [
            event
            for event in activity
            if (event.entity_type == "quote" and event.entity_id in ids)
            or (event.entity_type == "customer" and event.entity_id in customer_ids)
            or event.actor_id == staff.id
        ]
    return {
        "greetingName": staff.first_name,
        "role": staff.role,
        "stats": {
            "totalQuotes": str(len(quotes)),
            "pendingActions": str(len(pending)),
            "manualPricing": str(len(manual)),
            "accepted": str(len(accepted)),
            "rejected": str(len(rejected)),
        },
        "pendingQuotes": [_sales_list_item(q) for q in pending[:8]],
        "manualPricingQuotes": [_sales_list_item(q) for q in manual[:8]],
        "acceptedQuotes": [_sales_list_item(q) for q in accepted[:5]],
        "rejectedQuotes": [_sales_list_item(q) for q in rejected[:5]],
        "recentQuotes": [_sales_list_item(q) for q in recent],
        "recentActivity": [
            {
                "at": event.created_at.strftime("%d %b %Y, %H:%M") if event.created_at else "",
                "action": event.action,
                "detail": event.detail,
                "actor": event.actor_email,
            }
            for event in activity[:12]
        ],
    }


def _sales_list_item(quote: Quote) -> QuoteListItem:
    item = quote_service._to_list_item(quote)
    customer = quote.customer
    snap = quote.pricing_snapshot if isinstance(quote.pricing_snapshot, dict) else {}
    return item.model_copy(
        update={
            "company": customer.company if customer else "",
            "customerName": f"{customer.first_name} {customer.last_name}".strip() if customer else "",
            "customerId": str(quote.customer_id),
            "requiresManualPricing": bool(snap.get("requiresManualPricing")) or quote.manual_pricing_status is not None,
            "manualPricingStatus": quote.manual_pricing_status,
        }
    )


def serialize_sales_quote(quote: Quote) -> dict:
    body = quote_service.serialize_quote(quote).model_dump(by_alias=True)
    customer = quote.customer
    assigned = customer.assigned_staff if customer else None
    snap = quote.pricing_snapshot if isinstance(quote.pricing_snapshot, dict) else {}
    errors = snap.get("errors") or []
    warnings = snap.get("warnings") or []
    body.update(
        {
            "customerId": str(quote.customer_id),
            "customerEmail": customer.email if customer else "",
            "assignedStaffId": assigned.id if assigned else None,
            "assignedStaffName": staff_name(assigned) if assigned else None,
            "createdByStaffId": quote.created_by_staff_id,
            "manualPricingStatus": quote.manual_pricing_status,
            "manualPricingNote": quote.manual_pricing_note,
            "manualPricingReasons": [
                err.get("message") if isinstance(err, dict) else str(err) for err in errors
            ],
            "manualPricingWarnings": [str(item) for item in warnings],
        }
    )
    return body
