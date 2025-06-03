# api/notify.py

import json
import requests

def handler(event, context):
    try:
        body = json.loads(event['body'])

        # 🔍 Caso 1: Richiesta manuale da bottone su index.html
        if body.get("source") == "manual-return":
            chat_id = body.get("chat_id")
            step = body.get("step")

            if not chat_id or step is None:
                return {
                    "statusCode": 400,
                    "body": json.dumps({"error": "Missing chat_id or step"})
                }

            print(f"🔁 Richiamo manuale: chat_id={chat_id}, step={step}")

            # Chiama Appwrite (main.py)
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
                "body": json.dumps({"status": "ok", "from": "manual"})
            }

        # 🔍 Caso 2: Webhook PayPal
        event_type = body.get("event_type")
        resource = body.get("resource", {})

        if event_type == "PAYMENT.CAPTURE.COMPLETED":
            custom_id = resource.get("custom_id")

            if custom_id and "-" in custom_id:
                chat_id, step = custom_id.split("-")
                print(f"💰 Pagamento ricevuto da PayPal: chat_id={chat_id}, step={step}")

                # Chiama Appwrite per mandare la foto
                requests.post(
                    "https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/67fd0175002fa4a735c4/executions",
                    headers={"Content-Type": "application/json"},
                    json={
                        "source": "paypal",
                        "chat_id": chat_id,
                        "step": int(step)
                    }
                )

                return {
                    "statusCode": 200,
                    "body": json.dumps({"status": "ok", "from": "paypal"})
                }

        # ⚠️ Nessuna azione eseguita
        return {
            "statusCode": 200,
            "body": json.dumps({"status": "ignored"})
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
