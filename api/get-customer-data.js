export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const paymentId = req.query.paymentId || '';
  if (!paymentId) {
    return res.status(200).json({ success: false, error: "paymentId ausente" });
  }

  const apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

  try {
    const fetchResponse = await fetch(`https://api.tribopay.com.br/api/public/v1/transactions/${encodeURIComponent(paymentId)}?api_token=${apiToken}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    const resData = await fetchResponse.json();

    const cust = resData?.customer || resData?.data?.customer;
    if (cust) {
      return res.status(200).json({
        success: true,
        customer: {
          customer_name: cust.name || '',
          customer_email: cust.email || '',
          customer_phone: cust.phone_number || '',
          customer_document: cust.document || ''
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        error: "Cliente nao encontrado na transacao",
        raw: resData
      });
    }
  } catch (error) {
    return res.status(200).json({
      success: false,
      error: "Erro de rede",
      details: error.message
    });
  }
}
