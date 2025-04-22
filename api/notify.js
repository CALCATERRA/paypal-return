const fetch = require('node-fetch');

exports.handler = async function (event, context) {
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

    if (!chatId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'chat_id mancante' })
      };
    }

    fetch('https://67fd01767b6cc3ff6cc6.appwrite.global/v1/functions/67fd0175002fa4a735c4/executions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': '67fd01767b6cc3ff6cc6',
        'X-Appwrite-Key': 'standard_9eb0...'
      },
      body: JSON.stringify({
        source: 'manual-return',
        chat_id: chatId
      })
    }).catch(err => console.error("Errore Appwrite:", err));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ status: 'notifica inviata' })
    };
  } catch (error) {
    console.error('Errore:', error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Errore interno del server' })
    };
  }
};
