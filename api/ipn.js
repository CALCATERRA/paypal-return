const axios = require("axios");

exports.handler = async function (event, context) {
  try {
    const body = JSON.parse(event.body);

    // 🔒 Controllo tipo evento
    if (body.event_type !== "CHECKOUT.ORDER.APPROVED") {
      return {
        statusCode: 200,
        body: "Evento ignorato"
      };
    }

    const purchaseUnit = body.resource.purchase_units?.[0];
    const customId = purchaseUnit?.custom_id;

    if (!customId || !customId.includes(":")) {
      return {
        statusCode: 400,
        body: "custom_id mancante o malformato"
      };
    }

    const [chat_id, stepStr] = customId.split(":");
    const step = parseInt(stepStr);

    if (!chat_id || isNaN(step)) {
      return {
        statusCode: 400,
        body: "Dati non validi"
      };
    }

    // 🔁 Chiama la funzione main.py di Appwrite
    const FUNCTION_ID = "67f6d345003e6da67d40"; // <-- il tuo ID funzione
    const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY; // ⚠️ Da impostare in Netlify
    const APPWRITE_PROJECT_ID = process.env.APPWRITE_PROJECT_ID; // ⚠️ Da impostare in Netlify
    const APPWRITE_ENDPOINT = "https://cloud.appwrite.io/v1";

    const response = await axios.post(
      `${APPWRITE_ENDPOINT}/functions/${FUNCTION_ID}/executions`,
      {
        source: "manual-return",
        chat_id: chat_id,
        step: step
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": APPWRITE_PROJECT_ID,
          "X-Appwrite-Key": APPWRITE_API_KEY
        }
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "OK", executed: response.data })
    };
  } catch (error) {
    console.error("❌ Errore IPN:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
