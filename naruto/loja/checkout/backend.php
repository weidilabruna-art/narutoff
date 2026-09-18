<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$input = file_get_contents('php://input');
$data  = json_decode($input, true);

if (!$data) {
    echo json_encode(["error" => "Dados de entrada inválidos"]);
    exit;
}

// ── Valor principal ───────────────────────────────────────────────────────────
$amountStr  = isset($data['amount']) ? $data['amount'] : '0,00';
$amountStr  = str_replace('.', '', $amountStr);
$amountStr  = str_replace(',', '.', $amountStr);
$amountCents = (int)round((float)$amountStr * 100);

if ($amountCents <= 0) { $amountCents = 100; }

// Diamonds enviados pelo frontend
$diamonds = isset($data['diamonds']) ? (int)$data['diamonds'] : 0;

// ── Dados do cliente ─────────────────────────────────────────────────────────
$customerName     = isset($data['nome'])     ? $data['nome']     : 'Cliente';
$customerEmail    = isset($data['email'])    ? $data['email']    : 'cliente@example.com';
$customerPhone    = isset($data['telefone']) ? preg_replace('/[^0-9]/', '', $data['telefone']) : '11999999999';
$customerDocument = isset($data['cpf'])      ? preg_replace('/[^0-9]/', '', $data['cpf'])      : '';

// Se o documento for vazio, tamanho diferente de 11/14 ou composto por digitos repetidos (ex: 00000000000)
if (strlen($customerDocument) !== 11 || preg_match('/^(\d)\1{10}$/', $customerDocument)) {
    $n1=rand(1,9);$n2=rand(0,9);$n3=rand(0,9);$n4=rand(0,9);
    $n5=rand(0,9);$n6=rand(0,9);$n7=rand(0,9);$n8=rand(0,9);$n9=rand(0,9);
    $d1=$n9*2+$n8*3+$n7*4+$n6*5+$n5*6+$n4*7+$n3*8+$n2*9+$n1*10;
    $d1=11-($d1%11); if($d1>=10)$d1=0;
    $d2=$d1*2+$n9*3+$n8*4+$n7*5+$n6*6+$n5*7+$n4*8+$n3*9+$n2*10+$n1*11;
    $d2=11-($d2%11); if($d2>=10)$d2=0;
    $customerDocument="$n1$n2$n3$n4$n5$n6$n7$n8$n9$d1$d2";
}

// ── Credenciais TriboPay ─────────────────────────────────────────────────────
$apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

// ── Mapa: preço (centavos) => ['product_hash' => ..., 'offer_hash' => ...] ──
$mainOfferMap = [
    899 => [
        'title'        => 'Assinatura Semanal',
        'product_hash' => 'qdzyel6qgc',
        'offer_hash'   => 'cxv6bgyc0w'  // Assinatura Semanal R$ 8,99
    ],
    1499 => [
        'title'        => 'Passe Booyah Plus',
        'product_hash' => 'qdzyel6qgc',
        'offer_hash'   => 'wwmme'       // Passe Booyah Plus R$ 14,99
    ],
    3690 => [
        'title'        => '5.600 Diamantes',
        'product_hash' => 'apubqrxdkq',
        'offer_hash'   => 'kr76v1dhd1'  // 5600 Diamantes R$ 36,90
    ],
    1999 => [
        'title'        => 'Assinatura Mensal',
        'product_hash' => 'qdzyel6qgc',
        'offer_hash'   => 'se0y0'       // Assinatura Mensal R$ 19,99
    ],
    2899 => [
        'title'        => '5.600 Diamantes',
        'product_hash' => 'apubqrxdkq',
        'offer_hash'   => 'kr76v1dhd1'  // 5600 Diamantes R$ 28,99 (legacy)
    ],
    8399 => [
        'title'        => '22.400 Diamantes',
        'product_hash' => 'fs5pk2kipq',
        'offer_hash'   => 'diivm29jls'  // 22400 Diamantes R$ 83,99
    ],
];

$mainTitle = "Recarga Free Fire";
$mainPrice = $amountCents;

if (isset($mainOfferMap[$amountCents])) {
    $entry = $mainOfferMap[$amountCents];
    $mainTitle = $entry['title'] ?? "Recarga Free Fire";
    if (isset($entry['diamond'])) {
        $selected = ($diamonds >= 1000) ? $entry['diamond'] : $entry['other'];
        $productHash = $selected['product_hash'];
        $offerHash   = $selected['offer_hash'];
        $mainTitle   = $selected['title'] ?? $mainTitle;
    } else {
        $productHash = $entry['product_hash'];
        $offerHash   = $entry['offer_hash'];
    }
}

