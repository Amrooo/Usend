async function run() {
  const apiKey = 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh';
  const url = 'https://food-api-team.noon.team/public/v1/pickup-points/list';
  
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-API-KEY': apiKey
    }
  });
  console.log(`Status: ${res.status}`);
  const text = await res.text();
  console.log(`Response: ${text.substring(0, 100)}`);
}
run();
