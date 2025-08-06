import os
import requests

APPWRITE_ENDPOINT = os.getenv("APPWRITE_FUNCTION_ENDPOINT")  # es. https://67fd...appwrite.global/v1
APPWRITE_PROJECT = os.getenv("APPWRITE_PROJECT_ID")    # ID del progetto
APPWRITE_FUNCTION_ID = os.getenv("APPWRITE_FUNCTION_ID")  # ID della funzione da eseguire
APPWRITE_FUNCTION_KEY = os.getenv("APPWRITE_FUNCTION_KEY")  # API Key valida

URL = f"{APPWRITE_ENDPOINT}/functions/{APPWRITE_FUNCTION_ID}/executions"

headers = {
    "X-Appwrite-Project": APPWRITE_PROJECT,
    "X-Appwrite-Key": APPWRITE_FUNCTION_KEY,
    "Content-Type": "application/json"
}

payload = {
    "source": "manual-return",
    "chat_id": "123456789",
    "step": 0,
    "secret_token": os.getenv("SECRET_TOKEN")
}

try:
    res = requests.post(URL, json=payload, headers=headers, timeout=10)
    print("✅ Risposta Appwrite:", res.status_code, res.text)
except Exception as e:
    print("❌ Errore di connessione:", str(e))
