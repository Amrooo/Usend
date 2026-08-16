const https = require('https');
const http = require('http');

function postJson(urlStr, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;

    const req = client.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Content-Length': Buffer.byteLength(body)
      },
      rejectUnauthorized: false,
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

async function testLiveServer() {
  console.log("\n=== Testing Live Cloudways Production Server API ===");
  const res = await postJson("https://usend.ae/api/courier/test-connection", {
    courierId: 'aramex',
    credentials: {
      username: "care@trsh.ae",
      password: "#Trsh2027",
      accountNumber: "75788705",
      accountPin: "217147",
      accountEntity: "DXB",
      accountCountryCode: "AE",
      apiEnv: "production"
    },
    environment: 'production'
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data || res.raw, null, 2));
}

testLiveServer();
