
import datetime

def user_serialiser(object) -> dict:
    return {
        "id": str(object["_id"]),
        "firstName": str(object["firstName"]),
        "lastName": str(object["lastName"]),
        "phone": str(object["phone"]),
        "email": str(object["email"]),
        "createdAt": str(object["createdAt"]),
        "lastLoggedInAt": str(object["lastLoggedInAt"])
    }

def user_list_serialiser(objects) -> list:
    return [user_serialiser(object) for object in objects]

def summary_serialiser(object) -> dict:
    serialized_data =  {
        "id": str(object["_id"]),
        "userId": str(object["userId"]),
        "type": str(object["type"]),
        "uploadType": str(object["uploadType"]),
        "initialData": str(object["initialData"]),
        "outputData": str(object["outputData"]),
        "createdAt": str(object["createdAt"]),
        "title": str(object["title"])
    }

    if "filedata" in object and object["filedata"]:
        serialized_data["fileName"] = object["filedata"].get("filename", None)
        serialized_data["fileId"] = object["filedata"].get("file_id", None)
    
    return serialized_data

def summary_list_serialiser(objects) -> list:
    return [summary_serialiser(object) for object in objects]

def shared_summary_serialiser(record: dict, summary: dict, sender: dict) -> dict:
    """
    Serialize a single shared summary including input content (initialData).
    
    :param record: The shared summary record from `shared_summaries` collection.
    :param summary: The corresponding summary document from `summaries` collection.
    :param sender: The user document of the sender from `users` collection.
    :return: Serialized shared summary as a dictionary.
    """
    # Call summary_serialiser for the summary content
    serialized_summary = summary_serialiser(summary)
    
    shared_at = record.get("shared_at", datetime.datetime.now())
    return {
        "id": serialized_summary["id"],
        "title": serialized_summary.get("type", "Untitled Summary"),
        "content": serialized_summary.get("outputData", "No content available"),
        "inputContent": serialized_summary.get("initialData", "No initial data available"),
        "sharedBy": sender.get("email", "Unknown") if sender else "Unknown",
        "sharedAt": datetime.datetime.strftime(
            shared_at, "%B %d, %Y"
        ) if isinstance(shared_at, datetime.datetime) else "Invalid Date",
    }