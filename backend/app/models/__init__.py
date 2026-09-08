from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base

# JSONB on Postgres, JSON elsewhere (tests / SQLite).
JsonType = JSON().with_variant(JSONB, "postgresql")


class QuoteStatus(StrEnum):
    DRAFT = "draft"
    QUOTED = "quoted"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    REJECTED = "rejected"
    REVISION_REQUESTED = "revision_requested"


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[str] = mapped_column(String(50), default="")
    designation: Mapped[str] = mapped_column(String(120), default="")
    company: Mapped[str] = mapped_column(String(255), default="")
    gst: Mapped[str] = mapped_column(String(50), default="")
    address: Mapped[str] = mapped_column(String(255), default="")
    city: Mapped[str] = mapped_column(String(100), default="")
    state: Mapped[str] = mapped_column(String(100), default="")
    pincode: Mapped[str] = mapped_column(String(20), default="")
    country: Mapped[str] = mapped_column(String(100), default="India")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    quotes: Mapped[list["Quote"]] = relationship(back_populates="customer")


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default=QuoteStatus.QUOTED.value, index=True)
    product_name: Mapped[str] = mapped_column(String(255))
    specification: Mapped[dict] = mapped_column(JsonType)
    bom_snapshot: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    pricing_snapshot: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    lead_time: Mapped[str] = mapped_column(String(80), default="21–28 days")
    payment_terms: Mapped[str] = mapped_column(String(80), default="40% advance")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    customer: Mapped[Customer] = relationship(back_populates="quotes")
    versions: Mapped[list["QuoteVersion"]] = relationship(
        back_populates="quote",
        cascade="all, delete-orphan",
    )
    status_history: Mapped[list["QuoteStatusHistory"]] = relationship(
        back_populates="quote",
        cascade="all, delete-orphan",
    )
    pricing_snapshots: Mapped[list["PricingSnapshot"]] = relationship(
        back_populates="quote",
        cascade="all, delete-orphan",
    )


class QuoteVersion(Base):
    __tablename__ = "quote_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quote_id: Mapped[int] = mapped_column(ForeignKey("quotes.id"), index=True)
    version: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(32))
    specification: Mapped[dict] = mapped_column(JsonType)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    quote: Mapped[Quote] = relationship(back_populates="versions")
    pricing_snapshots: Mapped[list["PricingSnapshot"]] = relationship(back_populates="version")


class QuoteStatusHistory(Base):
    __tablename__ = "quote_status_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quote_id: Mapped[int] = mapped_column(ForeignKey("quotes.id"), index=True)
    from_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    to_status: Mapped[str] = mapped_column(String(32))
    event: Mapped[str] = mapped_column(String(120))
    detail: Mapped[str] = mapped_column(Text, default="")
    event_type: Mapped[str] = mapped_column(String(20), default="neutral")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    quote: Mapped[Quote] = relationship(back_populates="status_history")


class PricingSnapshot(Base):
    __tablename__ = "pricing_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    quote_id: Mapped[int | None] = mapped_column(ForeignKey("quotes.id"), nullable=True, index=True)
    quote_version_id: Mapped[int | None] = mapped_column(
        ForeignKey("quote_versions.id"),
        nullable=True,
        index=True,
    )
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    unit_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer)
    total_amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    total_kg: Mapped[float] = mapped_column(Numeric(12, 4))
    source: Mapped[str] = mapped_column(String(40), default="book4")
    rule_version: Mapped[str] = mapped_column(String(40), default="book4-16-04-26")
    breakdown: Mapped[dict | None] = mapped_column(JsonType, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    quote: Mapped[Quote | None] = relationship(back_populates="pricing_snapshots")
    version: Mapped[QuoteVersion | None] = relationship(back_populates="pricing_snapshots")
