from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_staff
from app.core.security import hash_password
from app.db.session import get_db
from app.models import StaffRole, StaffUser
from app.services.audit import record_audit
from app.services.staff import create_staff, get_staff_by_email

router = APIRouter(prefix="/admin", tags=["admin"])

VALID_ROLES = {item.value for item in StaffRole}


class StaffOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    id: int
    email: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    role: str
    is_active: bool = Field(alias="isActive")


class StaffCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    email: str
    password: str
    first_name: str = Field(alias="firstName")
    last_name: str = Field(alias="lastName")
    role: str


class StaffUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    first_name: str | None = Field(default=None, alias="firstName")
    last_name: str | None = Field(default=None, alias="lastName")
    role: str | None = None
    is_active: bool | None = Field(default=None, alias="isActive")
    password: str | None = None


def _out(staff: StaffUser) -> StaffOut:
    return StaffOut(
        id=staff.id,
        email=staff.email,
        firstName=staff.first_name,
        lastName=staff.last_name,
        role=staff.role,
        isActive=staff.is_active,
    )


@router.get("/users", response_model=list[StaffOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: StaffUser = Depends(require_staff(StaffRole.ADMIN.value)),
) -> list[StaffOut]:
    rows = db.scalars(select(StaffUser).order_by(StaffUser.email)).all()
    return [_out(item) for item in rows]


@router.post("/users", response_model=StaffOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: StaffCreate,
    db: Session = Depends(get_db),
    admin: StaffUser = Depends(require_staff(StaffRole.ADMIN.value)),
) -> StaffOut:
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if get_staff_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
    staff = create_staff(
        db,
        email=payload.email,
        password=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
    )
    record_audit(
        db,
        staff=admin,
        action="staff.created",
        entity_type="staff",
        entity_id=staff.id,
        detail=f"Created {staff.email} as {staff.role}",
        commit=True,
    )
    return _out(staff)


@router.patch("/users/{user_id}", response_model=StaffOut)
def update_user(
    user_id: int,
    payload: StaffUpdate,
    db: Session = Depends(get_db),
    admin: StaffUser = Depends(require_staff(StaffRole.ADMIN.value)),
) -> StaffOut:
    staff = db.get(StaffUser, user_id)
    if staff is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    data = payload.model_dump(exclude_unset=True)
    if "role" in data and data["role"] is not None and data["role"] not in VALID_ROLES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role")
    if data.get("password"):
        staff.hashed_password = hash_password(data.pop("password"))
    for key, value in data.items():
        setattr(staff, key, value)
    db.add(staff)
    record_audit(
        db,
        staff=admin,
        action="staff.updated",
        entity_type="staff",
        entity_id=staff.id,
        detail=f"Updated {staff.email}",
    )
    db.commit()
    db.refresh(staff)
    return _out(staff)
