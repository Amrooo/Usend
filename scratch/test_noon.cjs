const https = require('https');

function getJson(urlStr, apiKey) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-KEY': apiKey
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
    req.end();
  });
}

const noonProdUrl = "https://food-api-team.noon.team/public/v1/pickup-points/list";
const noonStgUrl = "https://food-api-team.noonstg.team/public/v1/pickup-points/list";

// Read from process.env if available, or test known keys
const apiKey = process.env.NOON_API_KEY || "TEST_KEY";

async function testNoon() {
  console.log("\n=== 1. Testing Noon Production Endpoint (pickup-points/list) ===");
  let res = await getJson(noonProdUrl, apiKey);
  console.log("Status:", res.status);
  console.log("Result:", JSON.stringify(res.data || res.raw || res.error, null, 2));

  console.log("\n=== 2. Testing Noon Staging Endpoint (pickup-points/list) ===");
  res = await getJson(noonStgUrl, apiKey);
  console.log("Status:", res.status);
  console.log("Result:", JSON.stringify(res.data || res.raw || res.error, null, 2));
}

testNoon();
