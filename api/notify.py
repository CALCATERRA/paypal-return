# api/notify.py

import json
import requests

def handler(event, context):
    try:
        body = json.loads(event['body'])
        chat_id = body.get('chat_id')
        step = body.get('step')

        if not chat_id or step is None:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing chat_id or step"})
            }

        # 🔁 Manda la richiesta ad Appwrite (chiama main.py)
        res = requests.post(
            "https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/67fd0175002fa4a735c4/executions",
            headers={"Content-Type": "application/json"},
            json={
                "source": "manual-return",
                "chat_id": chat_id,
                "step": step
            }
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # CORS
                "Access-Control-Allow-Headers": "*"
            },
            "body": json.dumps({"status": "ok"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
