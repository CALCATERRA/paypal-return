const fetch = require('node-fetch');

exports.handler = async (event) => {
  const body = JSON.parse(event.body || '{}');
  const chatId = body.chat_id;

  if (!chatId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "chat_id mancante" })
    };
  }

  try {
    const appwriteResponse = await fetch("https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/67fd0175002fa4a735c4/executions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "manual-return", chat_id: chatId })
    });

    const result = await appwriteResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ status: "ok", result })
    };
  } catch (err) {
    console.error("Errore nella fetch:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Errore durante la richiesta a Appwrite" })
    };
  }
};
