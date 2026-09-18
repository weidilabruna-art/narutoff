export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceita requisições POST para recebimento de webhook
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const payload = req.body || {};
  console.log("Recebendo webhook da TriboPay:", JSON.stringify(payload));

  // Retorna sucesso de recebimento do webhook (TriboPay espera 200 OK)
  return res.status(200).json({ success: true });
}
