<?php
// ==========================================
// CONFIGURAÇÕES DO PIXEL E WEBHOOK
// ==========================================
$pixelId = "1059470159233925";
$accessToken = "EAAZAyEHxz9GkBSBk1hTFdr5cZCEZCzVNkFGOHEU50ZCKxmEnagA61CqUd0nABTBpTiLH7souQZCzm3P9o5iAs9QDk8AqYb0RqFzlXZAC0pDJ0b4g5QAQYijSKZAHpoD3OTq2vs5fOJZB7GYBYx6uwOzcCphXbPkDtmQzmxxBA1jXxScTMTD3qvNc3lLJeUTeLwZDZD"; 
// ==========================================

$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Log para você ver os pagamentos chegando se quiser (opcional)
file_put_contents('webhook_log.txt', date('Y-m-d H:i:s') . " - " . $input . PHP_EOL, FILE_APPEND);

if (!$data) {
    http_response_code(400);
    echo "Bad Request";
    exit;
}

// Em webhooks da TriboPay, geralmente a estrutura tem 'payment_status'
$status = '';
if (isset($data['payment_status'])) {
    $status = strtolower($data['payment_status']);
} elseif (isset($data['data']['payment_status'])) {
    $status = strtolower($data['data']['payment_status']);
} elseif (isset($data['status'])) {
    $status = strtolower($data['status']);
} elseif (isset($data['data']['status'])) {
    $status = strtolower($data['data']['status']);
}

// Só marca Purchase se o status for pago ou aprovado
if (in_array($status, ['paid', 'approved', 'completed'])) {
    
    // Tenta encontrar o valor da transação e email/fone
    $amount = 0;
    if (isset($data['amount'])) $amount = $data['amount'];
    elseif (isset($data['data']['amount'])) $amount = $data['data']['amount'];
    
    $value = $amount > 0 ? (float)$amount / 100 : 0;
    
    $customerEmail = $data['customer']['email'] ?? ($data['data']['customer']['email'] ?? '');
    $customerPhone = $data['customer']['phone_number'] ?? ($data['data']['customer']['phone_number'] ?? '');
    
    // Tenta pegar os UTMs (o backend.php envia no custom_data ou metadata)
    $metadata = $data['metadata'] ?? ($data['custom_data'] ?? ($data['data']['metadata'] ?? []));
    
    $fbc = $metadata['fbc'] ?? '';
    $fbp = $metadata['fbp'] ?? '';
    
    // Prepara dados do usuário pra API de conversões (hashing)
    $userData = [];
    if (!empty($fbc)) $userData['fbc'] = $fbc;
    if (!empty($fbp)) $userData['fbp'] = $fbp;
    
    if (!empty($customerEmail)) {
        $userData['em'] = hash('sha256', trim(strtolower($customerEmail)));
    }
    if (!empty($customerPhone)) {
        $phone = preg_replace('/[^0-9]/', '', $customerPhone);
        if (strlen($phone) == 10 || strlen($phone) == 11) {
            $phone = '55' . $phone;
        }
        $userData['ph'] = hash('sha256', $phone);
    }
    
    $transactionId = $data['hash'] ?? ($data['data']['hash'] ?? uniqid());

    $eventData = [
        "data" => [
            [
                "event_name" => "Purchase",
                "event_time" => time(),
                "action_source" => "website",
                "event_id" => "purchase_" . $transactionId,
                "user_data" => $userData,
                "custom_data" => [
                    "value" => $value > 0 ? $value : 0,
                    "currency" => "BRL"
                ]
            ]
        ]
    ];

    if ($accessToken !== "COLE_AQUI_SEU_TOKEN_DE_ACESSO_DA_API_DE_CONVERSOES") {
        $url = "https://graph.facebook.com/v19.0/{$pixelId}/events?access_token={$accessToken}";

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($eventData));
        curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        
        file_put_contents('webhook_log.txt', "CAPI Response: " . $response . PHP_EOL, FILE_APPEND);
    }
}

http_response_code(200);
echo json_encode(["received" => true]);
?>
