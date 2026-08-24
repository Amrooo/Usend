const https = require('https');

const data = JSON.stringify({
    "OriginAddress": {
        "Line1": null,
        "Line2": null,
        "Line3": null,
        "City": "Dubai",
        "StateOrProvinceCode": null,
        "PostCode": "131",
        "CountryCode": "AE",
        "Longitude": 0,
        "Latitude": 0,
        "BuildingNumber": null,
        "BuildingName": null,
        "Floor": null,
        "Apartment": null,
        "POBox": null,
        "Description": null
    },
    "DestinationAddress": {
        "Line1": null,
        "Line2": null,
        "Line3": null,
        "City": "Dubai",
        "StateOrProvinceCode": null,
        "PostCode": "131",
        "CountryCode": "AE",
        "Longitude": 0,
        "Latitude": 0,
        "BuildingNumber": null,
        "BuildingName": null,
        "Floor": null,
        "Apartment": null,
        "POBox": null,
        "Description": null
    },
    "ShipmentDetails": {
        "Dimensions": null,
        "ActualWeight": {
            "Unit": "KG",
            "Value": 0.6
        },
        "ChargeableWeight": {
            "Unit": "KG",
            "Value": 0.6
        },
        "DescriptionOfGoods": null,
        "GoodsOriginCountry": null,
        "NumberOfPieces": 1,
        "ProductGroup": "DOM",
        "ProductType": "ONP",
        "PaymentType": "P",
        "PaymentOptions": null,
        "CustomsValueAmount": null,
        "CashOnDeliveryAmount": null,
        "InsuranceAmount": null,
        "CashAdditionalAmount": null,
        "CashAdditionalAmountDescription": null,
        "CollectAmount": null,
        "Services": "",
        "Items": null,
        "DeliveryInstructions": null,
        "AdditionalProperties": null,
        "ContainsDangerousGoods": false
    },
    "PreferredCurrencyCode": "AED",
    "ClientInfo": {
        "UserName": "care@trsh.ae",
        "Password": "#Usend2027",
        "Version": "v1.0",
        "AccountNumber": "75788705",
        "AccountPin": "217147",
        "AccountEntity": "DXB",
        "AccountCountryCode": "AE",
        "Source": 0,
        "PreferredLanguageCode": null
    },
    "Transaction": null
});

const options = {
  hostname: 'ws.aramex.net',
  port: 443,
  path: '/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', responseBody);
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error);
});

req.write(data);
req.end();
