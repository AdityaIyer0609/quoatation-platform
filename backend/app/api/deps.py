from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_token_payload
from app.db.session import get_db
from app.models import Customer, StaffRole, StaffUser
from app.services.auth import get_customer_by_id
from app.services.staff import get_staff_by_id

bearer = HTTPBearer(auto_error=False)

ALL_STAFF = (
    StaffRole.SALES_EXECUTIVE.value,
    StaffRole.SALES_MANAGER.value,
    StaffRole.PRICING_MANAGER.value,
    StaffRole.ADMIN.value,
)


def _credentials(creds: HTTPAuthorizationCredentials | None) -> dict:
    if creds is None or creds.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    payload = decode_token_payload(creds.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return payload


def get_current_customer(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Customer:
    payload = _credentials(creds)
    if str(payload.get("typ") or "customer") == "staff":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customer access only")
    try:
        customer_id = int(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    customer = get_customer_by_id(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Customer not found")
    return customer


def get_current_staff(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> StaffUser:
    payload = _credentials(creds)
    if str(payload.get("typ") or "customer") != "staff":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access only")
    try:
        staff_id = int(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    staff = get_staff_by_id(db, staff_id)
    if staff is None or not staff.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Staff not found")
    return staff


def require_staff(*roles: str) -> Callable[..., StaffUser]:
    allowed = set(roles) if roles else set(ALL_STAFF)

    def dependency(staff: StaffUser = Depends(get_current_staff)) -> StaffUser:
        if staff.role == StaffRole.ADMIN.value:
            return staff
        if staff.role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return staff

    return dependency
