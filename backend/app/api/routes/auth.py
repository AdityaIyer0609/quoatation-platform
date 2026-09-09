from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.api.deps import bearer
from app.core.security import create_access_token, decode_token_payload
from app.db.session import get_db
from app.schemas import (
    CustomerProfile,
    LoginRequest,
    PasswordResetRequest,
    PasswordResetResponse,
    TokenResponse,
)
from app.services.auth import authenticate, get_customer_by_id
from app.services.staff import authenticate_staff, get_staff_by_id

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    staff = authenticate_staff(db, payload.email, payload.password)
    if staff is not None:
        return TokenResponse(
            access_token=create_access_token(str(staff.id), token_type="staff", role=staff.role)
        )
    customer = authenticate(db, payload.email, payload.password)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return TokenResponse(
        access_token=create_access_token(str(customer.id), token_type="customer", role="customer")
    )


@router.post("/password-reset", response_model=PasswordResetResponse)
def password_reset(payload: PasswordResetRequest) -> PasswordResetResponse:
    _ = payload.email
    return PasswordResetResponse(sent=True)


@router.get("/me", response_model=CustomerProfile)
def me(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> CustomerProfile:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token_payload(creds.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    token_type = str(payload.get("typ") or "customer")
    try:
        subject_id = int(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    if token_type == "staff":
        staff = get_staff_by_id(db, subject_id)
        if staff is None or not staff.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff not found")
        return CustomerProfile.from_staff(staff)
    customer = get_customer_by_id(db, subject_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Customer not found")
    return CustomerProfile.from_customer(customer)
