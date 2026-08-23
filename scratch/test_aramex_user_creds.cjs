async function testAramex() {
  try {
    const payload = {
      ClientInfo: {
        UserName: "care@trsh.ae",
        Password: "#Usend2027",
        Version: "v1.0",
        AccountNumber: "75788705",
        AccountPin: "217147",
        AccountEntity: "DXB",
        AccountCountryCode: "AE",
        Source: 0
      },
      Transaction: {
        Reference1: "Connection Verification",
        Reference2: "", Reference3: "", Reference4: "", Reference5: ""
      },
      OriginAddress: {
        Line1: "Origin", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE"
      },
      DestinationAddress: {
        Line1: "Dest", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE"
      },
      ShipmentDetails: {
        PaymentType: "P",
        PaymentOptions: "",
        CustomsValueAmount: { Value: 0, CurrencyCode: "AED" },
        Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
        ActualWeight: { Value: 1, Unit: "KG" },
        ChargeableWeight: { Value: 1, Unit: "KG" },
        DescriptionOfGoods: "Test",
        GoodsOriginCountry: "AE",
        NumberOfPieces: 1,
        ProductGroup: "DOM",
        ProductType: "OND"
      }
    };

    const res = await fetch("https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.log("Error:", e.message);
  }
}

testAramex();
