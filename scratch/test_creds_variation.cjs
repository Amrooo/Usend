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

function buildPayload(creds) {
  return {
    ClientInfo: creds,
    Transaction: { Reference1: "Test", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
    OriginAddress: { Line1: "L1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE" },
    DestinationAddress: { Line1: "L1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Abu Dhabi", CountryCode: "AE" },
    ShipmentDetails: {
      PaymentType: "P", ProductGroup: "DOM", ProductType: "OND",
      ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
      NumberOfPieces: 1, Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
      DescriptionOfGoods: "Test", GoodsOriginCountry: "AE", PaymentOptions: ""
    }
  };
}

const variations = [
  {
    name: "Standard Prod Creds",
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
    name: "Source 24",
    creds: {
      UserName: "octman.sam@gmail.com",
      Password: "#JohnSnow2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 24
    }
  },
  {
    name: "Version v1",
    creds: {
      UserName: "octman.sam@gmail.com",
      Password: "#JohnSnow2027",
      Version: "v1",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  },
  {
    name: "Trimmed Password without #",
    creds: {
      UserName: "octman.sam@gmail.com",
      Password: "JohnSnow2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    }
  }
];

async function testAll() {
  for (const v of variations) {
    console.log(`\n=== Testing: ${v.name} ===`);
    const res = await postJson("https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate", buildPayload(v.creds));
    console.log("Notifications:", JSON.stringify(res.data?.Notifications || res.data));
    if (res.data && !res.data.HasErrors) {
      console.log(">>> SUCCESS FOR VARIATION:", v.name, JSON.stringify(res.data.TotalAmount));
    }
  }
}

testAll();
