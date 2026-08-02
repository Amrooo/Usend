const Module = require('module');
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  console.log(`Loading: ${request} from ${parent ? parent.filename : 'main'}`);
  return originalLoad.apply(this, arguments);
};

console.log("Starting require trace for Stripe...");
require('stripe');
console.log("Done!");
