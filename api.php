<?php
$requestUri = $_SERVER['REQUEST_URI'];
if (isset($_GET['path'])) {
    $forwardUri = $_GET['path'];
} else {
    $forwardUri = str_replace('/api.php', '/api', $requestUri);
}
$nodeUrl = 'http://127.0.0.1:3005' . $forwardUri;

$method = $_SERVER['REQUEST_METHOD'];
$headers = function_exists('getallheaders') ? getallheaders() : [];
$curlHeaders = [];
if (isset($_SERVER["HTTP_AUTHORIZATION"])) {
    $headers["Authorization"] = $_SERVER["HTTP_AUTHORIZATION"];
}


foreach ($headers as $key => $value) {
    if (strtolower($key) !== 'host') {
        $curlHeaders[] = "$key: $value";
    }
}
$curlHeaders[] = 'Host: 127.0.0.1';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $nodeUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);

if ($method === 'POST' || $method === 'PUT' || $method === 'PATCH') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'API Gateway Error', 'details' => $curlError, 'url' => $nodeUrl]);
    exit;
}

if ($httpCode >= 100) {
    http_response_code($httpCode);
}

$isJson = json_decode($response) !== null;
if ($isJson) {
    header('Content-Type: application/json');
}

echo $response;
?>
