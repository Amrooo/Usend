#!/usr/bin/env node
/**
 * seed-firestore-credentials.cjs
 * Seeds Firestore with all production courier credentials and configs using the REST API.
 * Reads from the .env file in the same directory.
 * Run with: node seed-firestore-credentials.cjs
 */

const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

// Read firebase-applet-config.json
const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const PROJECT_ID = firebaseConfig.projectId;

console.log(`[Seed] Targeting Firebase project: ${PROJECT_ID}`);

// Get Access Token
const homedir = require('os').homedir();
const fbToolsPath = path.join(homedir, '.config', 'configstore', 'firebase-tools.json');
let accessToken = null;
if (fs.existsSync(fbToolsPath)) {
  const fbTools = JSON.parse(fs.readFileSync(fbToolsPath, 'utf8'));
  accessToken = fbTools.tokens?.access_token;
}

if (!accessToken) {
  console.error('[Seed] Could not find access token in firebase-tools.json.');
  process.exit(1);
}

console.log('[Seed] Using access token from firebase CLI.');

// Helper to convert JS object to Firestore REST document
function buildFirestoreDoc(obj) {
  return { fields: buildFields(obj) };
}

function buildFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: val.toString() };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = { arrayValue: { values: val.map(v => buildFields({v}).v) } };
    } else if (typeof val === 'object') {
      fields[key] = { mapValue: { fields: buildFields(val) } };
    }
  }
  return fields;
}

// ─── Credentials to write to private_settings/courier_credentials ─────────────
const courierCredentials = {
  aramex: {
    sandboxCreds: {
      username: 'testingapi@aramex.com',
      password: 'R123456789$r',
      accountNumber: '45796',
      accountPin: '116216',
      accountEntity: 'DXB',
      accountCountryCode: 'AE',
      source: '24',
      version: 'v1'
    },
    productionCreds: {
      username: process.env.ARAMEX_USERNAME || 'care@trsh.ae',
      password: process.env.ARAMEX_PASSWORD || '',
      accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || '75788705',
      accountPin: process.env.ARAMEX_ACCOUNT_PIN || '217147',
      accountEntity: process.env.ARAMEX_ACCOUNT_ENTITY || 'DXB',
      accountCountryCode: process.env.ARAMEX_ACCOUNT_COUNTRY_CODE || 'AE',
      source: process.env.ARAMEX_SOURCE || '0',
      version: process.env.ARAMEX_VERSION || 'v1.0'
    }
  },
  noon: {
    sandboxCreds: {
      apiKey: process.env.NOON_API_KEY || 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh',
      storeId: process.env.NOON_STORE_ID || ''
    },
    productionCreds: {
      apiKey: process.env.NOON_PROD_API_KEY || '',
      storeId: process.env.NOON_PROD_STORE_ID || ''
    }
  }
};

// ─── Public configs for settings/courier_configs ───────────────────────────────
const courierConfigs = {
  aramex: {
    id: 'aramex',
    name: 'Aramex Express',
    status: 'Active',
    currentMode: 'production',
    baseUrlUat: 'ws.aramex.net',
    baseUrlProd: 'ws.aramex.net',
    connectionStatus: { state: 'CONFIGURED_NOT_TESTED', lastTestedAt: null, lastTestedMode: null, errorMessage: null },
    rates: {
      guest: { baseFee: 30, perKmRate: 0, perKgRate: 5, expressSurcharge: 25, codFee: 10 },
      user: { baseFee: 25, perKmRate: 0, perKgRate: 4, expressSurcharge: 20, codFee: 8 },
      merchant: { baseFee: 15, perKmRate: 0, perKgRate: 2.5, expressSurcharge: 10, codFee: 5 }
    }
  },
  noon: {
    id: 'noon',
    name: 'Noon Hyperlocal',
    status: 'Active',
    currentMode: 'sandbox',
    baseUrlUat: 'https://food-api-team.noonstg.team',
    baseUrlProd: 'https://food-api-team.noon.team',
    connectionStatus: { state: 'CONFIGURED_NOT_TESTED', lastTestedAt: null, lastTestedMode: null, errorMessage: null },
    rates: {
      guest: { baseFee: 25, perKmRate: 0, perKgRate: 4.5, expressSurcharge: 20, codFee: 8 },
      user: { baseFee: 20, perKmRate: 0, perKgRate: 3.5, expressSurcharge: 15, codFee: 6 },
      merchant: { baseFee: 12, perKmRate: 0, perKgRate: 2.0, expressSurcharge: 8, codFee: 3 }
    }
  }
};

async function writeDoc(col, doc, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${col}/${doc}`;
  const res = await fetch(url + '?updateMask.fieldPaths=' + Object.keys(data).map(k=>`${k}`).join('&updateMask.fieldPaths='), {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(buildFirestoreDoc(data))
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to write ${col}/${doc}: ${res.status} ${text}`);
  }
  return await res.json();
}

async function seed() {
  console.log('\n[Seed] Writing courier_credentials to private_settings/courier_credentials...');
  await writeDoc('private_settings', 'courier_credentials', courierCredentials);
  console.log('[Seed] ✅ private_settings/courier_credentials written.');

  console.log('\n[Seed] Writing courier_configs to settings/courier_configs...');
  await writeDoc('settings', 'courier_configs', courierConfigs);
  console.log('[Seed] ✅ settings/courier_configs written.');

  console.log('\n[Seed] 🎉 Firestore seeding complete!');
}

seed().catch(err => {
  console.error('[Seed] Fatal error:', err);
  process.exit(1);
});
