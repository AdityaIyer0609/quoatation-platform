from app.models import StaffRole
from app.schemas.pricing import PricingOptions
from app.services.pricing.book4 import default_book_payload
from app.services.pricing.service import preview_pricing
from app.services.staff import create_staff
from tests.conftest import SPEC
from tests.test_pricing import _spec


def _login(client, email: str) -> dict[str, str]:
    response = client.post("/api/auth/login", json={"email": email, "password": "secret123"})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def test_custom_conversion_rate_is_used():
    book = default_book_payload()
    book["conversionRows"] = [
        {"design": "Circular", "loops": "X-Corner", "complication": "Builder", "rate": 2000}
    ]
    result = preview_pricing(_spec(), book=book)
    assert result.conversion_rate_per_ton == 2000


def test_new_conversion_row_can_price_unknown_design():
    book = default_book_payload()
    book["conversionRows"] = list(book["conversionRows"]) + [
        {"design": "Tunnel Bag", "loops": "Corner", "complication": "Standard", "rate": 880}
    ]
    result = preview_pricing(
        _spec(constructionType="Circular"),
        book=book,
        options=PricingOptions(
            bag_design="Tunnel Bag",
            loop_pattern="Corner",
            complication="Standard",
        ),
    )
    assert result.bag_design == "Tunnel Bag"
    assert result.conversion_rate_per_ton == 880
    assert result.priced is True


def test_sales_can_save_pricing_book(client, db_session):
    create_staff(
        db_session,
        email="price@quotecraft.local",
        password="secret123",
        first_name="Price",
        last_name="Lead",
        role=StaffRole.PRICING_MANAGER.value,
    )
    headers = _login(client, "price@quotecraft.local")
    loaded = client.get("/api/sales/pricing-book", headers=headers)
    assert loaded.status_code == 200, loaded.text
    payload = loaded.json()["payload"]
    payload["ppPlatts"] = 1600
    payload["ruleVersion"] = "custom-2026-09"
    saved = client.put(
        "/api/sales/pricing-book",
        headers=headers,
        json={"payload": payload, "notes": "Updated PP Platts", "ruleVersion": "custom-2026-09"},
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["payload"]["ppPlatts"] == 1600
    assert saved.json()["ppRmPerT"] == 1685


def test_sales_executive_can_save_pricing_book(client, db_session):
    create_staff(
        db_session,
        email="exec@quotecraft.local",
        password="secret123",
        first_name="Exec",
        last_name="User",
        role=StaffRole.SALES_EXECUTIVE.value,
    )
    headers = _login(client, "exec@quotecraft.local")
    loaded = client.get("/api/sales/pricing-book", headers=headers)
    assert loaded.status_code == 200
    assert loaded.json()["canEdit"] is True
    payload = loaded.json()["payload"]
    payload["peRmPerT"] = 2000
    saved = client.put(
        "/api/sales/pricing-book",
        headers=headers,
        json={"payload": payload, "notes": "Exec update"},
    )
    assert saved.status_code == 200, saved.text
    assert saved.json()["payload"]["peRmPerT"] == 2000


def test_quote_preview_uses_saved_book(client, db_session, auth_header):
    create_staff(
        db_session,
        email="mgr@quotecraft.local",
        password="secret123",
        first_name="Mgr",
        last_name="User",
        role=StaffRole.SALES_MANAGER.value,
    )
    staff = _login(client, "mgr@quotecraft.local")
    book = client.get("/api/sales/pricing-book", headers=staff).json()["payload"]
    for row in book["conversionRows"]:
        if row["design"] == "Circular" and row["loops"] == "X-Corner" and row["complication"] == "Builder":
            row["rate"] = 1111
    client.put("/api/sales/pricing-book", headers=staff, json={"payload": book})
    priced = client.post("/api/quotes/pricing/preview", headers=auth_header, json={"specification": SPEC})
    assert priced.status_code == 200, priced.text
    assert priced.json()["conversionRatePerTon"] == 1111
