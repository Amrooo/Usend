import { NoonAdapter } from './src/backend/adapters/NoonAdapter';
import { AramexAdapter } from './src/backend/adapters/AramexAdapter';

async function run() {
  const noon = new NoonAdapter();
  const aramex = new AramexAdapter();

  const noonResult = await noon.validateCredentials({ apiKey: 'gxgyh5bcTvarO0iX9N7vMsRv4NZpoMWlu1Wm2Cg3eZW1oR4u5a7Cn24RwpZK3LOZUgMGIOPLv2crIVARo1VppbUPzlELLSA0qk9O2gcVtgRkG6Sk8Ag9OZubOvkMwNWh' }, 'production');
  console.log("Noon Validation:", noonResult);

  const aramexResult = await aramex.validateCredentials({
    username: 'octman.sam@gmail.com',
    password: 'cug.Nv95-npNxaQ',
    version: 'v1.0',
    accountNumber: '75788705',
    accountPin: '217147',
    accountEntity: 'DXB',
    accountCountryCode: 'AE',
    source: '0'
  }, 'production');
  console.log("Aramex Validation:", aramexResult);
}

run();
