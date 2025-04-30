const axios = require("axios");

exports.handler = async function (event, context) {
  try {
    const body = JSON.parse(event.body);

    // 🔒 Controllo tipo evento
    if (body.event_type !== "CHECKOUT.ORDER.APPROVED") {
      console.log("📩 Evento ignorato:", body.event_type);
      return {
        statusCode: 200,
        body: "Evento ignorato"
      };
    }

    const orderId = body.resource.id;
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

    // 🔐 Dati per autenticazione PayPal
    const PAYPAL_CLIENT_ID = "AQkjs0Ptk4Zpl5u2ye3F9QfpwiSc0qeWotEpuACJ3j8qRSAbsPK0PJKa3-ZwE42Cpmy3eaBXemoAQa4i";
    const PAYPAL_SECRET = "EJ9BNB3r9MLMfHQdICy_w8AnCqRE6oaX_ZNSv-XhqbwZg8_KX-lKS9MW2pj9d9IOAcJ9jOAaogvssy1X";

    const basicAuth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString("base64");

    // 📡 Capture pagamento
    const captureRes = await axios.post(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`
        }
      }
    );

    console.log("✅ Pagamento catturato:", captureRes.data);

    // 📤 Chiama Appwrite
    const FUNCTION_ID = "67fd0175002fa4a735c4";
    const APPWRITE_API_KEY = "standard_9eb0f84522bd452ab9c78a14ae51298b6eb019b2f803a2c17221e37f422064137df7be925f7b6832eb91f511428779103737b1238b139c1cfffaa00b131a65dd1f203f8a54c2b163485319aa750920d3b3f03dedc78b46773e58470bdf3a9e7033d94896171fea4b8034f252405f0eaa5cc2c07ebb7e0634ad503a09262077ca";
    const APPWRITE_PROJECT_ID = "67f037f300060437d16d";
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
    console.error("❌ Errore IPN:", error.response?.data || error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
