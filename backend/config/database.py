import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from gridfs import GridFS
import certifi

# Load environment variables
load_dotenv()

# Use environment variable for the database URI
uri = os.getenv('DATABASE_URL')

if not uri:
    raise ValueError("Missing required environment variables. Please check your .env file.")

client = MongoClient(uri, tlsCAFile=certifi.where(), server_api=ServerApi('1'))

db = client.internaldb
users_collection_name = db["users"]
summaries_collection_name = db["summaries"]
shared_summaries_collection_name = db["shared_summaries"]

grid_fs = GridFS(db)
