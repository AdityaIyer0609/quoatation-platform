from tests.conftest import SPEC


def test_preview_is_book4(client, auth_header):
    response = client.post(
        "/api/quotes/preview",
        headers=auth_header,
        json={"specification": SPEC},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "book4"
    pricing = body["pricing"]
    assert pricing["quantity"] == 499
    assert pricing["currency"] == "USD"
    assert pricing["totalKg"] > 0
    snap = body["pricingSnapshot"]
    assert snap["ruleVersion"] == "book4-16-04-26"
    assert snap["ppRmRate"] == 1570


def test_create_list_and_get_quote(client, auth_header):
    created = client.post(
        "/api/quotes",
        headers=auth_header,
        json={"specification": SPEC},
    )
    assert created.status_code == 201
    quote = created.json()
    assert quote["status"] == "quoted"
    assert quote["number"].startswith("QT-")
    assert quote["specification"]["productType"] == "FIBC Bulk Bag"
    assert quote["versions"][0]["version"] == 1
    assert quote["versions"][0]["isCurrent"] is True
    assert quote["versions"][0]["bomSnapshot"] is not None
    assert quote["versions"][0]["pricingSnapshot"]["ruleVersion"] == "book4-16-04-26"
    assert quote["currentVersion"] == 1
    assert quote["timeline"][0]["event"] in {
        "Quotation issued",
        "Quotation stored — manual pricing required",
    }
    assert quote["pricing"]["currency"] == "USD"
    assert quote["pricingSnapshot"]["ruleVersion"] == "book4-16-04-26"
    assert quote["bomSnapshot"] is not None
    frozen_unit = quote["pricingSnapshot"]["unitPrice"]

    listed = client.get("/api/quotes", headers=auth_header)
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    listed_item = listed.json()[0]
    assert listed_item["amount"] == quote["pricing"]["totalAmount"]
    if quote["pricing"]["requiresManualPricing"]:
        assert listed_item["amount"] is None

    detail = client.get(f"/api/quotes/{quote['id']}", headers=auth_header)
    assert detail.status_code == 200
    assert detail.json()["id"] == quote["id"]
    assert detail.json()["pricingSnapshot"]["unitPrice"] == frozen_unit


def test_pricing_snapshot_does_not_change_when_rates_change(client, auth_header, monkeypatch):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    assert created.status_code == 201
    original = created.json()["pricingSnapshot"]
    monkeypatch.setattr("app.services.pricing.book4.PP_RM_PER_T", 99999)
    monkeypatch.setattr("app.services.pricing.service.PP_RM_PER_T", 99999)
    detail = client.get(f"/api/quotes/{created.json()['id']}", headers=auth_header)
    frozen = detail.json()["pricingSnapshot"]
    assert frozen["ppRmRate"] == original["ppRmRate"]
    assert frozen["unitPrice"] == original["unitPrice"]
    assert frozen["ppMaterialCost"] == original["ppMaterialCost"]


def test_accept_quote(client, auth_header):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    accepted = client.post(f"/api/quotes/{quote_id}/accept", headers=auth_header)
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "accepted"

    conflict = client.post(f"/api/quotes/{quote_id}/reject", headers=auth_header, json={"message": "too late"})
    assert conflict.status_code == 409


def test_revision_request_does_not_create_version(client, auth_header):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    original_v1 = created.json()["versions"][0]
    revised = client.post(
        f"/api/quotes/{quote_id}/revision",
        headers=auth_header,
        json={"message": "Please increase GSM"},
    )
    assert revised.status_code == 200
    body = revised.json()
    assert body["status"] == "revision_requested"
    assert len(body["versions"]) == 1
    assert body["versions"][0]["pricingSnapshot"] == original_v1["pricingSnapshot"]
    assert body["versions"][0]["bomSnapshot"] == original_v1["bomSnapshot"]
    history = client.get(f"/api/quotes/{quote_id}/history", headers=auth_header)
    assert any(item["event"] == "Revision requested" for item in history.json())


def test_dashboard(client, auth_header):
    client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    response = client.get("/api/dashboard", headers=auth_header)
    assert response.status_code == 200
    body = response.json()
    assert body["greetingName"] == "Arjun"
    assert len(body["recentQuotes"]) == 1


def test_pdf_uses_frozen_snapshot_and_never_shows_zero_for_manual(client, auth_header):
    spec = {
        **SPEC,
        "bodyStyle": "Non-Builder",
        "length": "90",
        "width": "90",
        "height": "120",
        "bodyGsm": "180",
        "loopWidth": "5",
        "quantity": "100",
    }
    created = client.post("/api/quotes", headers=auth_header, json={"specification": spec})
    assert created.status_code == 201
    quote = created.json()
    assert quote["pricing"]["requiresManualPricing"] is True
    listed = client.get("/api/quotes", headers=auth_header).json()
    match = next(item for item in listed if item["id"] == quote["id"])
    assert match["amount"] is None
    assert match["requiresManualPricing"] is True
    pdf = client.get(f"/api/quotes/{quote['id']}/pdf", headers=auth_header)
    assert pdf.status_code == 200
    assert pdf.headers["content-type"].startswith("application/pdf")
    body = pdf.content
    assert body.startswith(b"%PDF")
    assert quote["number"].encode() in body
    assert b"Manual pricing" in body
    assert b"$0.00 total" not in body.lower()
    assert b"348.6" not in body


def test_pdf_includes_priced_total(client, auth_header):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    assert created.status_code == 201
    quote = created.json()
    pdf = client.get(f"/api/quotes/{quote['id']}/pdf", headers=auth_header)
    assert pdf.status_code == 200
    assert quote["number"].encode() in pdf.content
    assert b"Version V1" in pdf.content
    if not quote["pricing"]["requiresManualPricing"]:
        assert b"Total amount" in pdf.content


def test_email_without_smtp_is_unavailable(client, auth_header, monkeypatch):
    from app.core.config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "smtp_host", "")
    monkeypatch.setattr(settings, "smtp_from", "")
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    response = client.post(f"/api/quotes/{quote_id}/email", headers=auth_header)
    assert response.status_code == 503


def test_reject_quote(client, auth_header):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    original_price = created.json()["pricingSnapshot"]
    rejected = client.post(
        f"/api/quotes/{quote_id}/reject",
        headers=auth_header,
        json={"message": "Not this time"},
    )
    assert rejected.status_code == 200
    assert rejected.json()["status"] == "rejected"
    assert rejected.json()["pricingSnapshot"] == original_price
    conflict = client.post(f"/api/quotes/{quote_id}/accept", headers=auth_header)
    assert conflict.status_code == 409


def test_revision_does_not_overwrite_snapshots(client, auth_header):
    created = client.post("/api/quotes", headers=auth_header, json={"specification": SPEC})
    quote_id = created.json()["id"]
    original_bom = created.json()["bomSnapshot"]
    original_price = created.json()["pricingSnapshot"]
    client.post(
        f"/api/quotes/{quote_id}/revision",
        headers=auth_header,
        json={"message": "Please increase GSM"},
    )
    detail = client.get(f"/api/quotes/{quote_id}", headers=auth_header).json()
    assert detail["bomSnapshot"] == original_bom
    assert detail["pricingSnapshot"] == original_price
    assert len(detail["versions"]) == 1

