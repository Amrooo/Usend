async function run() {
  const apiKey = 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh';
  const response = await fetch('https://api.noon.partners/pickup-points', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${apiKey}`,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
  const text = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(`Response: ${text.substring(0, 100)}`);
}
run();
