from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import Customer
from app.schemas import ProfileUpdate


def get_customer_by_email(db: Session, email: str) -> Customer | None:
    return db.scalar(select(Customer).where(Customer.email == email.lower()))


def get_customer_by_id(db: Session, customer_id: int) -> Customer | None:
    return db.get(Customer, customer_id)


def authenticate(db: Session, email: str, password: str) -> Customer | None:
    customer = get_customer_by_email(db, email)
    if customer is None or not verify_password(password, customer.hashed_password):
        return None
    return customer


def create_customer(
    db: Session,
    *,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    **profile: str,
) -> Customer:
    customer = Customer(
        email=email.lower(),
        hashed_password=hash_password(password),
        first_name=first_name,
        last_name=last_name,
        **profile,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def update_profile(db: Session, customer: Customer, payload: ProfileUpdate) -> Customer:
    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(customer, key, value)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer
