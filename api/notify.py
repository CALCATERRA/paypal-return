# api/notify.py

import json
import requests

def handler(event, context):
    try:
        body = json.loads(event['body'])

        # Caso 1: Richiamo manuale (bottone su index.html)
        if body.get("source") == "manual-return":
            chat_id = body.get("chat_id")
            step = body.get("step")

            if not chat_id or step is None:
                return {
                    "statusCode": 400,
                    "body": json.dumps({"error": "Missing chat_id or step"})
                }

            # Chiama main.py
            requests.post(
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
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                },
                "body": json.dumps({"status": "ok"})
            }

        # Caso 2: Webhook da PayPal
        if body.get("event_type") == "PAYMENT.CAPTURE.COMPLETED":
            custom_id = body.get("resource", {}).get("custom_id")

            if custom_id and "-" in custom_id:
                chat_id, step = custom_id.split("-")

                # Manda stessa richiesta del bottone (così funziona tutto senza cambiare main.py)
                requests.post(
                    "https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/67fd0175002fa4a735c4/executions",
                    headers={"Content-Type": "application/json"},
                    json={
                        "source": "manual-return",  # <-- FONDAMENTALE!
                        "chat_id": chat_id,
                        "step": int(step)
                    }
                )

                return {
                    "statusCode": 200,
                    "body": json.dumps({"status": "ok"})
                }

        # Nessuna azione utile
        return {
            "statusCode": 200,
            "body": json.dumps({"status": "ignored"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
