import pytest
import uuid
from fastapi.testclient import TestClient
from main import app
from models.models import User, Summary
import datetime
import os
from pymongo import MongoClient
from io import BytesIO
from reportlab.pdfgen import canvas
# Set the environment variable for the test database
os.environ['DATABASE_URL'] = 'mongodb+srv://admin:admin123@cluster0.jkvhz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'  # Adjust as necessary

client = TestClient(app)

mongo_client = MongoClient(os.environ['DATABASE_URL'])
db = mongo_client.internaldb

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    users_collection = db["users"]
    summaries_collection = db["summaries"]
    shared_summaries_collection = db["shared_summaries"]

    users_collection.drop()
    summaries_collection.drop()
    shared_summaries_collection.drop()
    # Dummy data for users
    user1 = User(
        firstName="Alice",
        lastName="Smith",
        phone="+14132752733",
        email="alice.smith@example.com",
        password="password123",
        confirmPassword="password123"
    )
    user1_dict = user1.dict()
    user1_dict['_id']= str(uuid.uuid4())
    user2 = User(
        firstName="Bob",
        lastName="Johnson",
        phone="+14132782738",
        email="bob.johnson@example.com",
        password="password123",
        confirmPassword="password123"
    )
    user2_dict = user2.dict()
    user2_dict['_id']= str(uuid.uuid4())
    # Insert users into the database
    users_collection.insert_many([user1_dict, user2_dict])  # Convert to dict for insertion

    # Dummy data for summaries
    summary1 = Summary(
        userId=str(uuid.uuid4()),  # Assuming userId is stored as email for this example
        type="code",
        uploadType="upload",
        initialData="print('Hello from Alice')",
        outputData= "This is a sample summary"
    )
    summary2 = Summary(
        userId=str(uuid.uuid4()),  # Assuming userId is stored as email for this example
        type="code",
        uploadType="upload",
        title="Title",
        initialData="print('Hello from Bob')",
        outputData= "This is a sample summary",
    )
    summary1_dict = summary1.dict()
    summary1_dict['_id']= str(uuid.uuid4())
    summary2_dict = summary2.dict()
    summary2_dict['_id']= str(uuid.uuid4())
    # Insert summaries into the database
    summaries_collection.insert_many([summary1_dict, summary2_dict])  # Convert to dict for insertion
    yield


    

@pytest.fixture
def create_user():
    user = User(
            firstName="John",
            lastName="Doe",
            phone="+14132772734",
            email="john.doe@example.com",
            password="password123",
            confirmPassword="password123"
        )
    
    # Convert datetime fields to ISO format for JSON serialization
    user_data_dict = user.dict()
    user_data_dict['createdAt'] = user.createdAt.isoformat()
    user_data_dict['lastLoggedInAt'] = user.lastLoggedInAt.isoformat()
    
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
    return response.json(), auth_token

def test_create_user():
    user = User(
            firstName="Test",
            lastName="User",
            phone="+14132072934",
            email="testnewuser@example.com",
            password="password123",
            confirmPassword="password123"
        )
    # Convert datetime fields to ISO format for JSON serialization
    user_data_dict = user.dict()
    user_data_dict['createdAt'] = user.createdAt.isoformat()
    user_data_dict['lastLoggedInAt'] = user.lastLoggedInAt.isoformat()
    response = client.post("/user/create", json=user_data_dict)
    assert response.json()["status"] == "OK" 
    db.users.delete_many({'email': user.email})


def test_create_user_with_existing_email():
    user_data = User(
        firstName="Alice",
        lastName="Smith",
        phone="+14132752733",
        email="alice.smith@example.com",
        password="password123"
    )
    user_data_dict = user_data.dict()
    user_data_dict['createdAt'] = user_data.createdAt.isoformat()
    user_data_dict['lastLoggedInAt'] = user_data.lastLoggedInAt.isoformat()

    response = client.post("/user/create", json=user_data_dict)
    assert response.status_code == 409  # Conflict status code for existing user
    assert response.json().get("detail") == "User Already Exists"

def test_verify_user():
    user_data = {
        "email": "alice.smith@example.com",
        "password": "password123"
    }
    response = client.post("/user/verify", json=user_data)
    assert response.status_code == 200
    assert "auth_token" in response.json()["result"]
    
def test_create_summary():
    user_data = {
        "email": "alice.smith@example.com",
        "password": "password123"
    }
    response = client.post("/user/verify", json=user_data)
    auth_token = response.json()['result']['auth_token'] 
    userId = response.json()['result']['user']['id']
    summary_data_dict = {
        "userId": userId,
        "type": "code",
        "uploadType": "upload",
        "initialData": "print('Hello World')",
        "createdAt": datetime.datetime.now(datetime.UTC).isoformat()  # Convert to ISO format string
    }
    
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    
    response = client.post("/summary/create", json=summary_data_dict, headers=headers)
    response = response.json()
    print("Create summary ",response)
    assert response["status"] == "OK"
    assert "summary_id" in response['result']

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

def test_get_shared_summaries_success(create_summary):
    """Test successfully retrieving shared summaries for a user."""
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
    existing_user_response = client.post("/user/verify", json={"email": second_user_data_dict['email'], "password": second_user_data_dict['password']})
    
    if existing_user_response.status_code == 200:
        second_user_response = existing_user_response
    else:
        second_user_response = client.post("/user/create", json=second_user_data_dict)
    
    
    # Share the summary created by the first user with the second user
    summary_id = create_summary[0]["result"]["summary_id"]
    auth_token = create_summary[1]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    client.post("/summary/share", json={"summary_id": summary_id, "recipient": second_user_data.email}, headers=headers)

    # Now retrieve shared summaries for the second user
    recipient_user_id = second_user_response.json()["result"]["user"]["id"]
    response = client.get(f"/user/{recipient_user_id}/shared-summaries", headers={"Authorization": f"Bearer {auth_token}"})
    assert response.status_code == 200
    assert isinstance(response.json()["result"], list)
    assert len(response.json()["result"]) > 0  

def test_get_shared_summaries_no_shared(create_user):
    """Test retrieving shared summaries for a user with no shared summaries."""
    user_id = create_user["result"]["user"]["id"]
    auth_token = create_user["result"]["auth_token"]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    response = client.get(f"/user/{user_id}/shared-summaries", headers=headers)
    
    assert response.status_code == 200
    assert response.json()["result"] == []  # Expecting an empty list

def test_get_shared_summaries_invalid_user(create_user):
    """Test retrieving shared summaries for a non-existent user."""
    invalid_user_id = "non_existent_user_id"
    auth_token = create_user["result"]["auth_token"]
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    response = client.get(f"/user/{invalid_user_id}/shared-summaries", headers=headers)

    assert response.status_code == 200  # Assuming the API returns an empty list for non-existent users
    assert response.json()["result"] == []  # Expecting an empty list since the user does not exist
