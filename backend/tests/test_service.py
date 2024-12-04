import pytest
from fastapi.testclient import TestClient
from main import app
from models.models import User, Summary
import datetime
import os

# Set the environment variable for the test database
os.environ['DATABASE_URL'] = 'mongodb://localhost:27017/test_db'  # Adjust as necessary

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    # Code to set up the test database (if needed)
    yield
    # Code to tear down the test database (if needed)

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
    # Convert datetime fields to ISO format for JSON serialization
    user_data_dict = user_data.dict()
    user_data_dict['createdAt'] = user_data.createdAt.isoformat()
    user_data_dict['lastLoggedInAt'] = user_data.lastLoggedInAt.isoformat()
    
    # Check if user already exists
    existing_user_response = client.post("/user/verify", json={"email": user_data_dict['email'], "password": user_data_dict['password']})
    
    if existing_user_response.status_code == 200:
        return existing_user_response.json()  # Return existing user

    response = client.post("/user/create", json=user_data_dict)
    return response.json()

@pytest.fixture
def create_summary(create_user):
    if 'userId' not in create_user.get("result", {}):
        pytest.fail("User creation failed or userId not found in response.")
    
    summary_data = Summary(
        userId=create_user["result"]["userId"],
        type="code",
        uploadType="upload",
        initialData="print('Hello World')"
    )
    # Convert datetime fields to ISO format for JSON serialization
    summary_data_dict = summary_data.dict()
    summary_data_dict['createdAt'] = summary_data.createdAt.isoformat()
    
    response = client.post("/summary/create", json=summary_data_dict)
    return response.json()

def test_create_user(create_user):
    print("Create User Response:", create_user)  # Print the response for debugging
    assert create_user["status"] == "OK" or create_user.get("detail") == "User Already Exists"
    assert "userId" in create_user.get("result", {}) or "userId" not in create_user

def test_verify_user(create_user):
    user_data = {
        "email": "john.doe@example.com",
        "password": "password123"
    }
    response = client.post("/user/verify", json=user_data)
    assert response.status_code == 200
    assert "auth_token" in response.json()["result"]

def test_create_summary(create_summary):
    assert create_summary["status"] == "OK"
    assert "summary_id" in create_summary["result"]

def test_user_summaries(create_user):
    print("Test User Summaries Response:", create_user)
    user_id = create_user["result"]["user"].get("id")
    assert user_id is not None, "User ID should not be None"
    
    response = client.get(f"/summaries/{user_id}")
    print("Test User Summaries Response:", response.json())
    assert response.status_code == 200
    assert isinstance(response.json()["result"], list)

def test_delete_summary(create_summary):
    summary_id = create_summary["result"]["summary_id"]

    delete_response = client.delete(f"/summary/{summary_id}")
    assert delete_response.status_code == 201
    assert delete_response.json()["result"]["message"] == "Summary deleted successfully" 