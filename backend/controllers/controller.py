from models.object import Object
from config.database import collection_name
from schema.schema import list_serialiser

def get_object():
    object = list_serialiser(collection_name.find())
    return object

def post_object(obj: Object):
    collection_name.insert_one(dict(obj))