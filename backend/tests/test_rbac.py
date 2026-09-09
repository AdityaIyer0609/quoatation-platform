from app.models import StaffRole
from app.services.auth import create_customer
from app.services.staff import create_staff
from tests.conftest import SPEC


def _login(client, email: str, password: str = "secret123") -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def _staff(db_session, email: str, role: str, name: str = "Pat"):
    return create_staff(
        db_session,
        email=email,
        password="secret123",
        first_name=name,
        last_name="User",
        role=role,
    )


def test_customer_cannot_use_sales_api(client, auth_header):
    response = client.get("/api/sales/dashboard", headers=auth_header)
    assert response.status_code == 403
    users = client.get("/api/admin/users", headers=auth_header)
    assert users.status_code == 403


def test_customer_cannot_read_another_customer_quote(client, db_session, auth_header, user):
    other = create_customer(
        db_session,
        email="other@packtech.in",
        password="secret123",
        first_name="Other",
        last_name="Buyer",
        company="Other Co",
    )
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    other_header = _login(client, other.email)
    blocked = client.get(f"/api/quotes/{quote_id}", headers=other_header)
    assert blocked.status_code == 404
    listed = client.get("/api/quotes", headers=other_header)
    assert listed.status_code == 200
    assert listed.json() == []


def test_staff_cannot_use_customer_quote_list(client, db_session):
    _staff(db_session, "exec@quotecraft.local", StaffRole.SALES_EXECUTIVE.value, "Exec")
    header = _login(client, "exec@quotecraft.local")
    response = client.get("/api/quotes", headers=header)
    assert response.status_code == 403
    me = client.get("/api/auth/me", headers=header)
    assert me.json()["kind"] == "staff"
    assert me.json()["role"] == "sales_executive"


def test_sales_executive_only_assigned_customers(client, db_session, user):
    exec_user = _staff(db_session, "exec@quotecraft.local", StaffRole.SALES_EXECUTIVE.value, "Exec")
    other_exec = _staff(db_session, "exec2@quotecraft.local", StaffRole.SALES_EXECUTIVE.value, "Two")
    outsider = create_customer(
        db_session,
        email="unassigned@packtech.in",
        password="secret123",
        first_name="Una",
        last_name="Signed",
        company="Free Co",
    )
    user.assigned_staff_id = exec_user.id
    outsider.assigned_staff_id = other_exec.id
    db_session.add_all([user, outsider])
    db_session.commit()

    header = _login(client, "exec@quotecraft.local")
    customers = client.get("/api/sales/customers", headers=header)
    assert customers.status_code == 200
    emails = {item["email"] for item in customers.json()}
    assert user.email in emails
    assert outsider.email not in emails

    hidden = client.get(f"/api/sales/customers/{outsider.id}", headers=header)
    assert hidden.status_code == 403

    created = client.post(
        "/api/sales/quotes",
        headers=header,
        json={"specification": SPEC, "customerId": user.id},
    )
    assert created.status_code == 201
    quote_id = created.json()["id"]

    blocked_create = client.post(
        "/api/sales/quotes",
        headers=header,
        json={"specification": SPEC, "customerId": outsider.id},
    )
    assert blocked_create.status_code == 403

    other_header = _login(client, "exec2@quotecraft.local")
    blocked_quote = client.get(f"/api/sales/quotes/{quote_id}", headers=other_header)
    assert blocked_quote.status_code == 403


def test_sales_manager_sees_all_quotes(client, db_session, user):
    exec_user = _staff(db_session, "exec@quotecraft.local", StaffRole.SALES_EXECUTIVE.value)
    _staff(db_session, "mgr@quotecraft.local", StaffRole.SALES_MANAGER.value, "Mgr")
    user.assigned_staff_id = exec_user.id
    db_session.add(user)
    db_session.commit()
    exec_header = _login(client, "exec@quotecraft.local")
    created = client.post(
        "/api/sales/quotes",
        headers=exec_header,
        json={"specification": SPEC, "customerId": user.id},
    )
    quote_id = created.json()["id"]
    mgr_header = _login(client, "mgr@quotecraft.local")
    listed = client.get("/api/sales/quotes", headers=mgr_header)
    assert any(item["id"] == quote_id for item in listed.json())
    dash = client.get("/api/sales/dashboard", headers=mgr_header)
    assert dash.status_code == 200
    assert "stats" in dash.json()


def test_pricing_manager_manual_queue_and_cannot_create(client, db_session, user):
    exec_user = _staff(db_session, "exec@quotecraft.local", StaffRole.SALES_EXECUTIVE.value)
    _staff(db_session, "price@quotecraft.local", StaffRole.PRICING_MANAGER.value, "Price")
    user.assigned_staff_id = exec_user.id
    db_session.add(user)
    db_session.commit()
    exec_header = _login(client, "exec@quotecraft.local")
    spec = {**SPEC, "bodyStyle": "Non-Builder", "length": "90", "width": "90", "height": "120", "bodyGsm": "180", "loopWidth": "5", "quantity": "100"}
    created = client.post(
        "/api/sales/quotes",
        headers=exec_header,
        json={"specification": spec, "customerId": user.id},
    )
    assert created.status_code == 201
    quote_id = created.json()["id"]
    assert created.json()["pricing"]["requiresManualPricing"] is True
    assert created.json()["manualPricingStatus"] == "pending"

    price_header = _login(client, "price@quotecraft.local")
    forbidden = client.post(
        "/api/sales/quotes",
        headers=price_header,
        json={"specification": SPEC, "customerId": user.id},
    )
    assert forbidden.status_code == 403
    queue = client.get("/api/sales/quotes?manualOnly=true", headers=price_header)
    assert any(item["id"] == quote_id for item in queue.json())
    approved = client.post(
        f"/api/sales/quotes/{quote_id}/manual-pricing",
        headers=price_header,
        json={"action": "approved", "note": "Commercial exception OK"},
    )
    assert approved.status_code == 200
    assert approved.json()["manualPricingStatus"] == "approved"
    assert approved.json()["pricingSnapshot"]["requiresManualPricing"] is True
    exec_approve = client.post(
        f"/api/sales/quotes/{quote_id}/manual-pricing",
        headers=exec_header,
        json={"action": "resolved", "note": "nope"},
    )
    assert exec_approve.status_code == 403


def test_admin_manages_users(client, db_session):
    _staff(db_session, "admin@quotecraft.local", StaffRole.ADMIN.value, "Ada")
    _staff(db_session, "exec@quotecraft.local", StaffRole.SALES_EXECUTIVE.value, "Exec")
    admin_header = _login(client, "admin@quotecraft.local")
    listed = client.get("/api/admin/users", headers=admin_header)
    assert listed.status_code == 200
    assert len(listed.json()) >= 2
    created = client.post(
        "/api/admin/users",
        headers=admin_header,
        json={
            "email": "newmgr@quotecraft.local",
            "password": "secret123",
            "firstName": "New",
            "lastName": "Mgr",
            "role": "sales_manager",
        },
    )
    assert created.status_code == 201
    exec_header = _login(client, "exec@quotecraft.local")
    blocked = client.get("/api/admin/users", headers=exec_header)
    assert blocked.status_code == 403
