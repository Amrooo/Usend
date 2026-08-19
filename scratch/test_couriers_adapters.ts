import { AramexAdapter } from '../src/backend/adapters/AramexAdapter';
import { NoonAdapter } from '../src/backend/adapters/NoonAdapter';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

async function testAdapters() {
  console.log("=== Testing Courier Adapters ===");

  const aramex = new AramexAdapter();
  const noon = new NoonAdapter();

  const aramexCredentials = {
    username: process.env.ARAMEX_USERNAME || "",
    password: process.env.ARAMEX_PASSWORD || "",
    accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "",
    accountPin: process.env.ARAMEX_ACCOUNT_PIN || "",
    accountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || "",
    accountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || "",
    version: process.env.ARAMEX_VERSION || "v1.0",
    source: process.env.ARAMEX_SOURCE || "0",
  };

  const noonCredentials = {
    apiKey: process.env.NOON_API_KEY || "",
  };

  console.log("\n--- Aramex Sandbox Test ---");
  const aramexTest = await aramex.validateCredentials(aramexCredentials, "sandbox");
  console.log("Sandbox Result:", aramexTest);

  console.log("\n--- Aramex Production Test ---");
  const aramexProd = await aramex.validateCredentials(aramexCredentials, "production");
  console.log("Production Result:", aramexProd);

  console.log("\n--- Noon Sandbox Test ---");
  const noonTest = await noon.validateCredentials(noonCredentials, "sandbox");
  console.log("Sandbox Result:", noonTest);

  console.log("\n--- Noon Production Test ---");
  const noonProd = await noon.validateCredentials(noonCredentials, "production");
  console.log("Production Result:", noonProd);
}

testAdapters().catch(console.error);
