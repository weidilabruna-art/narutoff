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
  
  let amountStr = data.amount || '0,00';
  amountStr = amountStr.replace(/\./g, '').replace(',', '.');
  let amountCents = Math.round(parseFloat(amountStr) * 100);
  if (isNaN(amountCents) || amountCents <= 0) {
    amountCents = 100;
  }

  const diamonds = parseInt(data.diamonds || '0');

  const customerName = data.nome || 'Cliente';
  const customerEmail = data.email || 'cliente@example.com';
  const customerPhone = (data.telefone || '').replace(/[^0-9]/g, '') || '11999999999';
  let customerDocument = (data.cpf || '').replace(/[^0-9]/g, '');

  if (customerDocument.length !== 11 || /^(\d)\1{10}$/.test(customerDocument)) {
    customerDocument = generateCPF();
  }

  const apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

  const mainOfferMap = {
    899: { title: 'Assinatura Semanal', product_hash: 'qdzyel6qgc', offer_hash: 'cxv6bgyc0w' },
    1290: { title: '1.060 Diamantes', product_hash: 'imnrkbs0vp', offer_hash: 'oillzkbya3' },
    1499: { title: 'Passe Booyah Plus', product_hash: 'qdzyel6qgc', offer_hash: 'wwmme' },
    1790: { title: '2.180 Diamantes', product_hash: 'iwwxcdzld2', offer_hash: 'b66yxism8i' },
    1990: { title: '2.180 Diamantes', product_hash: 'iwwxcdzld2', offer_hash: 'b66yxism8i' },
    1999: { title: 'Assinatura Mensal', product_hash: 'qdzyel6qgc', offer_hash: 'se0y0' },
    2899: { title: '2.800 Diamantes', product_hash: 'apubqrxdkq', offer_hash: 'kr76v1dhd1' },
    3690: { title: '5.600 Diamantes', product_hash: 'apubqrxdkq', offer_hash: 'kr76v1dhd1' },
    4990: { title: '22.400 Diamantes', product_hash: 'fs5pk2kipq', offer_hash: 'diivm29jls' },
    8399: { title: '22.400 Diamantes', product_hash: 'fs5pk2kipq', offer_hash: 'diivm29jls' }
  };

  let mainTitle = "Recarga Free Fire";
  let mainPrice = amountCents;
  let productHash = null;
  let offerHash = null;

  if (mainOfferMap[amountCents]) {
    const entry = mainOfferMap[amountCents];
    mainTitle = entry.title || "Recarga Free Fire";
    if (entry.diamond) {
      const selected = (diamonds >= 4000) ? entry.diamond : entry.other;
      productHash = selected.product_hash;
      offerHash = selected.offer_hash;
      mainTitle = selected.title || mainTitle;
    } else {
      productHash = entry.product_hash;
      offerHash = entry.offer_hash;
    }
  }

  let addonOfferInfo = null;

  if (!offerHash) {
    const subscriptionPrices = {
      899: { title: 'Assinatura Semanal', product_hash: 'qdzyel6qgc', offer_hash: 'cxv6bgyc0w' },
      1499: { title: 'Passe Booyah Plus', product_hash: 'qdzyel6qgc', offer_hash: 'wwmme' },
      1999: { title: 'Assinatura Mensal', product_hash: 'qdzyel6qgc', offer_hash: 'se0y0' }
    };
    const diamondOnlyMap = {
      1290: { title: '1.060 Diamantes', product_hash: 'imnrkbs0vp', offer_hash: 'oillzkbya3' },
      1790: { title: '2.180 Diamantes', product_hash: 'iwwxcdzld2', offer_hash: 'b66yxism8i' },
      1990: { title: '2.180 Diamantes', product_hash: 'iwwxcdzld2', offer_hash: 'b66yxism8i' },
      2899: { title: '2.800 Diamantes', product_hash: 'apubqrxdkq', offer_hash: 'kr76v1dhd1' },
      3690: { title: '5.600 Diamantes', product_hash: 'apubqrxdkq', offer_hash: 'kr76v1dhd1' },
      4990: { title: '22.400 Diamantes', product_hash: 'fs5pk2kipq', offer_hash: 'diivm29jls' },
      8399: { title: '22.400 Diamantes', product_hash: 'fs5pk2kipq', offer_hash: 'diivm29jls' }
    };

    for (const [dpStr, dData] of Object.entries(diamondOnlyMap)) {
      const dp = parseInt(dpStr);
      const remainder = amountCents - dp;
      if (remainder > 0 && subscriptionPrices[remainder]) {
        productHash = dData.product_hash;
        offerHash = dData.offer_hash;
        mainTitle = dData.title;
        mainPrice = dp;
        addonOfferInfo = { ...subscriptionPrices[remainder], price: remainder };
        break;
      }
    }
  }

  // Fallback baseado nos diamantes caso ainda não tenha sido mapeado pelo preço exato
  if (!offerHash || !productHash) {
    if (diamonds >= 15000) {
      productHash = 'fs5pk2kipq';
      offerHash = 'diivm29jls';
      mainTitle = '22.400 Diamantes';
    } else if (diamonds >= 4000) {
      productHash = 'apubqrxdkq';
      offerHash = 'kr76v1dhd1';
      mainTitle = '5.600 Diamantes';
    } else if (diamonds >= 2000) {
      productHash = 'iwwxcdzld2';
      offerHash = 'b66yxism8i';
      mainTitle = '2.180 Diamantes';
    } else if (diamonds >= 900) {
      productHash = 'imnrkbs0vp';
      offerHash = 'oillzkbya3';
      mainTitle = '1.060 Diamantes';
    }
  }

  if (!offerHash || !productHash) {
    const formattedPrice = (amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return res.status(200).json({
      error: `Preço não mapeado: ${formattedPrice}`,
      details: "Adicione o product_hash e offer_hash para este valor no backend"
    });
  }

  const orderBumpMap = {
    'calca-angelical-azul': { title: 'Calça Angelical Azul', product_hash: 'da5ccrjpsk', offer_hash: 'g8oh06qgke', price: 1799 },
    '2180-diamantes': { title: '2180 Diamantes Desconto', product_hash: 'iwwxcdzld2', offer_hash: 'b66yxism8i', price: 1528 },
    'conjunto-naruto': { title: 'Conjunto Naruto', product_hash: 'btvslj6omx', offer_hash: 'ozthkiwaqr', price: 2173 },
    'conjunto-sasuke': { title: 'Conjunto Sasuke', product_hash: 'wfme43czrb', offer_hash: 'mf4fq8todx', price: 1978 },
    'conjunto-kakashi': { title: 'Conjunto Kakashi', product_hash: 'hxtlktjxfx', offer_hash: 'mbexs7wylf', price: 1990 },
    'mascara-barba': { title: 'Máscara Antiga Barba do Velho', product_hash: 'syp1p8jl8m', offer_hash: 'ypwui', price: 1782 }
  };

  const selectedBumps = data.selected_orderbumps || [];
  const upsellOffers = [];
  let bumpsExtraCents = 0;
  const cartItems = [];

  cartItems.push({
    title: mainTitle,
    price: mainPrice,
    quantity: 1,
    operation_type: 1,
    tangible: false,
    product_hash: productHash
  });

  if (addonOfferInfo) {
    upsellOffers.push({
      product_hash: addonOfferInfo.product_hash,
      offer_hash: addonOfferInfo.offer_hash
    });
    cartItems.push({
      title: addonOfferInfo.title,
      price: addonOfferInfo.price,
      quantity: 1,
      operation_type: 1,
      tangible: false,
      product_hash: addonOfferInfo.product_hash
    });
  }

  for (const bump of selectedBumps) {
    const bumpId = bump.id || '';
    const bumpInfo = orderBumpMap[bumpId];
    if (!bumpInfo) continue;

    upsellOffers.push({
      product_hash: bumpInfo.product_hash,
      offer_hash: bumpInfo.offer_hash
    });
    
    const bumpPrice = bump.priceInCents !== undefined ? parseInt(bump.priceInCents) : bumpInfo.price;
    bumpsExtraCents += bumpPrice;

    cartItems.push({
      title: bumpInfo.title || bumpId.replace(/-/g, ' '),
      price: bumpPrice,
      quantity: 1,
      operation_type: 1,
      tangible: false,
      product_hash: bumpInfo.product_hash
    });
  }

  const totalFinalCents = amountCents + bumpsExtraCents;

  const transactionPayload = {
    product_hash: productHash,
    offer_hash: offerHash,
    amount: totalFinalCents,
    payment_method: "pix",
    customer: {
      name: customerName,
      email: customerEmail,
      phone_number: customerPhone,
      document: customerDocument
    },
    cart: cartItems,
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
    transactionPayload.metadata = trackingParams;
    transactionPayload.custom_data = trackingParams;
    Object.assign(transactionPayload, trackingParams);
  }

  const trackingFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'fbc', 'fbp'];
  for (const field of trackingFields) {
    if (data[field]) {
      transactionPayload[field] = data[field];
    }
  }

  try {
    const fetchResponse = await fetch(`https://api.tribopay.com.br/api/public/v1/transactions?api_token=${apiToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(transactionPayload)
    });

    const txRes = await fetchResponse.json();

    let pixCode = null;
    let txId = Math.random().toString(36).substring(7);

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

    if (pixCode) {
      return res.status(200).json({
        id: txId,
        pix: { qrcode: pixCode }
      });
    } else {
      return res.status(200).json({
        error: "Falha ao gerar PIX com a TriboPay",
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
