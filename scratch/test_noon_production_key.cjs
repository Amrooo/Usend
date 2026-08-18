require('dotenv').config();

async function testNoonProduction() {
  const apiKey = process.env.NOON_API_KEY;
  if (!apiKey) {
    console.error("❌ NOON_API_KEY is missing from .env file!");
    process.exit(1);
  }

  console.log(`Testing Noon API in Production mode...`);
  console.log(`Using Key: ${apiKey}`);

  const baseUrl = 'https://food-api-team.noon.team'; // Production URL
  const endpoint = `${baseUrl}/public/v1/pickup-points/list`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': apiKey,
      },
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();
    console.log(`\nHTTP Status: ${response.status} ${response.statusText}`);
    
    try {
      const data = JSON.parse(text);
      console.log("Response JSON:", JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log("✅ SUCCESS! The production API key is valid.");
      } else {
        console.log("❌ FAILED! The production API key was rejected.");
      }
    } catch (e) {
      console.log("Response Body:", text.substring(0, 500));
      console.log("❌ FAILED! The response was not JSON. (Usually means a firewall block or invalid route).");
    }
    
  } catch (err) {
    console.error("❌ ERROR during request:", err);
  }
}

testNoonProduction();
