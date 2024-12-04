import pytest
from fastapi.testclient import TestClient
from main import app
from models.models import User, Summary

client = TestClient(app)

@pytest.fixture
def create_user():
    user_data = User(
        firstName="John",
        lastName="Doe",
        phone="+14132752734",
        email="john.doe@example.com",
        password="password123",
        confirmPassword="password123"
    )
    response = client.post("/user/create", json=user_data.dict())
    return response.json()

def test_create_user(create_user):
    assert create_user["status"] == "OK"
    assert "userId" in create_user["result"]

def test_verify_user(create_user):
    user_data = {
        "email": "john.doe@example.com",
        "password": "password123"
    }
    response = client.post("/user/verify", json=user_data)
    assert response.status_code == 200
    assert "auth_token" in response.json()["result"]

def test_create_summary(create_user):
    summary_data = {
        "userId": create_user["result"]["userId"],
        "type": "code",
        "uploadType": "upload",
        "initialData": "print('Hello World')"
    }
    response = client.post("/summary/create", json=summary_data)
    assert response.status_code == 201
    assert "summary_id" in response.json()["result"]

def test_user_summaries(create_user):
    user_id = create_user["result"]["userId"]
    response = client.get(f"/summaries/{user_id}")
    assert response.status_code == 200
    assert isinstance(response.json()["result"], list)

def test_delete_summary(create_user):
    summary_data = {
        "userId": create_user["result"]["userId"],
        "type": "code",
        "uploadType": "upload",
        "initialData": "print('Hello World')"
    }
    create_response = client.post("/summary/create", json=summary_data)
    summary_id = create_response.json()["result"]["summary_id"]

    delete_response = client.delete(f"/summary/{summary_id}")
    assert delete_response.status_code == 201
    assert delete_response.json()["result"]["message"] == "Summary deleted successfully" 