import path from 'path';

async function testEngine() {
  console.log("================================================================================");
  console.log(" COMPREHENSIVE INTEGRATION SUITE: ARAMEX & NOON (TEST & PRODUCTION) ");
  console.log("================================================================================");

  const { AramexAdapter } = await import('../src/backend/adapters/AramexAdapter.ts');
  const { NoonAdapter } = await import('../src/backend/adapters/NoonAdapter.ts');

  const aramex = new AramexAdapter();
  const noon = new NoonAdapter();

  // ---------------------------------------------------------
  // 1. ARAMEX SANDBOX (TEST ENVIRONMENT)
  // ---------------------------------------------------------
  console.log("\n>>> 1. ARAMEX - SANDBOX (TEST ENVIRONMENT)");
  const aramexSandboxCreds = {
    username: "testingapi@aramex.com",
    password: "R123456789$r",
    accountNumber: "45796",
    accountPin: "116216",
    accountEntity: "DXB",
    accountCountryCode: "AE",
    source: "24",
    version: "v1"
  };

  try {
    const sandboxValid = await aramex.validateCredentials(aramexSandboxCreds, 'sandbox');
    console.log("Aramex Sandbox Credential Validation:", sandboxValid);

    const sandboxRate = await aramex.calculateRate({
      originCity: "Dubai",
      originCountry: "AE",
      destCity: "Dubai",
      destCountry: "AE",
      weightKg: 2,
      isExpress: true
    }, aramexSandboxCreds, 'sandbox');
    console.log("Aramex Sandbox Rate Result:", JSON.stringify(sandboxRate, null, 2));
  } catch (err: any) {
    console.error("Aramex Sandbox Error:", err.message);
  }

  // ---------------------------------------------------------
  // 2. ARAMEX PRODUCTION
  // ---------------------------------------------------------
  console.log("\n>>> 2. ARAMEX - PRODUCTION ENVIRONMENT");
  const aramexProdCreds = {
    username: "care@trsh.ae",
    password: "#Trsh2027",
    accountNumber: "75788705",
    accountPin: "217147",
    accountEntity: "DXB",
    accountCountryCode: "AE",
    source: "0",
    version: "v1.0"
  };

  try {
    const prodValid = await aramex.validateCredentials(aramexProdCreds, 'production');
    console.log("Aramex Production Credential Validation:", prodValid);

    const prodRate = await aramex.calculateRate({
      originCity: "Dubai",
      originCountry: "AE",
      destCity: "Dubai",
      destCountry: "AE",
      weightKg: 2,
      isExpress: true
    }, aramexProdCreds, 'production');
    console.log("Aramex Production Rate Result:", JSON.stringify(prodRate, null, 2));
  } catch (err: any) {
    console.error("Aramex Production Error:", err.message);
  }

  // ---------------------------------------------------------
  // 3. NOON RIDER ON DEMAND - STAGING (TEST ENVIRONMENT)
  // ---------------------------------------------------------
  console.log("\n>>> 3. NOON RIDER ON DEMAND - STAGING (TEST ENVIRONMENT)");
  const noonStagingCreds = {
    apiKey: "noon-partners-key-id-37f0867306304eec8f901eb2a6945f41",
    storeId: "PRJ571252"
  };

  try {
    const noonStagingValid = await noon.validateCredentials(noonStagingCreds, 'sandbox');
    console.log("Noon Staging Credential Validation:", noonStagingValid);
  } catch (err: any) {
    console.error("Noon Staging Error:", err.message);
  }

  // ---------------------------------------------------------
  // 4. NOON RIDER ON DEMAND - PRODUCTION ENVIRONMENT
  // ---------------------------------------------------------
  console.log("\n>>> 4. NOON RIDER ON DEMAND - PRODUCTION ENVIRONMENT");
  const noonProdCreds = {
    apiKey: "noon-partners-key-id-37f0867306304eec8f901eb2a6945f41",
    storeId: "PRJ571252"
  };

  try {
    const noonProdValid = await noon.validateCredentials(noonProdCreds, 'production');
    console.log("Noon Production Credential Validation:", noonProdValid);
  } catch (err: any) {
    console.error("Noon Production Error:", err.message);
  }

  console.log("\n================================================================================");
  console.log(" INTEGRATION TESTING COMPLETED ");
  console.log("================================================================================");
}

testEngine();
