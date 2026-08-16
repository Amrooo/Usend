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

async function testLocalhost() {
  console.log("\n=== 1. Testing Localhost /api/courier/test-connection (Aramex) ===");
  let res = await postJson("http://localhost:3000/api/courier/test-connection", {
    courierId: 'aramex',
    credentials: {
      username: "octman.sam@gmail.com",
      password: "#JohnSnow2027",
      accountNumber: "75788705",
      accountPin: "217147",
      accountEntity: "DXB",
      accountCountryCode: "AE",
      apiEnv: "production"
    },
    environment: 'production'
  });
  console.log("Status:", res.status);
  console.log("Result:", JSON.stringify(res.data || res.raw, null, 2));

  console.log("\n=== 2. Testing Localhost /api/courier/shipment (Aramex) ===");
  res = await postJson("http://localhost:3000/api/courier/shipment", {
    courierId: 'aramex',
    payload: {
      senderName: "USend Central Depot",
      senderPhone: "+971500000000",
      senderCity: "Dubai",
      senderCountry: "AE",
      senderAddress: "Al Quoz Industrial 3",
      receiverName: "Test Customer",
      receiverPhone: "+971520000000",
      receiverCity: "Abu Dhabi",
      receiverCountry: "AE",
      receiverAddress: "Corniche Street, Villa 12",
      goodsDescription: "Sample Documents",
      weightKg: 1,
      codAmountAED: 0
    },
    credentials: {
      username: "octman.sam@gmail.com",
      password: "#JohnSnow2027",
      accountNumber: "75788705",
      accountPin: "217147",
      accountEntity: "DXB",
      accountCountryCode: "AE",
      apiEnv: "production"
    },
    environment: 'production'
  });
  console.log("Status:", res.status);
  console.log("Result:", JSON.stringify(res.data || res.raw, null, 2));
}

testLocalhost();
