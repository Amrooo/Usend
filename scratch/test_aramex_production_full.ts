import { AramexAdapter } from '../src/backend/adapters/AramexAdapter';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function runAramexFullTest() {
  console.log("==================================================");
  console.log("       ARAMEX PRODUCTION INTEGRATION TESTS        ");
  console.log("==================================================");

  const aramex = new AramexAdapter();
  const credentials = {
    username: process.env.ARAMEX_USERNAME || "",
    password: process.env.ARAMEX_PASSWORD || "",
    accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "",
    accountPin: process.env.ARAMEX_ACCOUNT_PIN || "",
    accountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "",
    accountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "AE",
    version: process.env.ARAMEX_VERSION || "v1.0",
    source: process.env.ARAMEX_SOURCE || "0",
  };

  console.log("Configuration:", {
    username: credentials.username,
    accountNumber: credentials.accountNumber,
    accountEntity: credentials.accountEntity,
    accountCountryCode: credentials.accountCountryCode,
    version: credentials.version
  });

  // TEST 1: Validate Credentials
  console.log("\n[TEST 1] Validating Credentials...");
  const validationRes = await aramex.validateCredentials(credentials, "production");
  console.log("Result:", validationRes);

  // TEST 2: Calculate Domestic Rate (Dubai -> Abu Dhabi, 1kg)
  console.log("\n[TEST 2] Calculate Domestic Rate (Dubai -> Abu Dhabi, 1kg)...");
  const rateRes1 = await aramex.calculateRate({
    originCity: "Dubai",
    originCountry: "AE",
    destCity: "Abu Dhabi",
    destCountry: "AE",
    weightKg: 1,
    isExpress: false
  }, credentials, "production");
  console.log("Result:", rateRes1);

  // TEST 3: Calculate Domestic Rate (Dubai -> Dubai, 0.5kg with COD 150 AED)
  console.log("\n[TEST 3] Calculate Domestic Rate with COD (Dubai -> Dubai, 0.5kg, COD 150 AED)...");
  const rateRes2 = await aramex.calculateRate({
    originCity: "Dubai",
    originCountry: "AE",
    destCity: "Dubai",
    destCountry: "AE",
    weightKg: 0.5,
    codAmount: 150,
    isExpress: false
  }, credentials, "production");
  console.log("Result:", rateRes2);

  // TEST 4: Calculate International Express Rate (Dubai -> Riyadh, 2kg)
  console.log("\n[TEST 4] Calculate International Express Rate (Dubai -> Riyadh, 2kg)...");
  const rateRes3 = await aramex.calculateRate({
    originCity: "Dubai",
    originCountry: "AE",
    destCity: "Riyadh",
    destCountry: "SA",
    weightKg: 2,
    isExpress: true
  }, credentials, "production");
  console.log("Result:", rateRes3);

  // TEST 5: Track Shipment API
  console.log("\n[TEST 5] Track Shipment (Checking tracking endpoint with test ID)...");
  const trackRes = await aramex.trackShipment("TEST12345678", credentials, "production");
  console.log("Result:", trackRes);

  console.log("\n==================================================");
  console.log("                  TEST SUMMARY                    ");
  console.log("==================================================");
  console.log("1. Credential Auth:       ", validationRes.success ? "PASS ✅" : "FAIL ❌");
  console.log("2. Domestic Rate Quote:   ", rateRes1.success ? `PASS ✅ (${rateRes1.totalAmount} ${rateRes1.currency})` : `FAIL ❌ (${rateRes1.error})`);
  console.log("3. Domestic COD Quote:    ", rateRes2.success ? `PASS ✅ (${rateRes2.totalAmount} ${rateRes2.currency})` : `FAIL ❌ (${rateRes2.error})`);
  console.log("4. International Quote:   ", rateRes3.success ? `PASS ✅ (${rateRes3.totalAmount} ${rateRes3.currency})` : `FAIL ❌ (${rateRes3.error})`);
  console.log("5. Tracking Endpoint:     ", (trackRes.success || trackRes.providerStatus === 'No Data') ? "PASS ✅ (Endpoint reachable & responsive)" : `FAIL ❌ (${trackRes.error})`);
}

runAramexFullTest().catch(console.error);
