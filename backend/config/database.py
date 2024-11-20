from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

uri = "mongodb+srv://admin:admin@cluster0.a039z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
client = MongoClient(uri, tlsCAFile=certifi.where(), server_api=ServerApi('1'))

db = client.internaldb
users_collection_name = db["users"]
summaries_collection_name = db["summaries"]