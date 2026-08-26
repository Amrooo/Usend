import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { NoonAdapter } from '../src/backend/adapters/NoonAdapter';

async function testProduction() {
  console.log('================================================================');
  console.log('🚀 TESTING NOON ADAPTER IN PRODUCTION MODE');
  console.log('================================================================');

  const adapter = new NoonAdapter();
  const apiKey = process.env.NOON_API_KEY || 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh';

  console.log('Target URL: https://food-api-team.noon.team');
  console.log('API Key:', apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 6));

  console.log('\n--- 1. Testing validateCredentials() ---');
  const validationRes = await adapter.validateCredentials({ apiKey }, 'production');
  console.log('Result:', JSON.stringify(validationRes, null, 2));

  console.log('\n--- 2. Testing listPickupPoints() ---');
  const pickupPoints = await adapter.listPickupPoints({ apiKey }, 'production');
  console.log('Pickup points count:', pickupPoints.length);
  console.log('Pickup points data:', JSON.stringify(pickupPoints, null, 2));

  console.log('\n--- 3. Testing Direct HTTPS Request to Production ---');
  try {
    const res = await fetch('https://food-api-team.noon.team/public/v1/pickup-points/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-KEY': apiKey,
      },
      signal: AbortSignal.timeout(10000)
    });
    console.log(`HTTP Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log('Body snippet:', text.substring(0, 500));
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

testProduction().catch(err => {
  console.error('Test error:', err);
});
