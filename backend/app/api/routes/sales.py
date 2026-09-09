from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.api.deps import require_staff
from app.db.session import get_db
from app.models import StaffRole, StaffUser
from app.schemas import QuoteActionRequest, QuoteCreateRequest, QuoteDetail, QuoteListItem
from app.schemas.pricing import PricingOptions
from app.services.email import SmtpNotConfiguredError, send_quote_email
from app.services.pdf import render_quote_pdf
from app.services import quotes as quote_service
from app.services.sales import (
    AccessDenied,
    assign_customer,
    create_quote_for_customer,
    create_sales_customer,
    dashboard,
    get_customer,
    get_quote,
    issue_version_for_staff,
    list_customers,
    list_quotes,
    serialize_sales_quote,
    set_manual_pricing,
    staff_name,
)

router = APIRouter(prefix="/sales", tags=["sales"])


class SalesCustomerOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    id: str
    email: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    company: str
    phone: str = ""
    city: str = ""
    assigned_staff_id: int | None = Field(default=None, alias="assignedStaffId")
    assigned_staff_name: str | None = Field(default=None, alias="assignedStaffName")
    quote_count: int = Field(default=0, alias="quoteCount")


class SalesCustomerCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str
    password: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    company: str = ""
    assigned_staff_id: int | None = Field(default=None, alias="assignedStaffId")


class AssignRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    staff_id: int | None = Field(default=None, alias="staffId")


class SalesQuoteCreate(QuoteCreateRequest):
    customer_id: int = Field(alias="customerId")

    model_config = ConfigDict(populate_by_name=True)


class IssueVersionRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    reason: str = Field(min_length=1)
    specification: dict | None = None
    bom_snapshot: dict | None = Field(default=None, alias="bomSnapshot")
    options: PricingOptions | None = None


class ManualPricingRequest(BaseModel):
    action: str
    note: str = ""


def _http_from_access(exc: Exception) -> HTTPException:
    if isinstance(exc, LookupError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, AccessDenied):
        return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


def _customer_out(customer) -> SalesCustomerOut:
    assigned = customer.assigned_staff
    return SalesCustomerOut(
        id=str(customer.id),
        email=customer.email,
        firstName=customer.first_name,
        lastName=customer.last_name,
        company=customer.company,
        phone=customer.phone,
        city=customer.city,
        assignedStaffId=customer.assigned_staff_id,
        assignedStaffName=staff_name(assigned) if assigned else None,
        quoteCount=len(customer.quotes or []),
    )


@router.get("/assignees", response_model=list[dict])
def sales_assignees(
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(StaffRole.SALES_MANAGER.value, StaffRole.ADMIN.value)
    ),
) -> list[dict]:
    from sqlalchemy import select

    rows = db.scalars(
        select(StaffUser).where(
            StaffUser.role.in_(
                [
                    StaffRole.SALES_EXECUTIVE.value,
                    StaffRole.SALES_MANAGER.value,
                    StaffRole.ADMIN.value,
                ]
            ),
            StaffUser.is_active.is_(True),
        )
    ).all()
    return [
        {
            "id": item.id,
            "email": item.email,
            "firstName": item.first_name,
            "lastName": item.last_name,
            "role": item.role,
        }
        for item in rows
    ]


