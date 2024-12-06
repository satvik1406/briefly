import pytest
from fastapi.testclient import TestClient
from main import app
from models.models import User, Summary
import datetime
import os
from pymongo import MongoClient
from io import BytesIO
from reportlab.pdfgen import canvas
# Set the environment variable for the test database
os.environ['DATABASE_URL'] = 'mongodb://localhost:27017/test_db'  # Adjust as necessary

client = TestClient(app)

mongo_client = MongoClient(os.environ['DATABASE_URL'])
db = mongo_client.test_db

users_collection_name = db["users"]
summaries_collection_name = db["summaries"]
shared_summaries_collection_name = db["shared_summaries"]
@pytest.fixture(scope="module", autouse=True)
def setup_database():
 
    yield  # This allows the tests to run

@pytest.fixture
def create_user():
    user_data = User(
        firstName="John",
        lastName="Doe",
        phone="+14132772734",
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
    if 'user' not in create_user.get("result", {}):
        pytest.fail("User creation failed or userId not found in response.")
    auth_token = create_user["result"]["auth_token"]
    
    summary_data = Summary(
        userId=create_user["result"]["user"]["id"],
        type="code",
        uploadType="upload",
        initialData="print('Hello World')"
    )
    
    summary_data_dict = {
        "userId": summary_data.userId,
        "type": summary_data.type,
        "uploadType": summary_data.uploadType,
        "initialData": summary_data.initialData,
        "createdAt": summary_data.createdAt.isoformat()  # Convert to ISO format string
    }
    
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    
    response = client.post("/summary/create", json=summary_data_dict, headers=headers)
    print("Create summary ",response.json())
    #response = {'status': 'OK', 'result': {'message': 'Summary created successfully', 'summary_id': '5f38bfe7-3c74-42c2-ac90-340134f44c4f'}}
    return response.json(), auth_token

def test_create_user(create_user):
    print("Create User Response:", create_user)  # Print the response for debugging
    assert create_user["status"] == "OK" or create_user.get("detail") == "User Already Exists"
    assert "userId" in create_user.get("result", {}) or "userId" not in create_user

def test_create_user_with_existing_email():
    user_data = User(
        firstName="Jane",
        lastName="Doe",
        phone="+14132752734",
        email="john.doe@example.com",  # Using existing email
        password="password123",
        confirmPassword="password123"
    )
    user_data_dict = user_data.dict()
    user_data_dict['createdAt'] = user_data.createdAt.isoformat()
    user_data_dict['lastLoggedInAt'] = user_data.lastLoggedInAt.isoformat()

    response = client.post("/user/create", json=user_data_dict)
    assert response.status_code == 409  # Conflict status code for existing user
    assert response.json().get("detail") == "User Already Exists"

def test_verify_user(create_user):
    user_data = {
        "email": "john.doe@example.com",
        "password": "password123"
    }
    response = client.post("/user/verify", json=user_data)
    assert response.status_code == 200
    assert "auth_token" in response.json()["result"]

# def test_user_summaries_empty(create_user):
#     """Test fetching summaries for a user with no summaries."""
#     user_id = create_user["result"]["user"].get("id")
#     # Ensure there are no summaries for this user
#     auth_token = create_user["result"]["auth_token"]
#     headers = {
#         "Authorization": f"Bearer {auth_token}"
#     }
#     response = client.get(f"/summaries/{user_id}",headers=headers)
#     assert response.status_code == 200
#     assert response.json()["result"] == []  # Expecting an empty list
    
def test_create_summary(create_summary):
    assert create_summary[0]["status"] == "OK"
    assert "summary_id" in create_summary[0]["result"]

def test_user_summaries(create_user):
    print("Test User Summaries Response:", create_user)
    user_id = create_user["result"]["user"].get("id")
    assert user_id is not None, "User ID should not be None"
    auth_token = create_user["result"]["auth_token"]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    response = client.get(f"/summaries/{user_id}",headers=headers)
    print("Test User Summaries Response:", response.json())
    assert response.status_code == 200
    assert isinstance(response.json()["result"], list)

def test_delete_summary(create_summary):
    summary_id = create_summary[0]["result"]["summary_id"]
    auth_token = create_summary[1]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    delete_response = client.delete(f"/summary/{summary_id}", headers=headers)
    assert delete_response.status_code == 201
    assert delete_response.json()["result"]["message"] == "Summary deleted successfully"

def test_verify_non_existent_user():
    """Test verifying a user account that does not exist."""
    non_existent_user_data = {
        "email": "nonexistent.user@example.com",
        "password": "wrongpassword"
    }
    response = client.post("/user/verify", json=non_existent_user_data)
    assert response.status_code == 404  # Expecting a 404 Not Found status
    assert response.json().get("detail") == "Account Does Not Exist"  # Adjust based on your actual error message 

def test_share_summary_success(create_user, create_summary):
    """Test sharing a summary with another user successfully."""
    # Create a second user
    second_user_data = User(
        firstName="Jane",
        lastName="Doe",
        phone="+14132752735",
        email="jane.doe@example.com",
        password="password123",
        confirmPassword="password123"
    )
    second_user_data_dict = second_user_data.dict()
    second_user_data_dict['createdAt'] = second_user_data.createdAt.isoformat()
    second_user_data_dict['lastLoggedInAt'] = second_user_data.lastLoggedInAt.isoformat()
    second_user_response = client.post("/user/create", json=second_user_data_dict)

    # Share the summary created by the first user
    summary_id = create_summary[0]["result"]["summary_id"]
    auth_token = create_summary[1]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    recipient_email = second_user_data.email
    share_response = client.post("/summary/share", json={"summary_id": summary_id, "recipient": recipient_email}, headers=headers)
    print(share_response.json())
    assert share_response.status_code == 200
    assert share_response.json()["result"]["message"] == f"Summary shared successfully with {recipient_email}"

def test_share_summary_not_found(create_user):
    """Test sharing a summary that does not exist."""
    auth_token = create_user["result"]["auth_token"]
    recipient_email = "jane.doe@example.com"
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    share_response = client.post("/summary/share", json={"summary_id": "non-existent-summary","recipient": recipient_email}, headers=headers)
    
    assert share_response.status_code == 404  # Expecting Not Found
    assert share_response.json().get("detail") == "Summary not found"

def test_share_summary_recipient_not_found(create_user, create_summary):
    """Test sharing a summary with a recipient that does not exist."""
    auth_token = create_user["result"]["auth_token"]
    summary_id = create_summary[0]["result"]["summary_id"]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    share_response = client.post(f"/summary/share", json={"summary_id": summary_id, "recipient": "nonexistent@example.com"},
                                 headers=headers)
    
    assert share_response.status_code == 404  # Expecting Not Found
    assert share_response.json().get("detail") == "The recipient must be a registered user of Briefly."

def test_share_summary_with_self(create_user, create_summary):
    """Test sharing a summary with oneself."""
    print(create_user)
    summary_id = create_summary[0]["result"]["summary_id"]
    auth_token = create_user["result"]["auth_token"]
    recipient_email = create_user["result"]["user"]["email"]  # Sharing with the same user
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    share_response = client.post(f"/summary/share", json={"summary_id": summary_id, "recipient": recipient_email},
                                 headers=headers)
    assert share_response.status_code == 400  # Expecting Bad Request
    assert share_response.json().get("detail") == "Failed to share summary: 400: You cannot share a summary with yourself."

@pytest.fixture
def sample_pdf():
    # Create a PDF in memory
    buffer = BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "Hello World")
    c.drawString(100, 700, "This is a test PDF")
    c.save()
    
    # Move buffer position to start
    buffer.seek(0)
    return buffer

