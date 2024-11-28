import os
from mistralai import Mistral
api_key = "UvZmnaaEx8y6tAYTjunw9dNDyXGe11qD"

prompts = {
    'code': "You are a code summarisation tool. Understand the given code and output the summary of the code. It should include all details including the input, logic and output of the code. Mention any potential errors at the end.",
    'research': "You are a research article summarisation tool. Go through the research article or excerpt given to you and summarize it. Make sure to include all the important findings in the article. Be as technical as you can be.",
    'documentation': "You are a summarisation tool. You will be given a piece of text that you should summarize."
}

def call_to_AI(inputType, inputData):
    model = "open-mistral-nemo"
    if inputType == "code":
        model = "open-codestral-mamba"
    client = Mistral(api_key=api_key)
    chat_response = client.chat.complete(
        model = model,
        messages = [
            {
                "role": "system",
                "content": prompts[inputType],
            },
            {
                "role": "system",
                "content": '''You should also give a title to the summary. Your output should strictly be of the below format.
                
                **Title:** (Title here)
                
                **Summary:** (Summary here)
                ''',
            },
            {
                "role": "user",
                "content": inputData,
            }
        ]
    )
    outputData = chat_response.choices[0].message.content 
    return outputData

def regenerate_feedback(summary_data, feedback):
    inputType = summary_data['type']
    model = "open-mistral-nemo"
    if  inputType == "code":
        model = "open-codestral-mamba"

    client = Mistral(api_key=api_key)
    chat_response = client.chat.complete(
        model = model,
        messages = [
            {
                "role": "system",
                "content": "",
            },
            {
                "role": "system",
                "content": '''You should also give a title to the summary. Your output should strictly be of the below format.
                
                **Title:** (Title here)
                
                **Summary:** (Summary here)
                ''',
            },
            {
                "role": "user",
                "content": summary_data['initialData'],
            },
            {
                "role": "assistant",
                "content": summary_data['outputData'],
            },
            {
                "role": "user",
                "content": feedback
            },
            {
                "role": "system",
                "content": "Regenerate the summary based on the feedback provided by the user. Make sure you strictly follow the same format for the output."
            }
        ]
    )
    outputData = chat_response.choices[0].message.content 
    return outputData