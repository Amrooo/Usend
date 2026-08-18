const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const STAGING_URL = "https://food-api-team.noonstg.team";
const STAGING_KEY = "SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4m4AAj61NwM0B7Ihk";

const PROD_URL = "https://food-api-team.noon.team";
const PROD_KEY = "noon-partners-key-id-37f0867306304eec8f901eb2a6945f41";

function makeNoonRequest(baseUrl, apiKey, method, path, body = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(baseUrl + path);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        rejectUnauthorized: false,
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, data });
        });
      });

      req.on('error', err => resolve({ statusCode: 500, error: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ statusCode: 504, error: 'Connection Timed Out (10s)' });
      });

      if (body) req.write(JSON.stringify(body));
      req.end();
    } catch (e) {
      resolve({ statusCode: 500, error: e.message });
    }
  });
}

async function runNoonSuite() {
  console.log("==========================================================================");
  console.log(" NOON RIDER ON DEMAND (RoD) INTEGRATION TEST SUITE ");
  console.log("==========================================================================");

  // --- 1. STAGING TEST ---
  console.log("\n>>> 1. NOON STAGING (TEST ENVIRONMENT)");
  console.log("Target:", STAGING_URL);
  
  const stagingList = await makeNoonRequest(STAGING_URL, STAGING_KEY, 'GET', '/public/v1/pickup-points/list');
  console.log("GET /public/v1/pickup-points/list - HTTP Status:", stagingList.statusCode);
  console.log("Response:", stagingList.data || stagingList.error);

  const stagingTaskPayload = {
    outlet_code: "77T4HCOD4G",
    external_order_number: `USEND-TEST-STG-${Date.now()}`,
    dropoff: {
      address: {
        line1: "Business Bay Tower 1",
        city: "Dubai",
        country_code: "AE"
      },
      recipient: {
        name: "Test Customer",
        phone_number: "+971501234567"
      },
      location: {
        latitude: 251998377,
        longitude: 552738694
      }
    },
    payment_type: "prepaid",
    cod_value: 0
  };

  const stagingCreate = await makeNoonRequest(STAGING_URL, STAGING_KEY, 'POST', '/public/v1/create-task', stagingTaskPayload);
  console.log("POST /public/v1/create-task - HTTP Status:", stagingCreate.statusCode);
  console.log("Response:", stagingCreate.data || stagingCreate.error);

  // --- 2. PRODUCTION TEST ---
  console.log("\n>>> 2. NOON PRODUCTION ENVIRONMENT");
  console.log("Target:", PROD_URL);

  const prodList = await makeNoonRequest(PROD_URL, PROD_KEY, 'GET', '/public/v1/pickup-points/list');
  console.log("GET /public/v1/pickup-points/list - HTTP Status:", prodList.statusCode);
  console.log("Response:", prodList.data || prodList.error);

  const prodTaskPayload = {
    outlet_code: "PRJ571252",
    external_order_number: `USEND-TEST-PROD-${Date.now()}`,
    dropoff: {
      address: {
        line1: "Business Bay Tower 1",
        city: "Dubai",
        country_code: "AE"
      },
      recipient: {
        name: "Test Customer",
        phone_number: "+971501234567"
      },
      location: {
        latitude: 251998377,
        longitude: 552738694
      }
    },
    payment_type: "prepaid",
    cod_value: 0
  };

  const prodCreate = await makeNoonRequest(PROD_URL, PROD_KEY, 'POST', '/public/v1/create-task', prodTaskPayload);
  console.log("POST /public/v1/create-task - HTTP Status:", prodCreate.statusCode);
  console.log("Response:", prodCreate.data || prodCreate.error);

  console.log("\n==========================================================================");
  console.log(" TESTING COMPLETED ");
  console.log("==========================================================================");
}

runNoonSuite();
