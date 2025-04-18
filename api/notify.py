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
            "https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/680250b10020b9b9190d/executions",
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
