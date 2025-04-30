const querystring = require("querystring");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  const rawBody = event.body;

  // Forward the data to PayPal for IPN validation
  const validationBody = `cmd=_notify-validate&${rawBody}`;

  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  const response = await fetch("https://ipnpb.paypal.com/cgi-bin/webscr", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: validationBody
  });

  const verification = await response.text();

  if (verification === "VERIFIED") {
    // ✅ OK: IPN ricevuto e valido da PayPal
    const data = querystring.parse(rawBody);

    const [chat_id, step] = (data.custom || "").split(":");

    // Esempio: chiama il tuo endpoint Appwrite o Telegram
    console.log("✅ IPN verificato", { chat_id, step });

    return {
      statusCode: 200,
      body: "IPN ricevuto e verificato"
    };
  } else {
    console.warn("❌ IPN NON verificato", verification);
    return {
      statusCode: 400,
      body: "IPN non valido"
    };
  }
};
