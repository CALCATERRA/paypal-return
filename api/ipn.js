const querystring = require("querystring");
const https = require("https");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ipnBody = event.body;

  // Prepara i dati per la verifica con PayPal
  const verificationBody = `cmd=_notify-validate&${ipnBody}`;

  // Verifica IPN con PayPal
  const isVerified = await new Promise((resolve) => {
    const req = https.request(
      {
        host: "ipnpb.paypal.com",
        method: "POST",
        path: "/cgi-bin/webscr",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(verificationBody),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data === "VERIFIED"));
      }
    );

    req.on("error", (err) => {
      console.error("Errore nella verifica IPN:", err);
      resolve(false);
    });

    req.write(verificationBody);
    req.end();
  });

  if (!isVerified) {
    console.warn("IPN non verificato");
    return { statusCode: 400, body: "IPN non verificato" };
  }

  const parsed = querystring.parse(ipnBody);

  if (parsed.payment_status !== "Completed") {
    return { statusCode: 200, body: "Pagamento non completato" };
  }

  const [chat_id, step] = parsed.custom?.split(":") || [];

  if (!chat_id || !step) {
    console.error("Chat ID o Step mancanti");
    return { statusCode: 400, body: "chat_id o step mancanti" };
  }

  // Qui puoi chiamare Appwrite o inviare a Telegram
  // Ad esempio: invio POST alla funzione Appwrite

  try {
    await fetch("https://67f6d3471e1e1546c937.appwrite.global/functions/67f6d345003e6da67d40/executions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, step: parseInt(step) })
    });

    return { statusCode: 200, body: "OK - Notifica inviata" };
  } catch (error) {
    console.error("Errore invio notifica:", error);
    return { statusCode: 500, body: "Errore invio notifica" };
  }
};
