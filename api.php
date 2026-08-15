<?php
// Simple PHP Proxy to route requests to the local Node.js server running on port 3000
// This is a workaround for Cloudways Nginx blocking direct /api/ routing for static apps.

$requestUri = $_SERVER['REQUEST_URI'];
// Remove /api from the URI if we are proxying to a different path, or keep it if node expects /api
$nodeUrl = 'http://127.0.0.1:3000' . $requestUri;

$method = $_SERVER['REQUEST_METHOD'];
$headers = function_exists('getallheaders') ? getallheaders() : [];
$curlHeaders = [];

foreach ($headers as $key => $value) {
    if (strtolower($key) !== 'host') {
        $curlHeaders[] = "$key: $value";
    }
}
$curlHeaders[] = 'Host: 127.0.0.1'; // important so node doesn't get confused if not using vhosts

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
curl_close($ch);

http_response_code($httpCode);

// Pass back content type based on basic json check
$isJson = json_decode($response) !== null;
if ($isJson) {
    header('Content-Type: application/json');
}

echo $response;
?>
