from datetime import datetime

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
    return {
        "id": str(object["_id"]),
        "userId": str(object["userId"]),
        "type": str(object["type"]),
        "uploadType": str(object["uploadType"]),
        "initialData": str(object["type"]),
        "outputData": str(object["outputData"])
    }


def summary_list_serialiser(summaries):
    return [
        {
            "id": str(summary["_id"]),
            "title": summary.get("type", "Untitled Summary"),
            "content": summary.get("initialData", "No content available for this summary"),

            "date": datetime.strftime(
                summary.get("createdAt", datetime.now()), "%B %d, %Y"
            ) if isinstance(summary.get("createdAt"), datetime) else "Invalid Date",
        }
        for summary in summaries
    ]

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
    
    return {
        "id": serialized_summary["id"],  # Use the summary ID from the serialized summary
        "title": serialized_summary.get("type", "Untitled Summary"),  # Use type as title
        "content": serialized_summary.get("outputData", "No content available"),  # Use outputData as content
        "inputContent": serialized_summary.get("initialData", "No initial data available"),  # Use initialData as input content
        "sharedBy": sender.get("email", "Unknown"),  # Sender's email
        "sharedAt": datetime.strftime(
            record.get("shared_at", datetime.now()), "%B %d, %Y"
        ) if isinstance(record.get("shared_at"), datetime) else "Invalid Date",  # Formatted shared date
    }
