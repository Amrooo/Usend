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

    req.on('error', (e) => resolve({ error: e.message }));
    req.write(body);
    req.end();
  });
}

function buildPayload(clientInfo) {
  return {
    ClientInfo: clientInfo,
    Transaction: { Reference1: "Test Rate", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
    OriginAddress: { Line1: "Line 1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE" },
    DestinationAddress: { Line1: "Line 1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Abu Dhabi", CountryCode: "AE" },
    ShipmentDetails: {
      PaymentType: "P", ProductGroup: "DOM", ProductType: "OND",
      ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
      NumberOfPieces: 1, Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
      DescriptionOfGoods: "Test Goods", GoodsOriginCountry: "AE", PaymentOptions: ""
    }
  };
}

const casingTests = [
  {
    name: "AccountPIN (uppercase PIN)",
    ClientInfo: {
      UserName: "octman.sam@gmail.com",
      Password: "#JohnSnow2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPIN: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  },
  {
    name: "AccountPIN (uppercase PIN) + AccountPin",
    ClientInfo: {
      UserName: "octman.sam@gmail.com",
      Password: "#JohnSnow2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountPIN: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  }
];

async function run() {
  for (const t of casingTests) {
    console.log(`\n=== Testing Casing Variation: ${t.name} ===`);
    const res = await postJson("https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate", buildPayload(t.ClientInfo));
    console.log("Status:", res.status);
    console.log("Full Output:", JSON.stringify(res.data || res.raw?.slice(0, 300)));
  }
}

run();
