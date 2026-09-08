def test_login_rejects_bad_password(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_and_me(client, user):
    response = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "secret123"},
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == user.email
    assert body["initials"] == "AK"


def test_password_reset(client):
    response = client.post("/api/auth/password-reset", json={"email": "arjun@packtech.in"})
    assert response.status_code == 200
    assert response.json()["sent"] is True


def test_profile_update(client, auth_header):
    response = client.put(
        "/api/profile",
        headers=auth_header,
        json={"phone": "+91 98765 43210", "city": "Navi Mumbai"},
    )
    assert response.status_code == 200
    assert response.json()["phone"] == "+91 98765 43210"
    assert response.json()["city"] == "Navi Mumbai"
