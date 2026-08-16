const https = require('https');
const http = require('http');

function postHttps(urlStr, data) {
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

function postHttp(urlStr, data) {
  return new Promise((resolve) => {
    const body = JSON.stringify(data);
    const url = new URL(urlStr);

    const req = http.request({
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      },
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

const prodCredsNew = {
  UserName: "care@trsh.ae",
  Password: "#Trsh2027",
  Version: "v1.0",
  AccountNumber: "75788705",
  AccountPin: "217147",
  AccountEntity: "DXB",
  AccountCountryCode: "AE",
  Source: 0
};

const ratePayload = {
  ClientInfo: prodCredsNew,
  Transaction: { Reference1: "Production Rate Check - #Trsh2027", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
  OriginAddress: { Line1: "Warehouse 1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE" },
  DestinationAddress: { Line1: "Villa 12", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Abu Dhabi", CountryCode: "AE" },
  ShipmentDetails: {
    PaymentType: "P", ProductGroup: "DOM", ProductType: "OND",
    ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
    NumberOfPieces: 1, Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
    DescriptionOfGoods: "Sample Documents", GoodsOriginCountry: "AE", PaymentOptions: ""
  }
};

const shipmentPayload = {
  ClientInfo: prodCredsNew,
  Transaction: { Reference1: "Production Shipment Dispatch - #Trsh2027", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
  Shipments: [
    {
      Reference1: "USEND-PROD-" + Date.now(),
      Reference2: "", Reference3: "",
      Shipper: {
        Reference1: "USend Central Hub", Reference2: "", AccountNumber: "75788705",
        PartyAddress: { Line1: "Al Quoz 3", Line2: "", Line3: "", City: "Dubai", StateOrProvince: "", PostCode: "", CountryCode: "AE" },
        Contact: {
          Department: "Logistics", PersonName: "Amro Elsamman", CompanyName: "TRSH (FZC)",
          PhoneNumber1: "+971522715506", PhoneNumber1Ext: "",
          PhoneNumber2: "", PhoneNumber2Ext: "",
          FaxNumber: "", CellPhone: "+971522715506", EmailAddress: "care@trsh.ae", Type: ""
        }
      },
      Consignee: {
        Reference1: "", Reference2: "", AccountNumber: "",
        PartyAddress: { Line1: "Corniche St", Line2: "", Line3: "", City: "Abu Dhabi", StateOrProvince: "", PostCode: "", CountryCode: "AE" },
        Contact: {
          Department: "", PersonName: "Customer Name", CompanyName: "Customer Inc",
          PhoneNumber1: "+971500000000", PhoneNumber1Ext: "",
          PhoneNumber2: "", PhoneNumber2Ext: "",
          FaxNumber: "", CellPhone: "+971500000000", EmailAddress: "customer@example.com", Type: ""
        }
      },
      ThirdParty: null, Reference4: "", Reference5: "",
      ShippingDateTime: `/Date(${Date.now()})/`,
      DueDate: `/Date(${Date.now() + 86400000})/`,
      Comments: "Live Dispatch", PickupLocation: "Reception", OperationsInstructions: "Fragile", AccountingInstrcutions: "",
      Details: {
        Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
        ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
        DescriptionOfGoods: "Documents", GoodsOriginCountry: "AE", NumberOfPieces: 1,
        ProductGroup: "DOM", ProductType: "OND", PaymentType: "P", PaymentOptions: "",
        CashOnDeliveryAmount: null, CustomsValueAmount: null
      }
    }
  ],
  LabelInfo: { ReportID: 9729, ReportType: "URL" }
};

async function testAll() {
  console.log("\n==================================================");
  console.log("=== 1. Direct Aramex Production Rate Check (#Trsh2027) ===");
  console.log("==================================================");
  let res = await postHttps("https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate", ratePayload);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data, null, 2));

  console.log("\n==================================================");
  console.log("=== 2. Direct Aramex Production CreateShipments (#Trsh2027) ===");
  console.log("==================================================");
  res = await postHttps("https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments", shipmentPayload);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data, null, 2));

  console.log("\n==================================================");
  console.log("=== 3. Localhost /api/courier/test-connection (care@trsh.ae / #Trsh2027) ===");
  console.log("==================================================");
  res = await postHttp("http://localhost:3000/api/courier/test-connection", {
    courierId: 'aramex',
    credentials: {
      username: "care@trsh.ae",
      password: "#Trsh2027",
      accountNumber: "75788705",
      accountPin: "217147",
      accountEntity: "DXB",
      accountCountryCode: "AE",
      apiEnv: "production"
    },
    environment: 'production'
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data || res.raw, null, 2));
}

testAll();
