export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const data = req.body || {};

  if (!data || !data.event_name) {
    return res.status(200).json({ status: "error", message: "Dados inválidos" });
  }

  const pixelId = "1059470159233925";
  const accessToken = "EAAZAyEHxz9GkBSBk1hTFdr5cZCEZCzVNkFGOHEU50ZCKxmEnagA61CqUd0nABTBpTiLH7souQZCzm3P9o5iAs9QDk8AqYb0RqFzlXZAC0pDJ0b4g5QAQYijSKZAHpoD3OTq2vs5fOJZB7GYBYx6uwOzcCphXbPkDtmQzmxxBA1jXxScTMTD3qvNc3lLJeUTeLwZDZD";

  const eventName = data.event_name;
  const eventId = data.event_id || '';
  const sourceUrl = data.source_url || '';
  const fbc = data.fbc || '';
  const fbp = data.fbp || '';
  
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const clientUserAgent = req.headers['user-agent'] || '';

  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: sourceUrl,
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: clientUserAgent
        }
      }
    ]
  };

  if (eventId) {
    eventData.data[0].event_id = eventId;
  }
  if (fbc) {
    eventData.data[0].user_data.fbc = fbc;
  }
  if (fbp) {
    eventData.data[0].user_data.fbp = fbp;
  }

  if (data.value !== undefined) {
    eventData.data[0].custom_data = {
      value: parseFloat(data.value),
      currency: data.currency || 'BRL'
    };
  }
  if (data.content_name) {
    if (!eventData.data[0].custom_data) {
      eventData.data[0].custom_data = {};
    }
    eventData.data[0].custom_data.content_name = data.content_name;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    const responseText = await fetchResponse.json();
    return res.status(200).json({ status: "success", fb_response: responseText });
  } catch (error) {
    return res.status(200).json({ status: "error", message: "Erro ao conectar com API do Facebook", details: error.message });
  }
}
