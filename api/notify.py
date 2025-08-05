import os
import time
import email
import imaplib
import re
import json
import requests
from urllib.parse import parse_qs

EMAIL_ACCOUNT = os.environ["EMAIL_ACCOUNT"]
EMAIL_PASSWORD = os.environ["EMAIL_PASSWORD"]
APPWRITE_ENDPOINT = os.environ["APPWRITE_FUNCTION_ENDPOINT"]
APPWRITE_KEY = os.environ["APPWRITE_FUNCTION_KEY"]

def handler(event, context):
    # Estrai i parametri dal link
    params = parse_qs(event["rawQuery"])
    chat_id = params["chat_id"][0]
    step = int(params["step"][0])
    expected_amount = float(params["amount"][0])

    print(f"✅ Inizio monitoraggio pagamento PayPal per chat_id={chat_id}, step={step}, amount={expected_amount:.2f}€")

    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
    mail.select("inbox")

    found = False
    for _ in range(60):  # 5 minuti (60 * 5s)
        result, data = mail.search(None, '(UNSEEN FROM "service@paypal.it")')
        if result == "OK":
            ids = data[0].split()
            for email_id in reversed(ids):
                result, msg_data = mail.fetch(email_id, "(RFC822)")
                if result != "OK":
                    continue
                raw_email = msg_data[0][1]
                msg = email.message_from_bytes(raw_email)

                subject = msg["Subject"]
                if not subject or "Hai ricevuto" not in subject:
                    continue

                # Leggiamo il corpo
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() == "text/plain":
                            body = part.get_payload(decode=True).decode(errors="ignore")
                            break
                else:
                    body = msg.get_payload(decode=True).decode(errors="ignore")

                # Trova l'importo ricevuto
                match = re.search(r"Hai ricevuto €\s*([\d,]+)", body)
                if match:
                    amount_str = match.group(1).replace(",", ".")
                    try:
                        amount = float(amount_str)
                        if abs(amount - expected_amount) < 0.01:
                            found = True
                            print(f"💰 Pagamento trovato: €{amount:.2f}")
                            break
                    except:
                        continue
        if found:
            break
        time.sleep(5)

    mail.logout()

    if found:
        # Chiama Appwrite per inviare la foto
        headers = {
            "X-Appwrite-Project": "default",
            "X-Appwrite-Key": APPWRITE_KEY,
            "Content-Type": "application/json"
        }
        data = {
            "chat_id": chat_id,
            "step": step
        }
        response = requests.post(APPWRITE_ENDPOINT, headers=headers, json=data)
        print("📨 Appwrite response:", response.status_code, response.text)
        return {
            "statusCode": 200,
            "body": json.dumps({"success": True, "message": "Pagamento confermato e foto inviata"})
        }

    return {
        "statusCode": 408,
        "body": json.dumps({"success": False, "message": "Nessun pagamento ricevuto entro 5 minuti"})
    }
