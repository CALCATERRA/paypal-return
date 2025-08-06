import Imap from "imap";
import { simpleParser } from "mailparser";
import fetch from "node-fetch";

const EMAIL_ACCOUNT = process.env.EMAIL_ACCOUNT;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const APPWRITE_ENDPOINT = process.env.APPWRITE_FUNCTION_ENDPOINT;
const APPWRITE_KEY = process.env.APPWRITE_FUNCTION_KEY;
const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const SECRET_TOKEN = process.env.SECRET_TOKEN;

console.log("✅ notify.js è stato invocato");

function openInbox(imap) {
  return new Promise((resolve, reject) => {
    imap.openBox("INBOX", false, (err, box) => {
      if (err) reject(err);
      else resolve(box);
    });
  });
}

function searchUnreadPaypalEmails(imap) {
  return new Promise((resolve, reject) => {
    // Cerca email non lette da service@paypal.it
    imap.search(["UNSEEN", ['FROM', "service@paypal.it"]], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}

function fetchEmail(imap, uid) {
  return new Promise((resolve, reject) => {
    const f = imap.fetch(uid, { bodies: "" });
    f.on("message", (msg) => {
      let raw = "";
      msg.on("body", (stream) => {
        stream.on("data", (chunk) => {
          raw += chunk.toString("utf8");
        });
      });
      msg.once("end", () => {
        resolve(raw);
      });
    });
    f.once("error", reject);
  });
}

function markAsSeen(imap, uid) {
  return new Promise((resolve, reject) => {
    imap.addFlags(uid, "\\Seen", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function handler(event, context) {
  console.log("🚀 Funzione notify avviata");
  console.log("📥 Metodo ricevuto:", event.httpMethod);

  try {
    const body = JSON.parse(event.body || "{}");

    #if (body.secret !== SECRET_TOKEN) {
    #  console.log("❌ Token segreto non valido");
    #  return {
    #    statusCode: 403,
    #    body: JSON.stringify({ success: false, message: "Accesso non autorizzato" }),
    #  };
    #}

    const chat_id = body.chat_id;
    const step = parseInt(body.step, 10);
    const expected_amount = parseFloat(body.amount);

    console.log(`✅ Inizio monitoraggio pagamento PayPal per chat_id=${chat_id}, step=${step}, amount=${expected_amount.toFixed(2)}€`);

    const imap = new Imap({
      user: EMAIL_ACCOUNT,
      password: EMAIL_PASSWORD,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
    });

    // Promisify IMAP connection & logic
    const connectImap = () =>
      new Promise((resolve, reject) => {
        imap.once("ready", resolve);
        imap.once("error", reject);
        imap.connect();
      });

    await connectImap();
    await openInbox(imap);

    let found = false;

    // Faccio un solo tentativo, come nel python (se vuoi aumentare i tentativi, aggiungi un ciclo con delay)
    const emailIds = await searchUnreadPaypalEmails(imap);
    console.log(`📧 Trovate ${emailIds.length} email non lette da service@paypal.it`);

    for (let i = emailIds.length - 1; i >= 0; i--) {
      const uid = emailIds[i];
      const rawEmail = await fetchEmail(imap, uid);
      const parsed = await simpleParser(rawEmail);

      const subject = parsed.subject || "";
      console.log(`🔎 Subject: ${subject}`);

      if (!subject.includes("Hai ricevuto")) continue;

      const body_email = parsed.text || "";
      console.log("📃 Corpo email ricevuto");

      const match = body_email.match(/Hai ricevuto €\s*([\d.,]+)/);
      if (match) {
        let amountStr = match[1].replace(",", ".");
        let amount = parseFloat(amountStr);
        console.log(`💶 Importo letto: €${amount.toFixed(2)}`);

        if (Math.abs(amount - expected_amount) < 0.01) {
          found = true;
          console.log("✅ Pagamento confermato!");
          await markAsSeen(imap, uid);
          break;
        }
      }
    }

    imap.end();

    if (found) {
      const headers = {
        "X-Appwrite-Project": APPWRITE_PROJECT_ID,
        "X-Appwrite-Key": APPWRITE_KEY,
        "Content-Type": "application/json",
      };

      const data = {
        chat_id: chat_id,
        step: step,
        secret_token: SECRET_TOKEN,
      };

      console.log("🚀 Invio richiesta a funzione Appwrite...");
      const response = await fetch(APPWRITE_ENDPOINT, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
      });

      const text = await response.text();
      console.log(`📨 Risposta Appwrite: ${response.status} ${text}`);

      if (response.status === 200) {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: "Pagamento confermato e foto inviata" }),
        };
      } else {
        return {
          statusCode: 500,
          body: JSON.stringify({ success: false, message: "Errore nell'invio foto tramite Appwrite" }),
        };
      }
    } else {
      console.log("⌛ Nessun pagamento rilevato entro il tempo limite.");
      return {
        statusCode: 408,
        body: JSON.stringify({ success: false, message: "Nessun pagamento ricevuto entro 5 minuti" }),
      };
    }
  } catch (e) {
    console.log(`❌ Errore generale: ${e}`);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Errore interno del server" }),
    };
  }
}
