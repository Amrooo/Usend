const http = require('http');

function postJson(urlStr, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    const url = new URL(urlStr);

    const req = http.request({
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
      timeout: 10000
    }, (res) => {
      let resp = '';
      res.on('data', chunk => resp += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resp) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resp });
        }
      });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

async function testNoonLocalhost() {
  console.log("\n=== Testing Localhost /api/courier/test-connection (Noon Production) ===");
  const res = await postJson("http://localhost:3000/api/courier/test-connection", {
    courierId: 'noon',
    credentials: {
      apiKey: "YOUR_NOON_API_KEY",
      outletCode: "YOUR_OUTLET_CODE"
    },
    environment: 'production'
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data || res.raw, null, 2));
}

testNoonLocalhost();
