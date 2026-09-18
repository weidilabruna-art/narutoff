<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$txid = isset($_GET['txid']) ? trim($_GET['txid']) : '';

if (empty($txid)) {
    echo json_encode(["status" => "pending", "error" => "txid ausente"]);
    exit;
}

$apiToken = "2tSdUJvzVh345Pr7w0BSJMrizSOZiEPtWyikTbQ5ipYGSITTXTjisZC4ikb5";

// Endpoint da TriboPay para consultar transação pelo hash
$url = 'https://api.tribopay.com.br/api/public/v1/transactions/' . urlencode($txid) . '?api_token=' . $apiToken;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$resData = json_decode($response, true) ?? [];

// Extrai o status da resposta da TriboPay
// Status possíveis em TriboPay: 'waiting_payment', 'paid', 'approved', 'completed', 'refused'
$status = 'pending';

if (isset($resData['payment_status'])) {
    $status = strtolower($resData['payment_status']);
} elseif (isset($resData['data']['payment_status'])) {
    $status = strtolower($resData['data']['payment_status']);
} elseif (isset($resData['status'])) {
    $status = strtolower($resData['status']);
} elseif (isset($resData['data']['status'])) {
    $status = strtolower($resData['data']['status']);
}

echo json_encode([
    "status" => $status,
    "raw"    => $resData
]);
?>
