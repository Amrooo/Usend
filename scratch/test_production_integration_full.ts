import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { AramexAdapter } from '../src/backend/adapters/AramexAdapter';
import { NoonAdapter } from '../src/backend/adapters/NoonAdapter';
import { Client } from 'ssh2';

async function runProductionTests() {
  console.log('================================================================================');
  console.log('🚀 LIVE PRODUCTION INTEGRATION SUITE: ARAMEX & NOON');
  console.log('================================================================================\n');

  // ==========================================================================
  // 1. ARAMEX PRODUCTION TESTING
  // ==========================================================================
  console.log('--------------------------------------------------------------------------------');
  console.log('📦 1. TESTING ARAMEX IN PRODUCTION');
  console.log('--------------------------------------------------------------------------------');
  const aramex = new AramexAdapter();
  const aramexProdCreds = {
    username: "care@trsh.ae",
    password: "#Usend2027",
    accountNumber: "75788705",
    accountPin: "217147",
    accountEntity: "DXB",
    accountCountryCode: "AE",
    source: "0",
    version: "v1.0"
  };

  console.log('Target Endpoint: https://ws.aramex.net');
  console.log('Account Number:', aramexProdCreds.accountNumber);
  console.log('User:', aramexProdCreds.username);

  // A. Test Rate Calculation
  console.log('\n[ARAMEX] Testing calculateRate()...');
  try {
    const rateRes = await aramex.calculateRate({
      originCity: "Dubai",
      originCountry: "AE",
      destCity: "Abu Dhabi",
      destCountry: "AE",
      weightKg: 1,
      isExpress: true,
      currency: "AED"
    }, aramexProdCreds, 'production');
    console.log('Aramex Rate Result:', JSON.stringify(rateRes, null, 2));
  } catch (e: any) {
    console.error('Aramex Rate Error:', e.message);
  }

  // B. Test validateCredentials
  console.log('\n[ARAMEX] Testing validateCredentials()...');
  try {
    const validRes = await aramex.validateCredentials(aramexProdCreds, 'production');
    console.log('Aramex Validation Result:', JSON.stringify(validRes, null, 2));
  } catch (e: any) {
    console.error('Aramex Validation Error:', e.message);
  }

  // ==========================================================================
  // 2. NOON PRODUCTION TESTING
  // ==========================================================================
  console.log('\n--------------------------------------------------------------------------------');
  console.log('🛵 2. TESTING NOON RIDER-ON-DEMAND IN PRODUCTION');
  console.log('--------------------------------------------------------------------------------');
  const noon = new NoonAdapter();
  const noonProdKey = process.env.NOON_API_KEY || "gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh";

  console.log('Target Endpoint: https://food-api-team.noon.team');
  console.log('API Key:', noonProdKey.substring(0, 15) + '...' + noonProdKey.substring(noonProdKey.length - 6));

  // A. Local Adapter validateCredentials
  console.log('\n[NOON - Local Check] Testing validateCredentials()...');
  const localNoonValid = await noon.validateCredentials({ apiKey: noonProdKey }, 'production');
  console.log('Local Result:', JSON.stringify(localNoonValid, null, 2));

  // B. Remote Server Production Test (Bypassing local firewall)
  console.log('\n[NOON - Live Cloudways Production Server Verification]');
  await new Promise<void>((resolve) => {
    const conn = new Client();
    conn.on('ready', () => {
      console.log('SSH Connection Established with Cloudways Server (134.209.28.27)...');
      
      const cmd = `
        echo ">>> Checking GET /public/v1/pickup-points/list on Live Production:"
        curl -s --compressed -w "\nHTTP_STATUS:%{http_code}\n" -X GET "https://food-api-team.noon.team/public/v1/pickup-points/list" \
          -H "Content-Type: application/json" \
          -H "Accept: application/json" \
          -H "X-API-KEY: ${noonProdKey}"
      `;
      
      conn.exec(cmd, (err, stream) => {
        if (err) {
          console.error("SSH Exec Error:", err);
          conn.end();
          return resolve();
        }
        stream.on('close', () => {
          conn.end();
          resolve();
        }).on('data', (data: Buffer) => {
          process.stdout.write(data.toString());
        }).stderr.on('data', (data: Buffer) => {
          process.stderr.write(data.toString());
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
  console.log('🎉 LIVE PRODUCTION INTEGRATION TESTS COMPLETE');
  console.log('================================================================================');
}

runProductionTests();
