from tests.conftest import SPEC
from app.models import StaffRole
from app.services.staff import create_staff


def _staff_header(client, db_session):
    create_staff(
        db_session,
        email="priya@quotecraft.local",
        password="Sales@123",
        first_name="Priya",
        last_name="Shah",
        role=StaffRole.SALES_MANAGER.value,
    )
    response = client.post(
        "/api/auth/login",
        json={"email": "priya@quotecraft.local", "password": "Sales@123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_staff_issue_version_freezes_and_does_not_overwrite_v1(client, auth_header, db_session, monkeypatch):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    assert created.status_code == 201
    quote = created.json()
    quote_id = quote["id"]
    v1 = quote["versions"][0]
    frozen_v1_price = v1["pricingSnapshot"]
    frozen_v1_bom = v1["bomSnapshot"]

    staff = _staff_header(client, db_session)
    issued = client.post(
        f"/api/sales/quotes/{quote_id}/versions",
        headers=staff,
        json={"reason": "Customer asked for a revised offer"},
    )
    assert issued.status_code == 200
    body = issued.json()
    assert body["status"] == "quoted"
    assert body["currentVersion"] == 2
    assert len(body["versions"]) == 2
    v1_after = next(item for item in body["versions"] if item["version"] == 1)
    v2 = next(item for item in body["versions"] if item["version"] == 2)
    assert v1_after["isCurrent"] is False
    assert v2["isCurrent"] is True
    assert v1_after["pricingSnapshot"] == frozen_v1_price
    assert v1_after["bomSnapshot"] == frozen_v1_bom
    assert v2["note"] == "Customer asked for a revised offer"
    assert v2["createdByName"] == "Priya Shah"
    assert body["pricingSnapshot"] == v2["pricingSnapshot"]

    monkeypatch.setattr("app.services.pricing.book4.PP_RM_PER_T", 99999)
    monkeypatch.setattr("app.services.pricing.service.PP_RM_PER_T", 99999)
    listed = client.get(f"/api/sales/quotes/{quote_id}/versions", headers=staff)
    assert listed.status_code == 200
    still_v1 = next(item for item in listed.json() if item["version"] == 1)
    assert still_v1["pricingSnapshot"]["ppRmRate"] == frozen_v1_price["ppRmRate"]
    assert still_v1["pricingSnapshot"]["unitPrice"] == frozen_v1_price["unitPrice"]

    compared = client.get(
        f"/api/sales/quotes/{quote_id}/versions/compare",
        headers=staff,
        params={"from": 1, "to": 2},
    )
    assert compared.status_code == 200
    changes = compared.json()["changes"]
    assert "unitPrice" in changes
    assert "totalAmount" in changes
    assert changes["unitPrice"]["from"] == v1_after["unitPrice"]

    accepted = client.post(f"/api/quotes/{quote_id}/accept", headers=auth_header)
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"

    blocked = client.post(
        f"/api/sales/quotes/{quote_id}/versions",
        headers=staff,
        json={"reason": "Too late"},
    )
    assert blocked.status_code == 409

    email = client.post(f"/api/quotes/{quote_id}/email", headers=auth_header)
    assert email.status_code in {409, 503}


def test_customer_cannot_accept_after_reject(client, auth_header):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    client.post(f"/api/quotes/{quote_id}/reject", headers=auth_header, json={"message": "No"})
    email = client.post(f"/api/quotes/{quote_id}/email", headers=auth_header)
    assert email.status_code == 409
