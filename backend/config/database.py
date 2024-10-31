from pymongo import MongoClient
from pymongo.server_api import ServerApi
import certifi

uri = "mongodb+srv://admin:user123@brieflyapplicationclust.g7ifw.mongodb.net/?retryWrites=true&w=majority&appName=BrieflyApplicationCluster"
client = MongoClient(uri, tlsCAFile=certifi.where(), server_api=ServerApi('1'))

db = client.internaldb
collection_name = db["object_collection"]