const http = require('http');

const data = JSON.stringify({
    courierId: 'noon',
    environment: 'production',
    credentials: { apiKey: 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh' }
});

const req = http.request('http://localhost:3000/api/courier/test-connection', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => console.log('Response:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
