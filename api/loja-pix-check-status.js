export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const txid = req.query.txid || '';
  if (!txid) {
    return res.status(200).json({ status: "pending", error: "txid ausente" });
  }

  const apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

  try {
    const fetchResponse = await fetch(`https://api.tribopay.com.br/api/public/v1/transactions/${encodeURIComponent(txid)}?api_token=${apiToken}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const resData = await fetchResponse.json();

    let status = 'pending';
    if (resData?.payment_status) {
      status = resData.payment_status.toLowerCase();
    } else if (resData?.data?.payment_status) {
      status = resData.data.payment_status.toLowerCase();
    } else if (resData?.status) {
      status = resData.status.toLowerCase();
    } else if (resData?.data?.status) {
      status = resData.data.status.toLowerCase();
    }

    return res.status(200).json({
      status: status,
      raw: resData
    });
  } catch (error) {
    return res.status(200).json({
      status: "pending",
      error: "Erro de rede",
      details: error.message
    });
  }
}
