const https = require('https');

function postJson(urlStr, data, timeoutMs = 8000) {
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
      timeout: timeoutMs
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

function buildShipmentPayload(clientInfo) {
  return {
    ClientInfo: clientInfo,
    Transaction: { Reference1: "Test Shipment", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
    Shipments: [
      {
        Reference1: "USEND-TEST-" + Date.now(),
        Reference2: "", Reference3: "",
        Shipper: {
          Reference1: "USend Central Depot", Reference2: "", AccountNumber: clientInfo.AccountNumber,
          PartyAddress: { Line1: "Dubai Warehouse", Line2: "", Line3: "", City: "Dubai", StateOrProvince: "", PostCode: "", CountryCode: "AE" },
          Contact: {
            Department: "", PersonName: "Test Sender", CompanyName: "USend Hub",
            PhoneNumber1: "+971500000000", PhoneNumber1Ext: "",
            PhoneNumber2: "", PhoneNumber2Ext: "",
            FaxNumber: "", CellPhone: "+971500000000", EmailAddress: "dispatch@usend.ae", Type: ""
          }
        },
        Consignee: {
          Reference1: "", Reference2: "", AccountNumber: "",
          PartyAddress: { Line1: "Delivery Address", Line2: "", Line3: "", City: "Abu Dhabi", StateOrProvince: "", PostCode: "", CountryCode: "AE" },
          Contact: {
            Department: "", PersonName: "Test Receiver", CompanyName: "Test Receiver",
            PhoneNumber1: "+971520000000", PhoneNumber1Ext: "",
            PhoneNumber2: "", PhoneNumber2Ext: "",
            FaxNumber: "", CellPhone: "+971520000000", EmailAddress: "receiver@test.com", Type: ""
          }
        },
        ThirdParty: null, Reference4: "", Reference5: "",
        ShippingDateTime: `/Date(${Date.now()})/`,
        DueDate: `/Date(${Date.now() + 86400000})/`,
        Comments: "USend Test Dispatch", PickupLocation: "Reception", OperationsInstructions: "Handle with care", AccountingInstrcutions: "",
        Details: {
          Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
          ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
          DescriptionOfGoods: "Test Item", GoodsOriginCountry: "AE", NumberOfPieces: 1,
          ProductGroup: "DOM", ProductType: "OND", PaymentType: "P", PaymentOptions: "",
          CashOnDeliveryAmount: null, CustomsValueAmount: null
        }
      }
    ],
    LabelInfo: { ReportID: 9729, ReportType: "URL" }
  };
}

const prodCreds = {
  UserName: "octman.sam@gmail.com",
  Password: "#JohnSnow2027",
  Version: "v1.0",
  AccountNumber: "75788705",
  AccountPin: "217147",
  AccountEntity: "DXB",
  AccountCountryCode: "AE",
  Source: 0
};

async function run() {
  console.log("=== Testing PROD CreateShipments with complete Contact Contract ===");
  const res = await postJson("https://ws.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments", buildShipmentPayload(prodCreds), 5000);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.data || res.raw, null, 2));
}

run();
