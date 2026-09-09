from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.db.session import get_db
from app.models import Customer, Quote
from app.schemas import (
    DashboardResponse,
    PreviewRequest,
    PreviewResponse,
    QuoteActionRequest,
    QuoteCreateRequest,
    QuoteDetail,
    QuoteListItem,
    QuoteVersionOut,
    TimelineEvent,
    BomPreviewRequest,
    BomPreviewResponse,
    PricingPreviewRequest,
    PricingPreviewResponse,
    ComplicationPickerResponse,
)
from app.services import quotes as quote_service
from app.services.bom import preview_bom
from app.services.pricing import preview_pricing
from app.services.pricing.mapping import complication_picker
from app.services.pdf import render_quote_pdf
from app.services.email import SmtpNotConfiguredError, send_quote_email

router = APIRouter(tags=["quotes"])


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> DashboardResponse:
    return quote_service.dashboard(db, customer)


@router.post("/quotes/preview", response_model=PreviewResponse)
def preview(
    payload: PreviewRequest,
    customer: Customer = Depends(get_current_customer),
) -> PreviewResponse:
    _ = customer
    summary, snapshot = quote_service.preview_quote(payload.specification)
    return PreviewResponse(pricing=summary, source="book4", pricingSnapshot=snapshot)


@router.post("/quotes/bom/preview", response_model=BomPreviewResponse)
def bom_preview(payload: BomPreviewRequest) -> BomPreviewResponse:
    return preview_bom(payload.specification)


@router.post("/quotes/pricing/preview", response_model=PricingPreviewResponse)
def pricing_preview(payload: PricingPreviewRequest) -> PricingPreviewResponse:
    return preview_pricing(payload.specification, payload.bom, payload.options)


@router.post("/quotes/pricing/complications", response_model=ComplicationPickerResponse)
def pricing_complications(payload: BomPreviewRequest) -> ComplicationPickerResponse:
    return ComplicationPickerResponse.model_validate(complication_picker(payload.specification))


@router.get("/quotes", response_model=list[QuoteListItem])
def list_quotes(
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> list[QuoteListItem]:
    return quote_service.list_quotes(db, customer)


@router.post("/quotes", response_model=QuoteDetail, status_code=status.HTTP_201_CREATED)
def create_quote(
    payload: QuoteCreateRequest,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> QuoteDetail:
    quote = quote_service.create_quote(
        db, customer, payload.specification, payload.bom_snapshot, payload.options
    )
    return quote_service.serialize_quote(quote)


@router.get("/quotes/{quote_id}", response_model=QuoteDetail)
def get_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> QuoteDetail:
    quote = _owned_quote(db, customer, quote_id)
    return quote_service.serialize_quote(quote)


@router.get("/quotes/{quote_id}/pdf")
def download_quote_pdf(
    quote_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> Response:
    quote = _owned_quote(db, customer, quote_id)
    payload = render_quote_pdf(quote)
    filename = f"{quote.number}.pdf"
    return Response(
        content=payload,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/quotes/{quote_id}/email")
def email_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> dict[str, bool]:
    quote = _owned_quote(db, customer, quote_id)
    try:
        quote_service.assert_sendable(quote)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    payload = render_quote_pdf(quote)
    try:
        send_quote_email(quote, payload)
    except SmtpNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not send the quotation email.",
        ) from exc
    return {"sent": True}


@router.get("/quotes/{quote_id}/versions", response_model=list[QuoteVersionOut])
def list_versions(
    quote_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> list[QuoteVersionOut]:
    quote = _owned_quote(db, customer, quote_id)
    return [quote_service.serialize_version(item) for item in sorted(quote.versions, key=lambda row: row.version)]


@router.get("/quotes/{quote_id}/history", response_model=list[TimelineEvent])
def list_history(
    quote_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> list[TimelineEvent]:
    quote = _owned_quote(db, customer, quote_id)
    return quote_service.serialize_quote(quote).timeline


@router.post("/quotes/{quote_id}/accept", response_model=QuoteDetail)
def accept_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> QuoteDetail:
    quote = _owned_quote(db, customer, quote_id)
    try:
        updated = quote_service.accept_quote(db, customer, quote)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return quote_service.serialize_quote(updated)


@router.post("/quotes/{quote_id}/reject", response_model=QuoteDetail)
def reject_quote(
    quote_id: int,
    payload: QuoteActionRequest,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> QuoteDetail:
    quote = _owned_quote(db, customer, quote_id)
    try:
        updated = quote_service.reject_quote(db, customer, quote, payload.message)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return quote_service.serialize_quote(updated)


@router.post("/quotes/{quote_id}/revision", response_model=QuoteDetail)
def request_revision(
    quote_id: int,
    payload: QuoteActionRequest,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> QuoteDetail:
    quote = _owned_quote(db, customer, quote_id)
    try:
        updated = quote_service.request_revision(db, customer, quote, payload.message)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return quote_service.serialize_quote(updated)


def _owned_quote(db: Session, customer: Customer, quote_id: int) -> Quote:
    quote = quote_service.get_quote(db, customer, quote_id)
    if quote is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote not found")
    return quote
