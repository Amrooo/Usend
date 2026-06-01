const url = 'https://ws.dev.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate';

const payload = {
  ClientInfo: {
    UserName: "testingapi@aramex.com",
    Password: "R123456789$r",
    Version: "v1",
    AccountNumber: "45796",
    AccountPin: "116216",
    AccountEntity: "DXB",
    AccountCountryCode: "AE",
    Source: 24
  },
  Transaction: {
    Reference1: "Rate Calculation",
  },
  OriginAddress: {
    City: "Dubai",
    CountryCode: "AE"
  },
  DestinationAddress: {
    City: "Abu Dhabi",
    CountryCode: "AE"
  },
  ShipmentDetails: {
    PaymentType: "P",
    ProductGroup: "DOM",
    ProductType: "OND",
    ActualWeight: { Value: 1, Unit: "KG" },
    ChargeableWeight: { Value: 1, Unit: "KG" },
    NumberOfPieces: 1
  }
};

(async () => {
  try {
    console.log("Sending request to:", url);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Error:", e);
  }
})();
