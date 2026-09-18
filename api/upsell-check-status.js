export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const paymentId = req.query.paymentId || req.query.txid || req.query.id || '';
  if (!paymentId) {
    return res.status(200).json({ status: "pending", error: "paymentId ausente" });
  }

  const apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

  try {
    const fetchResponse = await fetch(`https://api.tribopay.com.br/api/public/v1/transactions/${encodeURIComponent(paymentId)}?api_token=${apiToken}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const resData = await fetchResponse.json();

    let rawStatus = '';
    if (resData?.payment_status) {
      rawStatus = resData.payment_status.toLowerCase();
    } else if (resData?.data?.payment_status) {
      rawStatus = resData.data.payment_status.toLowerCase();
    } else if (resData?.status) {
      rawStatus = resData.status.toLowerCase();
    } else if (resData?.data?.status) {
      rawStatus = resData.data.status.toLowerCase();
    }

    let status = 'pending';
    if (rawStatus === 'paid' || rawStatus === 'approved' || rawStatus === 'completed') {
      status = 'paid';
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
