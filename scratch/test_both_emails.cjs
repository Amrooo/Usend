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

function buildPayload(userName, password) {
  return {
    ClientInfo: {
      UserName: userName,
      Password: password,
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    },
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

const combinations = [
  { user: "octman.sam@gmail.com", pass: "#JohnSnow2027" },
  { user: "octman.sam@gmail.com", pass: "JohnSnow2027" },
  { user: "octman.sam@gmail.com", pass: "#johnsnow2027" },
  { user: "octman.sam@gmail.com", pass: "johnsnow2027" },
  { user: "care@trsh.ae", pass: "#JohnSnow2027" },
  { user: "care@trsh.ae", pass: "JohnSnow2027" },
  { user: "care@trsh.ae", pass: "217147" },
  { user: "care@trsh.ae", pass: "TRSH2026" },
  { user: "care@trsh.ae", pass: "TRSH2025" },
  { user: "75788705", pass: "#JohnSnow2027" }
];

async function run() {
  for (const c of combinations) {
    console.log(`\nTesting User: "${c.user}" | Pass: "${c.pass}"`);
    const res = await postJson("https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate", buildPayload(c.user, c.pass));
    const notification = res.data?.Notifications?.[0] || res.data || res.error;
    console.log("Response:", JSON.stringify(notification));
    if (res.data && !res.data.HasErrors) {
      console.log("🎉🎉🎉 SUCCESS! TotalAmount:", JSON.stringify(res.data.TotalAmount));
    }
  }
}

run();
