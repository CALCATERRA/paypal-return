# api/notify.py

import json
import requests
import os

def handler(event, context):
    try:
        body = json.loads(event['body'])
        chat_id = body.get('chat_id')

        if not chat_id:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing chat_id"})
            }

        # 🔁 Manda la richiesta ad Appwrite (o direttamente a Telegram)
        res = requests.post(
            "https://680250b299914130d313.fra.appwrite.run/",
            headers={"Content-Type": "application/json"},
            json={"source": "manual-return", "chat_id": chat_id}
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # CORS!
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps({"status": "ok"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
