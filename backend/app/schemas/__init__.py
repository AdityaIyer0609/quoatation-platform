from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.bom import BomCustomerSpec, BomPreviewRequest, BomPreviewResponse
from app.schemas.pricing import (
    PricingOptions,
    PricingPreviewRequest,
    PricingPreviewResponse,
    ComplicationPickerResponse,
)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class PasswordResetRequest(BaseModel):
    email: str


class PasswordResetResponse(BaseModel):
    sent: bool = True


class CustomerProfile(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, serialize_by_alias=True)

    id: int
    email: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    phone: str
    designation: str
    company: str
    gst: str
    address: str
    city: str
    state: str
    pincode: str
    country: str
    initials: str = ""

    @classmethod
    def from_customer(cls, customer: Any) -> "CustomerProfile":
        return cls.model_validate(customer).model_copy(
            update={
                "initials": f"{customer.first_name[:1]}{customer.last_name[:1]}".upper()
            }
        )


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    first_name: str | None = Field(default=None, alias="firstName")
    last_name: str | None = Field(default=None, alias="lastName")
    phone: str | None = None
    designation: str | None = None
    company: str | None = None
    gst: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str | None = None


class QuoteSpecification(BaseModel):
    """Customer-facing configuration. Extra BOM fields are preserved."""

    product_type: str = Field(default="FIBC Bulk Bag", alias="productType")
    product_category: str = Field(default="Type A — Standard", alias="productCategory")
    construction_type: str = Field(default="Circular", alias="constructionType")
    bottom_construction: str = Field(default="Flat Bottom", alias="bottomConstruction")
    top_construction: str = Field(default="Open Top", alias="topConstruction")
    length: str = "90"
    width: str = "90"
    height: str = "120"
    swl: str = "1000"
    fabric: str = "Virgin PP Woven"
    gsm: str = ""
    liner: str = ""
    printing: str = ""
    loops: str = ""
    accessories: list[str] = Field(default_factory=list)
    quantity: str = "500"
    delivery_location: str = Field(default="", alias="deliveryLocation")
    notes: str = ""

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True, extra="allow")


class PricingSummary(BaseModel):
    currency: str = "USD"
    unit_price: float | None = Field(default=None, alias="unitPrice")
    quantity: int
    total_amount: float | None = Field(default=None, alias="totalAmount")
    total_kg: float = Field(alias="totalKg")
    requires_manual_pricing: bool = Field(default=False, alias="requiresManualPricing")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class QuoteListItem(BaseModel):
    id: str
    number: str
    product_name: str = Field(alias="productName")
    date: str
    quantity: int
    amount: float | None = None
    status: str

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class TimelineEvent(BaseModel):
    at: str
    event: str
    detail: str
    type: str


class QuoteVersionOut(BaseModel):
    id: str
    version: int
    status: str
    created_at: str = Field(alias="createdAt")
    note: str | None = None

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class QuoteDetail(BaseModel):
    id: str
    number: str
    status: str
    product_name: str = Field(alias="productName")
    created_at: str = Field(alias="createdAt")
    valid_until: str | None = Field(alias="validUntil")
    lead_time: str = Field(alias="leadTime")
    payment_terms: str = Field(alias="paymentTerms")
    requested_by: str = Field(alias="requestedBy")
    company: str
    specification: dict[str, Any]
    bom_snapshot: dict[str, Any] | None = Field(default=None, alias="bomSnapshot")
    pricing_snapshot: dict[str, Any] | None = Field(default=None, alias="pricingSnapshot")
    pricing: PricingSummary
    timeline: list[TimelineEvent]
    versions: list[QuoteVersionOut]

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class PreviewRequest(BaseModel):
    specification: QuoteSpecification


class PreviewResponse(BaseModel):
    pricing: PricingSummary
    source: str = "book4"
    pricing_snapshot: dict[str, Any] | None = Field(default=None, alias="pricingSnapshot")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class QuoteCreateRequest(BaseModel):
    specification: dict[str, Any]
    bom_snapshot: dict[str, Any] | None = Field(default=None, alias="bomSnapshot")
    options: PricingOptions | None = None

    model_config = ConfigDict(populate_by_name=True)


class QuoteActionRequest(BaseModel):
    message: str = ""


class DashboardStats(BaseModel):
    quotes_this_month: str = Field(alias="quotesThisMonth")
    quotes_this_month_delta: str = Field(alias="quotesThisMonthDelta")
    in_progress: str = Field(alias="inProgress")
    in_progress_delta: str = Field(alias="inProgressDelta")
    total_spent_ytd: str = Field(alias="totalSpentYtd")
    total_spent_delta: str = Field(alias="totalSpentDelta")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)


class DashboardResponse(BaseModel):
    greeting_name: str = Field(alias="greetingName")
    date_label: str = Field(alias="dateLabel")
    stats: DashboardStats
    recent_quotes: list[QuoteListItem] = Field(alias="recentQuotes")
    pending_quote: QuoteListItem | None = Field(default=None, alias="pendingQuote")

    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)
