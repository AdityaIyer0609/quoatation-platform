from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.db.base import Base
from app.db.session import get_db, make_engine
from app.main import app
from app.models import Customer  # noqa: F401
from app.services.auth import create_customer

SPEC = {
    "productType": "FIBC Bulk Bag",
    "productCategory": "Type A",
    "constructionType": "Circular",
    "bodyStyle": "Builder",
    "bodyGrade": "Std",
    "sizeType": "INNER",
    "length": "120",
    "width": "120",
    "height": "200",
    "swl": "1000",
    "sfRatio": "5:1",
    "fabricColour": "White",
    "bodyGsm": "240",
    "bodyLami": "0",
    "sameFabricForPanels": True,
    "topType": "Open",
    "bottomType": "Flat",
    "loopEnabled": True,
    "loopType": "PP",
    "loopConstruction": "Cross Corner",
    "loopGsm": "40",
    "loopLength": "30",
    "loopWidth": "7",
    "loopCount": "4",
    "quantity": "499",
    "linerEnabled": False,
    "printing": "UnPrinted",
    "deliveryLocation": "Mumbai, Maharashtra",
    "notes": "",
}


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    engine = make_engine("sqlite+pysqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture()
def user(db_session: Session) -> Customer:
    return create_customer(
        db_session,
        email="arjun@packtech.in",
        password="secret123",
        first_name="Arjun",
        last_name="Kumar",
        company="PackTech Industries Pvt Ltd",
    )


@pytest.fixture()
def auth_header(client: TestClient, user: Customer) -> dict[str, str]:
    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "secret123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
