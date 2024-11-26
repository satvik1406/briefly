from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

uri = "mongodb+srv://admin:user123@brieflyapplicationclust.g7ifw.mongodb.net/?retryWrites=true&w=majority&appName=BrieflyApplicationCluster"
client = MongoClient(uri, tlsCAFile=certifi.where(), server_api=ServerApi('1'))

db = client.internaldb
users_collection_name = db["users"]
summaries_collection_name = db["summaries"]
shared_summaries_collection_name = db["shared_summaries"]