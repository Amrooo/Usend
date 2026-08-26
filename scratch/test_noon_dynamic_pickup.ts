import { NoonAdapter } from '../src/backend/adapters/NoonAdapter';
import { toNoonCoordinate, toNoonFils } from '../src/backend/adapters/CourierAdapter';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING NOON INTEGRATION & PICKUP POINT UNIT TESTS');
  console.log('================================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Test Coordinate Utility
  console.log('\n--- 1. Testing toNoonCoordinate ---');
  const lat = 25.1964783;
  const convertedLat = toNoonCoordinate(lat);
  assert(convertedLat === 251964783, `toNoonCoordinate(25.1964783) === 251964783 (got ${convertedLat})`);

  const lng = 55.2808833;
  const convertedLng = toNoonCoordinate(lng);
  assert(convertedLng === 552808833, `toNoonCoordinate(55.2808833) === 552808833 (got ${convertedLng})`);

  // 2. Test Monetary Utility (AED to fils)
  console.log('\n--- 2. Testing toNoonFils ---');
  const amountAED = 50.00;
  const convertedFils = toNoonFils(amountAED);
  assert(convertedFils === 5000, `toNoonFils(50.00) === 5000 (got ${convertedFils})`);

  const amountDecimal = 34.75;
  const convertedDecimalFils = toNoonFils(amountDecimal);
  assert(convertedDecimalFils === 3475, `toNoonFils(34.75) === 3475 (got ${convertedDecimalFils})`);

  // 3. Test NoonAdapter Methods Existence
  console.log('\n--- 3. Testing NoonAdapter Method Signatures ---');
  const adapter = new NoonAdapter();
  assert(typeof adapter.validateCredentials === 'function', 'adapter.validateCredentials is a function');
  assert(typeof adapter.listPickupPoints === 'function', 'adapter.listPickupPoints is a function');
  assert(typeof adapter.createPickupPoint === 'function', 'adapter.createPickupPoint is a function');
  assert(typeof adapter.getOrCreatePickupPoint === 'function', 'adapter.getOrCreatePickupPoint is a function');
  assert(typeof adapter.createShipment === 'function', 'adapter.createShipment is a function');

  // 4. Test validateCredentials with Missing API Key
  console.log('\n--- 4. Testing validateCredentials Validation ---');
  const invalidCredsRes = await adapter.validateCredentials({ apiKey: '' }, 'sandbox');
  assert(invalidCredsRes.success === false, 'validateCredentials fails gracefully when apiKey is empty');

  // 5. Test Mocked listPickupPoints / getOrCreatePickupPoint
  console.log('\n--- 5. Testing getOrCreatePickupPoint matching logic ---');
  
  // Test coordinate matching inside getOrCreatePickupPoint logic
  const mockPoints = [
    {
      code: 'OUTLET_EXISTING_1',
      name: 'Dubai Mall Main Hub',
      latitude: 251964783,
      longitude: 552808833,
      external_code: 'STORE_BRANCH_001',
    },
    {
      code: 'OUTLET_EXISTING_2',
      name: 'Abu Dhabi Branch',
      latitude: 244538840,
      longitude: 543773438,
      external_code: 'STORE_BRANCH_002',
    }
  ];

  // Override listPickupPoints on instance for unit verification
  (adapter as any).listPickupPoints = async () => mockPoints;

  const matchedByExt = await adapter.getOrCreatePickupPoint(
    { apiKey: 'test' },
    'sandbox',
    { external_code: 'STORE_BRANCH_001' }
  );
  assert(matchedByExt === 'OUTLET_EXISTING_1', `getOrCreatePickupPoint matched by external_code (got ${matchedByExt})`);

  const matchedByCoords = await adapter.getOrCreatePickupPoint(
    { apiKey: 'test' },
    'sandbox',
    { latitude: 24.4538840, longitude: 54.3773438 }
  );
  assert(matchedByCoords === 'OUTLET_EXISTING_2', `getOrCreatePickupPoint matched by coordinates (got ${matchedByCoords})`);

  console.log('\n================================================================');
  console.log(`TOTAL RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
