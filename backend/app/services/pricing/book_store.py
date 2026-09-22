from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import PricingBook, StaffUser
from app.services.pricing.book4 import default_book_payload
from app.services.pricing.rates import BookRates, validate_book_payload


def get_active_payload(db: Session) -> dict:
    row = db.scalar(
        select(PricingBook).where(PricingBook.is_active.is_(True)).order_by(PricingBook.id.desc())
    )
    if row is None:
        payload = default_book_payload()
        row = PricingBook(
            name="Book4",
            rule_version=str(payload["ruleVersion"]),
            is_active=True,
            payload=payload,
            notes="Seeded from Book4 worksheet 16-04-26",
        )
        db.add(row)
        db.commit()
        db.refresh(row)
    return BookRates(row.payload).payload


def save_payload(
    db: Session,
    payload: dict,
    staff: StaffUser,
    notes: str = "",
) -> PricingBook:
    errors = validate_book_payload(payload)
    if errors:
        raise ValueError(" ".join(errors))
    rates = BookRates(payload)
    for existing in db.scalars(select(PricingBook).where(PricingBook.is_active.is_(True))).all():
        existing.is_active = False
        db.add(existing)
    row = PricingBook(
        name="Book4",
        rule_version=rates.rule_version,
        is_active=True,
        payload=rates.payload,
        notes=notes,
        updated_by_id=staff.id,
        updated_by_name=f"{staff.first_name} {staff.last_name}".strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def reset_to_book4(db: Session, staff: StaffUser) -> PricingBook:
    return save_payload(db, default_book_payload(), staff, notes="Reset to Book4 defaults")


def serialize_book(row: PricingBook | None, payload: dict) -> dict:
    return {
        "id": row.id if row else None,
        "name": row.name if row else "Book4",
        "ruleVersion": payload.get("ruleVersion"),
        "isActive": True,
        "notes": row.notes if row else "",
        "updatedByName": row.updated_by_name if row else "",
        "createdAt": row.created_at.isoformat() if row and row.created_at else None,
        "payload": payload,
        "ppRmPerT": BookRates(payload).pp_rm_per_t,
    }


def get_active_row(db: Session) -> PricingBook | None:
    get_active_payload(db)
    return db.scalar(
        select(PricingBook).where(PricingBook.is_active.is_(True)).order_by(PricingBook.id.desc())
    )
