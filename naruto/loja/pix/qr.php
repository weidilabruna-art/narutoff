<?php
header('Content-Type: image/png');
$text = isset($_GET['text']) ? $_GET['text'] : '';
if (!$text) exit;

$url = 'https://quickchart.io/qr?size=250x250&text=' . urlencode($text);

if (ini_get('allow_url_fopen')) {
    $img = @file_get_contents($url);
} else {
    $img = false;
}

if ($img === false && function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $img = curl_exec($ch);
    curl_close($ch);
}

if ($img !== false) {
    echo $img;
}
?>