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
