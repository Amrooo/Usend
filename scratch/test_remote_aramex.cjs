const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Established...');
  
  const aramexPayload1 = JSON.stringify({
    ClientInfo: {
      UserName: "care@trsh.ae",
      Password: "#Trsh2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    },
    Transaction: { Reference1: "Test Rate", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
    OriginAddress: { Line1: "Warehouse 1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE" },
    DestinationAddress: { Line1: "Villa 12", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Abu Dhabi", CountryCode: "AE" },
    ShipmentDetails: {
      PaymentType: "P", ProductGroup: "DOM", ProductType: "OND",
      ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
      NumberOfPieces: 1, Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
      DescriptionOfGoods: "Sample Documents", GoodsOriginCountry: "AE", PaymentOptions: ""
    }
  });

  const aramexPayload2 = JSON.stringify({
    ClientInfo: {
      UserName: "octman.sam@gmail.com",
      Password: "#JohnSnow2027",
      Version: "v1.0",
      AccountNumber: "75788705",
      AccountPin: "217147",
      AccountEntity: "DXB",
      AccountCountryCode: "AE",
      Source: 0
    },
    Transaction: { Reference1: "Test Rate", Reference2: "", Reference3: "", Reference4: "", Reference5: "" },
    OriginAddress: { Line1: "Warehouse 1", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Dubai", CountryCode: "AE" },
    DestinationAddress: { Line1: "Villa 12", Line2: "", Line3: "", PostCode: "", StateOrProvince: "", City: "Abu Dhabi", CountryCode: "AE" },
    ShipmentDetails: {
      PaymentType: "P", ProductGroup: "DOM", ProductType: "OND",
      ActualWeight: { Value: 1, Unit: "KG" }, ChargeableWeight: { Value: 1, Unit: "KG" },
      NumberOfPieces: 1, Dimensions: { Length: 10, Width: 10, Height: 10, Unit: "CM" },
      DescriptionOfGoods: "Sample Documents", GoodsOriginCountry: "AE", PaymentOptions: ""
    }
  });

  const cmd = `
    echo "=========================================================================="
    echo ">>> ARAMEX PROD TEST 1 (care@trsh.ae):"
    curl -s -X POST "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '${aramexPayload1}'
    echo ""

    echo "=========================================================================="
    echo ">>> ARAMEX PROD TEST 2 (octman.sam@gmail.com):"
    curl -s -X POST "https://ws.aramex.net/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate" \
      -H "Content-Type: application/json" \
      -H "Accept: application/json" \
      -d '${aramexPayload2}'
    echo ""
    echo "=========================================================================="
  `;

  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', () => conn.end())
      .on('data', (d) => process.stdout.write(d))
      .stderr.on('data', (d) => process.stderr.write(d));
  });
}).connect({
  host: '134.209.28.27',
  port: 22,
  username: 'master_awqbxuyqcq',
  password: 'rW9MJAfvXn4n'
});
