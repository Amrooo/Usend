const https = require('https');

function postJson(urlStr, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    const url = new URL(urlStr);

    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
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

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', error: 'Timed out' });
    });

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

function buildRatePayload(clientInfo) {
  return {
    ClientInfo: clientInfo,
    Transaction: { Reference1: "Test Rate", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
    OriginAddress: { Line1: "Line 1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE" },
    DestinationAddress: { Line1: "Line 1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Abu Dhabi", CountryCode: "AE" },
    ShipmentDetails: {
      PaymentType: "P",
      ProductGroup: "DOM",
      ProductType: "OND",
      ActualWeight: { Value: 1, Unit: "KG" },
      ChargeableWeight: { Value: 1, Unit: "KG" },
      NumberOfPieces: 1,
      Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
      DescriptionOfGoods: "Test Goods",
      GoodsOriginCountry: "AE",
      PaymentOptions: ""
    }
  };
}

const credSets = [
  {
    name: "Production Creds (Account #75788705)",
    url: "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate",
    creds: {
      UserName: "octman.sam@gmail.com",
      Password: "#JohnSnow2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  },
  {
    name: "UAT Creds (Account #45796) on ws.aramex.net",
    url: "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate",
    creds: {
      UserName: "testingapi@aramex.com",
      Password: "R123456789$r",
      Version: "v1.0",
      AccountNumber: "45796",
      AccountPin: "116216",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  },
  {
    name: "UAT Creds (Account #154454) on ws.aramex.net",
    url: "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate",
    creds: {
      UserName: "dxbit@aramex.com",
      Password: "Ar@m3x$h1pp1ng",
      Version: "v1.0",
      AccountNumber: "154454",
      AccountPin: "115216",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  },
  {
    name: "UAT Creds (Account #45796) on ws.uat.aramex.net",
    url: "https://ws.uat.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate",
    creds: {
      UserName: "testingapi@aramex.com",
      Password: "R123456789$r",
      Version: "v1.0",
      AccountNumber: "45796",
      AccountPin: "116216",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  }
];

async function run() {
  for (const set of credSets) {
    console.log(`\n=== Testing: ${set.name} ===`);
    const res = await postJson(set.url, buildRatePayload(set.creds));
    console.log("Status:", res.status);
    console.log("Notifications:", JSON.stringify(res.data?.Notifications || res.data || res.error || res.raw, null, 2));
    if (res.data && !res.data.HasErrors) {
      console.log("SUCCESS! TotalAmount:", JSON.stringify(res.data.TotalAmount));
    }
  }
}

run();
