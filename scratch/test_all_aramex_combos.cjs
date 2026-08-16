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
    OriginAddress: { Line1: "L1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE" },
    DestinationAddress: { Line1: "L1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Abu Dhabi", CountryCode: "AE" },
    ShipmentDetails: {
      PaymentType: "P", ProductGroup: "DOM", ProductType: "OND",
      ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
      NumberOfPieces: 1, Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
      DescriptionOfGoods: "Test Goods", GoodsOriginCountry: "AE", PaymentOptions: ""
    }
  };
}

const tests = [
  { name: "Default (DXB, 217147, octman.sam@gmail.com)", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "75788705", AccountPin: "217147", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 0 } },
  { name: "Uppercase Email", creds: { UserName: "OCTMAN.SAM@GMAIL.COM", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "75788705", AccountPin: "217147", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 0 } },
  { name: "Empty PIN", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "75788705", AccountPin: "", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 0 } },
  { name: "PIN 0", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "75788705", AccountPin: "0", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 0 } },
  { name: "Source 24", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "75788705", AccountPin: "217147", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 24 } },
  { name: "Source 30", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "75788705", AccountPin: "217147", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 30 } },
  { name: "Entity AE", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "75788705", AccountPin: "217147", AccountEntity: "AE", AccountCountryCode: "AE", Source: 0 } },
  { name: "Version v1", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1", AccountNumber: "75788705", AccountPin: "217147", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 0 } },
  { name: "No AccountNumber", creds: { UserName: "octman.sam@gmail.com", Password: "#JohnSnow2027", Version: "v1.0", AccountNumber: "", AccountPin: "", AccountEntity: "DXB", AccountCountryCode: "AE", Source: 0 } },
];

async function run() {
  for (const t of tests) {
    console.log(`\n=== Testing: ${t.name} ===`);
    const res = await postJson("https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate", buildPayload(t.creds));
    const notification = res.data?.Notifications?.[0] || res.data || res.error;
    console.log("Response:", JSON.stringify(notification));
    if (res.data && !res.data.HasErrors) {
      console.log("🎉🎉🎉 SUCCESS! Result:", JSON.stringify(res.data.TotalAmount));
    }
  }
}

run();
