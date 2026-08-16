const https = require('https');

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
      timeout: 8000
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

const keysToTest = [
  "PRJ571252",
  "prj571252",
  "TRSH (FZC)",
  "TRSH"
];

async function run() {
  for (const k of keysToTest) {
    console.log(`\nTesting Noon Key: "${k}"`);
    let res = await getHttps("https://food-api-team.noon.team/public/v1/pickup-points/list", k);
    console.log("Status:", res.status, JSON.stringify(res.data || res.raw));
    if (res.status === 200) {
      console.log("🎉🎉🎉 SUCCESS FOR NOON PROD KEY!", k, JSON.stringify(res.data));
    }
  }
}

run();