// Se não encontrou preço exato, tenta decompor (pacote + assinatura)
$addonOfferInfo = null;

if (!$offerHash) {
    $subscriptionPrices = [
         899 => ['title' => 'Assinatura Semanal', 'product_hash' => 'qdzyel6qgc', 'offer_hash' => 'cxv6bgyc0w'],
        1499 => ['title' => 'Passe Booyah Plus', 'product_hash' => 'qdzyel6qgc', 'offer_hash' => 'wwmme'],
        1999 => ['title' => 'Assinatura Mensal', 'product_hash' => 'qdzyel6qgc', 'offer_hash' => 'se0y0'],
    ];
    $diamondOnlyMap = [
        3690 => ['title' => '5.600 Diamantes', 'product_hash' => 'apubqrxdkq', 'offer_hash' => 'kr76v1dhd1'],
        2899 => ['title' => '5.600 Diamantes', 'product_hash' => 'apubqrxdkq', 'offer_hash' => 'kr76v1dhd1'], // legacy
        8399 => ['title' => '22.400 Diamantes', 'product_hash' => 'fs5pk2kipq', 'offer_hash' => 'diivm29jls'],
    ];

    foreach ($diamondOnlyMap as $dp => $dData) {
        $remainder = $amountCents - $dp;
        if ($remainder > 0 && isset($subscriptionPrices[$remainder])) {
            $productHash    = $dData['product_hash'];
            $offerHash      = $dData['offer_hash'];
            $mainTitle      = $dData['title'];
            $mainPrice      = $dp;
            $addonOfferInfo = $subscriptionPrices[$remainder];
            $addonOfferInfo['price'] = $remainder;
            break;
        }
    }
}

if (!$offerHash || !$productHash) {
    echo json_encode([
        "error"   => "Preço não mapeado: R$ " . number_format($amountCents / 100, 2, ',', '.'),
        "details" => "Adicione o product_hash e offer_hash para este valor no backend.php"
    ]);
    exit;
}

// ── Mapa de Order Bumps ───────────────────────────────────────────────────────
$orderBumpMap = [
    'calca-angelical-vermelha'   => ['title' => 'Calça Angelical Vermelha', 'product_hash' => 'da5ccrjpsk', 'offer_hash' => 'g8oh06qgke', 'price' => 1799],
    '2180-diamantes'    => ['title' => '2180 Diamantes Desconto', 'product_hash' => 'iwwxcdzld2', 'offer_hash' => '2ujgh',      'price' => 1584],
    'conjunto-rey-mysterio'  => ['title' => 'Conjunto Rey Mysterio', 'product_hash' => 'btvslj6omx', 'offer_hash' => 'ozthkiwaqr', 'price' => 1439],
    'conjunto-rim' => ['title' => 'Conjunto Rim', 'product_hash' => 'wfme43czrb', 'offer_hash' => 'mf4fq8todx', 'price' => 1399],
    'mp5'       => ['title' => 'MP5 - Fascínio Dourado', 'product_hash' => 'hxtlktjxfx', 'offer_hash' => 'mbexs7wylf', 'price' => 1782],
];

// ── Helper: POST para a TriboPay ─────────────────────────────────────────────
function triboPost(string $endpoint, array $payload, string $token): array {
    $ch = curl_init('https://api.tribopay.com.br/api/public/v1' . $endpoint . '?api_token=' . $token);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    // Otimizações para evitar lentidão/timeout na requisição
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); // Força IPv4 (evita timeouts de resolução IPv6)
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Evita lentidão na validação SSL do servidor
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false); 
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10); // Cancela se não conectar em 10s
    curl_setopt($ch, CURLOPT_TIMEOUT, 15); // Tempo máximo total da requisição (15s)
    
    $res = curl_exec($ch);
    curl_close($ch);
    return json_decode($res, true) ?? [];
}

// ── Order Bumps selecionados ──────────────────────────────────────────────────
$selectedBumps = isset($data['selected_orderbumps']) && is_array($data['selected_orderbumps'])
    ? $data['selected_orderbumps'] : [];

$upsellOffers = [];
$bumpsExtraCents = 0;

// Se houve decomposição (ex: diamantes + assinatura), adiciona a assinatura no order_bumps
if ($addonOfferInfo) {
    $upsellOffers[] = [
        "product_hash" => $addonOfferInfo['product_hash'],
        "offer_hash"   => $addonOfferInfo['offer_hash']
    ];
}

