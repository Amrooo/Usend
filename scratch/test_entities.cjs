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

function buildPayload(entity) {
  return {
    ClientInfo: {
      UserName: "octman.sam@gmail.com",
      Password: "#JohnSnow2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: entity,
      AccountCountryCode: "AE",
      Source: 0
    },
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

const entities = ["DXB", "SHJ", "AUH", "FJR", "AJM", "RAK", "UAQ", "SAIF", "HFZ"];

async function testEntities() {
  for (const entity of entities) {
    console.log(`\n=== Testing AccountEntity: ${entity} ===`);
    const res = await postJson("https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate", buildPayload(entity));
    console.log("Notifications:", JSON.stringify(res.data?.Notifications || res.data));
    if (res.data && !res.data.HasErrors) {
      console.log("SUCCESS FOR ENTITY:", entity, JSON.stringify(res.data.TotalAmount));
    }
  }
}

testEntities();
