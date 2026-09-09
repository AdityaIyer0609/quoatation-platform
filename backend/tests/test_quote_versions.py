from tests.conftest import SPEC
from app.models import StaffRole
from app.services.staff import create_staff
import pytest


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


def test_revised_offer_copies_freeze_and_sets_commercial_price(client, auth_header, db_session, monkeypatch):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    assert created.status_code == 201
    quote = created.json()
    quote_id = quote["id"]
    v1 = quote["versions"][0]
    frozen_v1_price = v1["pricingSnapshot"]
    frozen_v1_bom = v1["bomSnapshot"]
    v1_unit = v1["unitPrice"] or 8.85
    offer_unit = round(float(v1_unit) - 0.15, 2)

    staff = _staff_header(client, db_session)
    missing = client.post(
        f"/api/sales/quotes/{quote_id}/versions",
        headers=staff,
        json={"reason": "Discount without a price"},
    )
    assert missing.status_code == 422

    issued = client.post(
        f"/api/sales/quotes/{quote_id}/versions",
        headers=staff,
        json={"reason": "Negotiated commercial discount", "unitPrice": offer_unit},
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
    assert v2["bomSnapshot"] == frozen_v1_bom
    assert v2["quantity"] == v1["quantity"]
    assert v2["unitPrice"] == pytest.approx(offer_unit)
    assert v2["totalAmount"] == pytest.approx(round(offer_unit * v2["quantity"], 2))
    assert v2["pricingSnapshot"]["commercialOffer"] is True
    assert v2["note"] == "Negotiated commercial discount"
    assert v2["createdByName"] == "Priya Shah"
    assert body["pricingSnapshot"]["unitPrice"] == offer_unit

    monkeypatch.setattr("app.services.pricing.book4.PP_RM_PER_T", 99999)
    monkeypatch.setattr("app.services.pricing.service.PP_RM_PER_T", 99999)
    listed = client.get(f"/api/sales/quotes/{quote_id}/versions", headers=staff)
    still_v1 = next(item for item in listed.json() if item["version"] == 1)
    assert still_v1["pricingSnapshot"]["ppRmRate"] == frozen_v1_price["ppRmRate"]
    assert still_v1["unitPrice"] == v1["unitPrice"]

    compared = client.get(
        f"/api/sales/quotes/{quote_id}/versions/compare",
        headers=staff,
        params={"from": 1, "to": 2},
    )
    assert compared.status_code == 200
    changes = compared.json()["changes"]
    assert changes["unitPrice"]["to"] == pytest.approx(offer_unit)
    assert changes["quantity"]["from"] == changes["quantity"]["to"]

    accepted = client.post(f"/api/quotes/{quote_id}/accept", headers=auth_header)
    assert accepted.status_code == 200
    blocked = client.post(
        f"/api/sales/quotes/{quote_id}/versions",
        headers=staff,
        json={"reason": "Too late", "unitPrice": 1.0},
    )
    assert blocked.status_code == 409


def test_reject_does_not_create_a_version(client, auth_header):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    rejected = client.post(
        f"/api/quotes/{quote_id}/reject",
        headers=auth_header,
        json={"message": "Price too high"},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert len(rejected.json()["versions"]) == 1
    email = client.post(f"/api/quotes/{quote_id}/email", headers=auth_header)
    assert email.status_code == 409
