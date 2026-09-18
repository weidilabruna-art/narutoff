<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$paymentId = isset($_GET['paymentId']) ? trim($_GET['paymentId']) : '';

if (empty($paymentId)) {
    echo json_encode(["success" => false, "error" => "paymentId ausente"]);
    exit;
}

$apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

$url = 'https://api.tribopay.com.br/api/public/v1/transactions/' . urlencode($paymentId) . '?api_token=' . $apiToken;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$resData = json_decode($response, true) ?? [];

if (!empty($resData['customer'])) {
    $cust = $resData['customer'];
    echo json_encode([
        "success" => true,
        "customer" => [
            "customer_name" => $cust['name'] ?? '',
            "customer_email" => $cust['email'] ?? '',
            "customer_phone" => $cust['phone_number'] ?? '',
            "customer_document" => $cust['document'] ?? ''
        ]
    ]);
} elseif (!empty($resData['data']['customer'])) {
    $cust = $resData['data']['customer'];
    echo json_encode([
        "success" => true,
        "customer" => [
            "customer_name" => $cust['name'] ?? '',
            "customer_email" => $cust['email'] ?? '',
            "customer_phone" => $cust['phone_number'] ?? '',
            "customer_document" => $cust['document'] ?? ''
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "error" => "Cliente nao encontrado na transacao",
        "raw" => $resData
    ]);
}
?>