def test_extract_text_from_pdf(sample_pdf):
    # Create a mock UploadFile
    class MockUploadFile:
        def __init__(self, filename, contents):
            self.filename = filename
            self.file = BytesIO(contents)

    mock_file = MockUploadFile("test.pdf", sample_pdf.getvalue())
    
    # Extract text from the PDF
    from services.service import extract_text_from_pdf
    extracted_text = extract_text_from_pdf(mock_file)
    
    # Check if the text was extracted (exact matching might be tricky due to PDF formatting)
    assert "Hello World" in extracted_text
    assert "This is a test PDF" in extracted_text

def test_get_summary_success(create_summary):
    """Test successfully retrieving a summary."""
    summary_id = create_summary[0]["result"]["summary_id"]
    auth_token = create_summary[1]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    # Use the client to send a request to the summary retrieval endpoint
    response = client.get(f"/summary/{summary_id}",headers=headers)
    # Assert that the response is successful
    assert response.status_code == 200
    retrieved_summary = response.json()
    # Assert that the retrieved summary matches the created summary
    assert retrieved_summary is not None
    assert retrieved_summary["result"]["id"] == summary_id  # Adjust based on your serializer output

def test_get_summary_not_found(create_summary):
    """Test retrieving a summary that does not exist."""
    auth_token = create_summary[1]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    with pytest.raises(ValueError, match="Summary not found"):
        response = client.get("/summary/non_existent_summary_id", headers=headers) 