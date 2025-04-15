const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const chatId = body.chat_id;

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
        'X-Appwrite-Project': '67fd01767b6cc3ff6cc6',
        'X-Appwrite-Key': 'standard_9eb0f84522bd452ab9c78a14ae51298b6eb019b2f803a2c17221e37f422064137df7be925f7b6832eb91f511428779103737b1238b139c1cfffaa00b131a65dd1f203f8a54c2b163485319aa750920d3b3f03dedc78b46773e58470bdf3a9e7033d94896171fea4b8034f252405f0eaa5cc2c07ebb7e0634ad503a09262077ca'
      },
      body: JSON.stringify({
        source: 'manual-return',
        chat_id: chatId
      })
    });

    const result = await appwriteResponse.json();

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Errore:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore interno del server' })
    };
  }
};
