const https = require('https');

// Test Noon
const noonKey = 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh';
const noonReq = https.request('https://api.noon.partners/pickup-points', {
  headers: {
    'Authorization': `Key ${noonKey}`
  }
}, (res) => {
  console.log(`Noon Prod Status: ${res.statusCode}`);
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => console.log('Noon Response:', body.substring(0, 100)));
});
noonReq.on('error', e => console.error("Noon Error:", e));
noonReq.end();

// Test Aramex (Location API as a simple test)
const aramexPayload = JSON.stringify({
  ClientInfo: {
    UserName: "octman.sam@gmail.com",
    Password: "cug.Nv95-npNxaQ",
    Version: "v1.0",
    AccountNumber: "75788705",
    AccountPin: "217147",
    AccountEntity: "DXB",
    AccountCountryCode: "AE",
    Source: 0
  },
  Transaction: {
    Reference1: "Test"
  },
  CountryCode: "AE"
});

const aramexReq = https.request('https://ws.aramex.net/ShippingAPI.V2/Location/Service_1_0.svc/json/FetchCities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': aramexPayload.length
  }
}, (res) => {
  console.log(`Aramex Prod Status: ${res.statusCode}`);
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log('Aramex Response HasError:', json.HasErrors);
      if (json.HasErrors) console.log('Aramex Errors:', json.Notifications);
    } catch(e) { console.log('Aramex Body:', body.substring(0, 100)); }
  });
});
aramexReq.on('error', e => console.error("Aramex Error:", e));
aramexReq.write(aramexPayload);
aramexReq.end();
