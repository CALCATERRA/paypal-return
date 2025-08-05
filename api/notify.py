import os
import time
import email
import imaplib
import re
import json
import requests

EMAIL_ACCOUNT = os.environ["EMAIL_ACCOUNT"]
EMAIL_PASSWORD = os.environ["EMAIL_PASSWORD"]
APPWRITE_ENDPOINT = os.environ["APPWRITE_FUNCTION_ENDPOINT"]
APPWRITE_KEY = os.environ["APPWRITE_FUNCTION_KEY"]

def handler(event, context):
    print("🚀 Funzione notify avviata")
    print("📥 Metodo ricevuto:", event.get("httpMethod", ""))

    try:
        body = json.loads(event.get("body", "{}"))
        chat_id = body["chat_id"]
        step = int(body["step"])
        expected_amount = float(body["amount"])
    except Exception as e:
        print(f"❌ Errore nel parsing dei parametri: {e}")
        return {
            "statusCode": 400,
            "body": json.dumps({"success": False, "message": "Parametri mancanti o non validi"})
        }

    print(f"✅ Inizio monitoraggio pagamento PayPal per chat_id={chat_id}, step={step}, amount={expected_amount:.2f}€")

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
        mail.select("inbox")

        found = False
        for attempt in range(60):  # fino a 5 minuti, 60*5s
            print(f"⏳ Tentativo {attempt+1}/60 di ricerca email non lette da service@paypal.it")
            result, data = mail.search(None, '(UNSEEN FROM "service@paypal.it")')

            if result == "OK":
                email_ids = data[0].split()
                print(f"📧 Trovate {len(email_ids)} email non lette")
                for email_id in reversed(email_ids):
                    res, msg_data = mail.fetch(email_id, "(RFC822)")
                    if res != "OK":
                        print("⚠️ Errore fetch email")
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)

                    subject = msg["Subject"] or ""
                    print(f"🔎 Subject: {subject}")
                    if "Hai ricevuto" not in subject:
                        continue

                    # Leggi corpo email
                    body_email = ""
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == "text/plain":
                                body_email = part.get_payload(decode=True).decode(errors="ignore")
                                break
                    else:
                        body_email = msg.get_payload(decode=True).decode(errors="ignore")

                    print("📃 Corpo email ricevuto")

                    # Cerca importo nel testo
                    match = re.search(r"Hai ricevuto €\s*([\d,.]+)", body_email)
                    if match:
                        amount_str = match.group(1).replace(",", ".")
                        try:
                            amount = float(amount_str)
                            print(f"💶 Importo letto: €{amount:.2f}")
                            # Qui controllo esatto senza tolleranza
                            if amount == expected_amount:
                                found = True
                                print("✅ Pagamento confermato!")
                                # Segna l'email come letta
                                mail.store(email_id, '+FLAGS', '\\Seen')
                                break
                        except Exception as e:
                            print(f"❌ Errore conversione importo: {e}")

            if found:
                break
            time.sleep(5)

        mail.logout()

        if found:
            # Chiamata ad Appwrite per inviare la foto
            headers = {
                "X-Appwrite-Project": "default",
                "X-Appwrite-Key": APPWRITE_KEY,
                "Content-Type": "application/json"
            }
            data = {"chat_id": chat_id, "step": step}
            print("🚀 Invio richiesta a funzione Appwrite...")
            response = requests.post(APPWRITE_ENDPOINT, headers=headers, json=data)
            print(f"📨 Risposta Appwrite: {response.status_code} {response.text}")

            if response.status_code == 200:
                return {
                    "statusCode": 200,
                    "body": json.dumps({"success": True, "message": "Pagamento confermato e foto inviata"})
                }
            else:
                return {
                    "statusCode": 500,
                    "body": json.dumps({"success": False, "message": "Errore nell'invio foto tramite Appwrite"})
                }
        else:
            print("⌛ Nessun pagamento rilevato entro il tempo limite.")
            return {
                "statusCode": 408,
                "body": json.dumps({"success": False, "message": "Nessun pagamento ricevuto entro 5 minuti"})
            }

    except Exception as e:
        print(f"❌ Errore generale: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"success": False, "message": "Errore interno del server"})
        }