@router.get("/dashboard")
def sales_dashboard(
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> dict:
    return dashboard(db, staff)


@router.get("/customers", response_model=list[SalesCustomerOut])
def sales_customers(
    search: str = "",
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> list[SalesCustomerOut]:
    return [_customer_out(item) for item in list_customers(db, staff, search)]


@router.post("/customers", response_model=SalesCustomerOut, status_code=status.HTTP_201_CREATED)
def sales_create_customer(
    payload: SalesCustomerCreate,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(StaffRole.SALES_MANAGER.value, StaffRole.ADMIN.value)
    ),
) -> SalesCustomerOut:
    try:
        customer = create_sales_customer(
            db,
            staff,
            email=payload.email,
            password=payload.password,
            first_name=payload.first_name,
            last_name=payload.last_name,
            company=payload.company,
            assigned_staff_id=payload.assigned_staff_id,
        )
    except (AccessDenied, LookupError, ValueError) as exc:
        raise _http_from_access(exc) from exc
    return _customer_out(customer)


@router.get("/customers/{customer_id}", response_model=SalesCustomerOut)
def sales_customer_detail(
    customer_id: int,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> SalesCustomerOut:
    try:
        customer = get_customer(db, staff, customer_id)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return _customer_out(customer)


@router.get("/customers/{customer_id}/quotes", response_model=list[QuoteListItem])
def sales_customer_quotes(
    customer_id: int,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> list[QuoteListItem]:
    try:
        get_customer(db, staff, customer_id)
        quotes = list_quotes(db, staff, customer_id=customer_id)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    from app.services.sales import _sales_list_item

    return [_sales_list_item(item) for item in quotes]


@router.post("/customers/{customer_id}/assign", response_model=SalesCustomerOut)
def sales_assign_customer(
    customer_id: int,
    payload: AssignRequest,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(StaffRole.SALES_MANAGER.value, StaffRole.ADMIN.value)
    ),
) -> SalesCustomerOut:
    try:
        customer = assign_customer(db, staff, customer_id, payload.staff_id)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return _customer_out(customer)


@router.get("/quotes", response_model=list[QuoteListItem])
def sales_quotes(
    search: str = "",
    status_filter: str = Query("", alias="status"),
    customer_id: int | None = Query(default=None, alias="customerId"),
    manual_only: bool = Query(False, alias="manualOnly"),
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> list[QuoteListItem]:
    from app.services.sales import _sales_list_item

    quotes = list_quotes(
        db,
        staff,
        search=search,
        status=status_filter,
        customer_id=customer_id,
        manual_only=manual_only,
    )
    return [_sales_list_item(item) for item in quotes]


@router.post("/quotes", status_code=status.HTTP_201_CREATED)
def sales_create_quote(
    payload: SalesQuoteCreate,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(
            StaffRole.SALES_EXECUTIVE.value,
            StaffRole.SALES_MANAGER.value,
            StaffRole.ADMIN.value,
        )
    ),
) -> dict:
    try:
        quote = create_quote_for_customer(
            db,
            staff,
            payload.customer_id,
            payload.specification,
            payload.bom_snapshot,
            payload.options,
        )
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return serialize_sales_quote(quote)


@router.get("/quotes/{quote_id}")
def sales_quote_detail(
    quote_id: int,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> dict:
    try:
        quote = get_quote(db, staff, quote_id)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return serialize_sales_quote(quote)


@router.get("/quotes/{quote_id}/pdf")
def sales_quote_pdf(
    quote_id: int,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> Response:
    try:
        quote = get_quote(db, staff, quote_id)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    payload = render_quote_pdf(quote)
    return Response(
        content=payload,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{quote.number}.pdf"'},
    )


@router.post("/quotes/{quote_id}/email")
def sales_quote_email(
    quote_id: int,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> dict[str, bool]:
    try:
        quote = get_quote(db, staff, quote_id)
        quote_service.assert_sendable(quote)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    pdf = render_quote_pdf(quote)
    try:
        send_quote_email(quote, pdf)
    except SmtpNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send the quotation email.",
        ) from exc
    return {"sent": True}


@router.post("/quotes/{quote_id}/accept", response_model=QuoteDetail)
def sales_accept(
    quote_id: int,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(
            StaffRole.SALES_EXECUTIVE.value,
            StaffRole.SALES_MANAGER.value,
            StaffRole.ADMIN.value,
        )
    ),
) -> QuoteDetail:
    try:
        quote = get_quote(db, staff, quote_id)
        updated = quote_service.accept_quote(db, quote.customer, quote)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return quote_service.serialize_quote(updated)


@router.post("/quotes/{quote_id}/reject", response_model=QuoteDetail)
def sales_reject(
    quote_id: int,
    payload: QuoteActionRequest,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(
            StaffRole.SALES_EXECUTIVE.value,
            StaffRole.SALES_MANAGER.value,
            StaffRole.ADMIN.value,
        )
    ),
) -> QuoteDetail:
    try:
        quote = get_quote(db, staff, quote_id)
        updated = quote_service.reject_quote(db, quote.customer, quote, payload.message)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return quote_service.serialize_quote(updated)


@router.post("/quotes/{quote_id}/revision", response_model=QuoteDetail)
def sales_revision(
    quote_id: int,
    payload: QuoteActionRequest,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(
            StaffRole.SALES_EXECUTIVE.value,
            StaffRole.SALES_MANAGER.value,
            StaffRole.ADMIN.value,
        )
    ),
) -> QuoteDetail:
    try:
        quote = get_quote(db, staff, quote_id)
        updated = quote_service.request_revision(db, quote.customer, quote, payload.message)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return quote_service.serialize_quote(updated)


@router.post("/quotes/{quote_id}/manual-pricing")
def sales_manual_pricing(
    quote_id: int,
    payload: ManualPricingRequest,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(StaffRole.PRICING_MANAGER.value, StaffRole.ADMIN.value)
    ),
) -> dict:
    try:
        quote = get_quote(db, staff, quote_id)
        updated = set_manual_pricing(db, staff, quote, action=payload.action, note=payload.note)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return serialize_sales_quote(updated)


@router.post("/quotes/{quote_id}/versions")
def sales_issue_version(
    quote_id: int,
    payload: IssueVersionRequest,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(
        require_staff(
            StaffRole.SALES_EXECUTIVE.value,
            StaffRole.SALES_MANAGER.value,
            StaffRole.ADMIN.value,
        )
    ),
) -> dict:
    try:
        updated = issue_version_for_staff(
            db,
            staff,
            quote_id,
            reason=payload.reason,
            specification=payload.specification,
            bom_snapshot=payload.bom_snapshot,
            options=payload.options,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return serialize_sales_quote(updated)


@router.get("/quotes/{quote_id}/versions")
def sales_list_versions(
    quote_id: int,
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> list:
    try:
        quote = get_quote(db, staff, quote_id)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
    return [
        quote_service.serialize_version(item).model_dump(by_alias=True)
        for item in sorted(quote.versions, key=lambda row: row.version)
    ]


@router.get("/quotes/{quote_id}/versions/compare")
def sales_compare_versions(
    quote_id: int,
    from_version: int = Query(..., alias="from"),
    to_version: int = Query(..., alias="to"),
    db: Session = Depends(get_db),
    staff: StaffUser = Depends(require_staff()),
) -> dict:
    try:
        quote = get_quote(db, staff, quote_id)
        return quote_service.compare_versions(quote, from_version, to_version)
    except (AccessDenied, LookupError) as exc:
        raise _http_from_access(exc) from exc
