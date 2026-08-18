const https = require('https');
const http = require('http');

async function makeHttpsRequest(options, postData) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, data });
      });
    });
    req.on('error', (err) => {
      resolve({ statusCode: 500, error: err.message });
    });
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function testAramex(mode, username, password, accountNumber, accountPin) {
  console.log(`\n========================================`);
  console.log(` TESTING ARAMEX - Mode: [${mode.toUpperCase()}]`);
  console.log(` Credentials: ${username} | Account: ${accountNumber}`);
  console.log(`========================================`);

  const payload = {
    ClientInfo: {
      UserName: username,
      Password: password,
      Version: "v1.0",
      AccountNumber: accountNumber,
      AccountPin: accountPin,
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    },
    Transaction: {
      Reference1: `TEST-${Date.now()}`,
      Reference2: "",
      Reference3: "",
      Reference4: "",
      Reference5: ""
    },
    OriginAddress: {
      Line1: "Jebel Ali Industrial 1",
      Line2: "",
      Line3: "",
      City: "Dubai",
      StateOrProvinceCode: "",
      PostCode: "",
      CountryCode: "AE"
    },
    DestinationAddress: {
      Line1: "Business Bay Tower 1",
      Line2: "",
      Line3: "",
      City: "Dubai",
      StateOrProvinceCode: "",
      PostCode: "",
      CountryCode: "AE"
    },
    ShipmentDetails: {
      PaymentType: "P",
      ProductGroup: "EXP",
      ProductType: "PPX",
      ActualWeight: { Unit: "KG", Value: 2.0 },
      ChargeableWeight: { Unit: "KG", Value: 2.0 },
      NumberOfPieces: 1,
      Dimensions: { Length: 20, Width: 20, Height: 20, Unit: "CM" }
    }
  };

  const options = {
    hostname: 'ws.aramex.net',
    port: 443,
    path: '/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  const res = await makeHttpsRequest(options, payload);
  console.log(`Aramex [${mode}] CalculateRate HTTP Status: ${res.statusCode}`);
  try {
    const json = JSON.parse(res.data);
    if (json.HasErrors) {
      console.log(`Aramex [${mode}] ERROR Response:`, JSON.stringify(json.Notifications, null, 2));
    } else {
      console.log(`Aramex [${mode}] SUCCESS Rate:`, JSON.stringify(json.TotalAmount, null, 2));
    }
  } catch (e) {
    console.log(`Aramex [${mode}] Raw Data:`, res.data.substring(0, 300));
  }
}

async function testNoon(mode, baseUrl) {
  console.log(`\n========================================`);
  console.log(` TESTING NOON - Mode: [${mode.toUpperCase()}]`);
  console.log(` Target URL: ${baseUrl}`);
  console.log(`========================================`);

  const apiKey = "noon-partners-key-id-37f0867306304eec8f901eb2a6945f41";
  
  const urlObj = new URL(baseUrl + '/api/v1/orders/quote');
  
  const payload = {
    pickup: {
      latitude: 25.2048,
      longitude: 55.2708,
      address: "Dubai Downtown"
    },
    dropoff: {
      latitude: 25.0657,
      longitude: 55.1713,
      address: "Jebel Ali Industrial"
    },
    items: [
      { name: "Documents", quantity: 1, weight_kg: 1.0 }
    ]
  };

  const options = {
    hostname: urlObj.hostname,
    port: 443,
    path: urlObj.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey
    }
  };

  const res = await makeHttpsRequest(options, payload);
  console.log(`Noon [${mode}] Quote HTTP Status: ${res.statusCode}`);
  try {
    const json = JSON.parse(res.data);
    console.log(`Noon [${mode}] Response:`, JSON.stringify(json, null, 2));
  } catch (e) {
    console.log(`Noon [${mode}] Raw Data:`, res.data.substring(0, 300));
  }
}

async function runAllTests() {
  // 1. Aramex Test (Sandbox/UAT)
  await testAramex('sandbox', 'testingapi@aramex.com', 'R123456789$r', '45796', '116216');

  // 2. Aramex Production
  await testAramex('production', 'care@trsh.ae', '#Trsh2027', '75788705', '217147');

  // 3. Noon Staging
  await testNoon('staging', 'https://food-api-team.noonstg.team');

  // 4. Noon Production
  await testNoon('production', 'https://food-api-team.noon.team');
}

runAllTests();
