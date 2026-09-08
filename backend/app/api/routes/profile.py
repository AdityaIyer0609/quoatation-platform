from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.db.session import get_db
from app.models import Customer
from app.schemas import CustomerProfile, ProfileUpdate
from app.services.auth import update_profile

router = APIRouter(tags=["profile"])


@router.get("/profile", response_model=CustomerProfile)
@router.get("/customers/me", response_model=CustomerProfile)
def read_profile(customer: Customer = Depends(get_current_customer)) -> CustomerProfile:
    return CustomerProfile.from_customer(customer)


@router.put("/profile", response_model=CustomerProfile)
@router.put("/customers/me", response_model=CustomerProfile)
def write_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
) -> CustomerProfile:
    updated = update_profile(db, customer, payload)
    return CustomerProfile.from_customer(updated)
