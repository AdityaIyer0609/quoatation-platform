from sqlalchemy.orm import Session

from app.models import AuditEvent, Customer, StaffUser


def record_audit(
    db: Session,
    *,
    staff: StaffUser | None = None,
    customer: Customer | None = None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    detail: str = "",
    commit: bool = False,
) -> None:
    actor_type = "system"
    actor_id = None
    actor_email = ""
    if staff is not None:
        actor_type = "staff"
        actor_id = staff.id
        actor_email = staff.email
    elif customer is not None:
        actor_type = "customer"
        actor_id = customer.id
        actor_email = customer.email
    db.add(
        AuditEvent(
            actor_type=actor_type,
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail,
        )
    )
    if commit:
        db.commit()
