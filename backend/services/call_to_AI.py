import os
from mistralai import Mistral

prompts = {
    'code': "You are a code summarisation tool. Understand the given code and output the summary of the code. It should include all details including the input, logic and output of the code. Mention any potential errors at the end.",
    'research': "You are a research article summarisation tool. Go through the research article or excerpt given to you and summarize it. Make sure to include all the important findings in the article. Be as technical as you can be.",
    'generic': "You are a summarisation tool. You will be given a piece of text that you should summarize."
}

def call_to_AI(inputType, inputData):
    api_key = "UvZmnaaEx8y6tAYTjunw9dNDyXGe11qD"
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
                "role": "user",
                "content": inputData,
            },
        ]
    )
    outputData = chat_response.choices[0].message.content 
    if "Summary:**\n\n" in outputData:
        outputData = outputData.split("Summary:**\n\n")[1]
    return outputData