$cartItems = [];

// Produto Principal
$cartItems[] = [
    "title"          => $mainTitle,
    "price"          => $mainPrice,
    "quantity"       => 1,
    "operation_type" => 1,
    "tangible"       => false,
    "product_hash"   => $productHash
];

if ($addonOfferInfo) {
    // Adiciona o Addon/Assinatura se existir
    $cartItems[] = [
        "title"          => $addonOfferInfo['title'],
        "price"          => $addonOfferInfo['price'],
        "quantity"       => 1,
        "operation_type" => 1,
        "tangible"       => false,
        "product_hash"   => $addonOfferInfo['product_hash']
    ];
}

foreach ($selectedBumps as $bump) {
    $bumpId   = $bump['id'] ?? '';
    $bumpInfo = $orderBumpMap[$bumpId] ?? null;
    if (!$bumpInfo) continue;

    $bumpPrice = isset($bump['priceInCents']) ? (int)$bump['priceInCents'] : ($bumpInfo['price'] ?? 0);
    $bumpsExtraCents += $bumpPrice;
    
    $bumpTitle = $bumpInfo['title'] ?? ucwords(str_replace('-', ' ', $bumpId));

    $cartItems[] = [
        "title"          => $bumpTitle,
        "price"          => $bumpPrice,
        "quantity"       => 1,
        "operation_type" => 1,
        "tangible"       => false,
        "product_hash"   => $bumpInfo['product_hash']
    ];
}

// O valor final da transação = valor base + order bumps
$totalFinalCents = $amountCents + $bumpsExtraCents;

$transactionPayload = [
    "product_hash"       => $productHash,
    "offer_hash"         => $offerHash,
    "amount"             => $totalFinalCents,
    "payment_method"     => "pix",
    "customer"           => [
        "name"         => $customerName,
        "email"        => $customerEmail,
        "phone_number" => $customerPhone,
        "document"     => $customerDocument
    ],
    "cart"               => $cartItems,
    "expire_in_days"     => 1,
    "transaction_origin" => "op1"
];

$trackingParams = [
    'utm_source'   => $data['utm_source'] ?? '',
    'utm_medium'   => $data['utm_medium'] ?? '',
    'utm_campaign' => $data['utm_campaign'] ?? '',
    'utm_content'  => $data['utm_content'] ?? '',
    'utm_term'     => $data['utm_term'] ?? '',
    'src'          => $data['src'] ?? '',
    'sck'          => $data['sck'] ?? '',
    'fbclid'       => $data['fbclid'] ?? '',
    'fbc'          => $data['fbc'] ?? '',
    'fbp'          => $data['fbp'] ?? ''
];
$trackingParams = array_filter($trackingParams);
if (!empty($trackingParams)) {
    $transactionPayload['metadata'] = $trackingParams;
    $transactionPayload['custom_data'] = $trackingParams;
    foreach ($trackingParams as $k => $v) {
        $transactionPayload[$k] = $v;
    }
}

$trackingFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'fbclid', 'fbc', 'fbp'];
foreach ($trackingFields as $field) {
    if (!empty($data[$field])) {
        $transactionPayload[$field] = $data[$field];
    }
}

// ── Cria transação na TriboPay ────────────────────────────────────────────────
$txRes = triboPost('/transactions', $transactionPayload, $apiToken);

$pixCode = null;
$txId    = uniqid();

// TriboPay pode retornar na raiz ou dentro de 'data' ou 'pix'
if (!empty($txRes['pix']['pix_qr_code'])) {
    $pixCode = $txRes['pix']['pix_qr_code'];
} elseif (!empty($txRes['data']['pix']['pix_qr_code'])) {
    $pixCode = $txRes['data']['pix']['pix_qr_code'];
} elseif (!empty($txRes['data']['pix_code'])) {
    $pixCode = $txRes['data']['pix_code'];
} elseif (!empty($txRes['pix_code'])) {
    $pixCode = $txRes['pix_code'];
}

if (!empty($txRes['hash'])) {
    $txId = $txRes['hash'];
} elseif (!empty($txRes['data']['hash'])) {
    $txId = $txRes['data']['hash'];
}

if ($pixCode) {
    echo json_encode([
        "id"  => $txId,
        "pix" => ["qrcode" => $pixCode]
    ]);
} else {
    echo json_encode([
        "error"   => "Falha ao gerar PIX com a TriboPay",
        "details" => $txRes
    ]);
}
?>
