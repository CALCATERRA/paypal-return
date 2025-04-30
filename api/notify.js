export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const chatId = body.chat_id;
    const step = body.step;

    if (!chatId || step === undefined) {
      console.log("❌ chat_id o step mancante", body);
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'chat_id o step mancante' })
      };
    }

    const response = await fetch('https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/67fd0175002fa4a735c4/executions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': '67fd01767b6cc3ff6cc6',
        'X-Appwrite-Key': 'standard_9eb0...' // <-- Sostituiscila con la tua vera chiave
      },
      body: JSON.stringify({
        source: 'manual-return',
        chat_id: chatId,
        step: step
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Errore Appwrite:", result);
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Errore da Appwrite', detail: result })
      };
    }

    console.log("✅ Successo:", result);
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ status: 'notifica inviata', result })
    };
  } catch (error) {
    console.error("❌ Errore interno:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Errore interno del server', detail: error.message })
    };
  }
}
