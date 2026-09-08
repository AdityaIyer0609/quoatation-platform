from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.session import get_db
from app.models import Customer
from app.api.deps import get_current_customer
from app.schemas import (
    CustomerProfile,
    LoginRequest,
    PasswordResetRequest,
    PasswordResetResponse,
    TokenResponse,
)
from app.services.auth import authenticate

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    customer = authenticate(db, payload.email, payload.password)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(str(customer.id)))


@router.post("/password-reset", response_model=PasswordResetResponse)
def password_reset(payload: PasswordResetRequest) -> PasswordResetResponse:
    _ = payload.email
    return PasswordResetResponse(sent=True)


@router.get("/me", response_model=CustomerProfile)
def me(customer: Customer = Depends(get_current_customer)) -> CustomerProfile:
    return CustomerProfile.from_customer(customer)
