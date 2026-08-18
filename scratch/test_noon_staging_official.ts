import https from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const STAGING_URL = "https://food-api-team.noonstg.team";
const OFFICIAL_TEST_KEY = "SstJi9Ho0EHG2t7kQVSz7nA2hOeL3iiwVxHxb0Njk60QJ0LfmvoXOsimw1zQC7VugHXiIRRMnWyU6f0uHcEcLlco5Eujqbd5pTwDlfBXpacuRI4m4AAj61NwM0B7Ihk";

function makeRequest(method, path, body = null) {
  return new Promise((resolve) => {
    try {
      const url = new URL(STAGING_URL + path);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': OFFICIAL_TEST_KEY
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

      req.on('error', err => resolve({ statusCode: 500, error: err.message, data: err.message }));
      req.on('timeout', () => {
        req.destroy();
        resolve({ statusCode: 504, error: 'Connection Timed Out (10s)', data: 'Connection Timed Out' });
      });

      if (body) req.write(JSON.stringify(body));
      req.end();
    } catch (e) {
      resolve({ statusCode: 500, error: e.message, data: e.message });
    }
  });
}

async function testNoonOfficialDoc() {
  console.log("==========================================================================");
  console.log(" TESTING NOON RIDER ON DEMAND (RoD) OFFICIAL STAGING API FROM DOC ");
  console.log(" Key:", OFFICIAL_TEST_KEY.substring(0, 20) + "...");
  console.log(" Base URL:", STAGING_URL);
  console.log("==========================================================================");

  // 1. List Pickup Points
  console.log("\n--- Step 1: GET /public/v1/pickup-points/list ---");
  const listRes = await makeRequest('GET', '/public/v1/pickup-points/list');
  console.log("HTTP Status:", listRes.statusCode);
  console.log("Response:", listRes.data);

  // 2. Create Delivery Task with Staging Outlet 77T4HCOD4G
  console.log("\n--- Step 2: POST /public/v1/create-task ---");
  const taskPayload = {
    outlet_code: "77T4HCOD4G",
    external_order_number: `USEND-TEST-${Date.now()}`,
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
        latitude: 251998377,  // 25.1998377 x 10^7
        longitude: 552738694  // 55.2738694 x 10^7
      }
    },
    payment_type: "prepaid",
    cod_value: 0
  };

  const createRes = await makeRequest('POST', '/public/v1/create-task', taskPayload);
  console.log("HTTP Status:", createRes.statusCode);
  console.log("Response:", createRes.data);
}

testNoonOfficialDoc();
