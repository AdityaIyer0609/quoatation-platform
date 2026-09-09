from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import StaffUser


def get_staff_by_email(db: Session, email: str) -> StaffUser | None:
    return db.scalar(select(StaffUser).where(StaffUser.email == email.lower()))


def get_staff_by_id(db: Session, staff_id: int) -> StaffUser | None:
    return db.get(StaffUser, staff_id)


def authenticate_staff(db: Session, email: str, password: str) -> StaffUser | None:
    staff = get_staff_by_email(db, email)
    if staff is None or not staff.is_active:
        return None
    if not verify_password(password, staff.hashed_password):
        return None
    return staff


def create_staff(
    db: Session,
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role: str,
) -> StaffUser:
    staff = StaffUser(
        email=email.lower(),
        hashed_password=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        role=role,
        is_active=True,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff
