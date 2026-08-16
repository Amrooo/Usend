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

const baseKey = "SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXoOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4mAAj61NwM0";

const keyVars = [
  baseKey + "B7Ihk",
  baseKey + "B7lhk",
  baseKey + "B71hk",
  baseKey + "B7lhk".trim(),
];

async function run() {
  for (const k of keyVars) {
    console.log(`\nTesting Key ending in: "${k.slice(-10)}"`);
    let res = await getHttps("https://food-api-team.noonstg.team/public/v1/pickup-points/list", k);
    console.log("Status:", res.status, JSON.stringify(res.data || res.raw));
    if (res.status === 200) {
      console.log("🎉🎉🎉 SUCCESS FOR STAGING KEY!", JSON.stringify(res.data));
    }
  }
}

run();
