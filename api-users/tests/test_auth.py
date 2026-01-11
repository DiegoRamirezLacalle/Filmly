import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test que el servidor responde"""
    response = client.get("/")
    assert response.status_code == 200


def test_signup_missing_fields():
    """Test registro sin campos requeridos"""
    response = client.post("/auth/signup", json={})
    assert response.status_code == 422  


def test_signup_invalid_email():
    """Test registro con email inválido"""
    response = client.post("/auth/signup", json={
        "email": "invalid-email",
        "password": "Test123!"
    })
    assert response.status_code == 422


def test_login_missing_fields():
    """Test login sin credenciales"""
    response = client.post("/auth/login", data={})
    assert response.status_code == 422


def test_login_wrong_credentials():
    """Test login con credenciales incorrectas"""
    response = client.post("/auth/login", data={
        "username": "nonexistent@example.com",
        "password": "wrongpassword"
    })
    assert response.status_code in [401, 400]  


def test_me_without_token():
    """Test acceso a /me sin token"""
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token():
    """Test acceso a /me con token inválido"""
    response = client.get("/auth/me", headers={
        "Authorization": "Bearer invalid-token-here"
    })
    assert response.status_code == 401
