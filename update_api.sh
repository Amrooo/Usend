sed -i '' '/$curlHeaders = \[\];/a\
if (isset($_SERVER["HTTP_AUTHORIZATION"])) {\
    $headers["Authorization"] = $_SERVER["HTTP_AUTHORIZATION"];\
}\
' api.php
