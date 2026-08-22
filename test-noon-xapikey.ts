async function run() {
  const apiKey = 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh';
  const url = 'https://api.noon.partners/pickup-points';
  
  console.log("Testing with X-API-KEY header...");
  const res1 = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'User-Agent': 'Usend/1.0'
    }
  });
  console.log(`X-API-KEY Status: ${res1.status}, Response: ${(await res1.text()).substring(0, 50)}`);

  console.log("\nTesting with Authorization: <apiKey>...");
  const res2 = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': apiKey,
      'User-Agent': 'Usend/1.0'
    }
  });
  console.log(`Authorization Status: ${res2.status}, Response: ${(await res2.text()).substring(0, 50)}`);
  
  console.log("\nTesting with both...");
  const res3 = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
      'x-api-key': apiKey,
      'User-Agent': 'Usend/1.0'
    }
  });
  console.log(`Both Status: ${res3.status}, Response: ${(await res3.text()).substring(0, 50)}`);
}
run();
