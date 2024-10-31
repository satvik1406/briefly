def initial_serialiser(object) -> dict:
    return {
        "id": str(object["_id"]),
        "name": str(object["name"]),
        "age": str(object["age"])
    }

def list_serialiser(objects) -> list:
    return [initial_serialiser(object) for object in objects]