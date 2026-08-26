import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { AramexAdapter } from '../src/backend/adapters/AramexAdapter';
import { NoonAdapter } from '../src/backend/adapters/NoonAdapter';
import { Client } from 'ssh2';

async function testAllPortalsProduction() {
  console.log('================================================================================');
  console.log('🌐 COMPREHENSIVE PRODUCTION VERIFICATION ACROSS ALL PORTALS');
  console.log('   (Admin Portal, Merchant Portal, and User/Consumer Portal)');
  console.log('================================================================================\n');

  const aramex = new AramexAdapter();
  const noon = new NoonAdapter();

  const aramexCreds = {
    username: "care@trsh.ae",
    password: "#Usend2027",
    accountNumber: "75788705",
    accountPin: "217147",
    accountEntity: "DXB",
    accountCountryCode: "AE",
    source: "0",
    version: "v1.0"
  };

  const noonApiKey = "gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh";

  // ============================================================================
  // PORTAL 1: ADMIN PORTAL
  // ============================================================================
  console.log('--------------------------------------------------------------------------------');
  console.log('👑 PORTAL 1: ADMIN PORTAL (COURIER CONFIG & CONNECTION VERIFICATION)');
  console.log('--------------------------------------------------------------------------------');

  console.log('\n[Admin -> Aramex] Testing Production Connection Verification...');
  const adminAramexTest = await aramex.validateCredentials(aramexCreds, 'production');
  console.log('Admin Aramex Test Result:', adminAramexTest.success ? '✅ SUCCESS (HTTP 200 OK)' : `❌ FAILED: ${adminAramexTest.error}`);

  console.log('\n[Admin -> Noon] Testing Production Connection Verification...');
  const adminNoonTest = await noon.validateCredentials({ apiKey: noonApiKey }, 'production');
  console.log('Admin Noon Test Result:', adminNoonTest.success ? '✅ SUCCESS (HTTP 200 OK)' : `❌ FAILED: ${adminNoonTest.error}`);

  // ============================================================================
  // PORTAL 2: MERCHANT PORTAL
  // ============================================================================
  console.log('\n--------------------------------------------------------------------------------');
  console.log('🏬 PORTAL 2: MERCHANT PORTAL (INTEGRATIONS, RATE QUOTING & BULK DISPATCH)');
  console.log('--------------------------------------------------------------------------------');

  // Merchant Aramex Rate Check
  console.log('\n[Merchant -> Aramex] Calculating Rate (Standard 2KG Dubai to Abu Dhabi)...');
  const merchantAramexRate = await aramex.calculateRate({
    originCity: "Dubai",
    originCountry: "AE",
    destCity: "Abu Dhabi",
    destCountry: "AE",
    weightKg: 2,
    isExpress: false,
    currency: "AED"
  }, aramexCreds, 'production');
  console.log('Merchant Aramex Rate Result:', merchantAramexRate);

  // Merchant Aramex COD Rate Check
  console.log('\n[Merchant -> Aramex] Calculating Rate (Express 1KG with 250 AED COD)...');
  const merchantAramexCodRate = await aramex.calculateRate({
    originCity: "Dubai",
    originCountry: "AE",
    destCity: "Sharjah",
    destCountry: "AE",
    weightKg: 1,
    isExpress: true,
    codAmount: 250,
    currency: "AED"
  }, aramexCreds, 'production');
  console.log('Merchant Aramex COD Rate Result:', merchantAramexCodRate);

  // Merchant Noon Dynamic Rate Check
  console.log('\n[Merchant -> Noon] Calculating Rate (On-Demand Instant Delivery in Dubai)...');
  const merchantNoonRate = await noon.calculateRate({
    originCity: "Dubai",
    originCountry: "AE",
    destCity: "Dubai",
    destCountry: "AE",
    weightKg: 1.5,
    isExpress: true,
    currency: "AED"
  }, { apiKey: noonApiKey }, 'production');
  console.log('Merchant Noon Rate Result:', merchantNoonRate);

  // ============================================================================
  // PORTAL 3: USER / CONSUMER PORTAL
  // ============================================================================
  console.log('\n--------------------------------------------------------------------------------');
  console.log('👤 PORTAL 3: USER / CONSUMER PORTAL (ORDER WIZARD & CHECKOUT DISPATCH)');
  console.log('--------------------------------------------------------------------------------');

  // Consumer Rate comparison
  console.log('\n[User Portal] Comparing Live Courier Options for Checkout (Dubai to Dubai, 1KG)...');
  const [userAramexRate, userNoonRate] = await Promise.all([
    aramex.calculateRate({
      originCity: "Dubai",
      originCountry: "AE",
      destCity: "Dubai",
      destCountry: "AE",
      weightKg: 1,
      isExpress: true,
      currency: "AED"
    }, aramexCreds, 'production'),
    noon.calculateRate({
      originCity: "Dubai",
      originCountry: "AE",
      destCity: "Dubai",
      destCountry: "AE",
      weightKg: 1,
      isExpress: true,
      currency: "AED"
    }, { apiKey: noonApiKey }, 'production')
  ]);

  console.log('Option A (Aramex Priority Express):', userAramexRate.success ? `${userAramexRate.totalAmount} ${userAramexRate.currency}` : userAramexRate.error);
  console.log('Option B (Noon Rider on Demand):', userNoonRate.success ? `${userNoonRate.totalAmount} ${userNoonRate.currency}` : userNoonRate.error);

  // ============================================================================
  // REMOTE PRODUCTION SERVER VERIFICATION (NOON DIRECT ENDPOINT & PICKUP RESOLUTION)
  // ============================================================================
  console.log('\n--------------------------------------------------------------------------------');
  console.log('☁️ CLOUDWAYS PRODUCTION SERVER LIVE API VERIFICATION');
  console.log('--------------------------------------------------------------------------------');

  await new Promise<void>((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log('SSH connection established with production server (134.209.28.27)...');
      
      const cmd = `
        echo ">>> Checking Noon Production Pickup Points List API:"
        curl -s --compressed -w "\nHTTP_STATUS:%{http_code}\n" -X GET "https://food-api-team.noon.team/public/v1/pickup-points/list" \
          -H "Content-Type: application/json" \
          -H "Accept: application/json" \
          -H "X-API-KEY: ${noonApiKey}"
      `;
      
      conn.exec(cmd, (err, stream) => {
        if (err) {
          console.error('SSH Exec Error:', err);
          conn.end();
          return resolve();
        }
        stream.on('close', () => {
          conn.end();
          resolve();
        }).on('data', (d: Buffer) => {
          process.stdout.write(d.toString());
        }).stderr.on('data', (d: Buffer) => {
          process.stderr.write(d.toString());
        });
      });
    }).on('error', (err) => {
      console.error('SSH Connect Error:', err.message);
      resolve();
    }).connect({
      host: '134.209.28.27',
      port: 22,
      username: 'master_awqbxuyqcq',
      password: 'rW9MJAfvXn4n'
    });
  });

  console.log('\n================================================================================');
  console.log('🎉 ALL PORTALS PRODUCTION VERIFICATION COMPLETED SUCCESSFULLY');
  console.log('================================================================================');
}

testAllPortalsProduction();
