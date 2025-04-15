const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  console.log("👉 Funzione chiamata");

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const chatId = body.chat_id;

    console.log("📥 chat_id ricevuto:", chatId);

    if (!chatId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'chat_id mancante' })
      };
    }

    const appwriteResponse = await fetch('https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/67fd0175002fa4a735c4/executions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': 'TUO_PROJECT_ID',
        'X-Appwrite-Key': 'LA_TUA_API_KEY'
      },
      body: JSON.stringify({
        source: 'manual-return',
        chat_id: chatId
      })
    });

    const result = await appwriteResponse.json();

    console.log("📤 Risposta da Appwrite:", result);

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('❌ Errore nella notify.js:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore interno del server' })
    };
  }
};
