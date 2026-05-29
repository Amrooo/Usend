const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf8');

server = server.replace(
  `const baseUrl = "https://ws.sbx.aramex.net";`,
  `const baseUrl = "https://ws.aramex.net";`
);

server = server.replace(
  `path = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json";`,
  `path = "/ShippingAPI.V2/RateCalculator/Service_1_0.svc/json/CalculateRate";`
);

server = server.replace(
  `path = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json";`,
  `path = "/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments";`
);

server = server.replace(
  `path = "/ShippingAPI/Tracking/Service_1_0.svc/json";`,
  `path = "/ShippingAPI.V2/Tracking/Service_1_0.svc/json/TrackShipments";`
);

fs.writeFileSync('server.ts', server);
