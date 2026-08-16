const https = require('https');
const http = require('http');

const stagingApiKey = "SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXoOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4mAAj61NwM0B7lhk";

function getHttps(urlStr, apiKey) {
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

function postHttp(urlStr, data) {
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

async function testNoonStaging() {
  console.log("\n==================================================");
  console.log("=== 1. Direct Noon Staging API Call (pickup-points/list) ===");
  console.log("==================================================");
  let res = await getHttps("https://food-api-team.noonstg.team/public/v1/pickup-points/list", stagingApiKey);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data || res.raw, null, 2));

  console.log("\n==================================================");
  console.log("=== 2. Localhost Noon Engine Test Connection ===");
  console.log("==================================================");
  res = await postHttp("http://localhost:3000/api/courier/test-connection", {
    courierId: 'noon',
    credentials: {
      apiKey: stagingApiKey,
      outletCode: "77T4HCOD4G"
    },
    environment: 'sandbox'
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data || res.raw, null, 2));
}

testNoonStaging();
